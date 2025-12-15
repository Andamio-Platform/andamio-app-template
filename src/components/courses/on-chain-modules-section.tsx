"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCourse } from "~/hooks/use-andamioscan";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioBadge,
  AndamioButton,
  AndamioSkeleton,
  AndamioAlert,
  AndamioAlertDescription,
  AndamioInput,
  AndamioLabel,
  AndamioDrawer,
  AndamioDrawerClose,
  AndamioDrawerContent,
  AndamioDrawerDescription,
  AndamioDrawerFooter,
  AndamioDrawerHeader,
  AndamioDrawerTitle,
  AndamioDrawerTrigger,
  AndamioTooltip,
  AndamioTooltipContent,
  AndamioTooltipTrigger,
  AndamioCheckbox,
} from "~/components/andamio";
import {
  Blocks,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Loader2,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { type ListCourseModulesOutput } from "@andamio/db-api";

// =============================================================================
// Types
// =============================================================================

interface OnChainModulesSectionProps {
  courseNftPolicyId: string;
}

interface HybridModuleStatus {
  /** On-chain module hash (assignment_id) */
  onChainHash: string;
  /** Module code if assigned in DB */
  moduleCode: string | null;
  /** Module title if in DB */
  title: string | null;
  /** SLTs from on-chain */
  slts: string[];
  /** Creator alias */
  createdBy: string;
  /** Prerequisites (module hashes) */
  prerequisites: string[];
  /** Whether module exists in DB */
  inDb: boolean;
  /** Whether module exists on-chain */
  onChain: boolean;
}

// =============================================================================
// Components
// =============================================================================

/**
 * Drawer for importing an on-chain module (assigning a module code)
 */
function ImportModuleDrawer({
  courseNftPolicyId,
  module,
  onSuccess,
}: {
  courseNftPolicyId: string;
  module: HybridModuleStatus;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const { authenticatedFetch, isAuthenticated } = useAndamioAuth();
  const [open, setOpen] = useState(false);
  const [moduleCode, setModuleCode] = useState("");
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [navigateAfterImport, setNavigateAfterImport] = useState(true);

  const handleImport = async () => {
    if (!isAuthenticated || !moduleCode.trim() || !title.trim()) {
      toast.error("Module code and title are required");
      return;
    }

    setIsSubmitting(true);
    const trimmedModuleCode = moduleCode.trim();
    const trimmedTitle = title.trim();

    try {
      // Step 1: Create the course module in the database
      const createModuleResponse = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-module/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: trimmedModuleCode,
            title: trimmedTitle,
          }),
        }
      );

      if (!createModuleResponse.ok) {
        const errorData = (await createModuleResponse.json()) as { message?: string };
        throw new Error(errorData.message ?? "Failed to create module");
      }

      // Step 2: Create SLTs for each on-chain SLT
      for (let i = 0; i < module.slts.length; i++) {
        const sltText = module.slts[i];
        const createSltResponse = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slt/create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              course_nft_policy_id: courseNftPolicyId,
              module_code: trimmedModuleCode,
              module_index: i + 1, // 1-indexed
              slt_text: sltText,
            }),
          }
        );

        if (!createSltResponse.ok) {
          console.error(`Failed to create SLT ${i + 1}:`, await createSltResponse.text());
          // Continue with other SLTs even if one fails
        }
      }

      setOpen(false);
      setModuleCode("");
      setTitle("");
      onSuccess();

      // Navigate to the new module or show success toast
      if (navigateAfterImport) {
        toast.success("Module Imported!", {
          description: `Navigating to "${trimmedTitle}"...`,
        });
        router.push(`/studio/course/${courseNftPolicyId}/${trimmedModuleCode}`);
      } else {
        toast.success("Module Imported!", {
          description: `"${trimmedTitle}" has been created with ${module.slts.length} learning targets.`,
          action: {
            label: "View Module",
            onClick: () => router.push(`/studio/course/${courseNftPolicyId}/${trimmedModuleCode}`),
          },
        });
      }
    } catch (err) {
      console.error("Error importing module:", err);
      toast.error("Import Failed", {
        description: err instanceof Error ? err.message : "Failed to import module",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const truncatedHash = `${module.onChainHash.slice(0, 12)}...${module.onChainHash.slice(-12)}`;

  return (
    <AndamioDrawer open={open} onOpenChange={setOpen}>
      <AndamioDrawerTrigger asChild>
        <AndamioButton variant="default" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Import Module
        </AndamioButton>
      </AndamioDrawerTrigger>
      <AndamioDrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <AndamioDrawerHeader className="text-left">
            <AndamioDrawerTitle>Import On-Chain Module</AndamioDrawerTitle>
            <AndamioDrawerDescription>
              This module exists on the blockchain but needs to be registered in
              your course studio. Assign a module code to manage it.
            </AndamioDrawerDescription>
          </AndamioDrawerHeader>

          <div className="space-y-4 px-4">
            {/* On-chain info */}
            <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Module Hash</p>
                <code className="text-xs font-mono">{truncatedHash}</code>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Created By</p>
                <span className="text-sm">{module.createdBy}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Learning Targets</p>
                <AndamioBadge variant="secondary">{module.slts.length}</AndamioBadge>
              </div>
            </div>

            {/* SLTs Preview */}
            <div className="rounded-lg border p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                On-Chain Learning Targets
              </p>
              <ul className="space-y-1.5">
                {module.slts.map((slt, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-xs text-success">
                      {index + 1}
                    </span>
                    <span>{slt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Module Code Input */}
            <div className="space-y-2">
              <AndamioLabel htmlFor="import-module-code">Module Code *</AndamioLabel>
              <AndamioInput
                id="import-module-code"
                placeholder="e.g., module-101"
                value={moduleCode}
                onChange={(e) => setModuleCode(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                A unique identifier for ordering modules. Use lowercase with hyphens.
              </p>
            </div>

            {/* Title Input */}
            <div className="space-y-2">
              <AndamioLabel htmlFor="import-module-title">Module Title *</AndamioLabel>
              <AndamioInput
                id="import-module-title"
                placeholder="e.g., Getting Started with Andamio"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Navigate after import option */}
            <div className="flex items-center space-x-2">
              <AndamioCheckbox
                id="navigate-after-import"
                checked={navigateAfterImport}
                onCheckedChange={(checked) => setNavigateAfterImport(checked === true)}
                disabled={isSubmitting}
              />
              <label
                htmlFor="navigate-after-import"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Open module after import
              </label>
            </div>
          </div>

          <AndamioDrawerFooter className="flex-row gap-3 pt-6">
            <AndamioDrawerClose asChild>
              <AndamioButton variant="outline" className="flex-1" disabled={isSubmitting}>
                Cancel
              </AndamioButton>
            </AndamioDrawerClose>
            <AndamioButton
              className="flex-1"
              onClick={handleImport}
              disabled={!moduleCode.trim() || !title.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Import Module
                </>
              )}
            </AndamioButton>
          </AndamioDrawerFooter>
        </div>
      </AndamioDrawerContent>
    </AndamioDrawer>
  );
}

/**
 * Row component for a module
 */
function ModuleRow({
  courseNftPolicyId,
  module,
  onRefresh,
}: {
  courseNftPolicyId: string;
  module: HybridModuleStatus;
  onRefresh: () => void;
}) {
  const truncatedHash = `${module.onChainHash.slice(0, 8)}...${module.onChainHash.slice(-8)}`;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Status Icon */}
          {module.inDb ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/10">
              <AlertCircle className="h-4 w-4 text-warning" />
            </div>
          )}

          {/* Module Info */}
          <div>
            {module.inDb ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{module.title}</span>
                  <AndamioBadge variant="outline" className="font-mono text-xs">
                    {module.moduleCode}
                  </AndamioBadge>
                </div>
                <span className="text-xs text-success">Registered in studio</span>
              </>
            ) : (
              <>
                <span className="font-medium text-muted-foreground italic">
                  Unregistered Module
                </span>
                <div className="text-xs text-warning">
                  Needs module code assignment
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {module.inDb ? (
            <Link href={`/studio/course/${courseNftPolicyId}/${module.moduleCode}`}>
              <AndamioButton variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Manage
              </AndamioButton>
            </Link>
          ) : (
            <ImportModuleDrawer
              courseNftPolicyId={courseNftPolicyId}
              module={module}
              onSuccess={onRefresh}
            />
          )}
        </div>
      </div>

      {/* On-chain Info */}
      <div className="rounded-lg bg-muted/30 p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">On-chain Hash</span>
          <code className="font-mono">{truncatedHash}</code>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Created By</span>
          <span>{module.createdBy}</span>
        </div>
      </div>

      {/* SLTs */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Learning Targets ({module.slts.length})
        </p>
        <ul className="space-y-1">
          {module.slts.map((slt, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                module.inDb
                  ? "bg-success/10 text-success"
                  : "bg-warning/10 text-warning"
              }`}>
                {index + 1}
              </span>
              <span className={!module.inDb ? "text-muted-foreground" : ""}>
                {slt}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Section showing on-chain modules with their DB registration status
 *
 * Teachers can:
 * - See all on-chain modules for their course
 * - Import unregistered modules by assigning a module code
 * - Navigate to manage registered modules
 */
export function OnChainModulesSection({ courseNftPolicyId }: OnChainModulesSectionProps) {
  const { isAuthenticated } = useAndamioAuth();

  // Fetch on-chain course data
  const {
    data: onChainCourse,
    isLoading: isLoadingOnChain,
    error: onChainError,
    refetch: refetchOnChain,
  } = useCourse(courseNftPolicyId);

  // Fetch DB modules
  const [dbModules, setDbModules] = useState<ListCourseModulesOutput>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  const fetchDbModules = useCallback(async () => {
    setIsLoadingDb(true);
    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-module/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
        }
      );
      if (response.ok) {
        const data = (await response.json()) as ListCourseModulesOutput;
        setDbModules(data ?? []);
      }
    } catch (err) {
      console.error("Error fetching DB modules:", err);
    } finally {
      setIsLoadingDb(false);
    }
  }, [courseNftPolicyId]);

  useEffect(() => {
    void fetchDbModules();
  }, [fetchDbModules]);

  // Combine on-chain and DB data
  const hybridModules = useMemo<HybridModuleStatus[]>(() => {
    if (!onChainCourse) return [];

    return onChainCourse.modules.map((onChainMod) => {
      // Try to find matching DB module by SLT content overlap
      const onChainSltTexts = new Set(onChainMod.slts);
      let matchedDbModule: ListCourseModulesOutput[number] | null = null;

      for (const dbMod of dbModules) {
        const dbSltTexts = new Set(dbMod.slts.map((s) => s.slt_text));
        const overlap = [...dbSltTexts].filter((t) => onChainSltTexts.has(t)).length;

        if (overlap > 0 && overlap >= onChainMod.slts.length * 0.5) {
          matchedDbModule = dbMod;
          break;
        }
      }

      return {
        onChainHash: onChainMod.assignment_id,
        moduleCode: matchedDbModule?.module_code ?? null,
        title: matchedDbModule?.title ?? null,
        slts: onChainMod.slts,
        createdBy: onChainMod.created_by,
        prerequisites: onChainMod.prerequisites,
        inDb: matchedDbModule !== null,
        onChain: true,
      };
    });
  }, [onChainCourse, dbModules]);

  // Stats
  const registeredCount = hybridModules.filter((m) => m.inDb).length;
  const unregisteredCount = hybridModules.filter((m) => !m.inDb).length;

  const handleRefresh = () => {
    void fetchDbModules();
    void refetchOnChain();
  };

  if (!isAuthenticated) {
    return null;
  }

  const isLoading = isLoadingOnChain || isLoadingDb;

  return (
    <AndamioCard>
      <AndamioCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Blocks className="h-5 w-5 text-primary" />
            </div>
            <div>
              <AndamioCardTitle>On-Chain Modules</AndamioCardTitle>
              <AndamioCardDescription>
                Modules minted on the blockchain
              </AndamioCardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isLoading && hybridModules.length > 0 && (
              <div className="flex gap-2">
                {registeredCount > 0 && (
                  <AndamioBadge variant="default" className="bg-success text-success-foreground">
                    {registeredCount} registered
                  </AndamioBadge>
                )}
                {unregisteredCount > 0 && (
                  <AndamioTooltip>
                    <AndamioTooltipTrigger asChild>
                      <AndamioBadge variant="outline" className="text-warning border-warning">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {unregisteredCount} unregistered
                      </AndamioBadge>
                    </AndamioTooltipTrigger>
                    <AndamioTooltipContent>
                      <p>On-chain modules needing module code assignment</p>
                    </AndamioTooltipContent>
                  </AndamioTooltip>
                )}
              </div>
            )}
            <AndamioButton
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </AndamioButton>
          </div>
        </div>
      </AndamioCardHeader>

      <AndamioCardContent>
        {/* Loading state */}
        {isLoading && hybridModules.length === 0 && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <AndamioSkeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        )}

        {/* Error state */}
        {onChainError && hybridModules.length === 0 && (
          <AndamioAlert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AndamioAlertDescription>
              Failed to fetch on-chain data: {onChainError.message}
            </AndamioAlertDescription>
          </AndamioAlert>
        )}

        {/* Empty state */}
        {!isLoading && hybridModules.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Blocks className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              No modules minted on-chain yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Mint module tokens to see them here.
            </p>
          </div>
        )}

        {/* Module list */}
        {hybridModules.length > 0 && (
          <div className="space-y-4">
            {hybridModules.map((module) => (
              <ModuleRow
                key={module.onChainHash}
                courseNftPolicyId={courseNftPolicyId}
                module={module}
                onRefresh={handleRefresh}
              />
            ))}
          </div>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
