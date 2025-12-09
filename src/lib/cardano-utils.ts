/**
 * Cardano utility functions and constants
 *
 * Consolidates common Cardano-related utilities used across the application.
 */

/**
 * Number of Lovelace per ADA
 * 1 ADA = 1,000,000 Lovelace
 */
export const LOVELACE_PER_ADA = 1_000_000;

/**
 * Common Cardano constants
 */
export const CARDANO_CONSTANTS = {
  /** Lovelace per ADA conversion factor */
  LOVELACE_PER_ADA,
  /** Minimum reward in Lovelace (1 ADA) */
  MIN_REWARD_LOVELACE: 1_000_000,
} as const;

/**
 * Format Lovelace amount as ADA string
 *
 * @param lovelace - Amount in Lovelace (string or number)
 * @returns Formatted string with ADA suffix (e.g., "1,000 ADA")
 *
 * @example
 * ```ts
 * formatLovelace(1000000) // "1 ADA"
 * formatLovelace("5000000") // "5 ADA"
 * formatLovelace(1500000) // "1.5 ADA"
 * ```
 */
export function formatLovelace(lovelace: string | number): string {
  const numericValue =
    typeof lovelace === "string" ? parseInt(lovelace, 10) : lovelace;

  if (isNaN(numericValue)) {
    return "0 ADA";
  }

  const ada = numericValue / LOVELACE_PER_ADA;
  return `${ada.toLocaleString()} ADA`;
}

/**
 * Convert ADA to Lovelace
 *
 * @param ada - Amount in ADA
 * @returns Amount in Lovelace
 *
 * @example
 * ```ts
 * adaToLovelace(1) // 1000000
 * adaToLovelace(5.5) // 5500000
 * ```
 */
export function adaToLovelace(ada: number): number {
  return Math.floor(ada * LOVELACE_PER_ADA);
}

/**
 * Convert Lovelace to ADA
 *
 * @param lovelace - Amount in Lovelace
 * @returns Amount in ADA
 *
 * @example
 * ```ts
 * lovelaceToAda(1000000) // 1
 * lovelaceToAda(5500000) // 5.5
 * ```
 */
export function lovelaceToAda(lovelace: number | string): number {
  const numericValue =
    typeof lovelace === "string" ? parseInt(lovelace, 10) : lovelace;
  return numericValue / LOVELACE_PER_ADA;
}

/**
 * Format ADA amount with proper decimals
 *
 * @param ada - Amount in ADA
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with ADA suffix
 *
 * @example
 * ```ts
 * formatAda(1.5) // "1.50 ADA"
 * formatAda(1000.123, 3) // "1,000.123 ADA"
 * ```
 */
export function formatAda(ada: number, decimals = 2): string {
  return `${ada.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ADA`;
}
