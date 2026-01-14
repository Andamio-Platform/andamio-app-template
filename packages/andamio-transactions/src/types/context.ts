/**
 * Context provided when a transaction is submitted to the blockchain
 */
export type SubmissionContext = {
  /** Transaction hash returned by the blockchain */
  txHash: string;

  /** Signed CBOR hex string submitted to chain */
  signedCbor: string;

  /** Original unsigned CBOR hex string */
  unsignedCbor: string;

  /** User ID from database */
  userId: string;

  /** User's wallet address (bech32) */
  walletAddress: string;

  /** Original inputs used to build the transaction */
  buildInputs: Record<string, unknown>;

  /** Timestamp when transaction was submitted */
  timestamp: Date;
};

/**
 * On-chain data extracted from a confirmed transaction
 *
 * This data is typically provided by a Cardano indexer (e.g., Koios) that queries
 * the confirmed transaction. The transaction monitoring service is responsible for
 * populating this structure.
 *
 * Note: Andamioscan provides parsed/structured data, not raw transaction fields.
 * For raw on-chain data like mints, metadata, and outputs, use Koios or similar.
 */
export type OnChainData = {
  /**
   * Tokens minted or burned in this transaction
   *
   * Source: Cardano indexer (e.g., Koios API /api/v1/tx_info)
   *
   * The assetName field contains the token name, which for module tokens is the
   * Blake2b-256 hash of the SLTs (computed via computeSltHash()).
   */
  mints?: Array<{
    policyId: string;
    assetName: string;
    quantity: number;
  }>;

  /** Transaction metadata (key 721, 1967, etc.) */
  metadata?: Record<string, unknown>;

  /** Transaction outputs */
  outputs?: Array<{
    address: string;
    value: {
      lovelace: string;
      assets?: Array<{
        unit: string;
        quantity: string;
      }>;
    };
    datum?: string | null;
    datumHash?: string | null;
  }>;

  /** Transaction inputs */
  inputs?: Array<{
    txHash: string;
    outputIndex: number;
    address: string;
  }>;

  /** Withdrawals (stake rewards, observers) */
  withdrawals?: Array<{
    address: string;
    amount: string;
  }>;
};

/**
 * Context provided when a transaction is confirmed on-chain
 */
export type ConfirmationContext = {
  /** Transaction hash */
  txHash: string;

  /** Signed CBOR hex string */
  signedCbor: string;

  /** Original inputs used to build the transaction */
  buildInputs: Record<string, unknown>;

  /** User ID from database */
  userId: string;

  /** User's wallet address (bech32) */
  walletAddress: string;

  /** Block height where transaction was included */
  blockHeight: number;

  /** Timestamp when transaction was confirmed */
  timestamp: Date;

  /** On-chain data extracted from the transaction */
  onChainData: OnChainData;
};
