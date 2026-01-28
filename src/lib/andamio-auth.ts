import { env } from "~/env";
import { authLogger } from "~/lib/debug-logger";
import { extractAliasFromUnit } from "~/lib/access-token-utils";

/**
 * Andamio Authentication Service (V2)
 *
 * Handles wallet-based authentication with Andamio APIs.
 *
 * Two auth flows are supported:
 *
 * 1. DEVELOPER AUTH (for users with access tokens):
 *    - POST /api/v2/auth/developer/account/login with {alias, wallet_address} → JWT
 *    - Requires alias from access token
 *    - Simpler, no nonce signing required
 *    - **SECURITY**: No cryptographic verification - just alias/address lookup
 *
 * 2. USER AUTH (fallback for users without access tokens):
 *    - POST /api/v2/auth/login/session → get nonce
 *    - Sign nonce with wallet
 *    - POST /api/v2/auth/login/validate → get JWT
 *    - Works for any wallet, no access token required
 *    - **SECURITY**: CIP-30 compliant with cryptographic proof of wallet ownership
 *
 * The authenticateWithWallet() function automatically chooses
 * the appropriate flow based on whether an access token is detected.
 *
 * **IMPORTANT FOR BROWSER APPS**: The hybrid approach is secure because:
 * - If developer auth fails (e.g., alias doesn't match address), we fall back to user auth
 * - User auth requires wallet signature, providing cryptographic verification
 * - An attacker cannot spoof another user's wallet by providing wrong alias/address
 */

export interface LoginSession {
  id: string;
  nonce: string;
  expires_at: string;
}

export interface WalletSignature {
  signature: string;
  key: string;
}

export interface AuthUser {
  id: string;
  cardanoBech32Addr: string | null;
  accessTokenAlias: string | null;
}

export interface AuthResponse {
  jwt: string;
  user: AuthUser;
}

// Use proxy for API calls to include the API key
// All auth requests go through the local proxy which adds X-API-Key header
const API_PROXY = "/api/gateway";

/**
 * Gateway API response types
 * Note: JWT is uppercase and uses "token" field
 */
interface GatewayLoginApiResponse {
  user_id: string;
  alias: string;
  tier: string;
  JWT: {
    token: string;
    expires_at: string;
  };
}

// =============================================================================
// DEVELOPER AUTH (for API key management)
// =============================================================================

/**
 * Developer registration session response
 */
export interface DevRegisterSession {
  session_id: string;
  nonce: string;
  expires_at: string;
}

/**
 * Developer registration result (after completing with signature)
 */
export interface DevRegisterResult {
  user_id: string;
  alias: string;
  tier: string;
  subscription_expiration: string;
}

/**
 * Login via Developer API (requires access token alias)
 *
 * Returns a DEVELOPER JWT for API key management operations.
 * This is separate from the end-user JWT obtained via wallet signing.
 *
 * **IMPORTANT**: Store the returned JWT using `storeDevJWT()`, NOT `storeJWT()`.
 *
 * @param alias - The user's access token alias (e.g., "alice")
 * @param walletAddress - The user's wallet address in bech32 format
 * @returns AuthResponse with developer JWT (use storeDevJWT to persist)
 */
