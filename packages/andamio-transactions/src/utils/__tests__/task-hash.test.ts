/**
 * Task Hash Tests
 *
 * Verify that our local hashing function matches on-chain task IDs.
 */

import { computeTaskHash, verifyTaskHash, isValidTaskHash, debugTaskCBOR, type TaskData } from "../task-hash";

describe("computeTaskHash", () => {
  // Known test data from PROJECT_MANAGER_TASKS_MANAGE transaction
  // On-chain task IDs from: 1c10f2a3b8c4cc29e4fd8229f45c00a3697dd59ebbedb08390dee790720c745a
  const task1: TaskData = {
    project_content: "Open Task #1",
    expiration_time: 1769027280000,
    lovelace_amount: 15000000,
    native_assets: [],
  };

  const task2: TaskData = {
    project_content: "Open Task #2",
    expiration_time: 1769027280000,
    lovelace_amount: 12500000,
    native_assets: [],
  };

  // Expected on-chain hashes
  const expectedHash1 = "c4c6affd3a575d56dc98f0e172928b5c5dd170ce13b1db4a9ae82f2d07223cb2";
  const expectedHash2 = "3cd5550254a8c2c5326c84bc9e1df0b1814d7ef22e3ddb9d58bb51013c8f7686";

  it("should compute correct hash for task 1", () => {
    const hash = computeTaskHash(task1);
    expect(hash).toBe(expectedHash1);
  });

  it("should compute correct hash for task 2", () => {
    const hash = computeTaskHash(task2);
    expect(hash).toBe(expectedHash2);
  });

  it("should verify task hashes correctly", () => {
    expect(verifyTaskHash(task1, expectedHash1)).toBe(true);
    expect(verifyTaskHash(task2, expectedHash2)).toBe(true);

    // Wrong hash should not verify
    expect(verifyTaskHash(task1, expectedHash2)).toBe(false);
    expect(verifyTaskHash(task2, expectedHash1)).toBe(false);
  });

  it("should be case-insensitive when verifying hashes", () => {
    expect(verifyTaskHash(task1, expectedHash1.toUpperCase())).toBe(true);
    expect(verifyTaskHash(task1, expectedHash1.toLowerCase())).toBe(true);
  });

  it("should handle tasks with native assets", () => {
    const taskWithAssets: TaskData = {
      project_content: "This are the requirements to achieve the task.",
      expiration_time: 1776421758000,
      lovelace_amount: 2000000,
      native_assets: [
        ["ff80aaaf03a273b8f5c558168dc0e2377eea810badbae6eceefc14ef.474f4c44", 1000000],
      ],
    };

    // Verify it produces a valid hash
    const hash = computeTaskHash(taskWithAssets);
    expect(isValidTaskHash(hash)).toBe(true);
    expect(hash.length).toBe(64);
  });

  it("should produce different hashes for different content", () => {
    const taskA: TaskData = {
      project_content: "Task A",
      expiration_time: 1769027280000,
      lovelace_amount: 15000000,
      native_assets: [],
    };

    const taskB: TaskData = {
      project_content: "Task B",
      expiration_time: 1769027280000,
      lovelace_amount: 15000000,
      native_assets: [],
    };

    const hashA = computeTaskHash(taskA);
    const hashB = computeTaskHash(taskB);

    expect(hashA).not.toBe(hashB);
  });

  it("should produce different hashes for different amounts", () => {
    const taskA: TaskData = {
      project_content: "Same Task",
      expiration_time: 1769027280000,
      lovelace_amount: 10000000,
      native_assets: [],
    };

    const taskB: TaskData = {
      project_content: "Same Task",
      expiration_time: 1769027280000,
      lovelace_amount: 20000000,
      native_assets: [],
    };

    const hashA = computeTaskHash(taskA);
    const hashB = computeTaskHash(taskB);

    expect(hashA).not.toBe(hashB);
  });
});

describe("isValidTaskHash", () => {
  it("should validate correct hash format", () => {
    expect(isValidTaskHash("c4c6affd3a575d56dc98f0e172928b5c5dd170ce13b1db4a9ae82f2d07223cb2")).toBe(true);
    expect(isValidTaskHash("3cd5550254a8c2c5326c84bc9e1df0b1814d7ef22e3ddb9d58bb51013c8f7686")).toBe(true);
  });

  it("should reject invalid hash formats", () => {
    // Too short
    expect(isValidTaskHash("c4c6affd3a575d56dc98f0e172928b5c")).toBe(false);

    // Too long
    expect(isValidTaskHash("c4c6affd3a575d56dc98f0e172928b5c5dd170ce13b1db4a9ae82f2d07223cb2ff")).toBe(false);

    // Invalid characters
    expect(isValidTaskHash("c4c6affd3a575d56dc98f0e172928b5c5dd170ce13b1db4a9ae82f2d07223cbXX")).toBe(false);

    // Empty string
    expect(isValidTaskHash("")).toBe(false);
  });
});

describe("debugTaskCBOR", () => {
  it("should return hex-encoded CBOR data", () => {
    const task: TaskData = {
      project_content: "Test",
      expiration_time: 1000,
      lovelace_amount: 100,
      native_assets: [],
    };

    const cbor = debugTaskCBOR(task);

    // Should be a valid hex string
    expect(/^[0-9a-f]+$/i.test(cbor)).toBe(true);

    // Should start with Constr 0 tag (d879) and indefinite array (9f)
    expect(cbor.startsWith("d8799f")).toBe(true);

    // Should end with break byte (ff)
    expect(cbor.endsWith("ff")).toBe(true);
  });
});
