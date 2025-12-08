"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useWallet } from "@meshsdk/react";
import {
  authenticateWithWallet,
  storeJWT,
  getStoredJWT,
  clearStoredJWT,
  isJWTExpired,
  type AuthUser,
} from "~/lib/andamio-auth";
import { extractAliasFromUnit } from "~/lib/access-token-utils";
import { env } from "~/env";

/**
 * Detect and sync access token from wallet to database
 * Called when wallet is connected and we have a valid JWT
 */
async function syncAccessTokenFromWallet(
  wallet: {
    getAssets: () => Promise<Array<{ unit: string; quantity: string }>>;
  },
  currentUser: AuthUser | null,
  jwt: string,
  updateUser: (user: AuthUser) => void
): Promise<void> {
  if (!currentUser || !wallet) return;

  try {
    // Get wallet assets
    const assets = await wallet.getAssets();
    const ACCESS_TOKEN_POLICY_ID = env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID;

    // Find access token in wallet
    const accessToken = assets.find((asset) => asset.unit.startsWith(ACCESS_TOKEN_POLICY_ID));

    if (!accessToken) {
      console.log("ℹ️ No access token found in wallet");
      return;
    }

    // Extract alias from token unit (policy ID + hex-encoded name)
    const alias = extractAliasFromUnit(accessToken.unit, ACCESS_TOKEN_POLICY_ID);

    // Check if we need to update the database
    // If user already has this alias in the database, skip
    if (currentUser.accessTokenAlias) {
      console.log("✅ Access token already synced:", currentUser.accessTokenAlias);
      return;
    }

    console.log("🔄 Syncing access token to database:", accessToken.unit);
    console.log("🔄 Extracted alias:", alias);

    const response = await fetch(`${env.NEXT_PUBLIC_ANDAMIO_API_URL}/user/update-alias`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        access_token_alias: alias,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as { success: boolean; user: AuthUser; jwt: string };
      console.log("✅ Access token alias synced to database:", alias);

      // Store the new JWT
      storeJWT(data.jwt);

      // Update local user state
      updateUser(data.user);
    } else {
      console.error("Failed to sync access token:", await response.text());
    }
  } catch (error) {
    console.error("Error syncing access token:", error);
  }
}

/**
 * Automatically register user as Creator and Learner on first login
 * Silently fails if user is already registered (409 Conflict)
 */
