import { z } from "zod";
import type { AndamioTransactionDefinition } from "../../../../types";
import { createProtocolSpec, getProtocolCost } from "../../../../utils/protocol-reference";
import { createSchemas } from "../../../../utils/schema-helpers";

const protocolId = "global.general.access-token.mint";
const txName = "GLOBAL_GENERAL_ACCESS_TOKEN_MINT" as const;

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
export const GLOBAL_GENERAL_ACCESS_TOKEN_MINT: AndamioTransactionDefinition = {
  txType: txName,
  role: "general",
  protocolSpec: {
    ...createProtocolSpec("v2", protocolId),
    requiredTokens: [], // No tokens required - this is the entry point
  },
  buildTxConfig: {
    ...createSchemas({
      // Transaction API inputs - matches MintAccessTokenTxRequest
      txParams: z.object({
        initiator_data: z.string().min(1), // GYAddressBech32 - wallet address
        alias: z.string().min(1).max(31), // Alias (alphanumeric, 1-31 chars)
      }),
      // No side effect parameters
      sideEffectParams: z.object({}),
    }),
    builder: { type: "api-endpoint", endpoint: "/v2/tx/global/general/access-token/mint" },
    estimatedCost: getProtocolCost(protocolId),
  },
  onSubmit: [
    {
      def: "Set Pending Transaction",
      method: "POST",
      endpoint: "/user/unconfirmed-tx",
      body: {
        tx_hash: { source: "context", path: "txHash" },
      },
    },
  ],
  onConfirmation: [
    {
      def: "Update Access Token Alias",
      method: "POST",
      endpoint: "/user/access-token-alias",
      body: {
        access_token_alias: { source: "context", path: "txParams.alias" },
      },
      critical: true,
    },
    {
      def: "Clear Pending Transaction",
      method: "POST",
      endpoint: "/user/unconfirmed-tx",
      body: {
        tx_hash: { source: "literal", value: null },
      },
    },
  ],
  ui: {
    buttonText: "Mint Access Token",
    title: "Mint Access Token",
    description: [
      "Mint your access token to participate in the Andamio protocol. This is required before you can enroll in courses or perform any other actions.",
    ],
    footerLink: "https://docs.andamio.io/docs/protocol/v2/transactions/global/general/access-token/mint",
    footerLinkText: "Tx Documentation",
    successInfo: "Access token minted successfully!",
  },
  docs: {
    protocolDocs: "https://docs.andamio.io/docs/protocol/v2/transactions/global/general/access-token/mint",
    apiDocs: "https://atlas-api-preprod-507341199760.us-central1.run.app/swagger/index.html#/default/post_v2_tx_global_general_access_token_mint",
  },
};
