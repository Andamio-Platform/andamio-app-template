"use strict";
/**
 * V2 Course Student Transaction Definitions
 *
 * Transactions for course students to commit to assignments, update them, and claim credentials.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.COURSE_STUDENT_CREDENTIAL_CLAIM = exports.COURSE_STUDENT_ASSIGNMENT_UPDATE = exports.COURSE_STUDENT_ASSIGNMENT_COMMIT = void 0;
var assignment_commit_1 = require("./assignment-commit");
Object.defineProperty(exports, "COURSE_STUDENT_ASSIGNMENT_COMMIT", { enumerable: true, get: function () { return assignment_commit_1.COURSE_STUDENT_ASSIGNMENT_COMMIT; } });
var assignment_update_1 = require("./assignment-update");
Object.defineProperty(exports, "COURSE_STUDENT_ASSIGNMENT_UPDATE", { enumerable: true, get: function () { return assignment_update_1.COURSE_STUDENT_ASSIGNMENT_UPDATE; } });
var credential_claim_1 = require("./credential-claim");
Object.defineProperty(exports, "COURSE_STUDENT_CREDENTIAL_CLAIM", { enumerable: true, get: function () { return credential_claim_1.COURSE_STUDENT_CREDENTIAL_CLAIM; } });
