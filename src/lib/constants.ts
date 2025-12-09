/**
 * Application constants
 *
 * Centralizes magic numbers and configuration values used across the application.
 */

/**
 * UI timing constants for notifications and feedback
 */
export const UI_TIMEOUTS = {
  /** Duration for copy feedback messages (e.g., "Copied!") */
  COPY_FEEDBACK: 2000,
  /** Duration for save success notifications */
  SAVE_SUCCESS: 3000,
  /** Duration for general toast notifications */
  TOAST_DEFAULT: 3000,
  /** Duration for error notifications (longer for readability) */
  ERROR_NOTIFICATION: 5000,
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  /** Default page size for lists */
  DEFAULT_PAGE_SIZE: 10,
  /** Maximum page size allowed */
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Form validation limits
 */
export const FORM_LIMITS = {
  /** Maximum title length */
  MAX_TITLE_LENGTH: 200,
  /** Maximum description length */
  MAX_DESCRIPTION_LENGTH: 2000,
  /** Maximum module code length */
  MAX_MODULE_CODE_LENGTH: 50,
} as const;

/**
 * Cardano explorer URLs by network
 */
export const EXPLORER_URLS = {
  mainnet: "https://cardanoscan.io",
  preprod: "https://preprod.cardanoscan.io",
  preview: "https://preview.cardanoscan.io",
} as const;

export type CardanoNetwork = keyof typeof EXPLORER_URLS;

/**
 * Get the explorer base URL for the current network
 */
export function getExplorerBaseUrl(network: CardanoNetwork = "preprod"): string {
  return EXPLORER_URLS[network];
}

/**
 * Get explorer URL for a transaction
 */
export function getTransactionExplorerUrl(txHash: string, network: CardanoNetwork = "preprod"): string {
  return `${EXPLORER_URLS[network]}/transaction/${txHash}`;
}

/**
 * Get explorer URL for a token/asset
 */
export function getTokenExplorerUrl(policyId: string, network: CardanoNetwork = "preprod"): string {
  return `${EXPLORER_URLS[network]}/token/${policyId}`;
}

/**
 * Get explorer URL for an address
 */
export function getAddressExplorerUrl(address: string, network: CardanoNetwork = "preprod"): string {
  return `${EXPLORER_URLS[network]}/address/${address}`;
}
