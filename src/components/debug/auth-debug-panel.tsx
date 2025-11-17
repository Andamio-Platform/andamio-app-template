"use client";

import React, { useState } from "react";
import { useAndamioAuth } from "~/contexts/andamio-auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Separator } from "~/components/ui/separator";
import { Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { getStoredJWT } from "~/lib/andamio-auth";
import { env } from "~/env";

interface JWTPayload {
  userId?: string;
  exp?: number;
  iat?: number;
  roles?: string[];
  [key: string]: unknown;
}

/**
 * AuthDebugPanel - Debugging tool for authentication issues
 *
 * Shows:
 * - Full auth state
 * - Decoded JWT payload
 * - Test authenticated request button
 */
export function AuthDebugPanel() {
  const auth = useAndamioAuth();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [roleResult, setRoleResult] = useState<string | null>(null);

  const jwt = getStoredJWT();
  let decodedJWT: JWTPayload | null = null;

  if (jwt) {
    try {
      decodedJWT = JSON.parse(atob(jwt.split('.')[1]!)) as JWTPayload;
    } catch (error) {
      console.error("Failed to decode JWT:", error);
    }
  }

  const handleCopyJWT = () => {
    if (jwt) {
      void navigator.clipboard.writeText(jwt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTestRequest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await auth.authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/owned`
      );

      if (response.ok) {
        const data = await response.json();
        setTestResult(`✅ SUCCESS: Got ${Array.isArray(data) ? data.length : 0} courses`);
      } else {
        const error = await response.json();
        setTestResult(`❌ FAILED: ${response.status} - ${JSON.stringify(error)}`);
      }
    } catch (error) {
      setTestResult(`❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleRequestCreatorRole = async () => {
    setIsCreatingRole(true);
    setRoleResult(null);

    try {
      const response = await auth.authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/creator/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRoleResult(`✅ SUCCESS: Creator role created! ID: ${(data as { creatorId?: string }).creatorId ?? "unknown"}\n\n🔄 Please re-authenticate (logout and login again) to refresh your JWT with the new role.`);
      } else {
        const error = await response.json();
        setRoleResult(`❌ FAILED: ${response.status} - ${JSON.stringify(error)}`);
      }
    } catch (error) {
      setRoleResult(`❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsCreatingRole(false);
    }
  };

  return (
    <Card className="border-yellow-500 border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          Auth Debug Panel
        </CardTitle>
        <CardDescription>
          Temporary debugging tool - remove in production
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auth State */}
        <div className="space-y-2">
          <h3 className="font-semibold">Auth State</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Wallet Connected:</div>
            <Badge variant={auth.isWalletConnected ? "default" : "secondary"}>
              {auth.isWalletConnected ? "Yes" : "No"}
            </Badge>

            <div>Authenticated:</div>
            <Badge variant={auth.isAuthenticated ? "default" : "secondary"}>
              {auth.isAuthenticated ? "Yes" : "No"}
            </Badge>

            <div>Has JWT:</div>
            <Badge variant={jwt ? "default" : "secondary"}>
              {jwt ? "Yes" : "No"}
            </Badge>

            <div>User Object:</div>
            <Badge variant={auth.user ? "default" : "secondary"}>
              {auth.user ? "Present" : "Null"}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* User Details */}
        {auth.user && (
          <>
            <div className="space-y-2">
              <h3 className="font-semibold">User Details</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID:</span>
                  <code className="text-xs">{auth.user.id}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address:</span>
                  <code className="text-xs">{auth.user.cardanoBech32Addr ?? "None"}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Access Token Alias:</span>
                  <code className="text-xs">{auth.user.accessTokenAlias ?? "None"}</code>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* JWT Info */}
        {jwt && decodedJWT && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">JWT Payload</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyJWT}
                  className="h-7"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy JWT
                    </>
                  )}
                </Button>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID:</span>
                  <code className="text-xs">{decodedJWT.userId ?? "Not found"}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Roles:</span>
                  <code className="text-xs">
                    {decodedJWT.roles ? JSON.stringify(decodedJWT.roles) : "Not found"}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issued At:</span>
                  <code className="text-xs">
                    {decodedJWT.iat
                      ? new Date(decodedJWT.iat * 1000).toLocaleString()
                      : "Not found"}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires At:</span>
                  <code className="text-xs">
                    {decodedJWT.exp
                      ? new Date(decodedJWT.exp * 1000).toLocaleString()
                      : "Not found"}
                  </code>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Test Request */}
        <div className="space-y-2">
          <h3 className="font-semibold">Test Authenticated Request</h3>
          <Button
            onClick={handleTestRequest}
            disabled={!auth.isAuthenticated || isTesting}
            className="w-full"
          >
            {isTesting ? "Testing..." : "Test GET /courses/owned"}
          </Button>
          {testResult && (
            <Alert variant={testResult.startsWith("✅") ? "default" : "destructive"}>
              <AlertDescription className="text-xs font-mono whitespace-pre-wrap">
                {testResult}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Error Display */}
        {auth.authError && (
          <>
            <Separator />
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Auth Error:</strong> {auth.authError}
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
}
