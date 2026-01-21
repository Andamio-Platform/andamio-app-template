/**
 * Task Hash Utility
 *
 * @deprecated Import from "@andamio/core/hashing" instead.
 * This file re-exports for backwards compatibility.
 *
 * @example
 * ```typescript
 * // Old import (deprecated)
 * import { computeTaskHash, type TaskData } from "~/lib/utils/task-hash";
 *
 * // New import (preferred)
 * import { computeTaskHash, type TaskData } from "@andamio/core/hashing";
 * ```
 */

export {
  computeTaskHash,
  verifyTaskHash,
  isValidTaskHash,
  debugTaskCBOR,
  type TaskData,
} from "@andamio/core/hashing";
