"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@meshsdk/react";
import { core } from "@meshsdk/core";
import {
  authenticateWithWallet,
  storeJWT,
  getStoredJWT,
  clearStoredJWT,
  isJWTExpired,
  type AuthUser,
} from "~/lib/andamio-auth";
import { extractAliasFromUnit } from "~/lib/access-token-utils";
import { authLogger } from "~/lib/debug-logger";
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
      authLogger.info("No access token found in wallet");
      return;
    }

    // Extract alias from token unit (policy ID + hex-encoded name)
    const alias = extractAliasFromUnit(accessToken.unit, ACCESS_TOKEN_POLICY_ID);

    // Check if we need to update the database
    // If user already has this alias in the database, skip
    if (currentUser.accessTokenAlias) {
      authLogger.info("Access token already synced:", currentUser.accessTokenAlias);
      return;
    }

    authLogger.info("Syncing access token to database:", accessToken.unit);
    authLogger.info("Extracted alias:", alias);

    const response = await fetch(`${env.NEXT_PUBLIC_ANDAMIO_API_URL}/user/access-token-alias`, {
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
      authLogger.info("Access token alias synced to database:", alias);

      // Store the new JWT
      storeJWT(data.jwt);

      // Update local user state
      updateUser(data.user);
    } else {
      authLogger.error("Failed to sync access token:", await response.text());
    }
  } catch (error) {
    authLogger.error("Error syncing access token:", error);
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
      authLogger.info("Registered as Creator:", creatorData.creatorId);
    } else if (creatorResponse.status === 409) {
      authLogger.info("Already registered as Creator");
    } else {
      authLogger.warn("Failed to register as Creator:", await creatorResponse.text());
    }
  } catch (error) {
    authLogger.warn("Error registering as Creator:", error);
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
      authLogger.info("Registered as Learner:", learnerData.learnerId);
    } else if (learnerResponse.status === 409) {
      authLogger.info("Already registered as Learner");
    } else {
      authLogger.warn("Failed to register as Learner:", await learnerResponse.text());
    }
  } catch (error) {
    authLogger.warn("Error registering as Learner:", error);
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
  refreshAuth: () => void;
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
  // Track if JWT validation is in progress (to prevent race condition with auto-auth)
  // Use BOTH ref (for immediate sync check) and state (for re-renders)
  const isValidatingJWTRef = useRef(false);
  const [isValidatingJWT, setIsValidatingJWT] = useState(false);

  // Helper to update both ref and state
  const setValidatingJWT = useCallback((value: boolean) => {
    isValidatingJWTRef.current = value;
    setIsValidatingJWT(value);
  }, []);

  // Validate stored JWT against connected wallet
  // Only authenticate if wallet is connected AND JWT matches the wallet
  useEffect(() => {
    // Check synchronously if there's a stored JWT to validate
    // This prevents auto-auth race condition by setting flag before async work
    const storedJWT = getStoredJWT();
    if (!storedJWT) {
      setValidatingJWT(false);
      return;
    }

    // Mark validation in progress SYNCHRONOUSLY via ref to prevent auto-auth race condition
    // The ref updates immediately (same tick), unlike state which batches
    isValidatingJWTRef.current = true;
    setValidatingJWT(true);

    const validateStoredJWT = async () => {

      // JWT expired - clear it silently
      if (isJWTExpired(storedJWT)) {
        authLogger.info("Stored JWT expired, clearing");
        clearStoredJWT();
        setValidatingJWT(false);
        return;
      }

      // Wallet not connected - don't authenticate, but keep JWT for later validation
      if (!connected || !wallet) {
        authLogger.debug("Wallet not connected, not restoring session from stored JWT");
        setValidatingJWT(false);
        return;
      }

      // Wallet is connected - validate JWT against wallet
      try {
        const payload = JSON.parse(atob(storedJWT.split(".")[1]!)) as {
          userId: string;
          cardanoBech32Addr?: string;
          accessTokenAlias?: string;
        };
        authLogger.debug("Validating stored JWT against connected wallet");

        // Get wallet address and convert to bech32 if needed
        // (Eternl returns hex, other wallets may return bech32)
        const rawAddress = await wallet.getChangeAddress();
        let walletAddress: string;
        if (rawAddress.startsWith("addr")) {
          walletAddress = rawAddress;
        } else {
          try {
            const addressObj = core.Address.fromString(rawAddress);
            if (!addressObj) {
              throw new Error("Failed to parse address");
            }
            walletAddress = addressObj.toBech32();
          } catch (conversionError) {
            authLogger.error("Failed to convert wallet address:", conversionError);
            setValidatingJWT(false);
            return;
          }
        }

        // Check address match
        if (payload.cardanoBech32Addr && payload.cardanoBech32Addr !== walletAddress) {
          authLogger.info("Stored JWT address doesn't match connected wallet, clearing JWT");
          clearStoredJWT();
          setValidatingJWT(false);
          return;
        }

        // Check access token alias match (if JWT has one)
        if (payload.accessTokenAlias) {
          const ACCESS_TOKEN_POLICY_ID = env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID;
          const assets = await wallet.getAssets();
          const walletAccessToken = assets.find((asset) =>
            asset.unit.startsWith(ACCESS_TOKEN_POLICY_ID)
          );

          if (walletAccessToken) {
            const walletAlias = extractAliasFromUnit(walletAccessToken.unit, ACCESS_TOKEN_POLICY_ID);
            if (walletAlias !== payload.accessTokenAlias) {
              authLogger.info("Stored JWT access token alias doesn't match wallet, clearing JWT");
              clearStoredJWT();
              setValidatingJWT(false);
              return;
            }
          }
          // If wallet doesn't have an access token but JWT does, that's okay - token might have been transferred
        }

        // JWT matches wallet - restore session
        authLogger.info("Stored JWT matches connected wallet, restoring session");
        setJwt(storedJWT);
        setIsAuthenticated(true);

        const userData: AuthUser = {
          id: payload.userId,
          cardanoBech32Addr: payload.cardanoBech32Addr ?? null,
          accessTokenAlias: payload.accessTokenAlias ?? null,
        };
        setUser(userData);
        authLogger.info("User data loaded from stored JWT:", userData);

        // Log JWT to console for debugging/testing (restored session)
        console.group("🔐 Andamio Session Restored");
        console.log("JWT Token:", storedJWT);
        console.log("User:", userData);
        console.log("\nTo use in API requests:");
        console.log(`Authorization: Bearer ${storedJWT}`);
        console.log("\nCurl example:");
        console.log(`curl -X POST "${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/owner/course/sync-teachers" \\
  -H "Authorization: Bearer ${storedJWT}" \\
  -H "Content-Type: application/json" \\
  -d '{"course_nft_policy_id": "YOUR_COURSE_POLICY_ID"}'`);
        console.groupEnd();

        // Sync access token from wallet (in case wallet has a new one)
        void syncAccessTokenFromWallet(wallet, userData, storedJWT, setUser);

        // Mark as having attempted auto-auth since we restored from JWT
        setHasAttemptedAutoAuth(true);
        setValidatingJWT(false);
      } catch (error) {
        authLogger.error("Failed to validate stored JWT:", error);
        clearStoredJWT();
        setValidatingJWT(false);
      }
    };

    void validateStoredJWT();
  }, [connected, wallet, setValidatingJWT]);

  // Clear authenticated state when wallet disconnects
  // Keep JWT in storage for potential reconnection with same wallet
  useEffect(() => {
    if (!connected) {
      setHasAttemptedAutoAuth(false);
      // Clear auth state but keep JWT for reconnection validation
      if (isAuthenticated) {
        authLogger.info("Wallet disconnected, clearing authenticated state (JWT kept for reconnection)");
        setIsAuthenticated(false);
        setUser(null);
        setJwt(null);
      }
    }
  }, [connected, isAuthenticated]);

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
      // Get wallet address (may be hex or bech32 depending on wallet)
      const rawAddress = await wallet.getChangeAddress();

      if (!rawAddress || rawAddress.length < 10) {
        console.error("Invalid address from wallet:", rawAddress);
        throw new Error(`Invalid wallet address: ${rawAddress || "(empty)"}`);
      }

      // Convert to bech32 if needed (Eternl returns hex, other wallets may return bech32)
      let bech32Address: string;
      if (rawAddress.startsWith("addr")) {
        // Already bech32 format
        bech32Address = rawAddress;
      } else {
        // Hex format - convert to bech32 using Mesh SDK
        try {
          const addressObj = core.Address.fromString(rawAddress);
          if (!addressObj) {
            throw new Error("Failed to parse address");
          }
          bech32Address = addressObj.toBech32();
          authLogger.debug("Converted hex address to bech32:", { hex: rawAddress.slice(0, 20) + "...", bech32: bech32Address });
        } catch (conversionError) {
          console.error("Failed to convert address format:", conversionError);
          throw new Error(`Unable to convert wallet address format: ${rawAddress.slice(0, 20)}...`);
        }
      }

      // Debug logging
      authLogger.debug("Authentication addresses:", {
        rawAddress: rawAddress.slice(0, 20) + "...",
        bech32Address,
        walletName,
      });

      // Authenticate
      const authResponse = await authenticateWithWallet({
        signMessage: async (nonce: string) => {
          authLogger.debug("Signing nonce:", { nonce: nonce.slice(0, 20) + "...", length: nonce.length });
          authLogger.debug("Using bech32 address for signing:", bech32Address);

          // Mesh SDK ISigner interface: signData(payload: string, address?: string)
          // Note: payload comes FIRST, address is optional second parameter
          const signature = await wallet.signData(nonce, bech32Address);
          return signature;
        },
        address: bech32Address, // Always send bech32 to the API
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

      // Log JWT to console for debugging/testing
      console.group("🔐 Andamio Authentication Successful");
      console.log("JWT Token:", authResponse.jwt);

      // Decode and display JWT payload
      try {
        const payload = JSON.parse(atob(authResponse.jwt.split(".")[1]!)) as { exp: number };
        console.log("JWT Payload:", payload);
        console.log("Expires:", new Date(payload.exp * 1000).toLocaleString());
      } catch {
        console.log("Could not decode JWT payload");
      }

      console.log("User:", authResponse.user);
      console.log("\nTo use in API requests:");
      console.log(`Authorization: Bearer ${authResponse.jwt}`);
      console.log("\nCurl example:");
      console.log(`curl -X POST "${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/owner/course/sync-teachers" \\
  -H "Authorization: Bearer ${authResponse.jwt}" \\
  -H "Content-Type: application/json" \\
  -d '{"course_nft_policy_id": "YOUR_COURSE_POLICY_ID"}'`);
      console.groupEnd();
    } catch (error) {
      authLogger.error("Authentication failed:", error);
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
    // 5. JWT validation is not in progress (check REF for immediate sync value, not state)
    //    The ref is critical - state updates are batched and may not be visible in same render
    if (connected && wallet && !isAuthenticated && !isAuthenticating && !hasAttemptedAutoAuth && !isValidatingJWTRef.current) {
      authLogger.info("Auto-authenticating after wallet connection...");
      setHasAttemptedAutoAuth(true);
      void authenticate();
    }
  }, [connected, wallet, isAuthenticated, isAuthenticating, hasAttemptedAutoAuth, isValidatingJWT, authenticate]);

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
   * Refresh auth state from stored JWT
   * Useful after operations that update the JWT (e.g., minting access token)
   * Updates context state without requiring re-authentication
   */
  const refreshAuth = useCallback(() => {
    const storedJWT = getStoredJWT();

    if (!storedJWT) {
      authLogger.warn("refreshAuth called but no JWT in storage");
      return;
    }

    if (isJWTExpired(storedJWT)) {
      authLogger.warn("refreshAuth called but stored JWT is expired");
      clearStoredJWT();
      setJwt(null);
      setUser(null);
      setIsAuthenticated(false);
      return;
    }

    try {
      const payload = JSON.parse(atob(storedJWT.split(".")[1]!)) as {
        userId: string;
        cardanoBech32Addr?: string;
        accessTokenAlias?: string;
      };

      const updatedUser: AuthUser = {
        id: payload.userId,
        cardanoBech32Addr: payload.cardanoBech32Addr ?? null,
        accessTokenAlias: payload.accessTokenAlias ?? null,
      };

      authLogger.info("Refreshing auth state from stored JWT:", updatedUser);

      setJwt(storedJWT);
      setUser(updatedUser);
      setIsAuthenticated(true);
    } catch (error) {
      authLogger.error("Failed to parse JWT during refresh:", error);
    }
  }, []);

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
        refreshAuth,
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
