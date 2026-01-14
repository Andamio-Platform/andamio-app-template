import type { AndamioTransactionDefinition } from "../../../../types";
/**
 * PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM Transaction Definition
 *
 * Contributors claim credential tokens after completing project tasks.
 *
 * ## API Endpoint
 * POST /v2/tx/project/contributor/credential/claim
 *
 * ## Request Body (ClaimProjectCredentialsTxRequest)
 * ```json
 * {
 *   "alias": "contributor1",              // Contributor's access token alias
 *   "project_id": "abc123...",            // Project NFT policy ID (56 char hex)
 *   "contributor_state_id": "def456..."   // Contributor state ID (56 char hex)
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
 * ## Why No Side Effects?
 *
 * This transaction has no database side effects because:
 *
 * 1. **Final Step in Flow**: By the time a contributor claims credentials, all
 *    task completions have already been recorded via earlier transactions.
 *
 * 2. **Pure On-Chain Operation**: The credential claim simply mints the
 *    credential token on-chain. The on-chain state already proves eligibility.
 *
 * 3. **Blockchain Verification**: Credential ownership is verified via
 *    blockchain queries, not database lookups.
 *
 * The credential token itself IS the proof of completion.
 */
export declare const PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM: AndamioTransactionDefinition;
