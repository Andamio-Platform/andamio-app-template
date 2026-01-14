/**
 * Tests for side effect execution utilities
 */

import { describe, it, expect, vi } from "vitest";
import {
  executeSideEffect,
  executeOnSubmit,
  shouldExecuteSideEffect,
  getExecutableSideEffects,
} from "../index";
import { createMockSubmissionContext } from "../../testing";
import type { SideEffect } from "../../types";

describe("Side Effect Execution", () => {
  const mockContext = createMockSubmissionContext({
    buildInputs: {
      policy: "policy123",
      moduleCode: "MODULE_1",
    },
    txHash: "tx_hash_abc",
  });

  const mockOptions = {
    apiBaseUrl: "http://localhost:4000/api/v0",
    authToken: "mock_token_123",
  };

  describe("executeSideEffect", () => {
    it("should skip 'Not implemented' endpoints", async () => {
      const sideEffect: SideEffect = {
        def: "Not Yet Implemented",
        method: "POST",
        endpoint: "Not implemented",
      };

      const result = await executeSideEffect(
        sideEffect,
        mockContext,
        mockOptions
      );

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
      expect(result.response).toBeUndefined();
    });

    it("should execute valid side effect successfully", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: "test" }),
      });

      const sideEffect: SideEffect = {
        def: "Update Status",
        method: "PATCH",
        endpoint: "/course-modules/{courseNftPolicyId}/{moduleCode}/status",
        pathParams: {
          courseNftPolicyId: "buildInputs.policy",
          moduleCode: "buildInputs.moduleCode",
        },
        body: {
          status: { source: "literal", value: "PENDING_TX" },
          pendingTxHash: { source: "context", path: "txHash" },
        },
      };

      const result = await executeSideEffect(sideEffect, mockContext, {
        ...mockOptions,
        fetchImpl: mockFetch,
      });

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(false);
      expect(result.response).toEqual({ success: true, data: "test" });

      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:4000/api/v0/course-modules/policy123/MODULE_1/status",
        expect.objectContaining({
          method: "PATCH",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer mock_token_123",
          }),
          body: JSON.stringify({
            status: "PENDING_TX",
            pendingTxHash: "tx_hash_abc",
          }),
        })
      );
    });

    it("should handle API errors gracefully", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => "Not found",
      });

      const sideEffect: SideEffect = {
        def: "Update Status",
        method: "PATCH",
        endpoint: "/course-modules/{courseNftPolicyId}/{moduleCode}/status",
        pathParams: {
          courseNftPolicyId: "buildInputs.policy",
          moduleCode: "buildInputs.moduleCode",
        },
      };

      const result = await executeSideEffect(sideEffect, mockContext, {
        ...mockOptions,
        fetchImpl: mockFetch,
      });

      expect(result.success).toBe(false);
      expect(result.skipped).toBe(false);
      expect(result.error).toContain("404");
      expect(result.error).toContain("Not found");
    });

    it("should handle network errors", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new Error("Network error"));

      const sideEffect: SideEffect = {
        def: "Update Status",
        method: "PATCH",
        endpoint: "/course-modules/{courseNftPolicyId}/{moduleCode}/status",
        pathParams: {
          courseNftPolicyId: "buildInputs.policy",
          moduleCode: "buildInputs.moduleCode",
        },
      };

      const result = await executeSideEffect(sideEffect, mockContext, {
        ...mockOptions,
        fetchImpl: mockFetch,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    });

    it("should handle path parameter resolution errors", async () => {
      const sideEffect: SideEffect = {
        def: "Update Status",
        method: "PATCH",
        endpoint: "/course-modules/{courseNftPolicyId}/{moduleCode}/status",
        pathParams: {
          courseNftPolicyId: "buildInputs.nonExistentField",
          moduleCode: "buildInputs.moduleCode",
        },
      };

      const result = await executeSideEffect(
        sideEffect,
        mockContext,
        mockOptions
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("could not be resolved");
    });
  });

  describe("executeOnSubmit", () => {
    it("should handle undefined onSubmit", async () => {
      const result = await executeOnSubmit(undefined, mockContext, mockOptions);

      expect(result.success).toBe(true);
      expect(result.results).toEqual([]);
      expect(result.criticalErrors).toEqual([]);
    });

    it("should handle empty onSubmit array", async () => {
      const result = await executeOnSubmit([], mockContext, mockOptions);

      expect(result.success).toBe(true);
      expect(result.results).toEqual([]);
      expect(result.criticalErrors).toEqual([]);
    });

    it("should execute all side effects sequentially", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const onSubmit: SideEffect[] = [
        {
          def: "Side Effect 1",
          method: "POST",
          endpoint: "/test1",
        },
        {
          def: "Side Effect 2",
          method: "POST",
          endpoint: "Not implemented",
        },
        {
          def: "Side Effect 3",
          method: "POST",
          endpoint: "/test3",
        },
      ];

      const result = await executeOnSubmit(onSubmit, mockContext, {
        ...mockOptions,
        fetchImpl: mockFetch,
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].skipped).toBe(true);
      expect(result.results[2].success).toBe(true);

      // Should only call fetch for non-skipped side effects
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should track critical errors", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Server error",
      });

      const onSubmit: SideEffect[] = [
        {
          def: "Non-Critical Side Effect",
          method: "POST",
          endpoint: "/test1",
          critical: false,
        },
        {
          def: "Critical Side Effect",
          method: "POST",
          endpoint: "/test2",
          critical: true,
        },
      ];

      const result = await executeOnSubmit(onSubmit, mockContext, {
        ...mockOptions,
        fetchImpl: mockFetch,
      });

      expect(result.success).toBe(false);
      expect(result.criticalErrors).toHaveLength(1);
      expect(result.criticalErrors[0]).toContain("Critical Side Effect");
      expect(result.results[0].success).toBe(false);
      expect(result.results[1].success).toBe(false);
    });

    it("should throw on critical failure if requested", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Server error",
      });

      const onSubmit: SideEffect[] = [
        {
          def: "Critical Side Effect",
          method: "POST",
          endpoint: "/test",
          critical: true,
        },
      ];

      await expect(
        executeOnSubmit(onSubmit, mockContext, {
          ...mockOptions,
          fetchImpl: mockFetch,
          throwOnCriticalFailure: true,
        })
      ).rejects.toThrow("Critical side effect failed");
    });

    it("should continue after non-critical failures", async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: callCount !== 1, // First call fails
          status: callCount === 1 ? 500 : 200,
          json: async () => ({ success: true }),
          text: async () => "Error",
        });
      });

      const onSubmit: SideEffect[] = [
        {
          def: "Non-Critical Side Effect 1",
          method: "POST",
          endpoint: "/test1",
          critical: false,
        },
        {
          def: "Non-Critical Side Effect 2",
          method: "POST",
          endpoint: "/test2",
          critical: false,
        },
      ];

      const result = await executeOnSubmit(onSubmit, mockContext, {
        ...mockOptions,
        fetchImpl: mockFetch,
      });

      expect(result.success).toBe(true); // No critical failures
      expect(result.results[0].success).toBe(false);
      expect(result.results[1].success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("shouldExecuteSideEffect", () => {
    it("should return false for 'Not implemented' endpoints", () => {
      const sideEffect: SideEffect = {
        def: "Test",
        method: "POST",
        endpoint: "Not implemented",
      };

      expect(shouldExecuteSideEffect(sideEffect)).toBe(false);
    });

    it("should return true for valid endpoints", () => {
      const sideEffect: SideEffect = {
        def: "Test",
        method: "POST",
        endpoint: "/test",
      };

      expect(shouldExecuteSideEffect(sideEffect)).toBe(true);
    });
  });

  describe("getExecutableSideEffects", () => {
    it("should return empty array for undefined", () => {
      expect(getExecutableSideEffects(undefined)).toEqual([]);
    });

    it("should filter out 'Not implemented' endpoints", () => {
      const sideEffects: SideEffect[] = [
        {
          def: "Valid 1",
          method: "POST",
          endpoint: "/test1",
        },
        {
          def: "Not Implemented",
          method: "POST",
          endpoint: "Not implemented",
        },
        {
          def: "Valid 2",
          method: "POST",
          endpoint: "/test2",
        },
      ];

      const executable = getExecutableSideEffects(sideEffects);

      expect(executable).toHaveLength(2);
      expect(executable[0].def).toBe("Valid 1");
      expect(executable[1].def).toBe("Valid 2");
    });
  });
});
