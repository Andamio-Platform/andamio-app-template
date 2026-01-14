"use strict";
/**
 * V2 Project Contributor Transaction Definitions
 *
 * Transactions for project contributors to commit to tasks and claim credentials.
 * TASK_COMMIT handles both initial enrollment and subsequent task commits.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM = exports.PROJECT_CONTRIBUTOR_TASK_ACTION = exports.PROJECT_CONTRIBUTOR_TASK_COMMIT = void 0;
var task_commit_1 = require("./task-commit");
Object.defineProperty(exports, "PROJECT_CONTRIBUTOR_TASK_COMMIT", { enumerable: true, get: function () { return task_commit_1.PROJECT_CONTRIBUTOR_TASK_COMMIT; } });
var task_action_1 = require("./task-action");
Object.defineProperty(exports, "PROJECT_CONTRIBUTOR_TASK_ACTION", { enumerable: true, get: function () { return task_action_1.PROJECT_CONTRIBUTOR_TASK_ACTION; } });
var credential_claim_1 = require("./credential-claim");
Object.defineProperty(exports, "PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM", { enumerable: true, get: function () { return credential_claim_1.PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM; } });
