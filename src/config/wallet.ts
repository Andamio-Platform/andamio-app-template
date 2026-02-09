import { BlockfrostProvider } from "@meshsdk/core";
import type { EnableWeb3WalletOptions } from "@utxos/sdk";
import { env } from "~/env";

/**
 * Blockfrost provider for social wallet (UTXOS/Web3) transaction submission.
 *
 * CIP-30 browser wallets (Nami, Eternl, etc.) have their own built-in submitter
 * via the extension. But MeshWallet (used by social login) is a software wallet
 * with no extension — it needs an explicit provider to fetch UTXOs and submit TX.
 *
 * Returns undefined when no Blockfrost key is configured (social wallets will
 * connect but won't be able to submit transactions).
 */
const blockfrostProvider = env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID
  ? new BlockfrostProvider(env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID)
  : undefined;

/**
 * Shared Web3 Services config for social wallet login (Google, Discord, X).
 *
 * Used as the default `web3Services` prop for ConnectWalletButton.
 * Project ID is from the Mesh Web3 dashboard.
 */
export const WEB3_SERVICES_CONFIG: EnableWeb3WalletOptions = {
  networkId: 0, // preprod
  projectId: "13ff4981-bdca-4aad-ba9a-41fe1018fdb0",
  fetcher: blockfrostProvider,
  submitter: blockfrostProvider,
};
