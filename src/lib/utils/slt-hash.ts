/**
 * SLT Hash Utility
 *
 * @deprecated Import from "@andamio/core/hashing" instead.
 * This file re-exports for backwards compatibility.
 *
 * @example
 * ```typescript
 * // Old import (deprecated)
 * import { computeSltHash } from "~/lib/utils/slt-hash";
 *
 * // New import (preferred)
 * import { computeSltHash } from "@andamio/core/hashing";
 * ```
 */

export {
  computeSltHash,
  computeSltHashDefinite,
  verifySltHash,
  isValidSltHash,
} from "@andamio/core/hashing";
