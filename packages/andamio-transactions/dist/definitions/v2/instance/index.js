"use strict";
/**
 * V2 Instance Transaction Definitions
 *
 * Transactions for creating courses and projects at the instance level.
 * These are owner-level operations that initialize new on-chain entities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.INSTANCE_PROJECT_CREATE = exports.INSTANCE_COURSE_CREATE = void 0;
var course_create_1 = require("./course-create");
Object.defineProperty(exports, "INSTANCE_COURSE_CREATE", { enumerable: true, get: function () { return course_create_1.INSTANCE_COURSE_CREATE; } });
var project_create_1 = require("./project-create");
Object.defineProperty(exports, "INSTANCE_PROJECT_CREATE", { enumerable: true, get: function () { return project_create_1.INSTANCE_PROJECT_CREATE; } });
