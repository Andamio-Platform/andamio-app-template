"use strict";
/**
 * V2 Course System Transactions
 *
 * Transactions for the Andamio Course Management System.
 * Covers the complete course lifecycle: enrollment, learning, and credentialing.
 *
 * Roles:
 * - owner: Course owners who manage teachers
 * - teacher: Instructors who manage modules and assess assignments
 * - student: Learners who enroll in courses and complete assignments
 *
 * Note: Course creation is in the instance folder (/v2/tx/instance/owner/course/create)
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
exports.COURSE_STUDENT_CREDENTIAL_CLAIM = exports.COURSE_STUDENT_ASSIGNMENT_UPDATE = exports.COURSE_STUDENT_ASSIGNMENT_COMMIT = exports.COURSE_TEACHER_ASSIGNMENTS_ASSESS = exports.COURSE_TEACHER_MODULES_MANAGE = exports.COURSE_OWNER_TEACHERS_MANAGE = void 0;
// Owner Transactions (1)
__exportStar(require("./owner"), exports);
// Teacher Transactions (2)
__exportStar(require("./teacher"), exports);
// Student Transactions (3)
__exportStar(require("./student"), exports);
// Re-export for explicit imports
var owner_1 = require("./owner");
Object.defineProperty(exports, "COURSE_OWNER_TEACHERS_MANAGE", { enumerable: true, get: function () { return owner_1.COURSE_OWNER_TEACHERS_MANAGE; } });
var teacher_1 = require("./teacher");
Object.defineProperty(exports, "COURSE_TEACHER_MODULES_MANAGE", { enumerable: true, get: function () { return teacher_1.COURSE_TEACHER_MODULES_MANAGE; } });
Object.defineProperty(exports, "COURSE_TEACHER_ASSIGNMENTS_ASSESS", { enumerable: true, get: function () { return teacher_1.COURSE_TEACHER_ASSIGNMENTS_ASSESS; } });
var student_1 = require("./student");
Object.defineProperty(exports, "COURSE_STUDENT_ASSIGNMENT_COMMIT", { enumerable: true, get: function () { return student_1.COURSE_STUDENT_ASSIGNMENT_COMMIT; } });
Object.defineProperty(exports, "COURSE_STUDENT_ASSIGNMENT_UPDATE", { enumerable: true, get: function () { return student_1.COURSE_STUDENT_ASSIGNMENT_UPDATE; } });
Object.defineProperty(exports, "COURSE_STUDENT_CREDENTIAL_CLAIM", { enumerable: true, get: function () { return student_1.COURSE_STUDENT_CREDENTIAL_CLAIM; } });
