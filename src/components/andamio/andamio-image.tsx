import Image, { type ImageProps } from "next/image";

/**
 * Hostnames configured under `images.remotePatterns` in next.config.js.
 * Keep in sync with that list. Wildcards are supported (e.g. "*.ftcdn.net").
 */
const ALLOWED_HOSTNAMES = [
  "*.andamio.io",
  "andamio.io",
  "storage.googleapis.com",
  "drive.google.com",
  "cdn.discordapp.com",
  "raw.githubusercontent.com",
  "gimbalabs.com",
  "meshjs.dev",
  "img.freepik.com",
  "i.imgur.com",
  "cdn.corenexis.com",
  "*.ftcdn.net",
  // dev
  "localhost",
];

function isAllowedHostname(src: string): boolean {
  let hostname: string;
  try {
    hostname = new URL(src).hostname;
  } catch {
    // relative path — Next.js Image handles these fine
    return true;
  }

  return ALLOWED_HOSTNAMES.some((pattern) => {
    if (pattern.startsWith("*.")) {
      const base = pattern.slice(2);
      return hostname === base || hostname.endsWith(`.${base}`);
    }
    return hostname === pattern;
  });
}

type AndamioImageProps = ImageProps & {
  /**
   * Fallback src shown when the image fails to load.
   * Defaults to an empty placeholder div if not provided.
   */
  fallbackSrc?: string;
};

/**
 * Drop-in replacement for `next/image`.
 *
 * - Uses `next/image` (with optimization) for known/allowlisted hostnames.
 * - Falls back to a plain `<img>` for arbitrary external URLs so the app
 *   never throws "hostname not configured" errors on user-submitted content.
 *
 * Usage is identical to `next/image`:
 *   <AndamioImage src={url} alt="..." fill />
 */
export function AndamioImage({
  src,
  alt,
  fallbackSrc,
  className,
  onError,
  ...props
}: AndamioImageProps) {
  const srcString = typeof src === "string" ? src : "";
  const useOptimized = !srcString || isAllowedHostname(srcString);

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

  // Plain img for untrusted/unknown hostnames — bypasses Next.js proxy.
  // `fill` translates to `position: absolute; inset: 0; width/height: 100%`.
  const isFill = "fill" in props && props.fill;
  const imgStyle = isFill
    ? { position: "absolute" as const, inset: 0, width: "100%", height: "100%" }
    : undefined;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={srcString || (fallbackSrc ?? "")}
      alt={alt}
      className={className}
      style={imgStyle}
      onError={
        onError as React.ReactEventHandler<HTMLImageElement> | undefined
      }
    />
  );
}
