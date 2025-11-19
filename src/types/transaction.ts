/**
 * Transaction Types
 *
 * Type definitions for Cardano transactions in the Andamio platform.
 * These types will be extracted to @andamio/transactions package.
 */

/**
 * Transaction state machine states
 */
export type TransactionState =
  | "idle"        // Not started
  | "fetching"    // Fetching unsigned CBOR from NBA
  | "signing"     // Waiting for user to sign with wallet
  | "submitting"  // Submitting signed tx to blockchain
  | "confirming"  // Waiting for blockchain confirmation
  | "success"     // Transaction confirmed on-chain
  | "error";      // Transaction failed

/**
 * Transaction result containing tx hash and status
 */
export interface TransactionResult {
  txHash?: string;
  success: boolean;
  error?: string;
  blockchainExplorerUrl?: string;
}

/**
 * Configuration for a transaction
 */
export interface TransactionConfig<TParams = unknown> {
  /**
   * NBA endpoint for fetching unsigned CBOR
   * Example: "/tx/mint-access-token"
   */
  endpoint: string;

  /**
   * Parameters to send to the NBA endpoint
   */
  params: TParams;

  /**
   * HTTP method to use for the NBA request
   * - GET: Parameters sent as query string (e.g., mint access token)
   * - POST: Parameters sent as JSON body (e.g., submit assignment)
   * @default "POST"
   */
  method?: "GET" | "POST";

  /**
   * Optional callback fired when transaction succeeds
   */
  onSuccess?: (result: TransactionResult) => void | Promise<void>;

  /**
   * Optional callback fired when transaction fails
   */
  onError?: (error: Error) => void;

  /**
   * Optional callback fired on any state change
   */
  onStateChange?: (state: TransactionState) => void;
}

/**
 * Response from NBA transaction endpoint
 * Contains unsigned CBOR hex string
 */
export interface UnsignedTxResponse {
  unsignedTxCBOR: string;
  txHash?: string;
}

/**
 * Mint Access Token transaction parameters
 */
export interface MintAccessTokenParams {
  user_address: string;
  new_alias: string;
}

/**
 * Enroll in Course (Mint Local State) transaction parameters
 */
export interface EnrollInCourseParams {
  user_access_token: string; // Policy ID + alias concatenated
  policy: string; // Course NFT policy ID
}

/**
 * Submit Assignment transaction parameters
 */
export interface SubmitAssignmentParams {
  courseNftPolicyId: string;
  moduleCode: string;
  walletAddress: string;
  accessTokenAlias: string;
  submissionInfo: string;
}
