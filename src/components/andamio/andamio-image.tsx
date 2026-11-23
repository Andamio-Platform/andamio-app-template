import Image, { type ImageProps } from "next/image";

/**
 * Allowed origins for next/image optimization.
 * Must stay in sync with images.remotePatterns in next.config.js.
 *
 * Each entry is { protocol, hostname } matching the config exactly:
 * - protocol: "https" or "http"
 * - hostname: exact hostname or single-label wildcard (*.example.com)
 *   Next.js * matches exactly one label, so *.andamio.io matches
 *   sub.andamio.io but not sub.sub.andamio.io.
 */
const ALLOWED_ORIGINS: { protocol: string; hostname: string }[] = [
  { protocol: "https", hostname: "*.andamio.io" },
  { protocol: "https", hostname: "andamio.io" },
  { protocol: "https", hostname: "storage.googleapis.com" },
  { protocol: "https", hostname: "drive.google.com" },
  { protocol: "https", hostname: "cdn.discordapp.com" },
  { protocol: "https", hostname: "raw.githubusercontent.com" },
  { protocol: "https", hostname: "gimbalabs.com" },
  { protocol: "https", hostname: "meshjs.dev" },
  { protocol: "https", hostname: "img.freepik.com" },
  { protocol: "https", hostname: "i.imgur.com" },
  { protocol: "https", hostname: "cdn.corenexis.com" },
  { protocol: "https", hostname: "*.ftcdn.net" },
  // Development only — matches next.config.js which only adds this in dev
  ...(process.env.NODE_ENV === "development"
    ? [{ protocol: "http", hostname: "localhost" }]
    : []),
];

function isAllowedOrigin(src: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(src);
  } catch {
    // Relative path — Next.js Image handles these fine
    return true;
  }

  const { protocol, hostname } = parsed;
  // URL.protocol includes the trailing colon (e.g. "https:")
  const proto = protocol.replace(/:$/, "");

  return ALLOWED_ORIGINS.some(({ protocol: allowedProto, hostname: pattern }) => {
    if (proto !== allowedProto) return false;
    if (pattern.startsWith("*.")) {
      // Single-label wildcard: *.example.com matches sub.example.com
      // but NOT example.com or sub.sub.example.com
      const base = pattern.slice(2);
      return hostname.endsWith(`.${base}`) && hostname.split(".").length === base.split(".").length + 1;
    }
    return hostname === pattern;
  });
}

/**
 * Drop-in replacement for `next/image`.
 *
 * - Uses `next/image` (with optimization) for origins in ALLOWED_ORIGINS.
 * - Falls back to a plain `<img>` for all other URLs so the app never
 *   throws "hostname not configured" errors on user-submitted content.
 *
 * Usage is identical to `next/image`:
 *   <AndamioImage src={url} alt="..." fill className="object-cover" />
 */
export function AndamioImage({
  src,
  alt,
  className,
  onError,
  ...props
}: ImageProps) {
  const srcString = typeof src === "string" ? src : "";
  const useOptimized = !srcString || isAllowedOrigin(srcString);

  if (useOptimized) {
    return (
      <Image
        src={src}
        alt={alt}
        className={className}
        onError={onError}
        {...props}
      />
    );
  }

  // Plain <img> for untrusted/unknown origins — bypasses Next.js proxy.
  // Translate the `fill` prop to equivalent inline styles.
  const isFill = "fill" in props && props.fill;
  const imgStyle = isFill
    ? { position: "absolute" as const, inset: 0, width: "100%", height: "100%" }
    : undefined;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={srcString}
      alt={alt}
      className={className}
      style={imgStyle}
      onError={onError}
    />
  );
}