export async function loginWithGateway(params: {
  alias: string;
  walletAddress: string;
}): Promise<AuthResponse> {
  authLogger.info("Attempting gateway login for alias:", params.alias);

  const response = await fetch(`${API_PROXY}/api/v2/auth/developer/account/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      alias: params.alias,
      wallet_address: params.walletAddress,
    }),
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string; error?: string };
    authLogger.error("Gateway login failed:", {
      status: response.status,
      error,
    });
    throw new Error(error.message ?? error.error ?? "Gateway login failed");
  }

  const apiResponse = (await response.json()) as GatewayLoginApiResponse;
  authLogger.info("Gateway login successful for alias:", apiResponse.alias);

  // Validate expected structure (JWT is uppercase, token field)
  if (!apiResponse.JWT || typeof apiResponse.JWT !== "object" || !apiResponse.JWT.token) {
    authLogger.error("Unexpected response structure - JWT field:", apiResponse.JWT);
    throw new Error("Invalid login response: missing or malformed JWT field");
  }

  return {
    jwt: apiResponse.JWT.token,
    user: {
      id: apiResponse.user_id,
      cardanoBech32Addr: params.walletAddress,
      accessTokenAlias: apiResponse.alias,
    },
  };
}

/**
 * Step 1: Create a developer registration session
 *
 * Returns a nonce that must be signed with the user's wallet to prove ownership.
 * The session expires after 5 minutes.
 *
 * **IMPORTANT**: Requires End User JWT authentication. Users must be signed in
 * via the standard wallet auth flow before registering as developers.
 *
 * @param alias - The desired username/alias (1-64 characters)
 * @param email - The user's email address
 * @param walletAddress - The user's wallet address in bech32 format (must match JWT)
 * @param endUserJwt - End User JWT from standard wallet authentication
 * @returns Session with nonce to sign
 */
export async function createDevRegisterSession(params: {
  alias: string;
  email: string;
  walletAddress: string;
  endUserJwt: string;
}): Promise<DevRegisterSession> {
  authLogger.info("Creating developer registration session for alias:", params.alias);

  const response = await fetch(`${API_PROXY}/api/v2/auth/developer/register/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${params.endUserJwt}`,
    },
    body: JSON.stringify({
      alias: params.alias,
      email: params.email,
      wallet_address: params.walletAddress,
    }),
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string; error?: string; code?: string };
    authLogger.error("Developer registration session failed:", {
      status: response.status,
      error,
    });

    // Provide user-friendly error messages for known error codes
    if (error.code === "alias_already_exists") {
      throw new Error("This alias is already taken. Please choose a different one.");
    }
    if (error.code === "wallet_address_already_registered") {
      throw new Error("This wallet is already registered. Try logging in instead.");
    }

    throw new Error(error.message ?? error.error ?? "Failed to create registration session");
  }

  const apiResponse = (await response.json()) as {
    session_id: string;
    nonce: string;
    expires_at: string;
  };

  authLogger.info("Developer registration session created, nonce received");

  return {
    session_id: apiResponse.session_id,
    nonce: apiResponse.nonce,
    expires_at: apiResponse.expires_at,
  };
}

/**
 * Step 2: Complete developer registration with wallet signature
 *
 * Verifies the CIP-30 signature and creates the developer account.
 *
 * **IMPORTANT**: Requires End User JWT authentication (same as step 1).
 *
 * @param sessionId - The session ID from createDevRegisterSession
 * @param signature - The CIP-30 wallet signature of the nonce
 * @param endUserJwt - End User JWT from standard wallet authentication
 * @returns Registration result with user info
 */
export async function completeDevRegistration(params: {
  sessionId: string;
  signature: WalletSignature;
  endUserJwt: string;
}): Promise<DevRegisterResult> {
  authLogger.info("Completing developer registration with signature");

  const response = await fetch(`${API_PROXY}/api/v2/auth/developer/register/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${params.endUserJwt}`,
    },
    body: JSON.stringify({
      session_id: params.sessionId,
      signature: {
        signature: params.signature.signature,
        key: params.signature.key,
      },
    }),
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string; error?: string; code?: string };
    authLogger.error("Developer registration completion failed:", {
      status: response.status,
      error,
    });

    // Provide user-friendly error messages for known error codes
    if (error.code === "session_expired") {
      throw new Error("Registration session expired. Please start again.");
    }
    if (error.code === "signature_verification_failed") {
      throw new Error("Wallet signature verification failed. Please try again.");
    }

    throw new Error(error.message ?? error.error ?? "Failed to complete registration");
  }

  const apiResponse = (await response.json()) as {
    user_id: string;
    alias: string;
    tier: string;
    subscription_expiration: string;
  };

  authLogger.info("Developer registration completed for alias:", apiResponse.alias);

  return {
    user_id: apiResponse.user_id,
    alias: apiResponse.alias,
    tier: apiResponse.tier,
    subscription_expiration: apiResponse.subscription_expiration,
  };
}

/**
 * @deprecated Use createDevRegisterSession + completeDevRegistration instead.
 * This function will fail as the old endpoint returns 410 Gone.
 */
export async function registerWithGateway(_params: {
  alias: string;
  email: string;
  walletAddress: string;
}): Promise<AuthResponse> {
  throw new Error(
    "registerWithGateway is deprecated. Use createDevRegisterSession + completeDevRegistration instead."
  );
}

// =============================================================================
// USER AUTH (fallback for users without access tokens)
// =============================================================================

/**
 * Step 1: Create a login session
 * Returns a nonce that must be signed with the user's wallet
 */
export async function createLoginSession(): Promise<LoginSession> {
  const response = await fetch(`${API_PROXY}/api/v2/auth/login/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    throw new Error(error.message ?? "Failed to create login session");
  }

  return response.json() as Promise<LoginSession>;
}

