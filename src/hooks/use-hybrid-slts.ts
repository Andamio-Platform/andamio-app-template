/**
 * Hybrid SLT Hooks
 *
 * Provides unified view of SLTs from both database and on-chain sources.
 * Supports bidirectional workflow:
 * - DB → On-chain: Create SLTs in DB, then mint on-chain
 * - On-chain → DB: Discover on-chain SLTs and import to DB
 *
 * @example
 * ```tsx
 * function ModuleSLTs({ courseId, moduleCode }) {
 *   const { hybridSlts, isLoading, onChainModule } = useHybridSlts(courseId, moduleCode);
 *
 *   return hybridSlts.map(slt => (
 *     <SLTRow
 *       key={slt.id}
 *       slt={slt}
 *       isOnChain={slt.onChain}
 *       isInDb={slt.inDb}
 *     />
 *   ));
 * }
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useCourse } from "./use-andamioscan";
import { env } from "~/env";
import {
  type AndamioscanModule,
  type AndamioscanCourse,
} from "~/lib/andamioscan";
import { type SLTListResponse } from "@andamio/db-api-types";

// =============================================================================
// Types
// =============================================================================

/**
 * Hybrid SLT combining DB and on-chain data
 */
export interface HybridSLT {
  /** Unique identifier - DB id if in DB, generated if on-chain only */
  id: string;
  /** SLT index within the module */
  moduleIndex: number;
  /** SLT text content */
  text: string;
  /** Whether this SLT exists in the database */
  inDb: boolean;
  /** Whether this SLT exists on-chain */
  onChain: boolean;
  /** DB SLT ID (if exists in DB) */
  dbId?: string;
}

/**
 * Hybrid module combining DB and on-chain data
 */
export interface HybridModule {
  /** Module code from DB (or generated from on-chain) */
  moduleCode: string;
  /** Module title from DB */
  title?: string;
  /** Module hash (assignment_id) from on-chain */
  onChainHash?: string;
  /** Whether module exists in DB */
  inDb: boolean;
  /** Whether module exists on-chain */
  onChain: boolean;
  /** Combined SLTs */
  slts: HybridSLT[];
  /** On-chain prerequisites (module hashes) */
  prerequisites: string[];
  /** Creator alias from on-chain */
  createdBy?: string;
}

/**
 * Result from useHybridSlts hook
 */
export interface UseHybridSltsResult {
  /** Combined SLTs from DB and on-chain */
  hybridSlts: HybridSLT[];
  /** On-chain module data if found */
  onChainModule: AndamioscanModule | null;
  /** DB SLTs */
  dbSlts: SLTListResponse;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Refresh data */
  refetch: () => void;
  /** Count of SLTs only in DB (not on-chain) */
  dbOnlyCount: number;
  /** Count of SLTs only on-chain (not in DB) */
  onChainOnlyCount: number;
  /** Count of SLTs in both DB and on-chain */
  syncedCount: number;
}

/**
 * Result from useHybridModules hook
 */
