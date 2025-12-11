"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useSuccessNotification } from "~/hooks/use-success-notification";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioTextarea } from "~/components/andamio/andamio-textarea";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioPageHeader } from "~/components/andamio";
import {
  AndamioSelect,
  AndamioSelectContent,
  AndamioSelectItem,
  AndamioSelectTrigger,
  AndamioSelectValue,
} from "~/components/andamio/andamio-select";
import { AlertCircle, Edit2, Save, Trash2, Upload, FileText, BookOpen, Blocks, Settings, Target } from "lucide-react";
import { AndamioTabs, AndamioTabsContent, AndamioTabsList, AndamioTabsTrigger } from "~/components/andamio/andamio-tabs";
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
  type CourseOutput,
  type ListCourseModulesOutput,
  type UpdateCourseModuleInput,
  type UpdateModuleStatusInput,
  updateCourseModuleInputSchema,
  updateModuleStatusInputSchema,
} from "@andamio/db-api";
import { MintModuleTokens } from "~/components/transactions";
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";

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
 * Type Reference: See API-TYPE-REFERENCE.md in @andamio/db-api
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const courseNftPolicyId = params.coursenft as string;
  const moduleCode = params.modulecode as string;
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  // URL-based tab persistence
  const urlTab = searchParams.get("tab");
  const validTabs = ["details", "content", "on-chain", "settings"];
  const activeTab = urlTab && validTabs.includes(urlTab) ? urlTab : "details";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [course, setCourse] = useState<CourseOutput | null>(null);
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
  const { isSuccess: saveSuccess, showSuccess } = useSuccessNotification();

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
        // Fetch course details for breadcrumb (POST with body)
        const courseResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/get`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
          }
        );

        if (courseResponse.ok) {
          const courseData = (await courseResponse.json()) as CourseOutput;
          setCourse(courseData);
        }

        // Fetch single module details (POST with body)
        const moduleResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/get`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              course_nft_policy_id: courseNftPolicyId,
              module_code: moduleCode,
            }),
          }
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
            `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/list`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
            }
          );

          if (modulesResponse.ok) {
            const modulesData = (await modulesResponse.json()) as ListCourseModulesOutput;
            // Filter to just this module
            const thisModuleWithSlts = modulesData.filter(
              (m) => m.module_code === moduleCode
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

    try {
      // Build input object for module update
      const updateInput: UpdateCourseModuleInput = {
        course_nft_policy_id: courseNftPolicyId,
        module_code: moduleCode,
        title,
        description,
      };

      // Validate module update input
      const updateValidation = updateCourseModuleInputSchema.safeParse(updateInput);

      if (!updateValidation.success) {
        const errors = updateValidation.error.issues
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        throw new Error(`Validation failed: ${errors}`);
      }

      // Send validated module update (POST /course-modules/update)
      const updateResponse = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/update`,
        {
          method: "POST",
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
          course_nft_policy_id: courseNftPolicyId,
          module_code: moduleCode,
          status: status as UpdateModuleStatusInput["status"],
        };

        // Validate status update input
        const statusValidation = updateModuleStatusInputSchema.safeParse(statusInput);

        if (!statusValidation.success) {
          const errors = statusValidation.error.issues
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join(", ");
          throw new Error(`Status validation failed: ${errors}`);
        }

        // Send validated status update (POST /course-modules/update-status)
        const statusResponse = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/update-status`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(statusValidation.data),
          }
        );

        if (!statusResponse.ok) {
          const errorData = (await statusResponse.json()) as ApiError;
          throw new Error(errorData.message ?? "Failed to update status");
        }
      }

      showSuccess();

      // Refetch module (POST /course-modules/get)
      const response = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
          }),
        }
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
    if (!isAuthenticated || !courseModule) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
          }),
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
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/update-code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            new_module_code: newModuleCode.trim(),
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
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/set-pending-tx`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            pending_tx_hash: pendingTxHash.trim(),
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
      showSuccess();
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
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to publish content");
      }

      showSuccess();
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
        <CourseBreadcrumb
          mode="studio"
          course={course ? { nftPolicyId: courseNftPolicyId, title: course.title ?? "Course" } : undefined}
          currentPage="module"
        />

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
      {/* Breadcrumb Navigation */}
      <CourseBreadcrumb
        mode="studio"
        course={course ? { nftPolicyId: courseNftPolicyId, title: course.title ?? "Course" } : undefined}
        courseModule={{ code: courseModule.module_code, title: courseModule.title }}
        currentPage="module"
      />

      {/* Header */}
      <div className="flex items-center justify-end">
        <AndamioBadge variant="outline" className="font-mono text-xs">
          {courseModule?.module_code}
        </AndamioBadge>
      </div>

      <AndamioPageHeader
        title="Edit Module"
        description={courseModule?.title ?? ""}
      />

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

      {/* Tabbed Interface */}
      <AndamioTabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <AndamioTabsList className="grid w-full grid-cols-4">
          <AndamioTabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Details</span>
          </AndamioTabsTrigger>
          <AndamioTabsTrigger value="content" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Content</span>
          </AndamioTabsTrigger>
          <AndamioTabsTrigger value="on-chain" className="flex items-center gap-2">
            <Blocks className="h-4 w-4" />
            <span className="hidden sm:inline">On-Chain</span>
          </AndamioTabsTrigger>
          <AndamioTabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </AndamioTabsTrigger>
        </AndamioTabsList>

        {/* Details Tab */}
        <AndamioTabsContent value="details" className="mt-6">
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
                  <AndamioInput id="moduleCode" value={courseModule?.module_code} disabled className="flex-1" />
                  <AndamioDialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                    <AndamioDialogTrigger asChild>
                      <AndamioButton
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewModuleCode(courseModule?.module_code ?? "");
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
                            Current: <code className="font-mono">{courseModule?.module_code}</code>
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
            </AndamioCardContent>
          </AndamioCard>
        </AndamioTabsContent>

        {/* Content Tab */}
        <AndamioTabsContent value="content" className="mt-6 space-y-4">
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Learning Targets
              </AndamioCardTitle>
              <AndamioCardDescription>
                Define what learners will achieve in this module
              </AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent>
              <Link href={`/studio/course/${courseNftPolicyId}/${moduleCode}/slts`}>
                <AndamioButton variant="outline" className="w-full justify-start">
                  <Target className="h-4 w-4 mr-2" />
                  Manage Student Learning Targets
                </AndamioButton>
              </Link>
            </AndamioCardContent>
          </AndamioCard>

          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Module Content
              </AndamioCardTitle>
              <AndamioCardDescription>
                Create and edit module introduction and lessons
              </AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-2">
              <Link href={`/studio/course/${courseNftPolicyId}/${moduleCode}/introduction`}>
                <AndamioButton variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Edit Module Introduction
                </AndamioButton>
              </Link>
            </AndamioCardContent>
          </AndamioCard>

          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Assignment
              </AndamioCardTitle>
              <AndamioCardDescription>
                Create the module assignment for learner assessment
              </AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
              <Link href={`/studio/course/${courseNftPolicyId}/${moduleCode}/assignment`}>
                <AndamioButton variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Edit Module Assignment
                </AndamioButton>
              </Link>
            </AndamioCardContent>
          </AndamioCard>

          {/* Publish Content */}
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Publish Content
              </AndamioCardTitle>
              <AndamioCardDescription>
                Make all content visible to learners
              </AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent>
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
            </AndamioCardContent>
          </AndamioCard>
        </AndamioTabsContent>

        {/* On-Chain Tab */}
        <AndamioTabsContent value="on-chain" className="mt-6 space-y-4">
          {/* Pending Transaction */}
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle>Pending Transaction</AndamioCardTitle>
              <AndamioCardDescription>Track blockchain transactions for this module</AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
              {courseModule?.pending_tx_hash ? (
                <div className="flex gap-2">
                  <AndamioInput
                    value={courseModule.pending_tx_hash}
                    disabled
                    className="flex-1 font-mono text-xs"
                  />
                  <AndamioButton
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a
                      href={`https://cardanoscan.io/transaction/${courseModule?.pending_tx_hash}`}
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
            </AndamioCardContent>
          </AndamioCard>

          {/* Mint Module Tokens - Show when module is APPROVED */}
          {courseModule?.status === "APPROVED" && moduleWithSlts.length > 0 ? (
            <MintModuleTokens
              courseNftPolicyId={courseNftPolicyId}
              courseModules={moduleWithSlts}
              onSuccess={async () => {
                // Refetch module to see updated status (POST /course-modules/get)
                const response = await fetch(
                  `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/get`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      course_nft_policy_id: courseNftPolicyId,
                      module_code: moduleCode,
                    }),
                  }
                );
                const data = (await response.json()) as CourseModuleOutput;
                setCourseModule(data);
                setStatus(data.status ?? "DRAFT");
              }}
            />
          ) : (
            <AndamioCard>
              <AndamioCardHeader>
                <AndamioCardTitle className="flex items-center gap-2">
                  <Blocks className="h-5 w-5" />
                  Mint Module Tokens
                </AndamioCardTitle>
                <AndamioCardDescription>
                  Mint this module and its SLTs on the Cardano blockchain
                </AndamioCardDescription>
              </AndamioCardHeader>
              <AndamioCardContent>
                <AndamioAlert>
                  <AlertCircle className="h-4 w-4" />
                  <AndamioAlertDescription>
                    {courseModule?.status === "PENDING_TX" ? (
                      "A transaction is pending. Wait for blockchain confirmation."
                    ) : courseModule?.status === "ON_CHAIN" ? (
                      "This module is already minted on-chain."
                    ) : (
                      <>
                        Module status must be <strong>APPROVED</strong> to mint tokens.
                        Current status: <strong>{courseModule?.status}</strong>
                      </>
                    )}
                  </AndamioAlertDescription>
                </AndamioAlert>
              </AndamioCardContent>
            </AndamioCard>
          )}
        </AndamioTabsContent>

        {/* Settings Tab */}
        <AndamioTabsContent value="settings" className="mt-6">
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle className="text-destructive">Danger Zone</AndamioCardTitle>
              <AndamioCardDescription>
                Irreversible actions that affect this module
              </AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
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
            </AndamioCardContent>
          </AndamioCard>
        </AndamioTabsContent>
      </AndamioTabs>
    </div>
  );
}
