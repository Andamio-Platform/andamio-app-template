"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useSuccessNotification } from "~/hooks/use-success-notification";
import { ContentEditor, ContentViewer } from "~/components/editor";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioTextarea } from "~/components/andamio/andamio-textarea";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioTabs, AndamioTabsContent, AndamioTabsList, AndamioTabsTrigger } from "~/components/andamio/andamio-tabs";
import { AndamioCheckbox } from "~/components/andamio/andamio-checkbox";
import { AndamioSwitch } from "~/components/andamio/andamio-switch";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { AlertCircle, Save, Trash2 } from "lucide-react";
import { AndamioPageHeader } from "~/components/andamio";
import {
  type AssignmentOutput,
  type CourseOutput,
  type CourseModuleOutput,
  type ListSLTsOutput,
  type CreateAssignmentInput,
  type UpdateAssignmentInput,
  createAssignmentInputSchema,
  updateAssignmentInputSchema,
} from "@andamio/db-api";
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";
import type { JSONContent } from "@tiptap/core";

/**
 * Studio page for editing or creating course module assignments
 *
 * API Endpoints:
 * - POST /assignments (protected) - Create new assignment
 * - PATCH /assignments/{courseNftPolicyId}/{moduleCode} (protected) - Update assignment
 * - DELETE /assignments/{courseNftPolicyId}/{moduleCode} (protected) - Delete assignment
 * Input Validation: Uses createAssignmentInputSchema and updateAssignmentInputSchema
 * Type Reference: See API-TYPE-REFERENCE.md in @andamio/db-api
 */

interface ApiError {
  message?: string;
}

