"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { gatewayPost, GatewayError } from "~/lib/gateway";
import { storeJWT } from "~/lib/andamio-auth";
import {
  SuccessIcon,
  ErrorIcon,
  LoadingIcon,
  AlertIcon,
  ForwardIcon,
  MailIcon,
} from "~/components/icons";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { AndamioButton } from "~/components/andamio/andamio-button";

type VerifyState = "verifying" | "success" | "error";

interface VerifyEmailResponse {
  message: string;
  token: string;
}

/**
 * Get user-friendly error message based on HTTP status code
 */
function getErrorMessage(error: unknown): { title: string; description: string } {
  if (error instanceof GatewayError) {
    switch (error.status) {
      case 400:
        return {
          title: "Invalid Verification Link",
          description: "The verification link is malformed or invalid. Please check your email and try again.",
        };
      case 404:
        return {
          title: "Link Not Found",
          description: "This verification link was not found or has already been used.",
        };
      case 410:
        return {
          title: "Link Expired",
          description: "This verification link has expired. Please request a new verification email.",
        };
      default:
        return {
          title: "Verification Failed",
          description: error.message || "An unexpected error occurred. Please try again.",
        };
    }
  }

  return {
    title: "Verification Failed",
    description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
  };
}

/**
 * Client component that handles the email verification logic
 * Must be wrapped in Suspense because it uses useSearchParams
 */
export function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = React.useState<VerifyState>("verifying");
  const [errorInfo, setErrorInfo] = React.useState<{
    title: string;
    description: string;
  } | null>(null);

  // Prevent duplicate requests across StrictMode remounts
  const verifyAttempted = React.useRef(false);

  // Extract params from URL
  const tokenId = searchParams.get("id");
  const token = searchParams.get("token");

  // Verify email on mount
  React.useEffect(() => {
    // Validate required params
    if (!tokenId || !token) {
      setErrorInfo({
        title: "Missing Parameters",
        description:
          "The verification link is incomplete. Please check your email and use the full link.",
      });
      setState("error");
      return;
    }

    // Only fire one request, even if the effect runs multiple times
    if (verifyAttempted.current) return;
    verifyAttempted.current = true;

    async function verifyEmail() {
      try {
        const response = await gatewayPost<VerifyEmailResponse>(
          "/api/v2/auth/developer/verify-email",
          {
            token_id: tokenId,
            token: token,
          },
        );

        // Store the JWT
        if (response.token) {
          storeJWT(response.token);
        }

        setState("success");
      } catch (error) {
        // 409 means the token was already used — verification succeeded on a prior request
        if (error instanceof GatewayError && error.status === 409) {
          setState("success");
          return;
        }

        console.error("[VerifyEmail] Verification failed:", error);
        setErrorInfo(getErrorMessage(error));
        setState("error");
      }
    }

    void verifyEmail();
  }, [tokenId, token]);

  return (
    <div className="flex min-h-screen items-center justify-center overflow-auto bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header - shown during verifying and error states */}
        {state !== "success" && (
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <MailIcon className="h-6 w-6 text-primary" />
            </div>
            <AndamioHeading level={1} size="2xl">
              Email Verification
            </AndamioHeading>
            <AndamioText variant="muted">
              Verifying your email address
            </AndamioText>
          </div>
        )}

        {/* State: Verifying */}
        {state === "verifying" && (
          <AndamioCard>
            <AndamioCardContent className="py-8">
              <div className="flex flex-col items-center gap-3">
                <LoadingIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                <AndamioText variant="muted">
                  Verifying your email address...
                </AndamioText>
              </div>
            </AndamioCardContent>
          </AndamioCard>
        )}

        {/* State: Success */}
        {state === "success" && (
          <AndamioCard>
            <AndamioCardHeader className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <SuccessIcon className="h-8 w-8 text-primary" />
              </div>
              <AndamioCardTitle className="text-2xl">
                Email Verified!
              </AndamioCardTitle>
              <AndamioCardDescription className="mx-auto max-w-sm text-center text-base">
                Your email has been verified successfully. You can now access all features.
              </AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
                <AndamioText variant="small" className="text-muted-foreground">
                  Your session has been updated with your verified email.
                </AndamioText>
              </div>

              <AndamioButton
                className="w-full"
                onClick={() => router.push("/dashboard")}
                rightIcon={<ForwardIcon className="h-4 w-4" />}
              >
                Continue to Dashboard
              </AndamioButton>
            </AndamioCardContent>
          </AndamioCard>
        )}

        {/* State: Error */}
        {state === "error" && errorInfo && (
          <AndamioCard>
            <AndamioCardHeader>
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                {errorInfo.title === "Link Expired" ? (
                  <AlertIcon className="h-5 w-5 text-destructive" />
                ) : (
                  <ErrorIcon className="h-5 w-5 text-destructive" />
                )}
              </div>
              <AndamioCardTitle className="text-center">
                {errorInfo.title}
              </AndamioCardTitle>
              <AndamioCardDescription className="mx-auto max-w-sm text-center">
                {errorInfo.description}
              </AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <AndamioText variant="small" className="font-medium">
                  What to do next
                </AndamioText>
                <AndamioText variant="small" className="text-muted-foreground">
                  {errorInfo.title === "Link Expired"
                    ? "Go to your account settings to request a new verification email."
                    : "Check your email for the correct verification link, or contact support if the problem persists."}
                </AndamioText>
              </div>

              <AndamioButton
                variant="outline"
                className="w-full"
                onClick={() => router.push("/")}
              >
                Return to Home
              </AndamioButton>
            </AndamioCardContent>
          </AndamioCard>
        )}
      </div>
    </div>
  );
}
