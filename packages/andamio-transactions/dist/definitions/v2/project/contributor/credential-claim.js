"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM = void 0;
const zod_1 = require("zod");
const protocol_reference_1 = require("../../../../utils/protocol-reference");
const schema_helpers_1 = require("../../../../utils/schema-helpers");
const protocolId = "project.contributor.credential.claim";
const txName = "PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM";
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
exports.PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM = {
    txType: txName,
    role: "project-contributor",
    protocolSpec: {
        ...(0, protocol_reference_1.createProtocolSpec)("v2", protocolId),
        requiredTokens: ["global-state.access-token-user"],
    },
    buildTxConfig: {
        ...(0, schema_helpers_1.createSchemas)({
            // Transaction API inputs - matches ClaimProjectCredentialsTxRequest
            txParams: zod_1.z.object({
                alias: zod_1.z.string().min(1).max(31), // Contributor's alias
                project_id: zod_1.z.string().length(56), // Project NFT policy ID (hex)
                contributor_state_id: zod_1.z.string().length(56), // Contributor state ID
            }),
            // No sideEffectParams - this transaction has no database side effects
        }),
        builder: { type: "api-endpoint", endpoint: "/api/v2/tx/project/contributor/credential/claim" },
        estimatedCost: (0, protocol_reference_1.getProtocolCost)(protocolId),
    },
    // No side effects - see JSDoc above for rationale
    onSubmit: [],
    onConfirmation: [],
    ui: {
        buttonText: "Claim Credentials",
        title: "Claim Project Credentials",
        description: [
            "Claim your credentials for completed project tasks. Once claimed, you will receive on-chain credential tokens that prove your achievements.",
        ],
        footerLink: "https://docs.andamio.io/docs/protocol/v2/transactions/project/contributor/credential-claim",
        footerLinkText: "Tx Documentation",
        successInfo: "Credentials claimed successfully!",
    },
    docs: {
        protocolDocs: "https://docs.andamio.io/docs/protocol/v2/transactions/project/contributor/credential-claim",
        apiDocs: "https://andamio-api-gateway-168705267033.us-central1.run.app/api/v1/docs/index.html#/default/post_v2_tx_project_contributor_credential_claim",
    },
};
