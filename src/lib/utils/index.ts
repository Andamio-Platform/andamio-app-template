/**
 * Utility Functions
 *
 * Local implementations of hash utilities for Andamio protocol.
 * These match the on-chain Plutus validator implementations.
 */

// Task hash utilities
export {
  computeTaskHash,
  verifyTaskHash,
  isValidTaskHash,
  debugTaskCBOR,
  type TaskData,
} from "./task-hash";

// SLT hash utilities
export {
  computeSltHashDefinite,
  verifySltHash,
  isValidSltHash,
} from "./slt-hash";

// Assignment info hash utilities
export {
  computeAssignmentInfoHash,
  verifyAssignmentInfoHash,
  isValidAssignmentInfoHash,
  verifyEvidenceDetailed,
  normalizeForHashing,
  type TiptapDoc,
  type TiptapNode,
  type TiptapMark,
  type EvidenceVerificationResult,
} from "./assignment-info-hash";
