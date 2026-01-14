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

import * as blake from "blakejs";
import * as cbor from "cbor";

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
export function computeSltHash(slts: string[]): string {
  // Convert each SLT string to UTF-8 bytes
  const sltBytes = slts.map((slt) => Buffer.from(slt, "utf-8"));

  // Encode as CBOR indefinite-length array of byte strings
  // This matches Plutus serialiseData $ toBuiltinData $ map stringToBuiltinByteString slts
  const cborData = encodeAsIndefiniteArray(sltBytes);

  // Hash with Blake2b-256
  return blake.blake2bHex(cborData, undefined, 32);
}

/**
 * Encode an array of byte buffers as a CBOR indefinite-length array.
 *
 * CBOR format:
 * - 0x9f: Start indefinite array marker
 * - Each item: CBOR-encoded byte string
 * - 0xff: Break/end marker
 *
 * @internal
 */
function encodeAsIndefiniteArray(items: Buffer[]): Buffer {
  const chunks: Buffer[] = [];

  // Start indefinite array (major type 4, additional info 31)
  chunks.push(Buffer.from([0x9f]));

  // Encode each byte buffer as a CBOR byte string
  for (const item of items) {
    chunks.push(cbor.encode(item));
  }

  // End indefinite array (break)
  chunks.push(Buffer.from([0xff]));

  return Buffer.concat(chunks);
}

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
export function verifySltHash(slts: string[], expectedHash: string): boolean {
  const computedHash = computeSltHash(slts);
  return computedHash.toLowerCase() === expectedHash.toLowerCase();
}

/**
 * Validate that a string is a valid SLT hash format.
 *
 * SLT hashes are 64-character hexadecimal strings (256-bit Blake2b hash).
 *
 * @param hash - String to validate
 * @returns true if the string is a valid SLT hash format
 */
export function isValidSltHash(hash: string): boolean {
  if (hash.length !== 64) {
    return false;
  }
  return /^[0-9a-fA-F]{64}$/.test(hash);
}

// =============================================================================
// Plutus-Compatible Encoding (with 64-byte chunking)
// =============================================================================

/**
 * Plutus chunk size for byte strings.
 * Strings longer than this are encoded as indefinite-length chunked byte strings.
 */
const PLUTUS_CHUNK_SIZE = 64;

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
export function computeSltHashDefinite(slts: string[]): string {
  const sltBytes = slts.map((slt) => Buffer.from(slt, "utf-8"));
  const cborData = encodeAsPlutusArray(sltBytes);
  return blake.blake2bHex(cborData, undefined, 32);
}

/**
 * Encode an array of byte buffers matching Plutus serialization.
 *
 * Uses indefinite-length array with chunked byte strings for long values.
 *
 * @internal
 */
function encodeAsPlutusArray(items: Buffer[]): Buffer {
  const chunks: Buffer[] = [];

  // Start indefinite array
  chunks.push(Buffer.from([0x9f]));

  // Encode each item (with chunking for long strings)
  for (const item of items) {
    chunks.push(encodePlutusBuiltinByteString(item));
  }

  // End indefinite array
  chunks.push(Buffer.from([0xff]));

  return Buffer.concat(chunks);
}

/**
 * Encode a byte buffer matching Plutus's stringToBuiltinByteString.
 *
 * - Strings <= 64 bytes: regular CBOR byte string
 * - Strings > 64 bytes: indefinite-length chunked byte string (64-byte chunks)
 *
 * @internal
 */
function encodePlutusBuiltinByteString(buffer: Buffer): Buffer {
  if (buffer.length <= PLUTUS_CHUNK_SIZE) {
    // Short string: encode normally
    return encodeCBORByteString(buffer);
  }

  // Long string: use indefinite-length chunked encoding
  const chunks: Buffer[] = [];
  chunks.push(Buffer.from([0x5f])); // Start indefinite byte string

  for (let i = 0; i < buffer.length; i += PLUTUS_CHUNK_SIZE) {
    const chunk = buffer.subarray(i, Math.min(i + PLUTUS_CHUNK_SIZE, buffer.length));
    chunks.push(encodeCBORByteString(chunk));
  }

  chunks.push(Buffer.from([0xff])); // Break
  return Buffer.concat(chunks);
}

/**
 * Encode a byte buffer as a CBOR byte string (definite length).
 *
 * @internal
 */
function encodeCBORByteString(buffer: Buffer): Buffer {
  const len = buffer.length;

  // CBOR byte string encoding (major type 2 = 0x40):
  // - 0-23 bytes: length inline (0x40 + len)
  // - 24-255 bytes: 0x58 + 1-byte length
  // - 256-65535 bytes: 0x59 + 2-byte length (big-endian)
  if (len <= 23) {
    return Buffer.concat([Buffer.from([0x40 + len]), buffer]);
  } else if (len <= 255) {
    return Buffer.concat([Buffer.from([0x58, len]), buffer]);
  } else if (len <= 65535) {
    return Buffer.concat([Buffer.from([0x59, len >> 8, len & 0xff]), buffer]);
  }
  throw new Error("Byte string too long for CBOR encoding");
}
