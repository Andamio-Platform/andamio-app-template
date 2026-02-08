import type { EnableWeb3WalletOptions } from "@meshsdk/web3-sdk";

/**
 * Shared Web3 Services config for social wallet login (Google, Discord, X).
 *
 * Used as the default `web3Services` prop for ConnectWalletButton.
 * Project ID is from the Mesh Web3 dashboard.
 */
export const WEB3_SERVICES_CONFIG: EnableWeb3WalletOptions = {
  networkId: 0, // preprod
  projectId: "13ff4981-bdca-4aad-ba9a-41fe1018fdb0",
};