/**
 * API response format from /api/v2/auth/login/validate
 */
interface ValidateSignatureApiResponse {
  jwt: string;
  user: {
    id: string;
    cardano_bech32_addr: string;
    access_token_alias: string | null;
    created_at?: string;
    updated_at?: string;
  };
}

/**
 * Step 2: Validate signature and get JWT
 * Verifies the wallet signature and returns a JWT token
 *
 * API expects: { id, signature: { signature, key }, address }
 * Optional: andamio_access_token_unit, convert_utf8, wallet_preference
 */
export async function validateSignature(params: {
  sessionId: string;
  signature: WalletSignature;
  address: string;
  convertUTF8?: boolean;
  walletPreference?: string;
  andamioAccessTokenUnit?: string | null;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_PROXY}/api/v2/auth/login/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: params.sessionId,
      signature: params.signature,
      address: params.address,
      convert_utf8: params.convertUTF8 ?? false,
      wallet_preference: params.walletPreference,
      andamio_access_token_unit: params.andamioAccessTokenUnit,
    }),
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string; error?: string; details?: unknown };
    authLogger.error("Validate signature failed:", {
      status: response.status,
      statusText: response.statusText,
      error,
    });
    throw new Error(error.message ?? error.error ?? "Failed to validate signature");
  }

  // Transform API response to internal format
  const apiResponse = (await response.json()) as ValidateSignatureApiResponse;
  return {
    jwt: apiResponse.jwt,
    user: {
      id: apiResponse.user.id,
      cardanoBech32Addr: apiResponse.user.cardano_bech32_addr,
      accessTokenAlias: apiResponse.user.access_token_alias,
    },
  };
}

/**
 * Complete authentication flow using CIP-30 wallet signing
 *
 * For browser-based end users, we ALWAYS use wallet signing (User Auth):
 * 1. Get nonce from /api/v2/auth/login/session
 * 2. User signs nonce with CIP-30 wallet
 * 3. Validate signature at /api/v2/auth/login/validate
 * 4. Receive JWT for authenticated API access
 *
 * This provides cryptographic proof of wallet ownership - essential for security.
 *
 * Note: Developer Auth (no signing) is available separately for programmatic/API access
 * but should NOT be used for end-user authentication in browsers.
 *
 * @param signMessage - Function to sign a message with wallet (CIP-30)
 * @param address - Wallet address in bech32 format
 * @param walletName - Optional wallet name for preference tracking
 * @param convertUTF8 - Whether to convert nonce to UTF8 before signing
 * @param getAssets - Function to get wallet assets (for access token detection)
 */
