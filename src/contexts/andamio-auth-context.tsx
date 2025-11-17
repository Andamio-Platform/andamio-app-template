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
      // TODO: Optionally decode and set user data from JWT
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
