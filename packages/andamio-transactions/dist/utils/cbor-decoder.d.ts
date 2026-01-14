/**
 * CBOR Transaction Decoder Utilities
 *
 * Extracts structured data from Cardano transaction CBOR using @meshsdk/core-cst.
 * Useful for extracting mints, outputs, and metadata from unsigned or signed transactions.
 *
 * ## Who Uses This
 *
 * **Primary User: Frontend (T3 App Template)**
 *
 * The transaction API returns `unsignedTxCBOR` in its response. This decoder lets the
 * frontend inspect what's in the transaction before asking the user to sign.
 *
 * **Who Does NOT Need This:**
 * - Transaction API - It builds the CBOR, doesn't need to decode it
 * - DB API - Only handles database records, never touches CBOR
 * - Transaction Monitoring Service - Would query Koios/Blockfrost for confirmed tx data
 *
 * ## Practical Reality
 *
 * For most Andamio transactions, this decoder is a **nice-to-have** rather than essential:
 * - Module hashes can be pre-computed with `computeSltHash(slts)` before calling the tx API
 * - Evidence hashes are computed with `computeAssignmentInfoHash(evidence)` before submission
 * - Transaction ID comes back after signing
 *
 * The decoder is most valuable for **transaction preview UI** and **debugging**.
 *
 * @example
 * ```typescript
 * import { decodeTransactionCbor, extractMints } from "@andamio/transactions";
 *
 * // From tx API response
 * const { unsignedTxCBOR } = await response.json();
 *
 * // Decode for preview UI
 * const decoded = decodeTransactionCbor(unsignedTxCBOR);
 * console.log(`Fee: ${Number(decoded.fee) / 1_000_000} ADA`);
 * console.log(`Minting ${decoded.mints.length} tokens`);
 *
 * // Or extract mints directly
 * const mints = extractMints(unsignedTxCBOR);
 * // => [{ policyId: "abc...", assetName: "moduleHash...", quantity: 1n }]
 * ```
 */
/**
 * Decoded mint information from a transaction
 */
export type DecodedMint = {
    /** Policy ID (56 hex characters) */
    policyId: string;
    /** Asset name (hex encoded) - for modules, this is the Blake2b-256 hash of SLTs */
    assetName: string;
    /** Quantity (positive for mint, negative for burn) */
    quantity: bigint;
};
/**
 * Decoded output information from a transaction
 */
export type DecodedOutput = {
    /** Destination address (bech32) */
    address: string;
    /** Lovelace amount */
    lovelace: bigint;
    /** Assets at this output */
    assets: Array<{
        policyId: string;
        assetName: string;
        quantity: bigint;
    }>;
    /** Datum hash if present */
    datumHash?: string;
    /** Inline datum if present */
    inlineDatum?: unknown;
};
/**
 * Decoded input information from a transaction
 */
export type DecodedInput = {
    /** Transaction hash of the UTXO being spent */
    txHash: string;
    /** Output index */
    outputIndex: number;
};
/**
 * Complete decoded transaction data
 */
export type DecodedTransaction = {
    /** Transaction ID (hash of the transaction body) */
    txId: string;
    /** Fee in lovelace */
    fee: bigint;
    /** Mints/burns in this transaction */
    mints: DecodedMint[];
    /** Outputs in this transaction */
    outputs: DecodedOutput[];
    /** Inputs being spent */
    inputs: DecodedInput[];
    /** Reference inputs (read-only) */
    referenceInputs: DecodedInput[];
    /** Collateral inputs */
    collateral: DecodedInput[];
    /** Time-to-live (slot number) */
    ttl?: number;
    /** Validity start slot */
    validityStart?: number;
    /** Whether transaction is valid (for signed txs) */
    isValid: boolean;
    /** Auxiliary data hash if present */
    auxiliaryDataHash?: string;
    /** Metadata from auxiliary data */
    metadata?: Map<bigint, unknown>;
};
/**
 * Decode a Cardano transaction CBOR hex string into a structured object.
 *
 * Works with both unsigned and signed transactions.
 *
 * @param cborHex - Transaction CBOR as hex string
 * @returns Decoded transaction data
 *
 * @example
 * ```typescript
 * // From tx API response
 * const response = await fetch('/tx/v2/teacher/course/modules/manage', {
 *   method: 'POST',
 *   body: JSON.stringify(inputs),
 * });
 * const { unsignedTxCBOR } = await response.json();
 *
 * // Decode to extract mints
 * const decoded = decodeTransactionCbor(unsignedTxCBOR);
 * console.log(decoded.mints);
 * // => [{ policyId: "abc...", assetName: "moduleHash...", quantity: 1n }]
 * ```
 */
export declare function decodeTransactionCbor(cborHex: string): DecodedTransaction;
/**
 * Extract just the mints from a transaction CBOR.
 *
 * Convenience function for module management transactions where you only need
 * to know what tokens were minted.
 *
 * @param cborHex - Transaction CBOR as hex string
 * @returns Array of minted/burned assets
 *
 * @example
 * ```typescript
 * const mints = extractMints(unsignedTxCBOR);
 *
 * // For COURSE_TEACHER_MODULES_MANAGE, map mints to module hashes
 * const moduleHashes = mints.map(m => m.assetName);
 * ```
 */
export declare function extractMints(cborHex: string): DecodedMint[];
/**
 * Extract mints filtered by policy ID.
 *
 * Useful when a transaction has multiple minting policies and you need
 * just the ones for a specific policy (e.g., course module tokens).
 *
 * @param cborHex - Transaction CBOR as hex string
 * @param policyId - Policy ID to filter by (56 hex characters)
 * @returns Array of minted/burned assets for that policy
 *
 * @example
 * ```typescript
 * // Get only the module token mints, not other tokens
 * const modulePolicy = getModuleMintingPolicyId(courseNftPolicyId);
 * const moduleMints = extractMintsByPolicy(unsignedTxCBOR, modulePolicy);
 * ```
 */
export declare function extractMintsByPolicy(cborHex: string, policyId: string): DecodedMint[];
/**
 * Extract just the asset names (token names) from mints.
 *
 * For module tokens, the asset name IS the module hash (Blake2b-256 of SLTs).
 * This is the most common use case for confirmation side effects.
 *
 * @param cborHex - Transaction CBOR as hex string
 * @param policyId - Optional policy ID to filter by
 * @returns Array of asset names (hex encoded)
 *
 * @example
 * ```typescript
 * // Extract module hashes for batch confirm
 * const moduleHashes = extractAssetNames(unsignedTxCBOR, modulePolicy);
 *
 * const confirmBody = formatBatchConfirmBody(
 *   courseNftPolicyId,
 *   moduleCodes,
 *   txHash,
 *   moduleHashes
 * );
 * ```
 */
export declare function extractAssetNames(cborHex: string, policyId?: string): string[];
/**
 * Get the transaction ID from CBOR without full decoding.
 *
 * The transaction ID is the Blake2b-256 hash of the transaction body.
 *
 * @param cborHex - Transaction CBOR as hex string
 * @returns Transaction ID (64 hex characters)
 */
export declare function extractTxId(cborHex: string): string;
