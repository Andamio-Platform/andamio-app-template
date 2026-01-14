"use strict";
/**
 * V2 Project System Transactions
 *
 * Transactions for the Andamio Project Management System.
 * Covers the complete project lifecycle: task management, contributions, and credentialing.
 *
 * Roles:
 * - owner: Project owners who manage managers and blacklist
 * - manager: Project managers who manage tasks and assess submissions
 * - contributor: Contributors who enroll, commit to tasks, and claim credentials
 *
 * Note: Project creation is in the instance folder (/v2/tx/instance/owner/project/create)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM = exports.PROJECT_CONTRIBUTOR_TASK_ACTION = exports.PROJECT_CONTRIBUTOR_TASK_COMMIT = exports.PROJECT_MANAGER_TASKS_ASSESS = exports.PROJECT_MANAGER_TASKS_MANAGE = exports.PROJECT_OWNER_BLACKLIST_MANAGE = exports.PROJECT_OWNER_MANAGERS_MANAGE = void 0;
// Owner Transactions (2)
__exportStar(require("./owner"), exports);
// Manager Transactions (2)
__exportStar(require("./manager"), exports);
// Contributor Transactions (3)
__exportStar(require("./contributor"), exports);
// Re-export for explicit imports
var owner_1 = require("./owner");
Object.defineProperty(exports, "PROJECT_OWNER_MANAGERS_MANAGE", { enumerable: true, get: function () { return owner_1.PROJECT_OWNER_MANAGERS_MANAGE; } });
Object.defineProperty(exports, "PROJECT_OWNER_BLACKLIST_MANAGE", { enumerable: true, get: function () { return owner_1.PROJECT_OWNER_BLACKLIST_MANAGE; } });
var manager_1 = require("./manager");
Object.defineProperty(exports, "PROJECT_MANAGER_TASKS_MANAGE", { enumerable: true, get: function () { return manager_1.PROJECT_MANAGER_TASKS_MANAGE; } });
Object.defineProperty(exports, "PROJECT_MANAGER_TASKS_ASSESS", { enumerable: true, get: function () { return manager_1.PROJECT_MANAGER_TASKS_ASSESS; } });
var contributor_1 = require("./contributor");
Object.defineProperty(exports, "PROJECT_CONTRIBUTOR_TASK_COMMIT", { enumerable: true, get: function () { return contributor_1.PROJECT_CONTRIBUTOR_TASK_COMMIT; } });
Object.defineProperty(exports, "PROJECT_CONTRIBUTOR_TASK_ACTION", { enumerable: true, get: function () { return contributor_1.PROJECT_CONTRIBUTOR_TASK_ACTION; } });
Object.defineProperty(exports, "PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM", { enumerable: true, get: function () { return contributor_1.PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM; } });
