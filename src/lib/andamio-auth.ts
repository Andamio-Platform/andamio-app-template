import { env } from "~/env";

/**
 * Andamio Authentication Service
 *
 * Handles wallet-based authentication with the Andamio Database API
 *
 * Auth Flow:
 * 1. Create session → get nonce
 * 2. Sign nonce with wallet
 * 3. Validate signature → get JWT
 * 4. Store JWT for API calls
 */

export interface LoginSession {
  id: string;
  nonce: string;
  expiresAt: string;
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

const API_URL = env.NEXT_PUBLIC_ANDAMIO_API_URL;

/**
 * Step 1: Create a login session
 * Returns a nonce that must be signed with the user's wallet
 */
export async function createLoginSession(): Promise<LoginSession> {
  const response = await fetch(`${API_URL}/auth/login/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create login session");
  }

  return response.json();
}

/**
 * Step 2: Validate signature and get JWT
 * Verifies the wallet signature and returns a JWT token
 */
export async function validateSignature(params: {
  sessionId: string;
  signature: WalletSignature;
  address: string;
  convertUTF8?: boolean;
  walletPreference?: string;
  andamioAccessTokenUnit?: string | null;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: params.sessionId,
      signature: params.signature,
      address: params.address,
      convertUTF8: params.convertUTF8 ?? false,
      walletPreference: params.walletPreference,
      andamioAccessTokenUnit: params.andamioAccessTokenUnit,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to validate signature");
  }

  return response.json();
}

/**
 * Complete authentication flow
 * Handles all steps: create session, sign nonce, validate signature
 */
export async function authenticateWithWallet(params: {
  signMessage: (nonce: string) => Promise<WalletSignature>;
  address: string;
  walletName?: string;
  convertUTF8?: boolean;
}): Promise<AuthResponse> {
  // Step 1: Create session
  const session = await createLoginSession();

  // Step 2: Sign nonce
  const signature = await params.signMessage(session.nonce);

  // Step 3: Validate and get JWT
  const authResponse = await validateSignature({
    sessionId: session.id,
    signature,
    address: params.address,
    convertUTF8: params.convertUTF8,
    walletPreference: params.walletName,
  });

  return authResponse;
}

/**
 * JWT Storage helpers
 */
export const JWT_STORAGE_KEY = "andamio_jwt";

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

/**
 * Check if JWT is expired (basic check, doesn't verify signature)
 */
export function isJWTExpired(jwt: string): boolean {
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1]!));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch {
    return true;
  }
}
