/**
 * SLT Hashing Utility
 *
 * Computes the module token name (hash) from a list of Student Learning Targets (SLTs).
 * This hash is used as the token name when minting module tokens on-chain.
 *
 * The algorithm matches the on-chain Plutus validator:
 * ```haskell
 * sltsToBbs MintModuleV2{slts} = blake2b_256 $ serialiseData $ toBuiltinData $ map stringToBuiltinByteString slts
 * ```
 *
 * Serialization format:
 * 1. Convert each SLT string to UTF-8 bytes
 * 2. Encode as CBOR indefinite-length array of byte strings
 * 3. Hash with Blake2b-256 (32 bytes / 256 bits)
 *
 * @module slt-hash
 */
/**
 * Compute the module hash (token name) from a list of SLT strings.
 *
 * This produces the same hash as the on-chain Plutus validator, allowing
 * clients to pre-compute or verify module token names.
 *
 * @param slts - Array of Student Learning Target strings
 * @returns 64-character hex string (256-bit Blake2b hash)
 *
 * @example
 * ```typescript
 * import { computeSltHash } from "@andamio/transactions";
 *
 * const slts = [
 *   "I can mint an access token.",
 *   "I can complete an assignment to earn a credential."
 * ];
 *
 * const moduleHash = computeSltHash(slts);
 * // Returns: "8dcbe1b925d87e6c547bbd8071c23a712db4c32751454b0948f8c846e9246b5c"
 * ```
 */
export declare function computeSltHash(slts: string[]): string;
/**
 * Verify that a given hash matches the computed hash for SLTs.
 *
 * @param slts - Array of Student Learning Target strings
 * @param expectedHash - The hash to verify (64-character hex string)
 * @returns true if the computed hash matches the expected hash
 *
 * @example
 * ```typescript
 * import { verifySltHash } from "@andamio/transactions";
 *
 * const slts = ["I can mint an access token."];
 * const moduleHash = "abc123..."; // from on-chain data
 *
 * if (verifySltHash(slts, moduleHash)) {
 *   console.log("SLTs match the on-chain module");
 * }
 * ```
 */
export declare function verifySltHash(slts: string[], expectedHash: string): boolean;
/**
 * Validate that a string is a valid SLT hash format.
 *
 * SLT hashes are 64-character hexadecimal strings (256-bit Blake2b hash).
 *
 * @param hash - String to validate
 * @returns true if the string is a valid SLT hash format
 */
export declare function isValidSltHash(hash: string): boolean;
/**
 * Compute the module hash matching Plutus on-chain encoding.
 *
 * Plutus's `stringToBuiltinByteString` chunks byte strings at 64 bytes.
 * This function replicates that behavior:
 * - Strings <= 64 bytes: encoded as regular CBOR byte strings
 * - Strings > 64 bytes: encoded as indefinite-length chunked byte strings
 *
 * @param slts - Array of Student Learning Target strings
 * @returns 64-character hex string (256-bit Blake2b hash)
 */
export declare function computeSltHashDefinite(slts: string[]): string;
