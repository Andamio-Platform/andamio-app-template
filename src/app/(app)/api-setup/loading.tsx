/**
 * Loading state for the API Setup page.
 *
 * Matches the stepper layout: header with icon, then a card
 * containing vertical checklist steps.
 */
export default function ApiSetupLoading() {
  return (
    <div className="h-full overflow-hidden">
      <div className="p-8 pb-16">
        <div className="max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl w-full mx-auto space-y-6">
          {/* Header with icon */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full motion-safe:animate-pulse bg-muted" />
            <div className="space-y-2">
              <div className="h-7 w-56 rounded motion-safe:animate-pulse bg-muted" />
              <div className="h-4 w-40 rounded motion-safe:animate-pulse bg-muted" />
            </div>
          </div>

          {/* Sign-in card skeleton */}
          <div className="rounded-xl border p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-5 w-40 rounded motion-safe:animate-pulse bg-muted" />
                <div className="h-4 w-64 rounded motion-safe:animate-pulse bg-muted" />
              </div>
              <div className="h-9 w-20 rounded motion-safe:animate-pulse bg-muted" />
            </div>
          </div>

          {/* Checklist card skeleton */}
          <div className="rounded-xl border p-6 space-y-6">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full motion-safe:animate-pulse bg-muted" />
                  {step < 4 && <div className="w-px flex-1 mt-1 bg-muted" />}
                </div>
                <div className="flex-1 pb-6 space-y-3">
                  <div className="h-4 w-32 rounded motion-safe:animate-pulse bg-muted" />
                  <div className="h-9 w-full rounded motion-safe:animate-pulse bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
