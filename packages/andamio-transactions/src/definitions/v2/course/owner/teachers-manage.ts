import { z } from "zod";
import type { AndamioTransactionDefinition } from "../../../../types";
import { createProtocolSpec, getProtocolCost } from "../../../../utils/protocol-reference";
import { createSchemas } from "../../../../utils/schema-helpers";

const protocolId = "course.owner.teachers.manage";
const txName = "COURSE_OWNER_TEACHERS_MANAGE" as const;

/**
 * WalletData schema for optional initiator data
 */
const initiatorDataSchema = z
  .object({
    used_addresses: z.array(z.string()), // Array of bech32 addresses
    change_address: z.string(), // Bech32 change address
  })
  .optional();

/**
 * COURSE_OWNER_TEACHERS_MANAGE Transaction Definition
 *
 * Course owner adds or removes teachers from a course by updating the Course Governance UTxO.
 *
 * ## API Endpoint
 * POST /v2/tx/course/owner/teachers/manage
 *
 * ## Request Body (ManageTeachersTxRequest)
 * ```json
 * {
 *   "alias": "courseowner",              // Owner's access token alias
 *   "course_id": "abc123...",            // Course NFT policy ID (56 char hex)
 *   "teachers_to_add": ["teacher1"],     // Aliases of teachers to add
 *   "teachers_to_remove": ["teacher2"]   // Aliases of teachers to remove
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
 * **None** - This is a purely on-chain action. Teacher access is determined by the
 * Course Governance UTxO on-chain. Connected access token holders with teacher access
 * will see their permissions reflected via Andamioscan API queries.
 *
 * ## On-Chain Result
 *
 * Updates the Course Governance UTxO to add/remove teacher aliases. Teachers gain
 * the ability to:
 * - Manage course modules (mint, update, burn)
 * - Assess student assignment submissions (accept/refuse)
 */
export const COURSE_OWNER_TEACHERS_MANAGE: AndamioTransactionDefinition = {
  txType: txName,
  role: "course-owner",
  protocolSpec: {
    ...createProtocolSpec("v2", protocolId),
    requiredTokens: ["global-state.access-token-user"],
  },
  buildTxConfig: {
    ...createSchemas({
      // Transaction API inputs - matches ManageTeachersTxRequest
      txParams: z.object({
        alias: z.string().min(1).max(31), // Owner's alias (Alias type)
        course_id: z.string().length(56), // Course NFT policy ID (GYMintingPolicyId)
        teachers_to_add: z.array(z.string().min(1).max(31)), // Aliases of teachers to add
        teachers_to_remove: z.array(z.string().min(1).max(31)), // Aliases of teachers to remove
        initiator_data: initiatorDataSchema, // Optional wallet data (WalletData)
      }),
      // No side effect parameters - purely on-chain action
      sideEffectParams: z.object({}),
    }),
    builder: { type: "api-endpoint", endpoint: "/api/v2/tx/course/owner/teachers/manage" },
    estimatedCost: getProtocolCost(protocolId),
  },
  // No side effects - teacher access is determined on-chain via Course Governance UTxO
  onSubmit: [],
  onConfirmation: [],
  ui: {
    buttonText: "Manage Teachers",
    title: "Manage Course Teachers",
    description: [
      "Add or remove teachers from a course. Teachers have the ability to manage course modules and assess student assignments.",
    ],
    footerLink: "https://docs.andamio.io/docs/protocol/v2/transactions/course/owner/teachers/manage",
    footerLinkText: "Tx Documentation",
    successInfo: "Course teachers updated successfully!",
  },
  docs: {
    protocolDocs: "https://docs.andamio.io/docs/protocol/v2/transactions/course/owner/teachers/manage",
    apiDocs: "https://dev-api.andamio.io/api/v1/docs/index.html#/default/post_v2_tx_course_owner_teachers_manage",
  },
};
