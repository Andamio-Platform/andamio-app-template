"use client";

import React from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAuthButton } from "~/components/auth/andamio-auth-button";
import { AndamioText } from "~/components/andamio";

interface RequireAuthProps {
  /** Page title shown when not authenticated */
  title: string;
  /** Description shown when not authenticated */
  description: string;
  /** Content to render when authenticated */
  children: React.ReactNode;
}

/**
 * Wrapper component that shows auth prompt when user is not authenticated.
 *
 * @example
 * ```tsx
 * <RequireAuth
 *   title="Studio"
 *   description="Connect your wallet to access the creator studio"
 * >
 *   <StudioContent />
 * </RequireAuth>
 * ```
 */
export function RequireAuth({ title, description, children }: RequireAuthProps) {
  const { isAuthenticated } = useAndamioAuth();

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div>
          <h1>{title}</h1>
          <AndamioText variant="muted">{description}</AndamioText>
        </div>

        <div className="max-w-md">
          <AndamioAuthButton />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
