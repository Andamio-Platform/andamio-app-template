/**
 * Config Exports
 *
 * Centralized configuration for transactions, validation, and UI strings.
 */

// Transaction UI configuration
export {
  TRANSACTION_UI,
  TRANSACTION_ENDPOINTS,
  getTransactionUI,
  getTransactionEndpoint,
  isTransactionType,
  type TransactionType,
  type TransactionUIConfig,
} from "./transaction-ui";

// Transaction validation schemas
export {
  txSchemas,
  validateTxParams,
  getTxSchema,
  parseTxParams,
  // Common schema building blocks
  aliasSchema,
  policyIdSchema,
  hashSchema,
  shortTextSchema,
  walletDataSchema,
  valueSchema,
  type TxParams,
} from "./transaction-schemas";
