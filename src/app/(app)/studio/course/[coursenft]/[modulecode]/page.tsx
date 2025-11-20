"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioTextarea } from "~/components/andamio/andamio-textarea";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import {
  AndamioSelect,
  AndamioSelectContent,
  AndamioSelectItem,
  AndamioSelectTrigger,
  AndamioSelectValue,
} from "~/components/andamio/andamio-select";
import { AlertCircle, ArrowLeft, Edit2, Save, Trash2, Upload } from "lucide-react";
import { AndamioConfirmDialog } from "~/components/andamio/andamio-confirm-dialog";
import {
  AndamioDialog,
  AndamioDialogContent,
  AndamioDialogDescription,
  AndamioDialogFooter,
  AndamioDialogHeader,
  AndamioDialogTitle,
  AndamioDialogTrigger,
} from "~/components/andamio/andamio-dialog";
import {
  type CourseModuleOutput,
  type ListCourseModulesOutput,
  type UpdateCourseModuleInput,
  type UpdateModuleStatusInput,
  updateCourseModuleInputSchema,
  updateModuleStatusInputSchema,
} from "@andamio-platform/db-api";
import { MintModuleTokens } from "~/components/transactions";

/**
 * Studio page for editing course module details and status
 *
 * API Endpoints:
 * - PATCH /course-modules/{courseNftPolicyId}/{moduleCode} (protected)
 * - PATCH /course-modules/{courseNftPolicyId}/{moduleCode}/status (protected)
 * - PATCH /course-modules/{courseNftPolicyId}/{moduleCode}/code (protected) - Rename module code
 * - PATCH /course-modules/{courseNftPolicyId}/{moduleCode}/pending-tx (protected) - Set pending transaction
 * - POST /course-modules/{courseNftPolicyId}/{moduleCode}/publish (protected) - Publish all module content
 * Input Validation: Uses updateCourseModuleInputSchema and updateModuleStatusInputSchema
 * Type Reference: See API-TYPE-REFERENCE.md in @andamio-platform/db-api
 */

interface ApiError {
  message?: string;
}

const MODULE_STATUSES = [
  "DRAFT",
  "APPROVED",
  "PENDING_TX",
  "ON_CHAIN",
  "DEPRECATED",
  "BACKLOG",
  "ARCHIVED",
] as const;

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["APPROVED", "BACKLOG", "ARCHIVED", "PENDING_TX"],
  APPROVED: ["DRAFT", "PENDING_TX", "BACKLOG", "ARCHIVED"],
  PENDING_TX: ["ON_CHAIN"],
  ON_CHAIN: ["DEPRECATED"],
  DEPRECATED: [],
  BACKLOG: ["DRAFT", "ARCHIVED"],
  ARCHIVED: ["BACKLOG", "DRAFT"],
};

