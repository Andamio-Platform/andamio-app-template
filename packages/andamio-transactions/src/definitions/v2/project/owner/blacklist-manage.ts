import { z } from "zod";
import type { AndamioTransactionDefinition } from "../../../../types";
import { createProtocolSpec, getProtocolCost } from "../../../../utils/protocol-reference";
import { createSchemas } from "../../../../utils/schema-helpers";

const protocolId = "project.owner.contributor-blacklist.manage";
const txName = "PROJECT_OWNER_BLACKLIST_MANAGE" as const;

/**
 * PROJECT_OWNER_BLACKLIST_MANAGE Transaction Definition
 *
 * Project owner manages the contributor blacklist for a project.
 * Blacklisted contributors cannot enroll or participate in the project.
 *
 * ## API Endpoint
 * POST /v2/tx/project/owner/contributor-blacklist/manage
 *
 * ## Request Body (ManageContributorBlacklistTxRequest)
 * ```json
 * {
 *   "alias": "projectowner",           // Owner's access token alias
 *   "project_id": "abc123...",         // Project NFT policy ID (56 char hex)
 *   "aliases_to_add": ["badactor1"],   // Aliases to blacklist
 *   "aliases_to_remove": ["forgiven1"] // Aliases to remove from blacklist
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
 * ## Side Effects
 *
 * **None** - This is a purely on-chain action. Blacklist status is determined by the
 * Project Governance UTxO on-chain.
 *
 * ## On-Chain Result
 *
 * Updates the Project Governance UTxO to add/remove aliases from the contributor blacklist.
 * Blacklisted contributors cannot:
 * - Enroll in the project
 * - Commit to tasks
 * - Receive rewards
 */
export const PROJECT_OWNER_BLACKLIST_MANAGE: AndamioTransactionDefinition = {
  txType: txName,
  role: "project-owner",
  protocolSpec: {
    ...createProtocolSpec("v2", protocolId),
    requiredTokens: ["global-state.access-token-user"],
  },
  buildTxConfig: {
    ...createSchemas({
      // Transaction API inputs - matches ManageContributorBlacklistTxRequest
      txParams: z.object({
        alias: z.string().min(1).max(31), // Owner's alias
        project_id: z.string().length(56), // Project NFT policy ID (hex)
        aliases_to_add: z.array(z.string().min(1).max(31)), // Aliases to blacklist
        aliases_to_remove: z.array(z.string().min(1).max(31)), // Aliases to remove from blacklist
      }),
      // No side effect parameters - purely on-chain action
      sideEffectParams: z.object({}),
    }),
    builder: { type: "api-endpoint", endpoint: "/api/v2/tx/project/owner/contributor-blacklist/manage" },
    estimatedCost: getProtocolCost(protocolId),
  },
  // No side effects - blacklist status is determined on-chain
  onSubmit: [],
  onConfirmation: [],
  ui: {
    buttonText: "Manage Blacklist",
    title: "Manage Contributor Blacklist",
    description: [
      "Add or remove contributors from the project blacklist. Blacklisted contributors cannot participate in this project.",
    ],
    footerLink: "https://docs.andamio.io/docs/protocol/v2/transactions/project/owner/blacklist-manage",
    footerLinkText: "Tx Documentation",
    successInfo: "Contributor blacklist updated successfully!",
  },
  docs: {
    protocolDocs: "https://docs.andamio.io/docs/protocol/v2/transactions/project/owner/blacklist-manage",
    apiDocs: "https://dev-api.andamio.io/api/v1/docs/index.html#/default/post_v2_tx_project_owner_contributor_blacklist_manage",
  },
};