export interface UseHybridModulesResult {
  /** Combined modules from DB and on-chain */
  hybridModules: HybridModule[];
  /** On-chain course data */
  onChainCourse: AndamioscanCourse | null;
  /** Loading states */
  isLoading: boolean;
  isLoadingDb: boolean;
  isLoadingOnChain: boolean;
  /** Error state */
  error: Error | null;
  /** Refresh data */
  refetch: () => void;
  /** Summary stats */
  stats: {
    totalModules: number;
    onChainModules: number;
    dbOnlyModules: number;
    onChainOnlyModules: number;
  };
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to get hybrid SLTs for a specific module
 *
 * Combines SLTs from:
 * - Database: POST /slts/list
 * - On-chain: useCourse hook (Andamioscan)
 *
 * Matches SLTs by comparing text content since on-chain SLTs are indexed
 * by position in the array.
 */
export function useHybridSlts(
  courseNftPolicyId: string | undefined,
  moduleCode: string | undefined,
  moduleHash?: string // Optional: If known, use to find on-chain module
): UseHybridSltsResult {
  const [dbSlts, setDbSlts] = useState<SLTListResponse>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [dbError, setDbError] = useState<Error | null>(null);

  // Fetch on-chain course data
  const {
    data: onChainCourse,
    isLoading: isLoadingOnChain,
    error: onChainError,
    refetch: refetchOnChain,
  } = useCourse(courseNftPolicyId);

  // Fetch DB SLTs
  const fetchDbSlts = useCallback(async () => {
    if (!courseNftPolicyId || !moduleCode) {
      setDbSlts([]);
      return;
    }

    setIsLoadingDb(true);
    setDbError(null);

    try {
      // Go API: GET /course/user/slts/list/{policy_id}/{module_code}
      const response = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/user/slts/list/${courseNftPolicyId}/${moduleCode}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch SLTs: ${response.statusText}`);
      }

      const data = (await response.json()) as SLTListResponse;
      setDbSlts(data ?? []);
    } catch (err) {
      console.error("Error fetching DB SLTs:", err);
      setDbError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoadingDb(false);
    }
  }, [courseNftPolicyId, moduleCode]);

  useEffect(() => {
    void fetchDbSlts();
  }, [fetchDbSlts]);

  // Find on-chain module by hash or by matching SLT content
  const onChainModule = useMemo(() => {
    if (!onChainCourse) return null;

    // If moduleHash is provided, use it directly
    if (moduleHash) {
      return (
        onChainCourse.modules.find((m) => m.assignment_id === moduleHash) ?? null
      );
    }

    // Otherwise, try to match by SLT content
    // This is a heuristic - we look for a module whose SLTs match the DB SLTs
    if (dbSlts.length === 0) return null;

    const dbSltTexts = new Set(dbSlts.map((s) => s.slt_text));

    for (const mod of onChainCourse.modules) {
      const onChainTexts = new Set(mod.slts);
      // Check if there's significant overlap
      const intersection = [...dbSltTexts].filter((t) => onChainTexts.has(t));
      if (intersection.length > 0 && intersection.length >= mod.slts.length * 0.5) {
        return mod;
      }
    }

    return null;
  }, [onChainCourse, moduleHash, dbSlts]);

  // Combine SLTs from both sources
  const hybridSlts = useMemo<HybridSLT[]>(() => {
    const sltMap = new Map<string, HybridSLT>();

    // Add DB SLTs
    for (const dbSlt of dbSlts) {
      const key = dbSlt.slt_text;
      const dbId = `db-${dbSlt.module_index}`;
      sltMap.set(key, {
        id: dbId,
        moduleIndex: dbSlt.module_index,
        text: dbSlt.slt_text,
        inDb: true,
        onChain: false,
        dbId: dbId,
      });
    }

    // Merge/add on-chain SLTs
    if (onChainModule) {
      onChainModule.slts.forEach((sltText, index) => {
        const key = sltText;
        const existing = sltMap.get(key);

        if (existing) {
          // SLT exists in both - mark as on-chain
          existing.onChain = true;
        } else {
          // On-chain only SLT
          sltMap.set(key, {
            id: `onchain-${index}`,
            moduleIndex: index + 1, // On-chain is 0-indexed, DB is 1-indexed
            text: sltText,
            inDb: false,
            onChain: true,
          });
        }
      });
    }

    // Sort by module index
    return Array.from(sltMap.values()).sort(
      (a, b) => a.moduleIndex - b.moduleIndex
    );
  }, [dbSlts, onChainModule]);

  // Calculate counts
  const counts = useMemo(() => {
    let dbOnly = 0;
    let onChainOnly = 0;
    let synced = 0;

    for (const slt of hybridSlts) {
      if (slt.inDb && slt.onChain) synced++;
      else if (slt.inDb && !slt.onChain) dbOnly++;
      else if (!slt.inDb && slt.onChain) onChainOnly++;
    }

    return { dbOnly, onChainOnly, synced };
  }, [hybridSlts]);

  const refetch = useCallback(() => {
    void fetchDbSlts();
    void refetchOnChain();
  }, [fetchDbSlts, refetchOnChain]);

  return {
    hybridSlts,
    onChainModule,
    dbSlts,
    isLoading: isLoadingDb || isLoadingOnChain,
    error: dbError ?? onChainError,
    refetch,
    dbOnlyCount: counts.dbOnly,
    onChainOnlyCount: counts.onChainOnly,
    syncedCount: counts.synced,
  };
}

/**
 * Hook to get hybrid modules for a course
 *
 * Combines modules from:
 * - Database: POST /course-modules/list
 * - On-chain: useCourse hook (Andamioscan)
 */
export function useHybridModules(
  courseNftPolicyId: string | undefined
): UseHybridModulesResult {
  const [dbModules, setDbModules] = useState<
    Array<{ module_code: string; title: string | null; slts: Array<{ slt_text: string }> }>
  >([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [dbError, setDbError] = useState<Error | null>(null);

  // Fetch on-chain course data
  const {
    data: onChainCourse,
    isLoading: isLoadingOnChain,
    error: onChainError,
    refetch: refetchOnChain,
  } = useCourse(courseNftPolicyId);

  // Fetch DB modules
  const fetchDbModules = useCallback(async () => {
    if (!courseNftPolicyId) {
      setDbModules([]);
      return;
    }

    setIsLoadingDb(true);
    setDbError(null);

    try {
      // Go API: GET /course/user/course-modules/list/{policy_id}
      const response = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/user/course-modules/list/${courseNftPolicyId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.statusText}`);
      }

      const data = (await response.json()) as Array<{
        module_code: string;
        title: string | null;
        slts: Array<{ slt_text: string }>;
      }>;
      setDbModules(data ?? []);
    } catch (err) {
      console.error("Error fetching DB modules:", err);
      setDbError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoadingDb(false);
    }
  }, [courseNftPolicyId]);

  useEffect(() => {
    void fetchDbModules();
  }, [fetchDbModules]);

  // Combine modules from both sources
  const hybridModules = useMemo<HybridModule[]>(() => {
    const moduleMap = new Map<string, HybridModule>();

    // Add DB modules (keyed by module_code)
    for (const dbMod of dbModules) {
      const key = dbMod.module_code;
      moduleMap.set(key, {
        moduleCode: dbMod.module_code,
        title: dbMod.title ?? undefined,
        inDb: true,
        onChain: false,
        slts: dbMod.slts.map((s, i) => ({
          id: `db-${i}`,
          moduleIndex: i + 1,
          text: s.slt_text,
          inDb: true,
          onChain: false,
        })),
        prerequisites: [],
      });
    }

    // Match on-chain modules to DB modules by SLT content overlap
    if (onChainCourse) {
      for (const onChainMod of onChainCourse.modules) {
        const onChainSltTexts = new Set(onChainMod.slts);

        // Try to find matching DB module
        let matchedKey: string | null = null;
        let bestOverlap = 0;

        for (const [key, dbMod] of moduleMap) {
          const dbSltTexts = new Set(dbMod.slts.map((s) => s.text));
          const overlap = [...dbSltTexts].filter((t) => onChainSltTexts.has(t)).length;

          if (overlap > bestOverlap && overlap >= onChainMod.slts.length * 0.5) {
            bestOverlap = overlap;
            matchedKey = key;
          }
        }

        if (matchedKey) {
          // Update existing DB module with on-chain data
          const existing = moduleMap.get(matchedKey)!;
          existing.onChain = true;
          existing.onChainHash = onChainMod.assignment_id;
          existing.prerequisites = onChainMod.prerequisites;
          existing.createdBy = onChainMod.created_by;

          // Update SLTs to mark on-chain status
          for (const slt of existing.slts) {
            if (onChainSltTexts.has(slt.text)) {
              slt.onChain = true;
            }
          }

          // Add any on-chain-only SLTs
          onChainMod.slts.forEach((sltText, index) => {
            if (!existing.slts.some((s) => s.text === sltText)) {
              existing.slts.push({
                id: `onchain-${index}`,
                moduleIndex: existing.slts.length + 1,
                text: sltText,
                inDb: false,
                onChain: true,
              });
            }
          });
        } else {
          // On-chain only module (no DB match)
          const generatedKey = `onchain-${onChainMod.assignment_id.slice(0, 8)}`;
          moduleMap.set(generatedKey, {
            moduleCode: generatedKey,
            onChainHash: onChainMod.assignment_id,
            inDb: false,
            onChain: true,
            slts: onChainMod.slts.map((text, i) => ({
              id: `onchain-${i}`,
              moduleIndex: i + 1,
              text,
              inDb: false,
              onChain: true,
            })),
            prerequisites: onChainMod.prerequisites,
            createdBy: onChainMod.created_by,
          });
        }
      }
    }

    return Array.from(moduleMap.values()).sort((a, b) =>
      a.moduleCode.localeCompare(b.moduleCode)
    );
  }, [dbModules, onChainCourse]);

  // Calculate stats
  const stats = useMemo(() => {
    let onChain = 0;
    let dbOnly = 0;
    let onChainOnly = 0;

    for (const mod of hybridModules) {
      if (mod.inDb && mod.onChain) onChain++;
      else if (mod.inDb && !mod.onChain) dbOnly++;
      else if (!mod.inDb && mod.onChain) onChainOnly++;
    }

    return {
      totalModules: hybridModules.length,
      onChainModules: onChain,
      dbOnlyModules: dbOnly,
      onChainOnlyModules: onChainOnly,
    };
  }, [hybridModules]);

  const refetch = useCallback(() => {
    void fetchDbModules();
    void refetchOnChain();
  }, [fetchDbModules, refetchOnChain]);

  return {
    hybridModules,
    onChainCourse,
    isLoading: isLoadingDb || isLoadingOnChain,
    isLoadingDb,
    isLoadingOnChain,
    error: dbError ?? onChainError,
    refetch,
    stats,
  };
}
