"use strict";
/**
 * V2 Transaction Definitions
 *
 * Current production transactions for Andamio Protocol V2.
 * V2 consolidates roles and dramatically reduces transaction count.
 *
 * Key improvements over V1:
 * - Batch module management (single tx for multiple modules)
 * - SLT hash token naming (tamper-evident design)
 * - Simplified role structure
 * - Lower operational costs
 *
 * Organized by system (matching API URL structure):
 * - global/: Global system transactions (access tokens)
 * - instance/: Instance-level transactions (course/project creation)
 * - course/: Course management system transactions
 * - project/: Project management system transactions
 *
 * Legacy paths (deprecated):
 * - general/: Moved to global/general/
 *
 * Total V2 Transactions: 15
 * - Global General: 1
 * - Instance: 2
 * - Course: 6 (1 owner + 2 teacher + 3 student)
 * - Project: 7 (2 owner + 2 manager + 3 contributor)
 *
 * @example
 * // Import all course transactions
 * import { course } from "@andamio/transactions/definitions/v2";
 *
 * // Import specific transactions
 * import { INSTANCE_COURSE_CREATE, COURSE_STUDENT_ASSIGNMENT_COMMIT } from "@andamio/transactions";
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM = exports.PROJECT_CONTRIBUTOR_TASK_ACTION = exports.PROJECT_CONTRIBUTOR_TASK_COMMIT = exports.PROJECT_MANAGER_TASKS_ASSESS = exports.PROJECT_MANAGER_TASKS_MANAGE = exports.PROJECT_OWNER_BLACKLIST_MANAGE = exports.PROJECT_OWNER_MANAGERS_MANAGE = exports.COURSE_STUDENT_CREDENTIAL_CLAIM = exports.COURSE_STUDENT_ASSIGNMENT_UPDATE = exports.COURSE_STUDENT_ASSIGNMENT_COMMIT = exports.COURSE_TEACHER_ASSIGNMENTS_ASSESS = exports.COURSE_TEACHER_MODULES_MANAGE = exports.COURSE_OWNER_TEACHERS_MANAGE = exports.INSTANCE_PROJECT_CREATE = exports.INSTANCE_COURSE_CREATE = exports.GLOBAL_GENERAL_ACCESS_TOKEN_MINT = exports.project = exports.instance = exports.global = exports.course = void 0;
// Export system namespaces
const courseExports = __importStar(require("./course"));
const globalExports = __importStar(require("./global"));
const instanceExports = __importStar(require("./instance"));
const projectExports = __importStar(require("./project"));
exports.course = courseExports;
exports.global = globalExports;
exports.instance = instanceExports;
exports.project = projectExports;
// Export all systems
__exportStar(require("./course"), exports);
__exportStar(require("./global"), exports);
__exportStar(require("./instance"), exports);
__exportStar(require("./project"), exports);
// Re-export individual definitions for explicit imports
// Global General (1)
var general_1 = require("./global/general");
Object.defineProperty(exports, "GLOBAL_GENERAL_ACCESS_TOKEN_MINT", { enumerable: true, get: function () { return general_1.GLOBAL_GENERAL_ACCESS_TOKEN_MINT; } });
// Instance (2)
var instance_1 = require("./instance");
Object.defineProperty(exports, "INSTANCE_COURSE_CREATE", { enumerable: true, get: function () { return instance_1.INSTANCE_COURSE_CREATE; } });
Object.defineProperty(exports, "INSTANCE_PROJECT_CREATE", { enumerable: true, get: function () { return instance_1.INSTANCE_PROJECT_CREATE; } });
// Course Owner (1)
var owner_1 = require("./course/owner");
Object.defineProperty(exports, "COURSE_OWNER_TEACHERS_MANAGE", { enumerable: true, get: function () { return owner_1.COURSE_OWNER_TEACHERS_MANAGE; } });
// Course Teacher (2)
var teacher_1 = require("./course/teacher");
Object.defineProperty(exports, "COURSE_TEACHER_MODULES_MANAGE", { enumerable: true, get: function () { return teacher_1.COURSE_TEACHER_MODULES_MANAGE; } });
Object.defineProperty(exports, "COURSE_TEACHER_ASSIGNMENTS_ASSESS", { enumerable: true, get: function () { return teacher_1.COURSE_TEACHER_ASSIGNMENTS_ASSESS; } });
// Course Student (3)
var student_1 = require("./course/student");
Object.defineProperty(exports, "COURSE_STUDENT_ASSIGNMENT_COMMIT", { enumerable: true, get: function () { return student_1.COURSE_STUDENT_ASSIGNMENT_COMMIT; } });
Object.defineProperty(exports, "COURSE_STUDENT_ASSIGNMENT_UPDATE", { enumerable: true, get: function () { return student_1.COURSE_STUDENT_ASSIGNMENT_UPDATE; } });
Object.defineProperty(exports, "COURSE_STUDENT_CREDENTIAL_CLAIM", { enumerable: true, get: function () { return student_1.COURSE_STUDENT_CREDENTIAL_CLAIM; } });
// Project Owner (2)
var owner_2 = require("./project/owner");
Object.defineProperty(exports, "PROJECT_OWNER_MANAGERS_MANAGE", { enumerable: true, get: function () { return owner_2.PROJECT_OWNER_MANAGERS_MANAGE; } });
Object.defineProperty(exports, "PROJECT_OWNER_BLACKLIST_MANAGE", { enumerable: true, get: function () { return owner_2.PROJECT_OWNER_BLACKLIST_MANAGE; } });
// Project Manager (2)
var manager_1 = require("./project/manager");
Object.defineProperty(exports, "PROJECT_MANAGER_TASKS_MANAGE", { enumerable: true, get: function () { return manager_1.PROJECT_MANAGER_TASKS_MANAGE; } });
Object.defineProperty(exports, "PROJECT_MANAGER_TASKS_ASSESS", { enumerable: true, get: function () { return manager_1.PROJECT_MANAGER_TASKS_ASSESS; } });
// Project Contributor (3)
var contributor_1 = require("./project/contributor");
Object.defineProperty(exports, "PROJECT_CONTRIBUTOR_TASK_COMMIT", { enumerable: true, get: function () { return contributor_1.PROJECT_CONTRIBUTOR_TASK_COMMIT; } });
Object.defineProperty(exports, "PROJECT_CONTRIBUTOR_TASK_ACTION", { enumerable: true, get: function () { return contributor_1.PROJECT_CONTRIBUTOR_TASK_ACTION; } });
Object.defineProperty(exports, "PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM", { enumerable: true, get: function () { return contributor_1.PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM; } });
