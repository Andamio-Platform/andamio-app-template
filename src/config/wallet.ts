/**
 * Shared wallet configuration for CardanoWallet component
 *
 * This config is used across multiple components that render the Mesh CardanoWallet.
 * Centralizing it here prevents drift and makes updates easier.
 */
export const WEB3_SERVICES_CONFIG = {
  networkId: 0,
  projectId: "13ff4981-bdca-4aad-ba9a-41fe1018fdb0",
} as const;
