import type { ProtocolSpec, ProtocolVersion } from "../types";
/**
 * Helper to create protocol specification references
 *
 * @example
 * ```ts
 * const spec = createProtocolSpec("v1", "general.access-token-mint");
 * ```
 */
export declare function createProtocolSpec(version: ProtocolVersion, id: string): ProtocolSpec;
/**
 * Transaction cost data extracted from YAML files
 *
 * Source: ~/$PROJECTS_PATH/andamio-docs/public/yaml/transactions/v1
 *
 * Note: YAML files use "estimated_cost" in metadata.
 * Many are listed as "0 ADA" which means minimal tx fees only.
 */
export declare const PROTOCOL_COSTS: {
    readonly "general.access-token-mint": {
        readonly txFee: 200000;
        readonly minDeposit: 2000000;
        readonly additionalCosts: readonly [{
            readonly label: "Platform fee";
            readonly amount: 5000000;
        }];
    };
    readonly "general.publish-tx": {
        readonly txFee: 200000;
        readonly additionalCosts: readonly [{
            readonly label: "Publishing fee";
            readonly amount: 150000000;
        }];
    };
    readonly "course-creator.mint-module-tokens": {
        readonly txFee: 200000;
        readonly minDeposit: 2000000;
    };
    readonly "course-creator.accept-assignment": {
        readonly txFee: 200000;
    };
    readonly "course-creator.deny-assignment": {
        readonly txFee: 200000;
    };
    readonly "course-creator.add-course-managers": {
        readonly txFee: 200000;
        readonly additionalCosts: readonly [{
            readonly label: "Per manager fee";
            readonly amount: 10000000;
        }];
    };
    readonly "student.mint-local-state": {
        readonly txFee: 200000;
        readonly minDeposit: 2000000;
    };
    readonly "student.burn-local-state": {
        readonly txFee: 200000;
    };
    readonly "student.commit-to-assignment": {
        readonly txFee: 200000;
    };
    readonly "student.update-assignment": {
        readonly txFee: 200000;
    };
    readonly "student.leave-assignment": {
        readonly txFee: 200000;
    };
    readonly "contributor.mint-project-state": {
        readonly txFee: 200000;
        readonly minDeposit: 2000000;
    };
    readonly "contributor.burn-project-state": {
        readonly txFee: 200000;
    };
    readonly "contributor.commit-project": {
        readonly txFee: 200000;
    };
    readonly "contributor.submit-project": {
        readonly txFee: 200000;
    };
    readonly "contributor.add-info": {
        readonly txFee: 200000;
    };
    readonly "contributor.get-rewards": {
        readonly txFee: 200000;
    };
    readonly "contributor.unlock-project": {
        readonly txFee: 200000;
    };
    readonly "project-creator.mint-treasury-token": {
        readonly txFee: 200000;
        readonly minDeposit: 2000000;
    };
    readonly "project-creator.manage-treasury-token": {
        readonly txFee: 200000;
    };
    readonly "project-creator.accept-project": {
        readonly txFee: 200000;
    };
    readonly "project-creator.refuse-project": {
        readonly txFee: 200000;
    };
    readonly "project-creator.deny-project": {
        readonly txFee: 200000;
    };
    readonly "admin.init-course": {
        readonly txFee: 200000;
        readonly minDeposit: 2000000;
    };
    readonly "admin.add-course-creators": {
        readonly txFee: 200000;
    };
    readonly "admin.rm-course-creators": {
        readonly txFee: 200000;
    };
    readonly "admin.init-project-step-1": {
        readonly txFee: 200000;
        readonly minDeposit: 2000000;
    };
    readonly "admin.init-project-step-2": {
        readonly txFee: 200000;
    };
    readonly "admin.init-single-contributor-state": {
        readonly txFee: 200000;
        readonly minDeposit: 2000000;
    };
    readonly "admin.add-project-creators": {
        readonly txFee: 200000;
    };
    readonly "admin.rm-project-creators": {
        readonly txFee: 200000;
    };
    readonly "admin.create-course": {
        readonly txFee: 200000;
        readonly minDeposit: 2000000;
    };
    readonly "admin.update-course-teachers": {
        readonly txFee: 200000;
    };
    readonly "teacher.manage-course-modules": {
        readonly txFee: 200000;
        readonly minDeposit: 2000000;
    };
    readonly "teacher.assess-assignment": {
        readonly txFee: 200000;
    };
    readonly "student.enroll-in-course": {
        readonly txFee: 200000;
        readonly minDeposit: 2000000;
    };
    readonly "student.update-assignment-submission": {
        readonly txFee: 200000;
    };
    readonly "student.claim-credential": {
        readonly txFee: 200000;
        readonly minDeposit: 2000000;
    };
};
/**
 * Get protocol cost for a transaction
 */
export declare function getProtocolCost(id: string): import("../types").TransactionCost;
