/**
 * Assignment Info Hash Utilities
 *
 * Functions for computing and verifying hashes of assignment evidence.
 * The hash is stored on-chain as `assignmentInfo` in the course state datum,
 * while the full evidence (Tiptap JSON document) is stored in the database.
 *
 * This provides:
 * - Compact on-chain storage (64-char hex hash vs full JSON)
 * - Tamper-evidence (can verify DB content matches on-chain commitment)
 * - Privacy (evidence details not exposed on-chain)
 *
 * Extracted from @andamio/transactions package for local use.
 *
 * @module assignment-info-hash
 */

import * as blake from "blakejs";

/**
 * Tiptap document structure (simplified)
 * The actual structure can be more complex with nested content
 */
export type TiptapDoc = {
  type: "doc";
  content?: TiptapNode[];
  [key: string]: unknown;
};

export type TiptapNode = {
  type: string;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
  attrs?: Record<string, unknown>;
  [key: string]: unknown;
};

export type TiptapMark = {
  type: string;
  attrs?: Record<string, unknown>;
  [key: string]: unknown;
};

/**
 * Normalizes a value for consistent hashing.
 *
 * Normalization rules:
 * - Objects: Sort keys alphabetically, recursively normalize values
 * - Arrays: Preserve order, recursively normalize items
 * - Strings: Trim whitespace
 * - Numbers/Booleans/null: Keep as-is
 * - undefined: Convert to null
 *
 * @param value - Any JSON-serializable value
 * @returns Normalized value
 */
export function normalizeForHashing(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    // Trim whitespace from strings
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    // Recursively normalize array items, preserving order
    return value.map(normalizeForHashing);
  }

  if (typeof value === "object") {
    // Sort keys alphabetically and recursively normalize values
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(value as Record<string, unknown>).sort();
    for (const key of keys) {
      const val = (value as Record<string, unknown>)[key];
      // Skip undefined values entirely
      if (val !== undefined) {
        sorted[key] = normalizeForHashing(val);
      }
    }
    return sorted;
  }

  // Fallback for any other type
  return value;
}

/**
 * Computes the assignment info hash from evidence content.
 *
 * The hash is computed as:
 * 1. Normalize the evidence (sort keys, trim strings, etc.)
 * 2. Serialize to JSON string (deterministic due to normalization)
 * 3. Apply Blake2b-256 hash
 *
 * @param evidence - The evidence content (Tiptap JSON document or any JSON-serializable data)
 * @returns 64-character lowercase hex string (Blake2b-256 hash)
 *
 * @example
 * ```typescript
 * import { computeAssignmentInfoHash } from "~/lib/utils/assignment-info-hash";
 *
 * const evidence = {
 *   type: "doc",
 *   content: [
 *     { type: "paragraph", content: [{ type: "text", text: "My submission" }] }
 *   ]
 * };
 *
 * const hash = computeAssignmentInfoHash(evidence);
 * // Use this hash as assignmentInfo in the transaction
 * ```
 */
export function computeAssignmentInfoHash(evidence: unknown): string {
  // Normalize the evidence for consistent hashing
  const normalized = normalizeForHashing(evidence);

  // Serialize to JSON (deterministic due to sorted keys)
  const jsonString = JSON.stringify(normalized);

  // Convert to bytes and hash with Blake2b-256
  const bytes = new TextEncoder().encode(jsonString);
  return blake.blake2bHex(bytes, undefined, 32);
}

/**
 * Verifies that evidence content matches an expected hash.
 *
 * Use this to verify that database evidence matches the on-chain commitment.
 *
 * @param evidence - The evidence content to verify
 * @param expectedHash - The expected hash (from on-chain data)
 * @returns True if the evidence produces the expected hash
 */
export function verifyAssignmentInfoHash(
  evidence: unknown,
  expectedHash: string
): boolean {
  const computedHash = computeAssignmentInfoHash(evidence);
  return computedHash.toLowerCase() === expectedHash.toLowerCase();
}

/**
 * Validates that a string is a valid assignment info hash format.
 *
 * A valid hash is a 64-character hexadecimal string (Blake2b-256 output).
 *
 * @param hash - The string to validate
 * @returns True if the string is a valid hash format
 */
export function isValidAssignmentInfoHash(hash: string): boolean {
  if (typeof hash !== "string") {
    return false;
  }
  if (hash.length !== 64) {
    return false;
  }
  return /^[0-9a-fA-F]{64}$/.test(hash);
}

/**
 * Result of comparing evidence with an on-chain hash
 */
export type EvidenceVerificationResult = {
  /** Whether the evidence matches the on-chain hash */
  isValid: boolean;
  /** The hash computed from the evidence */
  computedHash: string;
  /** The expected hash (from on-chain) */
  expectedHash: string;
  /** Human-readable status message */
  message: string;
};

/**
 * Performs a detailed verification of evidence against an on-chain hash.
 *
 * Returns a detailed result object with both hashes and a status message,
 * useful for debugging and user feedback.
 *
 * @param evidence - The evidence content to verify
 * @param onChainHash - The hash from on-chain data
 * @returns Detailed verification result
 */
export function verifyEvidenceDetailed(
  evidence: unknown,
  onChainHash: string
): EvidenceVerificationResult {
  // Validate the on-chain hash format first
  if (!isValidAssignmentInfoHash(onChainHash)) {
    return {
      isValid: false,
      computedHash: "",
      expectedHash: onChainHash,
      message: `Invalid on-chain hash format: expected 64 hex characters, got "${onChainHash}"`,
    };
  }

  const computedHash = computeAssignmentInfoHash(evidence);
  const isValid = computedHash.toLowerCase() === onChainHash.toLowerCase();

  return {
    isValid,
    computedHash,
    expectedHash: onChainHash.toLowerCase(),
    message: isValid
      ? "Evidence matches on-chain commitment"
      : "Evidence does not match on-chain commitment - content may have been modified",
  };
}
