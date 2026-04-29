/**
 * Transaction recovery context — typed entity identifiers used by the indexer
 * fallback path when polling terminates on a 404 budget.
 *
 * The context is carried from the submit call site through
 * `useTransaction.execute()` → `txWatcherStore.register()` → optional
 * `PendingTxRegistration` persistence → recovery loop → indexer lookup.
 *
 * Only two kinds are supported today (the two commitment-producing flows
 * whose GET endpoints can independently confirm on-chain state). Other TX
 * types pass `undefined` and fall through to the synthetic terminal.
 *
 * @see src/lib/tx-indexer-fallback.ts - Consumer of this context
 * @see docs/plans/2026-04-14-001-fix-tx-register-404-polling-loop-plan.md
 */

export type TxRecoveryContext =
  | {
      kind: "project_contributor";
      projectId: string;
      taskHash: string;
    }
  | {
      kind: "course_assignment";
      courseId: string;
      moduleCode: string;
      sltHash: string;
    };
