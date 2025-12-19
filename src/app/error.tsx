"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { AndamioText } from "~/components/andamio/andamio-text";

/**
 * Root error boundary for the application
 *
 * Catches unhandled errors at the top level and displays a minimal error UI.
 * This boundary doesn't have access to the full component library since it
 * may be rendered before providers are initialized.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <h1 className="text-xl font-bold">Something went wrong</h1>
            </div>

            <AndamioText variant="muted">
              {error.message || "An unexpected error occurred"}
            </AndamioText>

            {error.digest && (
              <AndamioText variant="small" className="text-xs text-gray-400">
                Error ID: {error.digest}
              </AndamioText>
            )}

            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