async function autoRegisterRoles(jwt: string): Promise<void> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${jwt}`,
  };

  try {
    // Register as Creator
    const creatorResponse = await fetch(`${env.NEXT_PUBLIC_ANDAMIO_API_URL}/creator/create`, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    });

    if (creatorResponse.ok) {
      const creatorData = (await creatorResponse.json()) as { success: boolean; creatorId: string };
      console.log("✅ Registered as Creator:", creatorData.creatorId);
    } else if (creatorResponse.status === 409) {
      console.log("ℹ️ Already registered as Creator");
    } else {
      console.warn("Failed to register as Creator:", await creatorResponse.text());
    }
  } catch (error) {
    console.warn("Error registering as Creator:", error);
  }

  try {
    // Register as Learner
    const learnerResponse = await fetch(`${env.NEXT_PUBLIC_ANDAMIO_API_URL}/learner/create`, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    });

    if (learnerResponse.ok) {
      const learnerData = (await learnerResponse.json()) as { success: boolean; learnerId: string };
      console.log("✅ Registered as Learner:", learnerData.learnerId);
    } else if (learnerResponse.status === 409) {
      console.log("ℹ️ Already registered as Learner");
    } else {
      console.warn("Failed to register as Learner:", await learnerResponse.text());
    }
  } catch (error) {
    console.warn("Error registering as Learner:", error);
  }
}

interface AndamioAuthContextType {
  // State
  isAuthenticated: boolean;
  user: AuthUser | null;
  jwt: string | null;
  isAuthenticating: boolean;
  authError: string | null;
  isWalletConnected: boolean;

  // Actions
  authenticate: () => Promise<void>;
  logout: () => void;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AndamioAuthContext = createContext<AndamioAuthContextType | undefined>(undefined);

/**
 * AndamioAuthProvider - Global authentication state provider
 *
 * Provides a single source of truth for authentication state across the entire app.
 * Manages JWT storage, wallet authentication, and authenticated API requests.
 */
export function AndamioAuthProvider({ children }: { children: React.ReactNode }) {
  const { connected, wallet, name: walletName, disconnect: disconnectWallet } = useWallet();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  // Track if we've attempted auto-auth for this wallet connection
  const [hasAttemptedAutoAuth, setHasAttemptedAutoAuth] = useState(false);

  // Check for stored JWT on mount
  useEffect(() => {
    const storedJWT = getStoredJWT();
    if (storedJWT && !isJWTExpired(storedJWT)) {
      setJwt(storedJWT);
      setIsAuthenticated(true);

      // Decode JWT and set user data
      try {
        const payload = JSON.parse(atob(storedJWT.split(".")[1]!)) as {
          userId: string;
          cardanoBech32Addr?: string;
          accessTokenAlias?: string;
        };
        console.log("🔍 JWT Payload:", payload);

        const userData: AuthUser = {
          id: payload.userId,
          cardanoBech32Addr: payload.cardanoBech32Addr ?? null,
          accessTokenAlias: payload.accessTokenAlias ?? null,
        };
        setUser(userData);
        console.log("✅ User data loaded from stored JWT:", userData);
        console.log("🔑 Access Token Alias:", userData.accessTokenAlias);

        // If wallet is connected, check for access token in wallet
        if (connected && wallet) {
          void syncAccessTokenFromWallet(wallet, userData, storedJWT, setUser);
        }
      } catch (error) {
        console.error("Failed to decode JWT:", error);
      }
    } else if (storedJWT) {
      // JWT expired, clear it
      clearStoredJWT();
    }
  }, [connected, wallet]);

  // Reset auto-auth attempt tracking when wallet disconnects
  useEffect(() => {
    if (!connected) {
      setHasAttemptedAutoAuth(false);
    }
  }, [connected]);

  /**
   * Authenticate with connected wallet
   */
  const authenticate = useCallback(async () => {
    if (!connected || !wallet) {
      setAuthError("Please connect your wallet first");
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // Get wallet address
      const address = await wallet.getChangeAddress();

      // Authenticate
      const authResponse = await authenticateWithWallet({
        signMessage: async (nonce: string) => {
          // Sign the nonce - Mesh SDK's signData handles CIP-30 format
          const signature = await wallet.signData(nonce);
          return signature;
        },
        address,
        walletName: walletName ?? undefined,
        convertUTF8: false, // Try false first, can be made configurable
        getAssets: async () => {
          // Get wallet assets to detect access token
          const assets = await wallet.getAssets();
          return assets;
        },
      });

      // Store JWT and update state
      storeJWT(authResponse.jwt);
      setJwt(authResponse.jwt);
      setUser(authResponse.user);
      setIsAuthenticated(true);

      // Automatically register as Creator and Learner on first login
      await autoRegisterRoles(authResponse.jwt);

      // Sync access token from wallet to database (in case it wasn't detected during auth)
      await syncAccessTokenFromWallet(wallet, authResponse.user, authResponse.jwt, setUser);

      // Log JWT to console for debugging
      console.group("🔐 Andamio Authentication Successful");
      console.log("JWT Token:", authResponse.jwt);

      // Decode and display JWT payload
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const payload = JSON.parse(atob(authResponse.jwt.split(".")[1]!));
        console.log("JWT Payload:", payload);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        console.log("Expires:", new Date(payload.exp * 1000).toLocaleString());
      } catch {
        console.log("Could not decode JWT payload");
      }

      console.log("User:", authResponse.user);
      console.log("\nTo use in API requests:");
      console.log(`Authorization: Bearer ${authResponse.jwt}`);
      console.groupEnd();
    } catch (error) {
      console.error("Authentication failed:", error);
      setAuthError(
        error instanceof Error ? error.message : "Authentication failed",
      );
      setIsAuthenticated(false);
    } finally {
      setIsAuthenticating(false);
    }
  }, [connected, wallet, walletName]);

  // Auto-authenticate when wallet connects (combines connect + sign into one step)
  useEffect(() => {
    // Only auto-auth if:
    // 1. Wallet is connected
    // 2. Not already authenticated
    // 3. Not currently authenticating
    // 4. Haven't already attempted auto-auth for this connection
    if (connected && wallet && !isAuthenticated && !isAuthenticating && !hasAttemptedAutoAuth) {
      console.log("🔄 Auto-authenticating after wallet connection...");
      setHasAttemptedAutoAuth(true);
      void authenticate();
    }
  }, [connected, wallet, isAuthenticated, isAuthenticating, hasAttemptedAutoAuth, authenticate]);

  /**
   * Logout and clear auth state
   * Also disconnects the wallet to complete the logout flow
   */
  const logout = useCallback(() => {
    clearStoredJWT();
    setJwt(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    // Disconnect the wallet as well
    disconnectWallet();
  }, [disconnectWallet]);

  /**
   * Make authenticated API request
   */
  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!jwt) {
        throw new Error("Not authenticated");
      }

      if (isJWTExpired(jwt)) {
        logout();
        throw new Error("JWT expired, please re-authenticate");
      }

      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${jwt}`,
        },
      });
    },
    [jwt, logout],
  );

  return (
    <AndamioAuthContext.Provider
      value={{
        isAuthenticated,
        user,
        jwt,
        isAuthenticating,
        authError,
        isWalletConnected: connected,
        authenticate,
        logout,
        authenticatedFetch,
      }}
    >
      {children}
    </AndamioAuthContext.Provider>
  );
}

/**
 * Hook for accessing Andamio authentication state
 *
 * Must be used within an AndamioAuthProvider
 */
export function useAndamioAuth() {
  const context = useContext(AndamioAuthContext);
  if (context === undefined) {
    throw new Error("useAndamioAuth must be used within AndamioAuthProvider");
  }
  return context;
}