export async function authenticateWithWallet(params: {
  signMessage: (nonce: string) => Promise<WalletSignature>;
  address: string;
  walletName?: string;
  convertUTF8?: boolean;
  getAssets?: () => Promise<Array<{ unit: string; quantity: string }>>;
}): Promise<AuthResponse> {
  const ACCESS_TOKEN_POLICY_ID = env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID;

  // Step 1: Detect access token in wallet (to include in validation request)
  let accessTokenUnit: string | undefined;

  if (params.getAssets) {
    try {
      const assets = await params.getAssets();

      // Find access token in wallet assets
      const accessToken = assets.find((asset) =>
        asset.unit.startsWith(ACCESS_TOKEN_POLICY_ID)
      );

      if (accessToken) {
        accessTokenUnit = accessToken.unit;
        const alias = extractAliasFromUnit(accessToken.unit, ACCESS_TOKEN_POLICY_ID);
        authLogger.info("Access Token detected in wallet:", {
          unit: accessTokenUnit,
          alias: alias,
        });
      } else {
        authLogger.info("No access token found in wallet");
      }
    } catch (error) {
      authLogger.warn("Failed to detect access token:", error);
      // Continue with auth - access token is optional
    }
  }

  // Step 2: Create login session (get nonce to sign)
  authLogger.info("Creating login session...");
  const session = await createLoginSession();
  authLogger.info("Login session created, nonce received");

  // Step 3: Sign nonce with wallet (CIP-30)
  authLogger.info("Requesting wallet signature...");
  const signature = await params.signMessage(session.nonce);
  authLogger.info("Wallet signature obtained");

  // Step 4: Validate signature and get JWT
  authLogger.info("Validating signature...");
  const authResponse = await validateSignature({
    sessionId: session.id,
    signature,
    address: params.address,
    convertUTF8: params.convertUTF8,
    walletPreference: params.walletName,
    andamioAccessTokenUnit: accessTokenUnit ?? null,
  });

  authLogger.info("Authentication successful");
  return authResponse;
}

/**
 * JWT Storage helpers
 *
 * Two separate JWTs are tracked:
 * 1. User JWT (andamio_jwt) - From wallet signing, for app features
 * 2. Developer JWT (andamio_dev_jwt) - From gateway login, for API key management
 */
export const JWT_STORAGE_KEY = "andamio_jwt";
export const DEV_JWT_STORAGE_KEY = "andamio_dev_jwt";

// User JWT helpers (for app features, requires wallet signing)
export function storeJWT(jwt: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(JWT_STORAGE_KEY, jwt);
    } catch {
      // localStorage may be unavailable (private browsing, quota exceeded)
      console.warn("[Auth] Failed to store JWT in localStorage");
    }
  }
}

export function getStoredJWT(): string | null {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(JWT_STORAGE_KEY);
    } catch {
      // localStorage may be unavailable
      return null;
    }
  }
  return null;
}

export function clearStoredJWT(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(JWT_STORAGE_KEY);
    } catch {
      // localStorage may be unavailable
    }
  }
}

// Developer JWT helpers (for API key management, no wallet signing)
export function storeDevJWT(jwt: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(DEV_JWT_STORAGE_KEY, jwt);
    } catch {
      // localStorage may be unavailable (private browsing, quota exceeded)
      console.warn("[Auth] Failed to store dev JWT in localStorage");
    }
  }
}

export function getStoredDevJWT(): string | null {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(DEV_JWT_STORAGE_KEY);
    } catch {
      // localStorage may be unavailable
      return null;
    }
  }
  return null;
}

export function clearStoredDevJWT(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(DEV_JWT_STORAGE_KEY);
    } catch {
      // localStorage may be unavailable
    }
  }
}

// Clear all JWTs (full logout)
export function clearAllJWTs(): void {
  clearStoredJWT();
  clearStoredDevJWT();
}

/**
 * Check if JWT is expired (basic check, doesn't verify signature)
 */
