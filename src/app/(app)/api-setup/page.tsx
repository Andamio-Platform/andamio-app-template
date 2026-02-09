"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@meshsdk/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { AndamioPageHeader } from "~/components/andamio";
import {
  SuccessIcon,
  ErrorIcon,
  LoadingIcon,
  CopyIcon,
  KeyIcon,
  WalletIcon,
  UserIcon,
  SignatureIcon,
  MailIcon,
  AlertIcon,
  SendIcon,
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
  getEmailVerificationStatus,
  resendVerificationEmail,
  type ApiKeyResponse,
  type DeveloperProfile,
  type DevRegisterSession,
  type WalletSignature,
  type EmailVerificationStatus,
} from "~/lib/andamio-auth";
import { useCopyFeedback } from "~/hooks/ui/use-success-notification";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";

type SetupStep = "connect" | "register" | "sign" | "api-key" | "complete";

interface WalletInfo {
  address: string;
  alias: string | null;
  accessTokenUnit: string | null;
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

  useEffect(() => {
    if (gatewayJwt) {
      storeDevJWT(gatewayJwt);
    }
    setDevJwt(gatewayJwt ?? getStoredDevJWT());
  }, [gatewayJwt]);

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

  // Try to login first (in case already registered)
  const handleCheckRegistration = async () => {
    if (!walletInfo?.alias || !walletInfo.address) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await loginWithGateway({
        alias: walletInfo.alias,
        walletAddress: walletInfo.address,
      });

      // Already registered - skip to API key step
      setGatewayJwt(response.jwt);
      setCurrentStep("api-key");
    } catch {
      // Not registered yet - stay on register step
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
          setCurrentStep("api-key");
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
      setCurrentStep("api-key");
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
      setProfileError(err instanceof Error ? err.message : "Failed to load API keys");
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
    if (!token) return;

    setIsVerificationLoading(true);
    setVerificationError(null);

    try {
      const status = await getEmailVerificationStatus(token);
      setEmailVerificationStatus(status);
    } catch (err) {
      // Only set error if it's not a 404 (endpoint might not exist yet)
      const errorMessage = err instanceof Error ? err.message : "Failed to check verification status";
      if (!errorMessage.includes("404")) {
        setVerificationError(errorMessage);
      }
    } finally {
      setIsVerificationLoading(false);
    }
  }, [devJwt]);

  useEffect(() => {
    if (devJwt || getStoredDevJWT()) {
      void loadEmailVerificationStatus();
    }
  }, [devJwt, loadEmailVerificationStatus]);

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

  return (
    <div className="space-y-6">
      <AndamioPageHeader
        title="Gateway API Setup"
        description="Register with the Andamio API Gateway and generate an API key"
      />

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <StepIndicator
          step={1}
          label="Connect"
          active={currentStep === "connect"}
          complete={currentStep !== "connect"}
        />
        <Separator className="flex-1" />
        <StepIndicator
          step={2}
          label="Register"
          active={currentStep === "register"}
          complete={currentStep === "sign" || currentStep === "api-key" || currentStep === "complete"}
        />
        <Separator className="flex-1" />
        <StepIndicator
          step={3}
          label="Sign"
          active={currentStep === "sign"}
          complete={currentStep === "api-key" || currentStep === "complete"}
        />
        <Separator className="flex-1" />
        <StepIndicator
          step={4}
          label="API Key"
          active={currentStep === "api-key"}
          complete={currentStep === "complete"}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <ErrorIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Email Verification Required - shown when logged in but email not verified */}
      {devJwt && emailVerificationStatus && !emailVerificationStatus.emailVerified && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertIcon className="h-5 w-5 text-warning" />
              Email Verification Required
            </CardTitle>
            <CardDescription>
              Please verify your email address to unlock all features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {verificationError && (
              <Alert variant="destructive">
                <ErrorIcon className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{verificationError}</AlertDescription>
              </Alert>
            )}

            {resendSuccess && (
              <Alert>
                <SuccessIcon className="h-4 w-4" />
                <AlertTitle>Email Sent</AlertTitle>
                <AlertDescription>{resendSuccess}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <MailIcon className="h-4 w-4" />
              <AlertTitle>Check Your Inbox</AlertTitle>
              <AlertDescription>
                We sent a verification link to your email address. Click the link to verify your account.
                {emailVerificationStatus.verificationEmailSentAt && (
                  <span className="block mt-1 text-xs text-muted-foreground">
                    Last sent: {new Date(emailVerificationStatus.verificationEmailSentAt).toLocaleString()}
                  </span>
                )}
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleResendVerification}
                disabled={isVerificationLoading || !emailVerificationStatus.canResend}
                variant="outline"
                className="w-full"
              >
                {isVerificationLoading && <LoadingIcon className="mr-2 h-4 w-4 animate-spin" />}
                <SendIcon className="mr-2 h-4 w-4" />
                Resend Verification Email
              </Button>

              {!emailVerificationStatus.canResend && emailVerificationStatus.waitDurationSeconds > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  You can resend in {emailVerificationStatus.waitDurationSeconds} seconds
                </p>
              )}

              {emailVerificationStatus.remainingAttempts > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  {emailVerificationStatus.remainingAttempts} resend attempts remaining today
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Connect Wallet */}
      {currentStep === "connect" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletIcon className="h-5 w-5" />
              Connect Wallet
            </CardTitle>
            <CardDescription>
              Connect your wallet with an Andamio Access Token to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!connected ? (
              <Alert>
                <WalletIcon className="h-4 w-4" />
                <AlertTitle>Wallet Required</AlertTitle>
                <AlertDescription>
                  Connect your wallet to get started.
                </AlertDescription>
                <ConnectWalletPrompt className="mt-3" />
              </Alert>
            ) : !isAuthenticated ? (
              <Alert>
                <WalletIcon className="h-4 w-4" />
                <AlertTitle>Authentication Required</AlertTitle>
                <AlertDescription>
                  Your wallet is connected, but you need to sign in first.
                  Please click &quot;Auth&quot; in the header bar to authenticate.
                  Your wallet must contain an Andamio Access Token.
                </AlertDescription>
              </Alert>
            ) : walletInfo && !walletInfo.alias ? (
              <Alert variant="destructive">
                <ErrorIcon className="h-4 w-4" />
                <AlertTitle>No Access Token Found</AlertTitle>
                <AlertDescription>
                  Your wallet does not contain an Andamio Access Token.
                  You need to mint an access token first before registering with the gateway.
                </AlertDescription>
              </Alert>
            ) : walletInfo?.alias ? (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Wallet Address</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {walletInfo.address.slice(0, 20)}...{walletInfo.address.slice(-10)}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Access Token Alias</span>
                    <Badge variant="secondary">{walletInfo.alias}</Badge>
                  </div>
                </div>
                <Button
                  onClick={handleCheckRegistration}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading && <LoadingIcon className="mr-2 h-4 w-4 animate-spin" />}
                  Continue to Registration
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Register */}
      {currentStep === "register" && walletInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Register with Gateway
            </CardTitle>
            <CardDescription>
              Create your account on the Andamio API Gateway
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Alias</span>
                <Badge variant="secondary">{walletInfo.alias}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Wallet</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {walletInfo.address.slice(0, 15)}...
                </code>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Required for account recovery and notifications
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleRegister}
                disabled={isLoading || !email}
                className="w-full"
              >
                {isLoading && <LoadingIcon className="mr-2 h-4 w-4 animate-spin" />}
                Register Account
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleCheckRegistration}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && <LoadingIcon className="mr-2 h-4 w-4 animate-spin" />}
                Already registered? Login
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Sign with Wallet */}
      {currentStep === "sign" && registerSession && walletInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SignatureIcon className="h-5 w-5" />
              Verify Wallet Ownership
            </CardTitle>
            <CardDescription>
              Sign a message with your wallet to prove you own this address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <WalletIcon className="h-4 w-4" />
              <AlertTitle>Wallet Signature Required</AlertTitle>
              <AlertDescription>
                Click the button below to sign with your wallet. This proves you own the wallet
                address and is required to create your developer account.
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Alias</span>
                <Badge variant="secondary">{walletInfo.alias}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm">{email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Session Expires</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(registerSession.expires_at).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSign}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && <LoadingIcon className="mr-2 h-4 w-4 animate-spin" />}
                <SignatureIcon className="mr-2 h-4 w-4" />
                Sign with Wallet
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setRegisterSession(null);
                  setCurrentStep("register");
                }}
                disabled={isLoading}
                className="w-full"
              >
                Back to Registration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Generate API Key */}
      {currentStep === "api-key" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyIcon className="h-5 w-5" />
              Generate API Key
            </CardTitle>
            <CardDescription>
              Create an API key for programmatic access to the Andamio Gateway
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <SuccessIcon className="h-4 w-4" />
              <AlertTitle>Registration Complete</AlertTitle>
              <AlertDescription>
                Your account has been created. You can now generate an API key.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="apiKeyName">API Key Name</Label>
              <Input
                id="apiKeyName"
                type="text"
                placeholder="my-app-key"
                value={apiKeyName}
                onChange={(e) => setApiKeyName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                A label to identify this API key (e.g., &quot;my-app&quot;, &quot;dev-testing&quot;)
              </p>
            </div>

            <Button
              onClick={handleGenerateApiKey}
              disabled={isLoading || !apiKeyName.trim()}
              className="w-full"
            >
              {isLoading && <LoadingIcon className="mr-2 h-4 w-4 animate-spin" />}
              Generate API Key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {currentStep === "complete" && apiKey && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SuccessIcon className="h-5 w-5 text-primary" />
              Setup Complete
            </CardTitle>
            <CardDescription>
              Your API key has been generated. Store it securely - it won&apos;t be shown again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <ErrorIcon className="h-4 w-4" />
              <AlertTitle>Save Your API Key</AlertTitle>
              <AlertDescription>
                This is the only time your API key will be displayed. Copy it now and store it securely.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>API Key</Label>
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
                    <SuccessIcon className="h-4 w-4 text-primary" />
                  ) : (
                    <CopyIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expires At</Label>
              <Input
                readOnly
                value={new Date(apiKey.expiresAt).toLocaleString()}
                className="text-sm"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Usage</Label>
              <p className="text-sm text-muted-foreground">
                Add this key to your environment variables:
              </p>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                ANDAMIO_API_KEY=&quot;{apiKey.apiKey}&quot;
              </pre>
              <p className="text-sm text-muted-foreground">
                Or use it in API requests as a header:
              </p>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                X-API-Key: {apiKey.apiKey}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {devJwt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyIcon className="h-5 w-5" />
              Your API Keys
            </CardTitle>
            <CardDescription>
              View and manage your existing API keys (keys are hidden after creation)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileError && (
              <Alert variant="destructive">
                <ErrorIcon className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{profileError}</AlertDescription>
              </Alert>
            )}

            {isProfileLoading ? (
              <div className="text-sm text-muted-foreground">Loading API keys...</div>
            ) : developerProfile?.activeKeys?.length ? (
              <div className="space-y-3">
                {developerProfile.activeKeys.map((key) => (
                  <div key={key.name} className="rounded-lg border p-4 space-y-3">
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
              <Alert>
                <KeyIcon className="h-4 w-4" />
                <AlertTitle>No API keys yet</AlertTitle>
                <AlertDescription>
                  Generate your first API key above to get started.
                </AlertDescription>
              </Alert>
            )}

            <Button
              variant="outline"
              onClick={() => void loadDeveloperProfile()}
              disabled={isProfileLoading}
            >
              {isProfileLoading && <LoadingIcon className="mr-2 h-4 w-4 animate-spin" />}
              Refresh Keys
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">About Gateway Registration</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            The Andamio API Gateway provides unified access to all Andamio services.
            Registration requires an on-chain Access Token to verify your identity.
          </p>
          <p>
            Your API key can be used for programmatic access to the gateway APIs,
            including transaction building, course/project data, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StepIndicator({
  step,
  label,
  active,
  complete
}: {
  step: number;
  label: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
          ${complete ? "bg-primary text-primary-foreground" : ""}
          ${active ? "bg-primary text-primary-foreground" : ""}
          ${!active && !complete ? "bg-muted text-muted-foreground" : ""}
        `}
      >
        {complete ? <SuccessIcon className="h-4 w-4" /> : step}
      </div>
      <span className={`text-sm ${active ? "font-medium" : "text-muted-foreground"}`}>
        {label}
      </span>
    </div>
  );
}
