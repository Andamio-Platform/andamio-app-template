import { Suspense } from "react";
import { VerifyEmailContent } from "./verify-email-content";
import {
  AndamioCard,
  AndamioCardContent,
} from "~/components/andamio/andamio-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { LoadingIcon, MailIcon } from "~/components/icons";

/**
 * Loading fallback for Suspense boundary
 */
function VerifyEmailLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center overflow-auto bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
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
        <AndamioCard>
          <AndamioCardContent className="py-8">
            <div className="flex flex-col items-center gap-3">
              <LoadingIcon className="h-8 w-8 animate-spin text-muted-foreground" />
              <AndamioText variant="muted">
                Loading...
              </AndamioText>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>
    </div>
  );
}

/**
 * Email verification page - handles magic link verification callbacks
 *
 * URL Parameters:
 * - id: Magic link token ID
 * - token: Magic link token value
 */
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
