"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@meshsdk/react";
import {
  authenticateWithWallet,
  storeJWT,
  getStoredJWT,
  clearStoredJWT,
  isJWTExpired,
  type AuthUser,
} from "~/lib/andamio-auth";

/**
 * Hook for managing Andamio authentication state
 *
 * Handles:
 * - Wallet-based authentication
 * - JWT storage and retrieval
 * - Auth state persistence
 * - Logout functionality
 */
export function useAndamioAuth() {
  const { connected, wallet, name: walletName } = useWallet();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check for stored JWT on mount
  useEffect(() => {
    const storedJWT = getStoredJWT();
    if (storedJWT && !isJWTExpired(storedJWT)) {
      setJwt(storedJWT);
      setIsAuthenticated(true);
      // TODO: Optionally fetch user data from JWT or API
    } else if (storedJWT) {
      // JWT expired, clear it
      clearStoredJWT();
    }
  }, []);

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
      });

      // Store JWT and update state
      storeJWT(authResponse.jwt);
      setJwt(authResponse.jwt);
      setUser(authResponse.user);
      setIsAuthenticated(true);
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

  /**
   * Logout and clear auth state
   */
  const logout = useCallback(() => {
    clearStoredJWT();
    setJwt(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
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

  return {
    // State
    isAuthenticated,
    user,
    jwt,
    isAuthenticating,
    authError,
    isWalletConnected: connected,

    // Actions
    authenticate,
    logout,
    authenticatedFetch,
  };
}
