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
 */
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
export declare function normalizeForHashing(value: unknown): unknown;
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
 * import { computeAssignmentInfoHash } from "@andamio/transactions";
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
export declare function computeAssignmentInfoHash(evidence: unknown): string;
/**
 * Verifies that evidence content matches an expected hash.
 *
 * Use this to verify that database evidence matches the on-chain commitment.
 *
 * @param evidence - The evidence content to verify
 * @param expectedHash - The expected hash (from on-chain data)
 * @returns True if the evidence produces the expected hash
 *
 * @example
 * ```typescript
 * import { verifyAssignmentInfoHash } from "@andamio/transactions";
 *
 * // Fetch evidence from database
 * const dbEvidence = await fetchEvidenceFromDb(commitmentId);
 *
 * // Fetch hash from on-chain data
 * const onChainHash = await fetchOnChainAssignmentInfo(studentAlias, courseId);
 *
 * // Verify they match
 * const isValid = verifyAssignmentInfoHash(dbEvidence, onChainHash);
 * if (!isValid) {
 *   console.error("Evidence has been tampered with or doesn't match on-chain commitment");
 * }
 * ```
 */
export declare function verifyAssignmentInfoHash(evidence: unknown, expectedHash: string): boolean;
/**
 * Validates that a string is a valid assignment info hash format.
 *
 * A valid hash is a 64-character hexadecimal string (Blake2b-256 output).
 *
 * @param hash - The string to validate
 * @returns True if the string is a valid hash format
 *
 * @example
 * ```typescript
 * import { isValidAssignmentInfoHash } from "@andamio/transactions";
 *
 * isValidAssignmentInfoHash("abc123"); // false - too short
 * isValidAssignmentInfoHash("xyz..."); // false - invalid characters
 * isValidAssignmentInfoHash("8dcbe1b925d87e6c547bbd8071c23a712db4c32751454b0948f8c846e9246b5c"); // true
 * ```
 */
export declare function isValidAssignmentInfoHash(hash: string): boolean;
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
 *
 * @example
 * ```typescript
 * import { verifyEvidenceDetailed } from "@andamio/transactions";
 *
 * const result = verifyEvidenceDetailed(dbEvidence, onChainHash);
 *
 * if (result.isValid) {
 *   console.log("Evidence verified successfully");
 * } else {
 *   console.error(result.message);
 *   console.log("Computed:", result.computedHash);
 *   console.log("Expected:", result.expectedHash);
 * }
 * ```
 */
export declare function verifyEvidenceDetailed(evidence: unknown, onChainHash: string): EvidenceVerificationResult;
