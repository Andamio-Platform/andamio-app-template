/**
 * @deprecated V1 PATTERN - Replaced by Gateway TX State Machine
 *
 * This file provides client-side Koios polling for TX confirmation. With V2 TX
 * State Machine, the Gateway handles confirmation server-side via Andamioscan.
 *
 * Only used by deprecated `use-pending-tx-watcher.ts` hook.
 * This file will be removed in a future release.
 *
 * @see ~/hooks/tx/use-tx-watcher.ts - V2 pattern (polls Gateway, not Koios)
 *
 * ---
 * Original description:
 *
 * Cardano Blockchain Indexer Utilities
 *
 * Provides blockchain query functionality for transaction confirmation checking.
 * Uses Koios API (free, no API key required for basic usage).
 */

export interface TransactionConfirmation {
  txHash: string;
  confirmed: boolean;
  blockHeight?: number;
  blockTime?: number;
  confirmations?: number;
}

export interface TransactionOutput {
  txHash: string;
  outputIndex: number;
  address: string;
  value: string;
  dataHash?: string;
  datum?: unknown;
  assets?: Array<{
    policyId: string;
    assetName: string;
    quantity: string;
  }>;
}

/**
 * Koios API configuration
 * Using our Next.js API proxy to avoid CORS issues
 * The proxy routes to preprod.koios.rest
 */
const KOIOS_API_BASE = "/api/koios";

/**
 * Check if a transaction is confirmed on the blockchain
 *
 * @param txHash - Transaction hash to check
 * @returns Promise<TransactionConfirmation>
 */
export async function checkTransactionConfirmation(
  txHash: string
): Promise<TransactionConfirmation> {
  try {
    const response = await fetch(`${KOIOS_API_BASE}/tx_status`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        _tx_hashes: [txHash],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Cardano Indexer] Koios error response:`, errorText);
      throw new Error(`Koios API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as Array<{
      tx_hash: string;
      num_confirmations?: number;
      block_height?: number;
      block_time?: number;
    }>;

    if (data.length === 0) {
      return {
        txHash,
        confirmed: false,
      };
    }

    const txInfo = data[0];
    const confirmed = (txInfo?.num_confirmations ?? 0) > 0;

    return {
      txHash,
      confirmed,
      blockHeight: txInfo?.block_height,
      blockTime: txInfo?.block_time,
      confirmations: txInfo?.num_confirmations,
    };
  } catch (error) {
    console.error(`[Cardano Indexer] Failed to check transaction ${txHash}:`, error);
    throw error;
  }
}

/**
 * Get transaction outputs (UTxOs) for extracting on-chain data
 *
 * @param txHash - Transaction hash
 * @returns Promise<TransactionOutput[]>
 */
export async function getTransactionOutputs(
  txHash: string
): Promise<TransactionOutput[]> {
  try {
    const response = await fetch(`${KOIOS_API_BASE}/tx_utxos`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        _tx_hashes: [txHash],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Cardano Indexer] Koios error response:`, errorText);
      throw new Error(`Koios API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as Array<{
      tx_hash: string;
      outputs?: Array<{
        tx_hash: string;
        tx_index: number;
        payment_addr: {
          bech32: string;
        };
        value: string;
        datum_hash?: string;
        inline_datum?: {
          bytes: string;
          value: unknown;
        };
        asset_list?: Array<{
          policy_id: string;
          asset_name: string;
          quantity: string;
        }>;
      }>;
    }>;

    if (data.length === 0 || !data[0]?.outputs) {
      return [];
    }

    const outputs = data[0].outputs.map((output) => ({
      txHash,
      outputIndex: output.tx_index,
      address: output.payment_addr.bech32,
      value: output.value,
      dataHash: output.datum_hash,
      datum: output.inline_datum?.value,
      assets: output.asset_list?.map((asset) => ({
        policyId: asset.policy_id,
        assetName: asset.asset_name,
        quantity: asset.quantity,
      })),
    }));

    return outputs;
  } catch (error) {
    console.error(`[Cardano Indexer] Failed to get outputs for transaction ${txHash}:`, error);
    throw error;
  }
}

/**
 * Extract on-chain data from transaction outputs
 * Used for building ConfirmationContext for side effects
 *
 * @param txHash - Transaction hash
 * @returns Promise<Record<string, unknown>>
 */
export async function extractOnChainData(
  txHash: string
): Promise<Record<string, unknown>> {
  try {
    const outputs = await getTransactionOutputs(txHash);

    // Extract minted assets
    const mints: Array<{ policyId: string; assetName: string; quantity: string }> = [];
    for (const output of outputs) {
      if (output.assets) {
        mints.push(...output.assets);
      }
    }

    // Build onChainData object
    const onChainData: Record<string, unknown> = {
      txHash,
      outputs: outputs.map((o) => ({
        address: o.address,
        value: o.value,
        dataHash: o.dataHash,
        datum: o.datum,
      })),
      mints,
    };

    return onChainData;
  } catch (error) {
    console.error(`[Cardano Indexer] Failed to extract on-chain data for ${txHash}:`, error);
    throw error;
  }
}

/**
 * Check multiple transactions in parallel
 *
 * @param txHashes - Array of transaction hashes
 * @returns Promise<TransactionConfirmation[]>
 */
export async function checkTransactionsBatch(
  txHashes: string[]
): Promise<TransactionConfirmation[]> {
  if (txHashes.length === 0) return [];

  try {
    // Use POST with JSON body (Koios recommended format)
    const response = await fetch(`${KOIOS_API_BASE}/tx_status`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        _tx_hashes: txHashes,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Cardano Indexer] Koios error response:`, errorText);
      throw new Error(`Koios API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as Array<{
      tx_hash: string;
      num_confirmations?: number;
      block_height?: number;
      block_time?: number;
    }>;

    // Map results back to requested tx hashes
    return txHashes.map((txHash) => {
      const txInfo = data.find((tx) => tx.tx_hash === txHash);
      if (!txInfo) {
        return { txHash, confirmed: false };
      }

      const confirmed = (txInfo.num_confirmations ?? 0) > 0;
      return {
        txHash,
        confirmed,
        blockHeight: txInfo.block_height,
        blockTime: txInfo.block_time,
        confirmations: txInfo.num_confirmations,
      };
    });
  } catch (error) {
    console.error("[Cardano Indexer] Failed to check transactions batch:", error);
    throw error;
  }
}