export default function AssignmentEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseNftPolicyId = params.coursenft as string;
  const moduleCode = params.modulecode as string;
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  const [course, setCourse] = useState<CourseOutput | null>(null);
  const [courseModule, setCourseModule] = useState<CourseModuleOutput | null>(null);
  const [, setAssignment] = useState<AssignmentOutput | null>(null);
  const [slts, setSlts] = useState<ListSLTsOutput>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignmentExists, setAssignmentExists] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [live, setLive] = useState(false);
  const [selectedSltIds, setSelectedSltIds] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { isSuccess: saveSuccess, showSuccess } = useSuccessNotification();

  // Content state for editor
  const [contentJson, setContentJson] = useState<JSONContent | null>(null);

  const handleContentChange = (content: JSONContent) => {
    setContentJson(content);
  };

  useEffect(() => {
    const fetchAssignmentAndSLTs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch course details for breadcrumb
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

        // Fetch module details for breadcrumb
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

        if (moduleResponse.ok) {
          const moduleData = (await moduleResponse.json()) as CourseModuleOutput;
          setCourseModule(moduleData);
        }

        // Fetch SLTs first (always available) - POST /slts/list
        const sltsResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slts/list`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              course_nft_policy_id: courseNftPolicyId,
              module_code: moduleCode,
            }),
          }
        );

        if (!sltsResponse.ok) {
          throw new Error(`Failed to fetch SLTs: ${sltsResponse.statusText}`);
        }

        const sltsData = (await sltsResponse.json()) as ListSLTsOutput;
        setSlts(sltsData);

        // Try to fetch assignment (may not exist yet) - POST /assignments/get
        try {
          const assignmentResponse = await fetch(
            `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignments/get`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                course_nft_policy_id: courseNftPolicyId,
                module_code: moduleCode,
              }),
            }
          );

          if (assignmentResponse.ok) {
            const data = (await assignmentResponse.json()) as AssignmentOutput;
            setAssignment(data);
            setAssignmentExists(true);
            setTitle(data.title ?? "");
            setDescription(data.description ?? "");
            setImageUrl(data.image_url ?? "");
            setVideoUrl(data.video_url ?? "");
            setLive(data.live ?? false);
            setContentJson((data.content_json as JSONContent) ?? null);
            // Note: SLTs are now fetched separately
          } else if (assignmentResponse.status === 404) {
            // Assignment doesn't exist yet - that's OK
            setAssignmentExists(false);
          } else {
            throw new Error(`Failed to fetch assignment: ${assignmentResponse.statusText}`);
          }
        } catch {
          console.warn("Assignment not found, will create new one");
          setAssignmentExists(false);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAssignmentAndSLTs();
  }, [courseNftPolicyId, moduleCode]);

  const handleSave = async () => {
    if (!isAuthenticated) {
      setSaveError("You must be authenticated to edit assignments");
      return;
    }

    if (!title.trim()) {
      setSaveError("Title is required");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      if (assignmentExists) {
        // Build input object for assignment update
        const updateInput: UpdateAssignmentInput = {
          course_nft_policy_id: courseNftPolicyId,
          module_code: moduleCode,
          title,
          description,
          content_json: contentJson,
          image_url: imageUrl || undefined,
          video_url: videoUrl || undefined,
          live,
        };

        // Validate update input
        const updateValidation = updateAssignmentInputSchema.safeParse(updateInput);

        if (!updateValidation.success) {
          const errors = updateValidation.error.errors
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join(", ");
          throw new Error(`Validation failed: ${errors}`);
        }

        // Send validated update (POST /assignments/update)
        const response = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignments/update`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateValidation.data),
          }
        );

        if (!response.ok) {
          const errorData = (await response.json()) as ApiError;
          throw new Error(errorData.message ?? "Failed to update assignment");
        }

        const data = (await response.json()) as AssignmentOutput;
        setAssignment(data);
      } else {
        // Build input object for assignment creation
        const assignmentCode = `${moduleCode}-ASSIGNMENT`;
        const createInput: CreateAssignmentInput = {
          course_nft_policy_id: courseNftPolicyId,
          module_code: moduleCode,
          assignment_code: assignmentCode,
          title,
          description,
          content_json: contentJson,
          image_url: imageUrl || undefined,
          video_url: videoUrl || undefined,
        };

        // Validate create input
        const createValidation = createAssignmentInputSchema.safeParse(createInput);

        if (!createValidation.success) {
          const errors = createValidation.error.errors
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join(", ");
          throw new Error(`Validation failed: ${errors}`);
        }

        // Send validated create (POST /assignments/create)
        const response = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignments/create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(createValidation.data),
          }
        );

        if (!response.ok) {
          const errorData = (await response.json()) as ApiError;
          throw new Error(errorData.message ?? "Failed to create assignment");
        }

        const data = (await response.json()) as AssignmentOutput;
        setAssignment(data);
        setAssignmentExists(true);
      }

      showSuccess();
    } catch (err) {
      console.error("Error saving assignment:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthenticated || !assignmentExists) {
      return;
    }

    if (!confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    setSaveError(null);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignments/delete`,
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
        throw new Error(errorData.message ?? "Failed to delete assignment");
      }

      // Redirect to module page after successful deletion
      router.push(`/studio/course/${courseNftPolicyId}/${moduleCode}`);
    } catch (err) {
      console.error("Error deleting assignment:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to delete assignment");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!isAuthenticated || !assignmentExists) {
      return;
    }

    setIsTogglingPublish(true);
    setSaveError(null);

    try {
      const newLiveStatus = !live;
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignments/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            live: newLiveStatus,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to toggle publish status");
      }

      const data = (await response.json()) as { success: boolean; live: boolean };
      setLive(data.live);
      showSuccess();
    } catch (err) {
      console.error("Error toggling publish status:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to toggle publish status");
    } finally {
      setIsTogglingPublish(false);
    }
  };

  const toggleSlt = (sltId: string) => {
    setSelectedSltIds((prev) =>
      prev.includes(sltId) ? prev.filter((id) => id !== sltId) : [...prev, sltId]
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <AndamioSkeleton className="h-8 w-32" />
        <AndamioSkeleton className="h-96 w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        {course && courseModule && (
          <CourseBreadcrumb
            mode="studio"
            course={{ nftPolicyId: courseNftPolicyId, title: course.title ?? "Course" }}
            courseModule={{ code: courseModule.module_code, title: courseModule.title }}
            currentPage="assignment"
          />
        )}

        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{error}</AndamioAlertDescription>
        </AndamioAlert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      {course && courseModule && (
        <CourseBreadcrumb
          mode="studio"
          course={{ nftPolicyId: courseNftPolicyId, title: course.title ?? "Course" }}
          courseModule={{ code: courseModule.module_code, title: courseModule.title }}
          currentPage="assignment"
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-end">
        <AndamioBadge variant={assignmentExists ? "default" : "secondary"}>
          {assignmentExists ? "Editing Assignment" : "Create New Assignment"}
        </AndamioBadge>
      </div>

      <AndamioPageHeader
        title={assignmentExists ? "Edit Assignment" : "Create Assignment"}
        description="Manage the module assignment and linked SLTs"
      />

      {/* Success/Error Messages */}
      {saveSuccess && (
        <AndamioAlert>
          <AndamioAlertTitle>Success</AndamioAlertTitle>
          <AndamioAlertDescription>Assignment saved successfully</AndamioAlertDescription>
        </AndamioAlert>
      )}

      {saveError && (
        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{saveError}</AndamioAlertDescription>
        </AndamioAlert>
      )}

      {/* Main Content Tabs */}
      <AndamioTabs defaultValue="edit" className="space-y-4">
        <AndamioTabsList>
          <AndamioTabsTrigger value="edit">Edit</AndamioTabsTrigger>
          <AndamioTabsTrigger value="preview">Preview</AndamioTabsTrigger>
        </AndamioTabsList>

        <AndamioTabsContent value="edit" className="space-y-6">
          {/* Metadata Card */}
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle>Assignment Details</AndamioCardTitle>
              <AndamioCardDescription>Basic information about the assignment</AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
              <div className="space-y-2">
                <AndamioLabel htmlFor="title">Title *</AndamioLabel>
                <AndamioInput
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Assignment title"
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <AndamioLabel htmlFor="description">Description</AndamioLabel>
                <AndamioTextarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Assignment description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <AndamioLabel htmlFor="imageUrl">Image URL</AndamioLabel>
                  <AndamioInput
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <AndamioLabel htmlFor="videoUrl">Video URL</AndamioLabel>
                  <AndamioInput
                    id="videoUrl"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AndamioSwitch id="live" checked={live} onCheckedChange={setLive} />
                  <AndamioLabel htmlFor="live">Live (visible to students)</AndamioLabel>
                </div>
                {assignmentExists && (
                  <AndamioButton
                    variant="outline"
                    size="sm"
                    onClick={handleTogglePublish}
                    disabled={isTogglingPublish}
                  >
                    {isTogglingPublish ? "Toggling..." : live ? "Unpublish" : "Publish"}
                  </AndamioButton>
                )}
              </div>
            </AndamioCardContent>
          </AndamioCard>

          {/* SLT Selection Card */}
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle>Linked Student Learning Targets</AndamioCardTitle>
              <AndamioCardDescription>
                Select which SLTs this assignment covers ({selectedSltIds.length} selected)
              </AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent>
              {slts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No SLTs available. Create SLTs first to link them to this assignment.
                </p>
              ) : (
                <div className="space-y-2">
                  {slts.map((slt) => (
                    <div key={slt.id} className="flex items-start space-x-2">
                      <AndamioCheckbox
                        id={`slt-${slt.id}`}
                        checked={selectedSltIds.includes(slt.id)}
                        onCheckedChange={() => toggleSlt(slt.id)}
                      />
                      <label
                        htmlFor={`slt-${slt.id}`}
                        className="text-sm cursor-pointer leading-tight"
                      >
                        <AndamioBadge variant="outline" className="mr-2 font-mono text-xs">
                          {slt.module_index}
                        </AndamioBadge>
                        {slt.slt_text}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </AndamioCardContent>
          </AndamioCard>

          {/* Content Editor Card */}
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle>Assignment Content</AndamioCardTitle>
              <AndamioCardDescription>Write the assignment instructions and details</AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
              <ContentEditor
                content={contentJson}
                onContentChange={handleContentChange}
                minHeight="400px"
                showWordCount
                placeholder="Write the assignment instructions and details..."
              />
            </AndamioCardContent>
          </AndamioCard>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div>
              {assignmentExists && (
                <AndamioButton variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete Assignment"}
                </AndamioButton>
              )}
            </div>
            <div className="flex gap-2">
              <AndamioButton
                variant="outline"
                onClick={() => router.push(`/studio/course/${courseNftPolicyId}/${moduleCode}`)}
              >
                Cancel
              </AndamioButton>
              <AndamioButton onClick={handleSave} disabled={isSaving || !title.trim()}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : assignmentExists ? "Save Changes" : "Create Assignment"}
              </AndamioButton>
            </div>
          </div>
        </AndamioTabsContent>

        <AndamioTabsContent value="preview">
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle>Preview</AndamioCardTitle>
              <AndamioCardDescription>Read-only preview of the assignment content</AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{title || "Untitled Assignment"}</h2>
                {description && <p className="text-muted-foreground mt-2">{description}</p>}
              </div>

              {selectedSltIds.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Covers Learning Targets:</h3>
                  <div className="flex flex-wrap gap-2">
                    {slts
                      .filter((slt) => selectedSltIds.includes(slt.id))
                      .map((slt) => (
                        <AndamioBadge key={slt.id} variant="secondary">
                          {slt.module_index}: {slt.slt_text}
                        </AndamioBadge>
                      ))}
                  </div>
                </div>
              )}

              <AndamioSeparator />

              <ContentViewer content={contentJson} />
            </AndamioCardContent>
          </AndamioCard>
        </AndamioTabsContent>
      </AndamioTabs>
    </div>
  );
}
