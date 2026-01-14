"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeTransactionCbor = decodeTransactionCbor;
exports.extractMints = extractMints;
exports.extractMintsByPolicy = extractMintsByPolicy;
exports.extractAssetNames = extractAssetNames;
exports.extractTxId = extractTxId;
const core_cst_1 = require("@meshsdk/core-cst");
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
function decodeTransactionCbor(cborHex) {
    const tx = (0, core_cst_1.deserializeTx)(cborHex);
    const body = tx.body();
    // Get core representation which gives us plain JS objects
    const coreBody = body.toCore();
    // Extract transaction ID
    const txId = tx.getId().toString();
    // Extract fee
    const fee = BigInt(coreBody.fee.toString());
    // Extract mints from core body
    const mints = [];
    if (coreBody.mint) {
        // coreBody.mint is a Map<AssetId, bigint>
        // AssetId is policyId + assetName concatenated
        for (const [assetId, quantity] of coreBody.mint.entries()) {
            const policyId = assetId.slice(0, 56);
            const assetName = assetId.slice(56);
            mints.push({
                policyId,
                assetName,
                quantity: BigInt(quantity.toString()),
            });
        }
    }
    // Extract outputs
    const outputs = [];
    if (coreBody.outputs) {
        for (const coreOutput of coreBody.outputs) {
            const assets = [];
            // Check for multiassets
            if (coreOutput.value.assets) {
                for (const [assetId, quantity] of coreOutput.value.assets.entries()) {
                    const policyId = assetId.slice(0, 56);
                    const assetName = assetId.slice(56);
                    assets.push({
                        policyId,
                        assetName,
                        quantity: BigInt(quantity.toString()),
                    });
                }
            }
            outputs.push({
                address: coreOutput.address.toString(),
                lovelace: BigInt(coreOutput.value.coins.toString()),
                assets,
                datumHash: coreOutput.datumHash?.toString(),
                inlineDatum: coreOutput.datum,
            });
        }
    }
    // Extract inputs
    const inputs = [];
    if (coreBody.inputs) {
        for (const coreInput of coreBody.inputs) {
            inputs.push({
                txHash: coreInput.txId.toString(),
                outputIndex: coreInput.index,
            });
        }
    }
    // Extract reference inputs
    const referenceInputs = [];
    if (coreBody.referenceInputs) {
        for (const coreInput of coreBody.referenceInputs) {
            referenceInputs.push({
                txHash: coreInput.txId.toString(),
                outputIndex: coreInput.index,
            });
        }
    }
    // Extract collateral
    const collateral = [];
    if (coreBody.collaterals) {
        for (const coreInput of coreBody.collaterals) {
            collateral.push({
                txHash: coreInput.txId.toString(),
                outputIndex: coreInput.index,
            });
        }
    }
    // Extract auxiliary data metadata
    let metadata;
    const auxData = tx.auxiliaryData();
    if (auxData) {
        const coreAuxData = auxData.toCore();
        if (coreAuxData?.blob) {
            metadata = coreAuxData.blob;
        }
    }
    return {
        txId,
        fee,
        mints,
        outputs,
        inputs,
        referenceInputs,
        collateral,
        ttl: coreBody.validityInterval?.invalidHereafter,
        validityStart: coreBody.validityInterval?.invalidBefore,
        isValid: tx.isValid(),
        auxiliaryDataHash: coreBody.auxiliaryDataHash?.toString(),
        metadata,
    };
}
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
function extractMints(cborHex) {
    return decodeTransactionCbor(cborHex).mints;
}
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
function extractMintsByPolicy(cborHex, policyId) {
    return extractMints(cborHex).filter((m) => m.policyId === policyId);
}
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
function extractAssetNames(cborHex, policyId) {
    const mints = policyId ? extractMintsByPolicy(cborHex, policyId) : extractMints(cborHex);
    return mints.map((m) => m.assetName);
}
/**
 * Get the transaction ID from CBOR without full decoding.
 *
 * The transaction ID is the Blake2b-256 hash of the transaction body.
 *
 * @param cborHex - Transaction CBOR as hex string
 * @returns Transaction ID (64 hex characters)
 */
function extractTxId(cborHex) {
    const tx = (0, core_cst_1.deserializeTx)(cborHex);
    return tx.getId().toString();
}
