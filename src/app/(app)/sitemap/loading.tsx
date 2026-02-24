/**
 * Loading state for the Sitemap page.
 *
 * Matches the sitemap layout: centered page header, auth status card,
 * then multiple route category cards with list items.
 */
export default function SitemapLoading() {
  return (
    <div className="space-y-8 pb-16">
      {/* Centered page header */}
      <div className="text-center space-y-2">
        <div className="h-8 w-24 mx-auto rounded motion-safe:animate-pulse bg-muted" />
        <div className="h-5 w-80 mx-auto rounded motion-safe:animate-pulse bg-muted" />
      </div>

      {/* Auth status card */}
      <div className="rounded-xl border p-8">
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-36 rounded motion-safe:animate-pulse bg-muted" />
            <div className="h-3 w-56 rounded motion-safe:animate-pulse bg-muted" />
          </div>
          <div className="h-6 w-28 rounded-full motion-safe:animate-pulse bg-muted" />
        </div>
      </div>

      {/* Route category cards */}
      {Array.from({ length: 4 }).map((_, cardIndex) => (
        <div key={cardIndex} className="rounded-xl border">
          {/* Card header */}
          <div className="p-6 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded motion-safe:animate-pulse bg-muted" />
              <div className="h-5 w-36 rounded motion-safe:animate-pulse bg-muted" />
            </div>
            <div className="h-4 w-48 rounded motion-safe:animate-pulse bg-muted" />
          </div>
          {/* Card content with route items */}
          <div className="px-6 pb-6 space-y-3">
            {Array.from({ length: 3 }).map((_, itemIndex) => (
              <div
                key={itemIndex}
                className="flex items-start justify-between gap-4 rounded-md border p-3"
              >
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 rounded motion-safe:animate-pulse bg-muted" />
                  <div className="h-3 w-64 rounded motion-safe:animate-pulse bg-muted" />
                  <div className="h-3 w-32 rounded motion-safe:animate-pulse bg-muted" />
                </div>
                <div className="h-8 w-16 rounded motion-safe:animate-pulse bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
