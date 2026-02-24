/**
 * Loading state for the Usage Dashboard page.
 *
 * Matches the usage layout: page header with refresh button, stat cards grid,
 * quota progress cards, and plan details.
 */
export default function UsageLoading() {
  return (
    <div className="space-y-8">
      {/* Page header with action */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-44 rounded motion-safe:animate-pulse bg-muted" />
          <div className="h-5 w-80 rounded motion-safe:animate-pulse bg-muted" />
        </div>
        <div className="h-9 w-20 rounded motion-safe:animate-pulse bg-muted" />
      </div>

      {/* Stat cards grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded motion-safe:animate-pulse bg-muted" />
              <div className="h-4 w-20 rounded motion-safe:animate-pulse bg-muted" />
            </div>
            <div className="h-7 w-16 rounded motion-safe:animate-pulse bg-muted" />
          </div>
        ))}
      </div>

      {/* Quota progress cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-4">
            <div className="space-y-2">
              <div className="h-5 w-28 rounded motion-safe:animate-pulse bg-muted" />
              <div className="h-4 w-48 rounded motion-safe:animate-pulse bg-muted" />
            </div>
            <div className="h-2 w-full rounded-full motion-safe:animate-pulse bg-muted" />
            <div className="h-4 w-24 rounded motion-safe:animate-pulse bg-muted" />
          </div>
        ))}
      </div>

      {/* Plan details card */}
      <div className="rounded-xl border p-6 space-y-4">
        <div className="space-y-2">
          <div className="h-5 w-24 rounded motion-safe:animate-pulse bg-muted" />
          <div className="h-4 w-48 rounded motion-safe:animate-pulse bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="h-4 w-28 rounded motion-safe:animate-pulse bg-muted" />
            <div className="h-5 w-20 rounded motion-safe:animate-pulse bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 rounded motion-safe:animate-pulse bg-muted" />
            <div className="h-5 w-28 rounded motion-safe:animate-pulse bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