export function isJWTExpired(jwt: string): boolean {
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1]!)) as { exp?: number };
    if (!payload.exp) {
      return true;
    }
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch {
    return true;
  }
}

// =============================================================================
// API KEY MANAGEMENT (requires Developer JWT)
// =============================================================================

/**
 * API Key response from gateway
 */
export interface ApiKeyResponse {
  apiKey: string;
  name: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

/**
 * Developer profile response
 */
export interface DeveloperProfile {
  userId: string;
  alias: string;
  tier: string;
  createdAt: string;
  activeKeys: ApiKeyResponse[];
}

/**
 * Developer usage response
 */
export interface DeveloperUsage {
  dailyQuotaConsumed: number;
  dailyQuotaLimit: number;
}

/**
 * Request a new API key from the gateway
 *
 * **IMPORTANT**: Requires a DEVELOPER JWT from `loginWithGateway()`.
 * Do NOT use the end-user JWT from wallet signing.
 *
 * @param jwt - Developer JWT from gateway auth (use getStoredDevJWT())
 * @param name - Name/label for the API key (for identification, 3-64 chars)
 * @param expiresInDays - Optional expiration in days (default varies by tier)
 * @returns API key details
 */
export async function requestApiKey(
  jwt: string,
  name: string,
  expiresInDays?: number
): Promise<ApiKeyResponse> {
  const requestBody: { api_key_name: string; expires_in_days?: number } = {
    api_key_name: name,
  };
  if (expiresInDays !== undefined) {
    requestBody.expires_in_days = expiresInDays;
  }
  authLogger.info("Requesting API key from gateway:", { name });

  const response = await fetch(`${API_PROXY}/api/v2/apikey/developer/key/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string; error?: string };
    authLogger.error("API key request failed:", {
      status: response.status,
      error,
    });
    throw new Error(error.message ?? error.error ?? "Failed to request API key");
  }

  const data = (await response.json()) as {
    api_key?: string;
    api_key_name?: string;
    created_at?: string;
    expires_at?: string;
    is_active?: boolean;
  };

  if (!data.api_key) {
    authLogger.error("API key response missing key field:", data);
    throw new Error("API key response missing api_key field");
  }

  authLogger.info("API key generated successfully");

  return {
    apiKey: data.api_key,
    name: data.api_key_name ?? name,
    createdAt: data.created_at ?? "",
    expiresAt: data.expires_at ?? "",
    isActive: data.is_active ?? true,
  };
}

/**
 * Rotate (extend) an existing API key
 *
 * **IMPORTANT**: Requires a DEVELOPER JWT, not the end-user JWT.
 *
 * @param jwt - Developer JWT from gateway auth (use getStoredDevJWT())
 * @param name - Name of the API key to rotate
 * @param expiresInDays - Optional new expiration in days
 * @returns Confirmation message
 */
export async function rotateApiKey(
  jwt: string,
  name: string,
  expiresInDays?: number
): Promise<{ confirmation: string }> {
  authLogger.info("Rotating API key:", name);

  const requestBody: { api_key_name: string; expires_in_days?: number } = {
    api_key_name: name,
  };
  if (expiresInDays !== undefined) {
    requestBody.expires_in_days = expiresInDays;
  }

  const response = await fetch(`${API_PROXY}/api/v2/apikey/developer/key/rotate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string; error?: string };
    authLogger.error("API key rotation failed:", {
      status: response.status,
      error,
    });
    throw new Error(error.message ?? error.error ?? "Failed to rotate API key");
  }

  const data = (await response.json()) as { confirmation?: string };
  authLogger.info("API key rotated successfully");

  return {
    confirmation: data.confirmation ?? "API key rotated successfully",
  };
}

/**
 * Delete an API key
 *
 * **IMPORTANT**: Requires a DEVELOPER JWT, not the end-user JWT.
 *
 * @param jwt - Developer JWT from gateway auth (use getStoredDevJWT())
 * @param name - Name of the API key to delete
 * @returns Confirmation message
 */
