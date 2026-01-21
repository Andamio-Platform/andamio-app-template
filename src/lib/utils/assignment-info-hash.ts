/**
 * Assignment Info Hash Utility
 *
 * @deprecated Import from "@andamio/core/hashing" instead.
 * Use `computeCommitmentHash` instead of `computeAssignmentInfoHash`.
 * This file re-exports for backwards compatibility.
 *
 * @example
 * ```typescript
 * // Old import (deprecated)
 * import { computeAssignmentInfoHash } from "~/lib/utils/assignment-info-hash";
 *
 * // New import (preferred)
 * import { computeCommitmentHash } from "@andamio/core/hashing";
 * ```
 */

export {
  // New names (preferred)
  computeCommitmentHash,
  verifyCommitmentHash,
  isValidCommitmentHash,
  // Deprecated aliases (for backwards compatibility)
  computeAssignmentInfoHash,
  verifyAssignmentInfoHash,
  isValidAssignmentInfoHash,
  // Utilities
  verifyEvidenceDetailed,
  normalizeForHashing,
  // Types
  type TiptapDoc,
  type TiptapNode,
  type TiptapMark,
  type EvidenceVerificationResult,
} from "@andamio/core/hashing";
