import type { AndamioTransactionDefinition } from "../../../../types";
/**
 * GLOBAL_GENERAL_ACCESS_TOKEN_MINT Transaction Definition
 *
 * User mints access tokens to participate in the Andamio protocol.
 * This is the entry point for all users.
 *
 * ## API Endpoint
 * POST /v2/tx/global/general/access-token/mint
 *
 * ## Request Body (MintAccessTokenTxRequest)
 * ```json
 * {
 *   "initiator_data": "addr_test1...",  // Bech32 wallet address
 *   "alias": "myalias"                   // Unique alias (1-31 alphanumeric chars)
 * }
 * ```
 *
 * ## Response (UnsignedTxResponse)
 * ```json
 * {
 *   "unsigned_tx": "84aa00..."
 * }
 * ```
 *
 * ## Notes
 * - This is the entry point for all protocol participation
 * - Alias must be unique across the protocol (enforced by linked list)
 * - 5 ADA service fee goes to protocol treasury
 * - Access token is required for all subsequent transactions
 *
 * ## Side Effects
 *
 * **onSubmit**: Sets the pending transaction hash in the user's record.
 * While in this state, UX can show onboarding content while waiting for confirmation.
 *
 * **onConfirmation**: Updates the user's access token alias in the database
 * and clears the pending transaction.
 */
export declare const GLOBAL_GENERAL_ACCESS_TOKEN_MINT: AndamioTransactionDefinition;
