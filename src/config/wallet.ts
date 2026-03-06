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
 * Project ID and network are configured via env vars (NEXT_PUBLIC_WEB3_SDK_*).
 *
 * Returns undefined when no project ID is configured (social login will be hidden).
 */
export const WEB3_SERVICES_CONFIG: EnableWeb3WalletOptions | undefined =
  env.NEXT_PUBLIC_WEB3_SDK_PROJECT_ID
    ? {
        networkId: env.NEXT_PUBLIC_WEB3_SDK_NETWORK === "mainnet" ? 1 : 0,
        projectId: env.NEXT_PUBLIC_WEB3_SDK_PROJECT_ID,
        fetcher: blockfrostProvider,
        submitter: blockfrostProvider,
      }
    : undefined;
