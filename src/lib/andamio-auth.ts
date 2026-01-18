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

interface GatewayRegisterApiResponse {
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
 * Login via Developer API (requires access token alias)
 *
 * Returns a DEVELOPER JWT for API key management operations.
 * This is separate from the end-user JWT obtained via wallet signing.
 *
 * **IMPORTANT**: Store the returned JWT using `storeDevJWT()`, NOT `storeJWT()`.
 *
 * **SECURITY NOTE**: This endpoint performs NO cryptographic wallet verification.
 * It simply looks up the alias and checks if it belongs to the provided wallet address.
 * Do NOT use this for end-user authentication in browsers.
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
 * Register a new user via Gateway API
 *
 * Creates a new user account and returns a DEVELOPER JWT.
 * This is separate from the end-user JWT obtained via wallet signing.
 *
 * **IMPORTANT**: Store the returned JWT using `storeDevJWT()`, NOT `storeJWT()`.
 *
 * @param alias - The desired username/alias (1-32 characters)
 * @param email - The user's email address
 * @param walletAddress - The user's wallet address in bech32 format
 * @returns AuthResponse with developer JWT (use storeDevJWT to persist)
 */
export async function registerWithGateway(params: {
  alias: string;
  email: string;
  walletAddress: string;
}): Promise<AuthResponse> {
  authLogger.info("Attempting gateway registration for alias:", params.alias);

  const response = await fetch(`${API_PROXY}/api/v2/auth/developer/account/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      alias: params.alias,
      email: params.email,
      wallet_address: params.walletAddress,
    }),
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string; error?: string };
    authLogger.error("Gateway registration failed:", {
      status: response.status,
      error,
    });
    throw new Error(error.message ?? error.error ?? "Gateway registration failed");
  }

  const apiResponse = (await response.json()) as GatewayRegisterApiResponse;
  authLogger.info("Gateway registration successful for alias:", apiResponse.alias);

  // Validate expected structure (JWT is uppercase, token field)
  if (!apiResponse.JWT || typeof apiResponse.JWT !== "object" || !apiResponse.JWT.token) {
    authLogger.error("Unexpected response structure - JWT field:", apiResponse.JWT);
    throw new Error("Invalid registration response: missing or malformed JWT field");
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
    localStorage.setItem(JWT_STORAGE_KEY, jwt);
  }
}

export function getStoredJWT(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(JWT_STORAGE_KEY);
  }
  return null;
}

export function clearStoredJWT(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(JWT_STORAGE_KEY);
  }
}

// Developer JWT helpers (for API key management, no wallet signing)
export function storeDevJWT(jwt: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(DEV_JWT_STORAGE_KEY, jwt);
  }
}

export function getStoredDevJWT(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(DEV_JWT_STORAGE_KEY);
  }
  return null;
}

export function clearStoredDevJWT(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(DEV_JWT_STORAGE_KEY);
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
  expiresAt: string;
}

/**
 * Request a new API key from the gateway
 *
 * **IMPORTANT**: Requires a DEVELOPER JWT from `loginWithGateway()` or `registerWithGateway()`.
 * Do NOT use the end-user JWT from wallet signing.
 *
 * @param jwt - Developer JWT from gateway auth (use getStoredDevJWT())
 * @param name - Name/label for the API key (for identification)
 * @returns API key and expiration date
 */
export async function requestApiKey(jwt: string, name: string): Promise<ApiKeyResponse> {
  // Try snake_case field name (common in Go APIs)
  const requestBody = { api_key_name: name };
  authLogger.info("Requesting API key from gateway:", { name, requestBody });

  const response = await fetch(`${API_PROXY}/api/v1/apikey/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData: { message?: string; error?: string } = {};
    try {
      errorData = JSON.parse(errorText) as { message?: string; error?: string };
    } catch {
      // Not JSON
    }
    authLogger.error("API key request failed:", {
      status: response.status,
      statusText: response.statusText,
      errorText,
      errorData,
    });
    throw new Error(errorData.message ?? errorData.error ?? `Failed to request API key: ${response.status} ${errorText}`);
  }

  const responseText = await response.text();
  authLogger.info("API key response:", responseText);

  let data: { api_key?: string; apiKey?: string; expires_at?: string; expiresAt?: string };
  try {
    data = JSON.parse(responseText) as typeof data;
  } catch {
    throw new Error(`Invalid API key response: ${responseText}`);
  }
  const apiKey = data.api_key ?? data.apiKey;
  const expiresAt = data.expires_at ?? data.expiresAt;

  if (!apiKey) {
    authLogger.error("API key response missing key field:", data);
    throw new Error("API key response missing api_key field");
  }

  authLogger.info("API key generated successfully");

  return {
    apiKey,
    expiresAt: expiresAt ?? "",
  };
}

/**
 * Rotate (extend) an existing API key
 *
 * **IMPORTANT**: Requires a DEVELOPER JWT, not the end-user JWT.
 *
 * @param jwt - Developer JWT from gateway auth (use getStoredDevJWT())
 * @returns Updated API key info
 */
export async function rotateApiKey(jwt: string): Promise<ApiKeyResponse> {
  authLogger.info("Rotating API key");

  const response = await fetch(`${API_PROXY}/api/v1/apikey/rotate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string; error?: string };
    authLogger.error("API key rotation failed:", {
      status: response.status,
      error,
    });
    throw new Error(error.message ?? error.error ?? "Failed to rotate API key");
  }

  const data = (await response.json()) as { api_key: string; expires_at: string };
  authLogger.info("API key rotated successfully");

  return {
    apiKey: data.api_key,
    expiresAt: data.expires_at,
  };
}

/**
 * Delete an API key
 *
 * **IMPORTANT**: Requires a DEVELOPER JWT, not the end-user JWT.
 *
 * @param jwt - Developer JWT from gateway auth (use getStoredDevJWT())
 */
export async function deleteApiKey(jwt: string): Promise<void> {
  authLogger.info("Deleting API key");

  const response = await fetch(`${API_PROXY}/api/v1/apikey/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string; error?: string };
    authLogger.error("API key deletion failed:", {
      status: response.status,
      error,
    });
    throw new Error(error.message ?? error.error ?? "Failed to delete API key");
  }

  authLogger.info("API key deleted successfully");
}
