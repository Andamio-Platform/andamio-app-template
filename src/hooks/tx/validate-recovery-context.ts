// Test-seam extraction of validateRecoveryContext from use-transaction.ts (pure, no React-deps).

import type { TransactionType } from "~/config/transaction-ui";
import type { TxRecoveryContext } from "~/types/tx-recovery";

// Drops a recoveryContext whose `kind` does not match the TX type — mismatches indicate a caller bug.
export function validateRecoveryContext(
  txType: TransactionType,
  context: TxRecoveryContext | undefined,
): TxRecoveryContext | undefined {
  if (!context) return undefined;
  const kindMatchesTxType =
    (context.kind === "project_contributor" &&
      txType === "PROJECT_CONTRIBUTOR_TASK_COMMIT") ||
    (context.kind === "course_assignment" &&
      txType === "COURSE_STUDENT_ASSIGNMENT_COMMIT");
  if (!kindMatchesTxType) {
    console.warn(
      `[useTransaction] recoveryContext.kind "${context.kind}" does not match txType "${txType}" — dropping`,
    );
    return undefined;
  }
  return context;
}
