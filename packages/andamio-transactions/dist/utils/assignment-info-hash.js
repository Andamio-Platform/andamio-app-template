"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeForHashing = normalizeForHashing;
exports.computeAssignmentInfoHash = computeAssignmentInfoHash;
exports.verifyAssignmentInfoHash = verifyAssignmentInfoHash;
exports.isValidAssignmentInfoHash = isValidAssignmentInfoHash;
exports.verifyEvidenceDetailed = verifyEvidenceDetailed;
const blake = __importStar(require("blakejs"));
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
function normalizeForHashing(value) {
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
        const sorted = {};
        const keys = Object.keys(value).sort();
        for (const key of keys) {
            const val = value[key];
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
function computeAssignmentInfoHash(evidence) {
    // Normalize the evidence for consistent hashing
    const normalized = normalizeForHashing(evidence);
    // Serialize to JSON (deterministic due to sorted keys)
    const jsonString = JSON.stringify(normalized);
    // Convert to bytes and hash with Blake2b-256
    const bytes = Buffer.from(jsonString, "utf-8");
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
function verifyAssignmentInfoHash(evidence, expectedHash) {
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
function isValidAssignmentInfoHash(hash) {
    if (typeof hash !== "string") {
        return false;
    }
    if (hash.length !== 64) {
        return false;
    }
    return /^[0-9a-fA-F]{64}$/.test(hash);
}
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
function verifyEvidenceDetailed(evidence, onChainHash) {
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
