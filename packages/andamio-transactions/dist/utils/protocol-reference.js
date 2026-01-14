"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROTOCOL_COSTS = void 0;
exports.createProtocolSpec = createProtocolSpec;
exports.getProtocolCost = getProtocolCost;
/**
 * Helper to create protocol specification references
 *
 * @example
 * ```ts
 * const spec = createProtocolSpec("v1", "general.access-token-mint");
 * ```
 */
function createProtocolSpec(version, id) {
    // Parse the ID to get role and transaction name
    const [role, txName] = id.split(".");
    return {
        version,
        id,
        yamlPath: `/yaml/transactions/${version}/${role}/${txName}.yaml`,
    };
}
/**
 * Transaction cost data extracted from YAML files
 *
 * Source: ~/$PROJECTS_PATH/andamio-docs/public/yaml/transactions/v1
 *
 * Note: YAML files use "estimated_cost" in metadata.
 * Many are listed as "0 ADA" which means minimal tx fees only.
 */
exports.PROTOCOL_COSTS = {
    // General transactions
    "general.access-token-mint": {
        txFee: 200000, // ~0.2 ADA estimated
        minDeposit: 2000000, // 2 ADA for token UTxO
        additionalCosts: [
            { label: "Platform fee", amount: 5000000 }, // 5 ADA to treasury
        ],
    },
    "general.publish-tx": {
        txFee: 200000,
        additionalCosts: [
            { label: "Publishing fee", amount: 150000000 }, // 150 ADA
        ],
    },
    // Course Creator transactions
    "course-creator.mint-module-tokens": {
        txFee: 200000,
        minDeposit: 2000000, // For module token UTxO
    },
    "course-creator.accept-assignment": {
        txFee: 200000,
    },
    "course-creator.deny-assignment": {
        txFee: 200000,
    },
    "course-creator.add-course-managers": {
        txFee: 200000,
        additionalCosts: [
            { label: "Per manager fee", amount: 10000000 }, // 10 ADA per manager
        ],
    },
    // Student transactions
    "student.mint-local-state": {
        txFee: 200000,
        minDeposit: 2000000,
    },
    "student.burn-local-state": {
        txFee: 200000,
    },
    "student.commit-to-assignment": {
        txFee: 200000,
    },
    "student.update-assignment": {
        txFee: 200000,
    },
    "student.leave-assignment": {
        txFee: 200000,
    },
    // Contributor transactions
    "contributor.mint-project-state": {
        txFee: 200000,
        minDeposit: 2000000,
    },
    "contributor.burn-project-state": {
        txFee: 200000,
    },
    "contributor.commit-project": {
        txFee: 200000,
    },
    "contributor.submit-project": {
        txFee: 200000,
    },
    "contributor.add-info": {
        txFee: 200000,
    },
    "contributor.get-rewards": {
        txFee: 200000,
    },
    "contributor.unlock-project": {
        txFee: 200000,
    },
    // Project Creator transactions
    "project-creator.mint-treasury-token": {
        txFee: 200000,
        minDeposit: 2000000,
    },
    "project-creator.manage-treasury-token": {
        txFee: 200000,
    },
    "project-creator.accept-project": {
        txFee: 200000,
    },
    "project-creator.refuse-project": {
        txFee: 200000,
    },
    "project-creator.deny-project": {
        txFee: 200000,
    },
    // Admin transactions (v1)
    "admin.init-course": {
        txFee: 200000,
        minDeposit: 2000000,
    },
    "admin.add-course-creators": {
        txFee: 200000,
    },
    "admin.rm-course-creators": {
        txFee: 200000,
    },
    "admin.init-project-step-1": {
        txFee: 200000,
        minDeposit: 2000000,
    },
    "admin.init-project-step-2": {
        txFee: 200000,
    },
    "admin.init-single-contributor-state": {
        txFee: 200000,
        minDeposit: 2000000,
    },
    "admin.add-project-creators": {
        txFee: 200000,
    },
    "admin.rm-project-creators": {
        txFee: 200000,
    },
    // Admin transactions (v2)
    "admin.create-course": {
        txFee: 200000,
        minDeposit: 2000000, // For Course NFT UTxO
    },
    "admin.update-course-teachers": {
        txFee: 200000,
    },
    // Teacher transactions (v2)
    "teacher.manage-course-modules": {
        txFee: 200000,
        minDeposit: 2000000, // For module token UTxO
    },
    "teacher.assess-assignment": {
        txFee: 200000,
    },
    // Student transactions (v2)
    "student.enroll-in-course": {
        txFee: 200000,
        minDeposit: 2000000, // For enrollment UTxO
    },
    "student.update-assignment-submission": {
        txFee: 200000,
    },
    "student.claim-credential": {
        txFee: 200000,
        minDeposit: 2000000, // For credential token UTxO
    },
};
/**
 * Get protocol cost for a transaction
 */
function getProtocolCost(id) {
    const cost = exports.PROTOCOL_COSTS[id];
    if (!cost) {
        return { txFee: 200000 }; // Default estimate
    }
    // Convert readonly arrays to mutable arrays for compatibility
    const result = {
        txFee: cost.txFee,
    };
    if ("minDeposit" in cost) {
        result.minDeposit = cost.minDeposit;
    }
    if ("additionalCosts" in cost) {
        result.additionalCosts = [...cost.additionalCosts];
    }
    return result;
}
