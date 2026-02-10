"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "@meshsdk/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioInput,
  AndamioButton,
  AndamioText,
  AndamioHeading,
} from "~/components/andamio";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import {
  SuccessIcon,
  ErrorIcon,
  LoadingIcon,
  CopyIcon,
  KeyIcon,
  WalletIcon,
  SignatureIcon,
  MailIcon,
  AlertIcon,
  SendIcon,
  DeveloperIcon,
} from "~/components/icons";
import { env } from "~/env";
import { ConnectWalletPrompt } from "~/components/auth/connect-wallet-prompt";
import { extractAliasFromUnit } from "~/lib/access-token-utils";
import {
  createDevRegisterSession,
  completeDevRegistration,
  loginWithGateway,
  requestApiKey,
  getDeveloperProfile,
  rotateApiKey,
  deleteApiKey,
  getStoredDevJWT,
  storeDevJWT,
  clearStoredDevJWT,
  getEmailVerificationStatus,
  resendVerificationEmail,
  isJWTExpired,
  type ApiKeyResponse,
  type DeveloperProfile,
  type DevRegisterSession,
  type WalletSignature,
  type EmailVerificationStatus,
} from "~/lib/andamio-auth";
import { useCopyFeedback } from "~/hooks/ui/use-success-notification";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioScrollArea } from "~/components/andamio/andamio-scroll-area";

type SetupStep = "connect" | "register" | "sign" | "verify-email" | "api-key" | "complete";

interface WalletInfo {
  address: string;
  alias: string | null;
  accessTokenUnit: string | null;
}

// =============================================================================
// ChecklistStep — vertical stepper item with numbered circle / checkmark
// =============================================================================

interface ChecklistStepProps {
  step: number;
  title: string;
  status: string | null; // null = incomplete, string = completion summary
  isLast?: boolean;
  children: React.ReactNode;
}