export async function deleteApiKey(
  jwt: string,
  name: string
): Promise<{ confirmation: string }> {
  authLogger.info("Deleting API key:", name);

  const response = await fetch(`${API_PROXY}/api/v2/apikey/developer/key/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ api_key_name: name }),
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string; error?: string };
    authLogger.error("API key deletion failed:", {
      status: response.status,
      error,
    });
    throw new Error(error.message ?? error.error ?? "Failed to delete API key");
  }

  const data = (await response.json()) as { confirmation?: string };
  authLogger.info("API key deleted successfully");

  return {
    confirmation: data.confirmation ?? "API key deleted successfully",
  };
}

/**
 * Get developer profile
 *
 * @param jwt - Developer JWT from gateway auth (use getStoredDevJWT())
 * @returns Developer profile with active API keys
 */
export async function getDeveloperProfile(jwt: string): Promise<DeveloperProfile> {
  authLogger.info("Fetching developer profile");

  const response = await fetch(`${API_PROXY}/api/v2/apikey/developer/profile/get`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string; error?: string };
    authLogger.error("Failed to get developer profile:", {
      status: response.status,
      error,
    });
    throw new Error(error.message ?? error.error ?? "Failed to get developer profile");
  }

  const data = (await response.json()) as {
    user_id?: string;
    alias?: string;
    tier?: string;
    created_at?: string;
    active_keys?: Array<{
      api_key?: string;
      api_key_name?: string;
      created_at?: string;
      expires_at?: string;
      is_active?: boolean;
    }>;
  };

  authLogger.info("Developer profile fetched successfully");

  return {
    userId: data.user_id ?? "",
    alias: data.alias ?? "",
    tier: data.tier ?? "",
    createdAt: data.created_at ?? "",
    activeKeys: (data.active_keys ?? []).map((key) => ({
      apiKey: key.api_key ?? "",
      name: key.api_key_name ?? "",
      createdAt: key.created_at ?? "",
      expiresAt: key.expires_at ?? "",
      isActive: key.is_active ?? true,
    })),
  };
}

/**
 * Get developer usage statistics
 *
 * @param jwt - Developer JWT from gateway auth (use getStoredDevJWT())
 * @returns Usage statistics
 */
export async function getDeveloperUsage(jwt: string): Promise<DeveloperUsage> {
  authLogger.info("Fetching developer usage");

  const response = await fetch(`${API_PROXY}/api/v2/apikey/developer/usage/get`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string; error?: string };
    authLogger.error("Failed to get developer usage:", {
      status: response.status,
      error,
    });
    throw new Error(error.message ?? error.error ?? "Failed to get developer usage");
  }

  const data = (await response.json()) as {
    daily_quota_consumed?: number;
    daily_quota_limit?: number;
  };

  authLogger.info("Developer usage fetched successfully");

  return {
    dailyQuotaConsumed: data.daily_quota_consumed ?? 0,
    dailyQuotaLimit: data.daily_quota_limit ?? 0,
  };
}

/**
 * Delete developer account
 *
 * **WARNING**: This permanently deletes the developer account and all associated API keys.
 *
 * @param jwt - Developer JWT from gateway auth (use getStoredDevJWT())
 * @returns Confirmation message
 */
export async function deleteDeveloperAccount(jwt: string): Promise<{ confirmation: string }> {
  authLogger.info("Deleting developer account");

  const response = await fetch(`${API_PROXY}/api/v2/apikey/developer/account/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string; error?: string };
    authLogger.error("Failed to delete developer account:", {
      status: response.status,
      error,
    });
    throw new Error(error.message ?? error.error ?? "Failed to delete developer account");
  }

  const data = (await response.json()) as { message?: string };
  authLogger.info("Developer account deleted successfully");

  // Clear stored JWT since account is gone
  clearStoredDevJWT();

  return {
    confirmation: data.message ?? "Developer account deleted successfully",
  };
}