export default function ModuleEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseNftPolicyId = params.coursenft as string;
  const moduleCode = params.modulecode as string;
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  const [courseModule, setCourseModule] = useState<CourseModuleOutput | null>(null);
  const [moduleWithSlts, setModuleWithSlts] = useState<ListCourseModulesOutput>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  // Rename dialog state
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newModuleCode, setNewModuleCode] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  // Pending transaction state
  const [isPendingTxDialogOpen, setIsPendingTxDialogOpen] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState("");
  const [isSettingPendingTx, setIsSettingPendingTx] = useState(false);
  const [pendingTxError, setPendingTxError] = useState<string | null>(null);

  // Publish content state
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const fetchModule = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch single module details
        const moduleResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}`
        );

        if (!moduleResponse.ok) {
          throw new Error(`Failed to fetch module: ${moduleResponse.statusText}`);
        }

        const moduleData = (await moduleResponse.json()) as CourseModuleOutput;
        setCourseModule(moduleData);
        setTitle(moduleData.title ?? "");
        setDescription(moduleData.description ?? "");
        setStatus(moduleData.status ?? "DRAFT");

        // Fetch all modules with SLTs for transaction (only if APPROVED)
        if (moduleData.status === "APPROVED") {
          const modulesResponse = await fetch(
            `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/${courseNftPolicyId}/course-modules`
          );

          if (modulesResponse.ok) {
            const modulesData = (await modulesResponse.json()) as ListCourseModulesOutput;
            // Filter to just this module
            const thisModuleWithSlts = modulesData.filter(
              (m) => m.moduleCode === moduleCode
            );
            setModuleWithSlts(thisModuleWithSlts);
          }
        }
      } catch (err) {
        console.error("Error fetching module:", err);
        setError(err instanceof Error ? err.message : "Failed to load module");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchModule();
  }, [courseNftPolicyId, moduleCode]);

  const handleSave = async () => {
    if (!isAuthenticated) {
      setSaveError("You must be authenticated to edit modules");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Build input object for module update
      const updateInput: UpdateCourseModuleInput = {
        courseNftPolicyId,
        moduleCode,
        title,
        description,
      };

      // Validate module update input
      const updateValidation = updateCourseModuleInputSchema.safeParse(updateInput);

      if (!updateValidation.success) {
        const errors = updateValidation.error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        throw new Error(`Validation failed: ${errors}`);
      }

      // Send validated module update
      const updateResponse = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateValidation.data),
        }
      );

      if (!updateResponse.ok) {
        const errorData = (await updateResponse.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to update module");
      }

      // Update status if changed
      if (status !== courseModule?.status) {
        // Build input object for status update
        const statusInput: UpdateModuleStatusInput = {
          courseNftPolicyId,
          moduleCode,
          status: status as UpdateModuleStatusInput["status"],
        };

        // Validate status update input
        const statusValidation = updateModuleStatusInputSchema.safeParse(statusInput);

        if (!statusValidation.success) {
          const errors = statusValidation.error.errors
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join(", ");
          throw new Error(`Status validation failed: ${errors}`);
        }

        // Send validated status update
        const statusResponse = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}/status`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(statusValidation.data),
          }
        );

        if (!statusResponse.ok) {
          const errorData = (await statusResponse.json()) as ApiError;
          throw new Error(errorData.message ?? "Failed to update status");
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Refetch module
      const response = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}`
      );
      const data = (await response.json()) as CourseModuleOutput;
      setCourseModule(data);
    } catch (err) {
      console.error("Error saving module:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthenticated || !module) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to delete module");
      }

      // Redirect to course edit page
      router.push(`/studio/course/${courseNftPolicyId}`);
    } catch (err) {
      console.error("Error deleting module:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to delete module");
    } finally {
      setIsDeleting(false);
    }
  };

  const getAvailableStatuses = () => {
    if (!courseModule?.status) return MODULE_STATUSES;
    return MODULE_STATUSES.filter(
      (s) => s === courseModule.status || STATUS_TRANSITIONS[courseModule.status]?.includes(s)
    );
  };

  const handleRenameModule = async () => {
    if (!newModuleCode.trim()) {
      setRenameError("Module code cannot be empty");
      return;
    }

    if (newModuleCode === moduleCode) {
      setRenameError("New module code must be different");
      return;
    }

    setIsRenaming(true);
    setRenameError(null);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}/code`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseNftPolicyId,
            moduleCode,
            newModuleCode: newModuleCode.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to rename module");
      }

      // Redirect to the new module code URL
      router.push(`/studio/course/${courseNftPolicyId}/${newModuleCode.trim()}`);
    } catch (err) {
      console.error("Error renaming module:", err);
      setRenameError(err instanceof Error ? err.message : "Failed to rename module");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleSetPendingTx = async () => {
    if (!pendingTxHash.trim()) {
      setPendingTxError("Transaction hash cannot be empty");
      return;
    }

    setIsSettingPendingTx(true);
    setPendingTxError(null);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}/pending-tx`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseNftPolicyId,
            moduleCode,
            pendingTxHash: pendingTxHash.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to set pending transaction");
      }

      const updatedModule = (await response.json()) as CourseModuleOutput;
      setCourseModule(updatedModule);
      setIsPendingTxDialogOpen(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error setting pending transaction:", err);
      setPendingTxError(err instanceof Error ? err.message : "Failed to set pending transaction");
    } finally {
      setIsSettingPendingTx(false);
    }
  };

  const handlePublishAllContent = async () => {
    setIsPublishing(true);
    setSaveError(null);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseNftPolicyId,
            moduleCode,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to publish content");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error publishing content:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to publish content");
    } finally {
      setIsPublishing(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <AndamioSkeleton className="h-8 w-32" />
        <AndamioSkeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (error || !courseModule) {
    return (
      <div className="space-y-6">
        <Link href={`/course/${courseNftPolicyId}/${moduleCode}`}>
          <AndamioButton variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Module
          </AndamioButton>
        </Link>

        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{error ?? "Module not found"}</AndamioAlertDescription>
        </AndamioAlert>
      </div>
    );
  }

  const availableStatuses = getAvailableStatuses();
  const hasChanges =
    title !== (courseModule?.title ?? "") ||
    description !== (courseModule?.description ?? "") ||
    status !== courseModule?.status;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/course/${courseNftPolicyId}/${moduleCode}`}>
          <AndamioButton variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Module
          </AndamioButton>
        </Link>
        <AndamioBadge variant="outline" className="font-mono text-xs">
          {courseModule?.moduleCode}
        </AndamioBadge>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Edit Module</h1>
        <p className="text-muted-foreground">Update module details and status</p>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <AndamioAlert>
          <AndamioAlertTitle>Success</AndamioAlertTitle>
          <AndamioAlertDescription>Module updated successfully</AndamioAlertDescription>
        </AndamioAlert>
      )}

      {saveError && (
        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{saveError}</AndamioAlertDescription>
        </AndamioAlert>
      )}

      {/* Edit Form */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Module Details</AndamioCardTitle>
          <AndamioCardDescription>Edit the module title, description, and status</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="title">Title *</AndamioLabel>
            <AndamioInput
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Module title"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="description">Description</AndamioLabel>
            <AndamioTextarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Module description"
              rows={4}
            />
          </div>

          {/* Module Code with Rename */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="moduleCode">Module Code</AndamioLabel>
            <div className="flex gap-2">
              <AndamioInput id="moduleCode" value={courseModule?.moduleCode} disabled className="flex-1" />
              <AndamioDialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                <AndamioDialogTrigger asChild>
                  <AndamioButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewModuleCode(courseModule?.moduleCode ?? "");
                      setRenameError(null);
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Rename
                  </AndamioButton>
                </AndamioDialogTrigger>
                <AndamioDialogContent>
                  <AndamioDialogHeader>
                    <AndamioDialogTitle>Rename Module Code</AndamioDialogTitle>
                    <AndamioDialogDescription>
                      Enter a new code for this module. This will update the module identifier.
                    </AndamioDialogDescription>
                  </AndamioDialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <AndamioLabel htmlFor="new-module-code">New Module Code</AndamioLabel>
                      <AndamioInput
                        id="new-module-code"
                        value={newModuleCode}
                        onChange={(e) => setNewModuleCode(e.target.value)}
                        placeholder="e.g., module-102"
                        maxLength={50}
                        disabled={isRenaming}
                      />
                      <p className="text-xs text-muted-foreground">
                        Current: <code className="font-mono">{courseModule?.moduleCode}</code>
                      </p>
                    </div>
                    {renameError && (
                      <AndamioAlert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AndamioAlertDescription>{renameError}</AndamioAlertDescription>
                      </AndamioAlert>
                    )}
                  </div>
                  <AndamioDialogFooter>
                    <AndamioButton
                      variant="outline"
                      onClick={() => setIsRenameDialogOpen(false)}
                      disabled={isRenaming}
                    >
                      Cancel
                    </AndamioButton>
                    <AndamioButton onClick={handleRenameModule} disabled={isRenaming}>
                      {isRenaming ? "Renaming..." : "Rename Module"}
                    </AndamioButton>
                  </AndamioDialogFooter>
                </AndamioDialogContent>
              </AndamioDialog>
            </div>
            <p className="text-sm text-muted-foreground">
              Use the rename button to change the module code identifier
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="status">Status</AndamioLabel>
            <AndamioSelect
              value={status}
              onValueChange={setStatus}
              disabled={courseModule?.status === "PENDING_TX"}
            >
              <AndamioSelectTrigger id="status">
                <AndamioSelectValue />
              </AndamioSelectTrigger>
              <AndamioSelectContent>
                {availableStatuses.map((s) => (
                  <AndamioSelectItem key={s} value={s}>
                    {s}
                  </AndamioSelectItem>
                ))}
              </AndamioSelectContent>
            </AndamioSelect>
            {courseModule?.status === "PENDING_TX" ? (
              <AndamioAlert>
                <AlertCircle className="h-4 w-4" />
                <AndamioAlertDescription>
                  Status is locked while transaction is pending. Only blockchain confirmation can update from PENDING_TX to ON_CHAIN.
                </AndamioAlertDescription>
              </AndamioAlert>
            ) : (
              <p className="text-sm text-muted-foreground">
                Current: {courseModule?.status} • Available transitions shown
              </p>
            )}
          </div>

          {/* Pending Transaction */}
          <div className="space-y-2">
            <AndamioLabel>Pending Transaction</AndamioLabel>
            {courseModule?.pendingTxHash ? (
              <div className="flex gap-2">
                <AndamioInput
                  value={courseModule.pendingTxHash}
                  disabled
                  className="flex-1 font-mono text-xs"
                />
                <AndamioButton
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a
                    href={`https://cardanoscan.io/transaction/${courseModule?.pendingTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Explorer
                  </a>
                </AndamioButton>
              </div>
            ) : (
              <div className="flex gap-2">
                <AndamioInput
                  value="No pending transaction"
                  disabled
                  className="flex-1"
                />
                {courseModule?.status === "DRAFT" && (
                  <AndamioDialog open={isPendingTxDialogOpen} onOpenChange={setIsPendingTxDialogOpen}>
                    <AndamioDialogTrigger asChild>
                      <AndamioButton
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPendingTxHash("");
                          setPendingTxError(null);
                        }}
                      >
                        Set Transaction
                      </AndamioButton>
                    </AndamioDialogTrigger>
                    <AndamioDialogContent>
                      <AndamioDialogHeader>
                        <AndamioDialogTitle>Set Pending Transaction</AndamioDialogTitle>
                        <AndamioDialogDescription>
                          Enter the transaction hash for the on-chain operation related to this module.
                        </AndamioDialogDescription>
                      </AndamioDialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <AndamioLabel htmlFor="pending-tx-hash">Transaction Hash</AndamioLabel>
                          <AndamioInput
                            id="pending-tx-hash"
                            value={pendingTxHash}
                            onChange={(e) => setPendingTxHash(e.target.value)}
                            placeholder="Enter Cardano transaction hash"
                            className="font-mono text-xs"
                            disabled={isSettingPendingTx}
                          />
                        </div>
                        {pendingTxError && (
                          <AndamioAlert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AndamioAlertDescription>{pendingTxError}</AndamioAlertDescription>
                          </AndamioAlert>
                        )}
                      </div>
                      <AndamioDialogFooter>
                        <AndamioButton
                          variant="outline"
                          onClick={() => setIsPendingTxDialogOpen(false)}
                          disabled={isSettingPendingTx}
                        >
                          Cancel
                        </AndamioButton>
                        <AndamioButton onClick={handleSetPendingTx} disabled={isSettingPendingTx}>
                          {isSettingPendingTx ? "Setting..." : "Set Transaction"}
                        </AndamioButton>
                      </AndamioDialogFooter>
                    </AndamioDialogContent>
                  </AndamioDialog>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {courseModule?.status === "DRAFT"
                ? "Track on-chain transactions for this module (DRAFT only)"
                : "Pending transactions can only be set for DRAFT modules"}
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <AndamioButton
              variant="outline"
              onClick={() => router.push(`/course/${courseNftPolicyId}/${moduleCode}`)}
            >
              Cancel
            </AndamioButton>
            <AndamioButton onClick={handleSave} disabled={isSaving || !hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </AndamioButton>
          </div>

          {/* Danger Zone */}
          <div className="border-t pt-4 mt-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete this module and all its lessons, SLTs, and assignments.
              </p>
              <AndamioConfirmDialog
                trigger={
                  <AndamioButton variant="destructive" size="sm" disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Module
                  </AndamioButton>
                }
                title="Delete Module"
                description={`Are you sure you want to delete "${courseModule?.title}"? This action cannot be undone. All lessons, SLTs, introduction, and assignments will be permanently removed.`}
                confirmText="Delete Module"
                variant="destructive"
                onConfirm={handleDelete}
                isLoading={isDeleting}
              />
            </div>
          </div>
        </AndamioCardContent>
      </AndamioCard>

      {/* Mint Module Tokens - Show when module is APPROVED */}
      {courseModule?.status === "APPROVED" && moduleWithSlts.length > 0 && (
        <MintModuleTokens
          courseNftPolicyId={courseNftPolicyId}
          courseModules={moduleWithSlts}
          onSuccess={async () => {
            // Refetch module to see updated status
            const response = await fetch(
              `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}`
            );
            const data = (await response.json()) as CourseModuleOutput;
            setCourseModule(data);
            setStatus(data.status ?? "DRAFT");
          }}
        />
      )}

      {/* Quick Links */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Module Management</AndamioCardTitle>
          <AndamioCardDescription>Manage module content and settings</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-2">
          <Link href={`/studio/course/${courseNftPolicyId}/${moduleCode}/slts`}>
            <AndamioButton variant="outline" className="w-full justify-start">
              Manage Student Learning Targets
            </AndamioButton>
          </Link>
          <Link href={`/studio/course/${courseNftPolicyId}/${moduleCode}/introduction`}>
            <AndamioButton variant="outline" className="w-full justify-start">
              Edit Module Introduction
            </AndamioButton>
          </Link>
          <Link href={`/studio/course/${courseNftPolicyId}/${moduleCode}/assignment`}>
            <AndamioButton variant="outline" className="w-full justify-start">
              Edit Module Assignment
            </AndamioButton>
          </Link>

          {/* Publish Content */}
          <div className="border-t pt-4 mt-4">
            <AndamioConfirmDialog
              trigger={
                <AndamioButton
                  variant="default"
                  className="w-full justify-start"
                  disabled={isPublishing}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isPublishing ? "Publishing..." : "Publish All Content"}
                </AndamioButton>
              }
              title="Publish All Module Content"
              description={`This will make all content (lessons, introduction, and assignments) for "${courseModule?.title}" live and visible to learners. Are you sure you want to continue?`}
              confirmText="Publish Content"
              onConfirm={handlePublishAllContent}
              isLoading={isPublishing}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Sets all lessons, introduction, and assignments to live status
            </p>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    </div>
  );
}