function ChecklistStep({ step, title, status, isLast = false, children }: ChecklistStepProps) {
  const isComplete = status !== null;

  return (
    <div className="flex gap-4">
      {/* Left rail: indicator + connector line */}
      <div className="flex flex-col items-center">
        {isComplete ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
            <SuccessIcon className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-muted-foreground">
            <span className="text-sm font-semibold">{step}</span>
          </div>
        )}
        {/* Connector line */}
        {!isLast && (
          <div className={`w-px flex-1 mt-1 ${isComplete ? "bg-success/40" : "bg-border"}`} />
        )}
      </div>

      {/* Right: content */}
      <div className="flex-1 pb-8 min-w-0">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-sm font-semibold ${isComplete ? "text-success" : "text-foreground"}`}>
            {title}
          </span>
          {status && (
            <AndamioBadge className="text-xs bg-success/10 text-success border-success/20">
              {status}
            </AndamioBadge>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ApiSetupPage() {
  const { connected, wallet } = useWallet();
  const { isCopied, copy } = useCopyFeedback();
  const { jwt: endUserJwt, isAuthenticated } = useAndamioAuth();

  const [currentStep, setCurrentStep] = useState<SetupStep>("connect");
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gatewayJwt, setGatewayJwt] = useState<string | null>(null);
  const [registerSession, setRegisterSession] = useState<DevRegisterSession | null>(null);

  const [apiKey, setApiKey] = useState<ApiKeyResponse | null>(null);
  const [apiKeyName, setApiKeyName] = useState("andamio-app");
  const [developerProfile, setDeveloperProfile] = useState<DeveloperProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [activeKeyAction, setActiveKeyAction] = useState<string | null>(null);
  const [devJwt, setDevJwt] = useState<string | null>(null);

  // Email verification state
  const [emailVerificationStatus, setEmailVerificationStatus] = useState<EmailVerificationStatus | null>(null);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  // Registration state detection
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null); // null = checking
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  useEffect(() => {
    if (gatewayJwt) {
      storeDevJWT(gatewayJwt);
    }
    setDevJwt(gatewayJwt ?? getStoredDevJWT());
  }, [gatewayJwt]);

  // Check registration status when wallet connects
  useEffect(() => {
    // Immediately clear profile state when wallet changes to prevent showing stale data
    setDeveloperProfile(null);
    setEmailVerificationStatus(null);

    async function checkRegistrationStatus() {
      if (!walletInfo?.alias || !walletInfo.address) {
        setIsRegistered(null);
        return;
      }

      const storedJwt = getStoredDevJWT();

      // First, validate stored JWT isn't expired
      if (storedJwt && isJWTExpired(storedJwt)) {
        clearStoredDevJWT();
        setDevJwt(null);
        setIsRegistered(false);
        return;
      }

      // Try to load profile (confirms actual registration)
      if (storedJwt) {
        try {
          const profile = await getDeveloperProfile(storedJwt);

          // CRITICAL: Verify the JWT belongs to the CURRENT wallet
          // If the alias doesn't match, this JWT is for a different user
          if (profile.alias !== walletInfo.alias) {
            console.warn("[API Setup] Stored JWT belongs to different wallet, clearing");
            clearStoredDevJWT();
            setDevJwt(null);
            setIsRegistered(false);
            setDeveloperProfile(null);
            return;
          }

          setIsRegistered(true);
          setRegisteredEmail(profile.alias ? `${profile.alias}@...` : null); // API doesn't return email, use alias as indicator
          setDevJwt(storedJwt);
          setDeveloperProfile(profile);
          setCurrentStep("verify-email");
        } catch {
          // JWT invalid or not registered - clear and start fresh
          clearStoredDevJWT();
          setDevJwt(null);
          setIsRegistered(false);
        }
      } else {
        setIsRegistered(false);
      }
    }

    void checkRegistrationStatus();
  }, [walletInfo?.alias, walletInfo?.address]);

  // Detect wallet and access token
  useEffect(() => {
    async function detectWallet() {
      if (!connected || !wallet) {
        setWalletInfo(null);
        setCurrentStep("connect");
        return;
      }

      try {
        const addresses = await wallet.getUsedAddresses();
        const address = addresses[0] ?? (await wallet.getChangeAddress());

        const assets = await wallet.getAssets();
        const accessTokenPolicyId = env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID;
        const accessToken = assets.find((asset) =>
          asset.unit.startsWith(accessTokenPolicyId)
        );

        let alias: string | null = null;
        if (accessToken) {
          alias = extractAliasFromUnit(accessToken.unit, accessTokenPolicyId);
        }

        setWalletInfo({
          address,
          alias,
          accessTokenUnit: accessToken?.unit ?? null,
        });

        // Move to register step if wallet is connected and has access token
        if (alias) {
          setCurrentStep("register");
        }
      } catch (err) {
        console.error("Failed to detect wallet:", err);
        setError("Failed to read wallet information");
      }
    }

    void detectWallet();
  }, [connected, wallet]);

  // State for showing "not registered" feedback
  const [notRegisteredFeedback, setNotRegisteredFeedback] = useState(false);

  // Try to login first (in case already registered)
  const handleCheckRegistration = async () => {
    if (!walletInfo?.alias || !walletInfo.address) return;

    setIsLoading(true);
    setError(null);
    setNotRegisteredFeedback(false);

    try {
      const response = await loginWithGateway({
        alias: walletInfo.alias,
        walletAddress: walletInfo.address,
      });

      // Already registered - set state and go to verify-email step
      setGatewayJwt(response.jwt);
      setIsRegistered(true);
      setCurrentStep("verify-email");
    } catch {
      // Not registered yet - show feedback and stay on register step
      setNotRegisteredFeedback(true);
      setCurrentStep("register");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Create registration session (get nonce to sign)
  const handleRegister = async () => {
    if (!walletInfo?.alias || !walletInfo.address || !email || !endUserJwt) return;

    setIsLoading(true);
    setError(null);

    try {
      const session = await createDevRegisterSession({
        alias: walletInfo.alias,
        email,
        walletAddress: walletInfo.address,
        endUserJwt,
      });

      setRegisterSession(session);
      setCurrentStep("sign");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "";
      // If wallet already registered, try to login instead
      if (errorMessage.toLowerCase().includes("already registered")) {
        try {
          const loginResponse = await loginWithGateway({
            alias: walletInfo.alias,
            walletAddress: walletInfo.address,
          });
          setGatewayJwt(loginResponse.jwt);
          setIsRegistered(true);
          setCurrentStep("verify-email");
          return;
        } catch (loginErr) {
          setError(loginErr instanceof Error ? loginErr.message : "Login failed");
          return;
        }
      }
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Sign nonce with wallet and complete registration
  const handleSign = async () => {
    if (!wallet || !walletInfo?.address || !registerSession || !endUserJwt) return;

    setIsLoading(true);
    setError(null);

    try {
      // Sign the nonce with wallet (CIP-30)
      // Mesh SDK ISigner interface: signData(payload: string, address?: string)
      // Note: payload (nonce) comes FIRST, address is optional second parameter
      const signResult = await wallet.signData(registerSession.nonce, walletInfo.address);

      // Complete registration with signature (requires End User JWT)
      await completeDevRegistration({
        sessionId: registerSession.session_id,
        signature: signResult as WalletSignature,
        endUserJwt,
      });

      // Now login to get the JWT
      const loginResponse = await loginWithGateway({
        alias: walletInfo.alias!,
        walletAddress: walletInfo.address,
      });

      setGatewayJwt(loginResponse.jwt);
      setRegisterSession(null);
      setIsRegistered(true);
      setRegisteredEmail(email); // Store the email used for registration
      setCurrentStep("verify-email");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "";
      if (errorMessage.includes("session expired") || errorMessage.includes("expired")) {
        setError("Registration session expired. Please start again.");
        setRegisterSession(null);
        setCurrentStep("register");
      } else {
        setError(err instanceof Error ? err.message : "Signature verification failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate API key
  const handleGenerateApiKey = async () => {
    if (!gatewayJwt || !apiKeyName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await requestApiKey(gatewayJwt, apiKeyName.trim());
      setApiKey(response);
      await loadDeveloperProfile();
      setCurrentStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate API key");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeveloperProfile = useCallback(async () => {
    const token = devJwt ?? getStoredDevJWT();
    if (!token) return;

    setIsProfileLoading(true);
    setProfileError(null);

    try {
      const profile = await getDeveloperProfile(token);
      setDeveloperProfile(profile);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load API keys";
      // Clear stale JWT on auth errors
      if (message.includes("401") || message.includes("403") || message.toLowerCase().includes("unauthorized")) {
        clearStoredDevJWT();
        setDevJwt(null);
        setDeveloperProfile(null);
      }
      setProfileError(message);
    } finally {
      setIsProfileLoading(false);
    }
  }, [devJwt]);

  async function handleRotateKey(keyName: string) {
    const token = devJwt ?? getStoredDevJWT();
    if (!token) return;

    const confirmed = window.confirm(`Rotate API key \"${keyName}\"?`);
    if (!confirmed) return;

    setActiveKeyAction(`rotate:${keyName}`);
    setProfileError(null);

    try {
      await rotateApiKey(token, keyName);
      await loadDeveloperProfile();
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to rotate API key");
    } finally {
      setActiveKeyAction(null);
    }
  }

  async function handleDeleteKey(keyName: string) {
    const token = devJwt ?? getStoredDevJWT();
    if (!token) return;

    const confirmed = window.confirm(`Delete API key \"${keyName}\"? This cannot be undone.`);
    if (!confirmed) return;

    setActiveKeyAction(`delete:${keyName}`);
    setProfileError(null);

    try {
      await deleteApiKey(token, keyName);
      await loadDeveloperProfile();
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to delete API key");
    } finally {
      setActiveKeyAction(null);
    }
  }

  useEffect(() => {
    if (devJwt || getStoredDevJWT()) {
      void loadDeveloperProfile();
    }
  }, [devJwt, loadDeveloperProfile]);

  // Load email verification status when devJwt is available
  const loadEmailVerificationStatus = useCallback(async () => {
    const token = devJwt ?? getStoredDevJWT();
    // Guard: don't call if not registered
    if (!token || isRegistered !== true) return;

    setIsVerificationLoading(true);
    setVerificationError(null);

    try {
      const status = await getEmailVerificationStatus(token);
      setEmailVerificationStatus(status);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to check verification status";

      // 500/401/403 = likely not registered or bad JWT - reset flow gracefully
      if (errorMessage.includes("500") || errorMessage.includes("401") || errorMessage.includes("403")) {
        clearStoredDevJWT();
        setDevJwt(null);
        setIsRegistered(false);
        setVerificationError(null); // Don't show error, just reset flow
      } else if (!errorMessage.includes("404")) {
        // Only set error if it's not a 404 (endpoint might not exist yet)
        setVerificationError(errorMessage);
      }
    } finally {
      setIsVerificationLoading(false);
    }
  }, [devJwt, isRegistered]);

  useEffect(() => {
    // Only check email verification if we confirmed registration
    if (isRegistered === true && (devJwt || getStoredDevJWT())) {
      void loadEmailVerificationStatus();
    }
  }, [isRegistered, devJwt, loadEmailVerificationStatus]);

  // Handle resend verification email
  async function handleResendVerification() {
    const token = devJwt ?? getStoredDevJWT();
    if (!token) return;

    setIsVerificationLoading(true);
    setVerificationError(null);
    setResendSuccess(null);

    try {
      const result = await resendVerificationEmail(token);
      setResendSuccess(result.message);
      // Refresh status after resending
      await loadEmailVerificationStatus();
    } catch (err) {
      setVerificationError(err instanceof Error ? err.message : "Failed to resend verification email");
    } finally {
      setIsVerificationLoading(false);
    }
  }

  const maskApiKey = (rawKey?: string) => {
    if (!rawKey) return "Hidden";
    if (rawKey.length <= 8) return `${rawKey[0]}••••${rawKey[rawKey.length - 1]}`;
    return `${rawKey.slice(0, 4)}••••${rawKey.slice(-4)}`;
  };

  const formatDateTime = (value: string) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleString();
  };

  // Computed step statuses for checklist display
  const hasEmail = email.trim().length > 0;
  // Use proper registration check instead of just JWT existence
  const isSignedIn = isRegistered === true && !!(gatewayJwt || devJwt);
  const isEmailVerified = emailVerificationStatus?.emailVerified ?? false;
  const hasApiKey = currentStep === "complete" || (developerProfile?.activeKeys?.length ?? 0) > 0;

  // Pre-requisite check: need wallet + auth + access token
  const canStartOnboarding = connected && isAuthenticated && walletInfo?.alias;

  // If not ready to start, show the connect wallet / auth prompt
  if (!canStartOnboarding) {
    return (
      <div className="h-full overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <AndamioScrollArea className="h-full">
          <div className="p-8 pb-16">
            <div className="max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl w-full mx-auto">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <DeveloperIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <AndamioHeading level={2} size="3xl" className="mb-1">Developer Onboarding</AndamioHeading>
                  <AndamioText variant="small" className="text-muted-foreground">
                    Get an API key to build with Andamio
                  </AndamioText>
                </div>
              </div>

              {/* Requirements Card */}
              <AndamioCard className="mt-6">
                <AndamioCardContent className="py-8">
                  {!connected ? (
                    <div className="text-center space-y-4">
                      <WalletIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <AndamioText className="font-medium mb-1">Connect Your Wallet</AndamioText>
                        <AndamioText variant="small" className="text-muted-foreground">
                          Connect a wallet with an Andamio Access Token to get started.
                        </AndamioText>
                      </div>
                      <ConnectWalletPrompt />
                    </div>
                  ) : !isAuthenticated ? (
                    <div className="text-center space-y-4">
                      <SignatureIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <AndamioText className="font-medium mb-1">Authentication Required</AndamioText>
                        <AndamioText variant="small" className="text-muted-foreground">
                          Your wallet is connected. Click &quot;Auth&quot; in the header to sign in.
                        </AndamioText>
                      </div>
                    </div>
                  ) : walletInfo && !walletInfo.alias ? (
                    <div className="text-center space-y-4">
                      <AlertIcon className="h-12 w-12 mx-auto text-destructive" />
                      <div>
                        <AndamioText className="font-medium mb-1 text-destructive">No Access Token Found</AndamioText>
                        <AndamioText variant="small" className="text-muted-foreground">
                          Your wallet does not contain an Andamio Access Token.
                          You need to mint one first before registering as a developer.
                        </AndamioText>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <LoadingIcon className="h-8 w-8 mx-auto animate-spin text-primary" />
                      <AndamioText variant="small" className="text-muted-foreground mt-2">
                        Loading wallet data...
                      </AndamioText>
                    </div>
                  )}
                </AndamioCardContent>
              </AndamioCard>
            </div>
          </div>
        </AndamioScrollArea>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      <AndamioScrollArea className="h-full">
        <div className="p-8 pb-16">
          <div className="max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl w-full mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <DeveloperIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <AndamioHeading level={2} size="3xl" className="mb-1">Developer Onboarding</AndamioHeading>
                <AndamioText variant="small" className="text-muted-foreground">
                  Get an API key to build with Andamio
                </AndamioText>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <ErrorIcon className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Registered Developers - Sign In (hidden after failed attempt) */}
            {!isSignedIn && !notRegisteredFeedback && (
              <AndamioCard className="mt-6">
                <AndamioCardContent className="py-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <AndamioText className="font-medium">Registered Developers</AndamioText>
                      <AndamioText variant="small" className="text-muted-foreground">
                        Already have an account? Sign in to manage your API keys.
                      </AndamioText>
                    </div>
                    <AndamioButton
                      variant="outline"
                      onClick={handleCheckRegistration}
                      disabled={isLoading}
                    >
                      {isLoading && <LoadingIcon className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </AndamioButton>
                  </div>
                </AndamioCardContent>
              </AndamioCard>
            )}

            {/* New Developers - Registration Flow */}
            <AndamioCard className="mt-6">
              {!isSignedIn && (
                <div className="px-6 pt-6 pb-2">
                  <AndamioText className="font-medium">New Developers</AndamioText>
                  <AndamioText variant="small" className="text-muted-foreground">
                    Register to get your API key.
                  </AndamioText>
                </div>
              )}
              <AndamioCardContent className="py-8">
                {/* Not registered feedback */}
                {notRegisteredFeedback && !isSignedIn && (
                  <div className="mb-6 rounded-lg border border-primary/50 bg-primary/10 p-4">
                    <div className="flex items-start gap-3">
                      <AlertIcon className="h-5 w-5 text-primary mt-0.5" />
                      <div className="space-y-1">
                        <AndamioText className="font-medium">Account not found</AndamioText>
                        <AndamioText variant="small" className="text-muted-foreground">
                          No developer account found for this wallet. Complete the registration below to get started.
                        </AndamioText>
                        <button
                          type="button"
                          className="text-sm text-primary hover:underline"
                          onClick={() => setNotRegisteredFeedback(false)}
                        >
                          ← Try sign in again
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Step 1: Enter Email */}
                <ChecklistStep
                  step={1}
                  title="Enter your email"
                  status={isRegistered ? (registeredEmail ?? email) || "registered" : null}
                >
                  {!isRegistered ? (
                    <div className="space-y-3">
                      <AndamioInput
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading || registerSession !== null}
                      />
                      <AndamioText variant="small" className="text-muted-foreground">
                        Required for account recovery and notifications
                      </AndamioText>
                    </div>
                  ) : (
                    <code className="rounded bg-muted px-2 py-1 font-mono text-sm text-foreground">
                      {(registeredEmail ?? email) || "—"}
                    </code>
                  )}
                </ChecklistStep>

                {/* Step 2: Sign with Wallet */}
                <ChecklistStep
                  step={2}
                  title="Sign with wallet"
                  status={isSignedIn ? "verified" : null}
                >
                  {!isSignedIn ? (
                    <div className="space-y-3">
                      {registerSession ? (
                        <>
                          <AndamioText variant="small" className="text-muted-foreground">
                            Sign with your wallet to prove ownership. Session expires at {new Date(registerSession.expires_at).toLocaleTimeString()}.
                          </AndamioText>
                          <div className="flex gap-2">
                            <AndamioButton
                              onClick={handleSign}
                              disabled={isLoading}
                              className="flex-1"
                            >
                              {isLoading && <LoadingIcon className="mr-2 h-4 w-4 animate-spin" />}
                              <SignatureIcon className="mr-2 h-4 w-4" />
                              Sign Now
                            </AndamioButton>
                            <AndamioButton
                              variant="outline"
                              onClick={() => {
                                setRegisterSession(null);
                                setCurrentStep("register");
                              }}
                              disabled={isLoading}
                            >
                              Back
                            </AndamioButton>
                          </div>
                        </>
                      ) : (
                        <>
                          <AndamioText variant="small" className="text-muted-foreground">
                            Verify wallet ownership with a signature.
                          </AndamioText>
                          <AndamioButton
                            onClick={handleRegister}
                            disabled={isLoading || !hasEmail}
                          >
                            {isLoading && <LoadingIcon className="mr-2 h-4 w-4 animate-spin" />}
                            Continue
                          </AndamioButton>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <WalletIcon className="h-4 w-4 text-muted-foreground" />
                      <code className="rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
                        {walletInfo.alias}
                      </code>
                    </div>
                  )}
                </ChecklistStep>

                {/* Step 3: Verify Email */}
                <ChecklistStep
                  step={3}
                  title="Verify email"
                  status={isEmailVerified ? "verified" : null}
                >
                  {!isSignedIn ? (
                    <AndamioText variant="small" className="text-muted-foreground">
                      Complete registration first
                    </AndamioText>
                  ) : isEmailVerified ? (
                    <AndamioText variant="small" className="text-success">
                      Email verified
                    </AndamioText>
                  ) : (
                    <div className="space-y-3">
                      {verificationError && (
                        <Alert variant="destructive">
                          <ErrorIcon className="h-4 w-4" />
                          <AlertDescription>{verificationError}</AlertDescription>
                        </Alert>
                      )}

                      {resendSuccess && (
                        <Alert>
                          <SuccessIcon className="h-4 w-4" />
                          <AlertDescription>{resendSuccess}</AlertDescription>
                        </Alert>
                      )}

                      <div className="rounded-lg border border-warning/50 bg-warning/10 p-3">
                        <div className="flex items-start gap-2">
                          <MailIcon className="h-4 w-4 text-warning mt-0.5" />
                          <div>
                            <AndamioText variant="small" className="font-medium">
                              Check your inbox
                            </AndamioText>
                            <AndamioText variant="small" className="text-muted-foreground">
                              Click the verification link we sent to your email.
                              {emailVerificationStatus?.verificationEmailSentAt && (
                                <span className="block mt-1 text-xs">
                                  Last sent: {new Date(emailVerificationStatus.verificationEmailSentAt).toLocaleString()}
                                </span>
                              )}
                            </AndamioText>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <AndamioButton
                          variant="outline"
                          size="sm"
                          onClick={handleResendVerification}
                          disabled={isVerificationLoading || !!(emailVerificationStatus && !emailVerificationStatus.canResend)}
                        >
                          {isVerificationLoading && <LoadingIcon className="mr-2 h-4 w-4 animate-spin" />}
                          <SendIcon className="mr-2 h-4 w-4" />
                          Resend Email
                        </AndamioButton>

                        {emailVerificationStatus && !emailVerificationStatus.canResend && emailVerificationStatus.waitDurationSeconds > 0 && (
                          <AndamioText variant="small" className="text-muted-foreground text-center">
                            Wait {emailVerificationStatus.waitDurationSeconds}s before resending
                          </AndamioText>
                        )}
                      </div>
                    </div>
                  )}
                </ChecklistStep>

                {/* Step 4: Generate API Key */}
                <ChecklistStep
                  step={4}
                  title="Generate API key"
                  status={hasApiKey ? apiKeyName : null}
                  isLast
                >
                  {!isSignedIn ? (
                    <AndamioText variant="small" className="text-muted-foreground">
                      Complete registration first
                    </AndamioText>
                  ) : currentStep === "complete" && apiKey ? (
                    <div className="space-y-4">
                      <Alert variant="destructive">
                        <ErrorIcon className="h-4 w-4" />
                        <AlertTitle>Save Your API Key</AlertTitle>
                        <AlertDescription>
                          This is the only time it will be displayed. Copy it now!
                        </AlertDescription>
                      </Alert>

                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={apiKey.apiKey}
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copy(apiKey.apiKey)}
                        >
                          {isCopied ? (
                            <SuccessIcon className="h-4 w-4 text-success" />
                          ) : (
                            <CopyIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <AndamioText variant="small" className="text-muted-foreground">
                          Add to your environment:
                        </AndamioText>
                        <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                          ANDAMIO_API_KEY=&quot;{apiKey.apiKey}&quot;
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AndamioInput
                        id="apiKeyName"
                        placeholder="my-app-key"
                        value={apiKeyName}
                        onChange={(e) => setApiKeyName(e.target.value)}
                        disabled={isLoading}
                      />
                      <AndamioText variant="small" className="text-muted-foreground">
                        A label to identify this API key
                      </AndamioText>
                      <AndamioButton
                        onClick={handleGenerateApiKey}
                        disabled={isLoading || !apiKeyName.trim()}
                      >
                        {isLoading && <LoadingIcon className="mr-2 h-4 w-4 animate-spin" />}
                        <KeyIcon className="mr-2 h-4 w-4" />
                        Generate Key
                      </AndamioButton>
                    </div>
                  )}
                </ChecklistStep>
              </AndamioCardContent>
            </AndamioCard>

            {/* Existing API Keys Card - only show after successful profile load */}
            {developerProfile && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <KeyIcon className="h-4 w-4" />
                    Your API Keys
                  </CardTitle>
                  <CardDescription>
                    Manage your existing API keys
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profileError && (
                    <Alert variant="destructive">
                      <ErrorIcon className="h-4 w-4" />
                      <AlertDescription>{profileError}</AlertDescription>
                    </Alert>
                  )}

                  {isProfileLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <LoadingIcon className="h-4 w-4 animate-spin" />
                      Loading keys...
                    </div>
                  ) : developerProfile?.activeKeys?.length ? (
                    <div className="space-y-3">
                      {developerProfile.activeKeys.map((key, index) => (
                        <div key={key.name || `key-${index}`} className="rounded-lg border p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{key.name}</span>
                                <Badge variant={key.isActive ? "secondary" : "outline"}>
                                  {key.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Created {formatDateTime(key.createdAt)} • Expires {formatDateTime(key.expiresAt)}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRotateKey(key.name)}
                                disabled={activeKeyAction !== null}
                              >
                                {activeKeyAction === `rotate:${key.name}` && (
                                  <LoadingIcon className="mr-2 h-3.5 w-3.5 animate-spin" />
                                )}
                                Rotate
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteKey(key.name)}
                                disabled={activeKeyAction !== null}
                              >
                                {activeKeyAction === `delete:${key.name}` && (
                                  <LoadingIcon className="mr-2 h-3.5 w-3.5 animate-spin" />
                                )}
                                Delete
                              </Button>
                            </div>
                          </div>
                          <div className="rounded-md bg-muted px-3 py-2 text-xs font-mono">
                            {maskApiKey(key.apiKey)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <AndamioText variant="small" className="text-muted-foreground">
                      No API keys yet. Generate your first key above.
                    </AndamioText>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void loadDeveloperProfile()}
                    disabled={isProfileLoading}
                  >
                    {isProfileLoading && <LoadingIcon className="mr-2 h-4 w-4 animate-spin" />}
                    Refresh
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </AndamioScrollArea>
    </div>
  );
}
