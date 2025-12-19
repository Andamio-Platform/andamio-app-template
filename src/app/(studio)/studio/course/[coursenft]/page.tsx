"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useSuccessNotification } from "~/hooks/use-success-notification";
import { useStudioHeader } from "~/components/layout/studio-header";
import { RequireCourseAccess } from "~/components/auth/require-course-access";
import {
  StudioEditorPane,
  StudioFormSection,
} from "~/components/studio/studio-editor-pane";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "~/components/andamio/andamio-resizable";
import {
  AndamioButton,
  AndamioBadge,
  AndamioSkeleton,
  AndamioInput,
  AndamioLabel,
  AndamioTextarea,
  AndamioAlert,
  AndamioAlertDescription,
  AndamioScrollArea,
} from "~/components/andamio";
import {
  AlertCircle,
  Plus,
  Save,
  Settings,
  BookOpen,
  Blocks,
  FileText,
  ChevronRight,
  Trash2,
  CheckCircle,
  Clock,
  Circle,
} from "lucide-react";
import { AndamioTabs, AndamioTabsList, AndamioTabsTrigger, AndamioTabsContent } from "~/components/andamio/andamio-tabs";
import { AndamioConfirmDialog } from "~/components/andamio/andamio-confirm-dialog";
import {
  type CourseOutput,
  type ListCourseModulesOutput,
  type UpdateCourseInput,
  updateCourseInputSchema,
} from "@andamio/db-api";
import { AndamioText } from "~/components/andamio/andamio-text";

interface ApiError {
  message?: string;
}

/**
 * Course Editor Content - The main editing UI
 *
 * Rendered only after RequireCourseAccess verifies the user has access.
 */
function CourseEditorContent({ courseNftPolicyId }: { courseNftPolicyId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  // URL-based tab persistence
  const urlTab = searchParams.get("tab");
  const validTabs = ["details", "on-chain", "settings"];
  const activeTab = urlTab && validTabs.includes(urlTab) ? urlTab : "details";

  // Update studio header
  const { setBreadcrumbs, setTitle, setStatus, setActions } = useStudioHeader();

  const [course, setCourse] = useState<CourseOutput | null>(null);
  const [modules, setModules] = useState<ListCourseModulesOutput>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitleState] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { isSuccess: saveSuccess, showSuccess } = useSuccessNotification();

  const [isDeleting, setIsDeleting] = useState(false);

  // Panel collapse state
  const [isOutlineCollapsed, setIsOutlineCollapsed] = useState(false);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCreateModule = () => {
    router.push(`/studio/course/${courseNftPolicyId}/new?step=blueprint`);
  };

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch course
      const courseResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
        }
      );

      if (!courseResponse.ok) {
        throw new Error(`Failed to fetch course: ${courseResponse.statusText}`);
      }

      const courseData = (await courseResponse.json()) as CourseOutput;
      setCourse(courseData);
      setTitleState(courseData.title ?? "");
      setDescription(courseData.description ?? "");
      setImageUrl(courseData.image_url ?? "");
      setVideoUrl(courseData.video_url ?? "");

      // Update header
      setTitle(courseData.title ?? "Untitled Course");
      setBreadcrumbs([
        { label: "Course Studio", href: "/studio/course" },
        { label: courseData.title ?? "Course" },
      ]);

      // Fetch modules
      const modulesResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-module/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
        }
      );

      if (modulesResponse.ok) {
        const modulesData = (await modulesResponse.json()) as ListCourseModulesOutput;
        setModules(modulesData ?? []);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to load course");
    } finally {
      setIsLoading(false);
    }
  }, [courseNftPolicyId, setBreadcrumbs, setTitle]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Update header actions
  useEffect(() => {
    setActions(
      <AndamioButton size="sm" onClick={handleCreateModule}>
        <Plus className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Add Module</span>
      </AndamioButton>
    );
  }, [setActions]);

  const handleSave = async () => {
    if (!isAuthenticated || !course) {
      setSaveError("You must be authenticated to edit courses");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const input: UpdateCourseInput = {
        course_code: course.course_code,
        data: {
          title: title || undefined,
          description: description || undefined,
          image_url: imageUrl || undefined,
          video_url: videoUrl || undefined,
        },
      };

      const validationResult = updateCourseInputSchema.safeParse(input);
      if (!validationResult.success) {
        const errors = validationResult.error.issues
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        throw new Error(`Validation failed: ${errors}`);
      }

      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_code: course.course_code,
            data: validationResult.data,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to update course");
      }

      showSuccess();
      await fetchData();
    } catch (err) {
      console.error("Error saving course:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthenticated || !course) return;

    setIsDeleting(true);
    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_code: course.course_code }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to delete course");
      }

      router.push("/studio/course");
    } catch (err) {
      console.error("Error deleting course:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to delete course");
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-3">
          <AndamioSkeleton className="h-8 w-48" />
          <AndamioSkeleton className="h-64 w-96" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <StudioEditorPane padding="normal">
        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertDescription>{error ?? "Course not found"}</AndamioAlertDescription>
        </AndamioAlert>
      </StudioEditorPane>
    );
  }

  const hasChanges =
    title !== (course.title ?? "") ||
    description !== (course.description ?? "") ||
    imageUrl !== (course.image_url ?? "") ||
    videoUrl !== (course.video_url ?? "");

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Left Panel: Module Outline */}
      <ResizablePanel
        defaultSize={25}
        minSize={15}
        maxSize={40}
        collapsible
        collapsedSize={0}
        onCollapse={() => setIsOutlineCollapsed(true)}
        onExpand={() => setIsOutlineCollapsed(false)}
      >
        <div className="flex h-full flex-col border-r border-border bg-muted/30">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Modules ({modules.length})
            </span>
            <AndamioButton
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleCreateModule}
            >
              <Plus className="h-3.5 w-3.5" />
            </AndamioButton>
          </div>

          {/* Module List */}
          <AndamioScrollArea className="flex-1">
            <div className="py-1">
              {modules.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <AndamioText variant="small" className="text-xs">No modules yet</AndamioText>
                  <AndamioButton
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs h-7"
                    onClick={handleCreateModule}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create First Module
                  </AndamioButton>
                </div>
              ) : (
                modules.map((courseModule) => (
                  <Link
                    key={courseModule.module_code}
                    href={`/studio/course/${courseNftPolicyId}/${courseModule.module_code}`}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-accent transition-colors group"
                  >
                    {/* Status indicator */}
                    <div className="flex-shrink-0">
                      {courseModule.status === "ON_CHAIN" ? (
                        <CheckCircle className="h-3.5 w-3.5 text-success" />
                      ) : courseModule.status === "PENDING_TX" ? (
                        <Clock className="h-3.5 w-3.5 text-info animate-pulse" />
                      ) : courseModule.status === "APPROVED" ? (
                        <Circle className="h-3.5 w-3.5 fill-warning text-warning" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Module info */}
                    <div className="flex-1 min-w-0">
                      <AndamioText variant="small" className="font-medium truncate text-foreground">
                        {courseModule.title ?? "Untitled"}
                      </AndamioText>
                      <AndamioText variant="small" className="text-[10px] font-mono truncate">
                        {courseModule.module_code}
                      </AndamioText>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </Link>
                ))
              )}
            </div>
          </AndamioScrollArea>

          {/* Footer with stats */}
          <div className="border-t border-border px-3 py-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{modules.filter((m) => m.status === "ON_CHAIN").length} on-chain</span>
              <span>{modules.filter((m) => m.status === "DRAFT").length} drafts</span>
            </div>
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right Panel: Course Details */}
      <ResizablePanel defaultSize={75}>
        <StudioEditorPane
          padding="tight"
          header={
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <AndamioBadge variant="outline" className="text-[10px] font-mono">
                  {course.course_code}
                </AndamioBadge>
                {course.course_nft_policy_id && (
                  <AndamioBadge variant="default" className="text-[10px]">
                    <Blocks className="h-2.5 w-2.5 mr-1" />
                    Published
                  </AndamioBadge>
                )}
              </div>
              <AndamioButton
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="h-7 text-xs"
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                {isSaving ? "Saving..." : "Save"}
              </AndamioButton>
            </div>
          }
        >
          {/* Messages */}
          {saveSuccess && (
            <AndamioAlert className="mb-3">
              <AndamioAlertDescription>Course updated successfully</AndamioAlertDescription>
            </AndamioAlert>
          )}
          {saveError && (
            <AndamioAlert variant="destructive" className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AndamioAlertDescription>{saveError}</AndamioAlertDescription>
            </AndamioAlert>
          )}

          {/* Tabs */}
          <AndamioTabs value={activeTab} onValueChange={handleTabChange}>
            <AndamioTabsList className="grid w-full grid-cols-3 h-8">
              <AndamioTabsTrigger value="details" className="text-xs gap-1 h-7">
                <FileText className="h-3.5 w-3.5" />
                Details
              </AndamioTabsTrigger>
              <AndamioTabsTrigger value="on-chain" className="text-xs gap-1 h-7">
                <Blocks className="h-3.5 w-3.5" />
                On-Chain
              </AndamioTabsTrigger>
              <AndamioTabsTrigger value="settings" className="text-xs gap-1 h-7">
                <Settings className="h-3.5 w-3.5" />
                Settings
              </AndamioTabsTrigger>
            </AndamioTabsList>

            {/* Details Tab */}
            <AndamioTabsContent value="details" className="mt-3 space-y-4">
              <StudioFormSection title="Course Information">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <AndamioLabel htmlFor="title" className="text-xs">
                      Title *
                    </AndamioLabel>
                    <AndamioInput
                      id="title"
                      value={title}
                      onChange={(e) => setTitleState(e.target.value)}
                      placeholder="Course title"
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <AndamioLabel htmlFor="description" className="text-xs">
                      Description
                    </AndamioLabel>
                    <AndamioTextarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Course description"
                      rows={3}
                      className="text-sm resize-none"
                    />
                  </div>
                </div>
              </StudioFormSection>

              <StudioFormSection title="Media">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <AndamioLabel htmlFor="imageUrl" className="text-xs">
                      Image URL
                    </AndamioLabel>
                    <AndamioInput
                      id="imageUrl"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <AndamioLabel htmlFor="videoUrl" className="text-xs">
                      Video URL
                    </AndamioLabel>
                    <AndamioInput
                      id="videoUrl"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://..."
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </StudioFormSection>
            </AndamioTabsContent>

            {/* On-Chain Tab */}
            <AndamioTabsContent value="on-chain" className="mt-3">
              <StudioFormSection title="Blockchain Status">
                <div className="rounded-lg border p-3 bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Blocks className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Course NFT</span>
                  </div>
                  <code className="text-[10px] text-muted-foreground font-mono break-all">
                    {courseNftPolicyId}
                  </code>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border p-2 text-center">
                    <AndamioText className="text-lg font-bold">{modules.length}</AndamioText>
                    <AndamioText variant="small" className="text-[10px]">Total Modules</AndamioText>
                  </div>
                  <div className="rounded-lg border p-2 text-center">
                    <AndamioText className="text-lg font-bold text-success">
                      {modules.filter((m) => m.status === "ON_CHAIN").length}
                    </AndamioText>
                    <AndamioText variant="small" className="text-[10px]">On-Chain</AndamioText>
                  </div>
                </div>
              </StudioFormSection>
            </AndamioTabsContent>

            {/* Settings Tab */}
            <AndamioTabsContent value="settings" className="mt-3">
              <StudioFormSection title="Course Code">
                <div className="space-y-1.5">
                  <AndamioInput
                    value={course.course_code}
                    disabled
                    className="h-8 text-sm font-mono"
                  />
                  <AndamioText variant="small" className="text-[10px]">
                    Course code cannot be changed
                  </AndamioText>
                </div>
              </StudioFormSection>

              <StudioFormSection title="Danger Zone" className="mt-4">
                <div className="rounded-lg border border-destructive/50 p-3">
                  <AndamioText variant="small" className="text-xs mb-2">
                    Permanently delete this course and all its content.
                  </AndamioText>
                  <AndamioConfirmDialog
                    trigger={
                      <AndamioButton
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete Course
                      </AndamioButton>
                    }
                    title="Delete Course"
                    description={`Are you sure you want to delete "${course.title}"? This action cannot be undone.`}
                    confirmText="Delete Course"
                    variant="destructive"
                    onConfirm={handleDelete}
                    isLoading={isDeleting}
                  />
                </div>
              </StudioFormSection>
            </AndamioTabsContent>
          </AndamioTabs>
        </StudioEditorPane>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

/**
 * Studio Course Edit Page
 *
 * Dense split-pane layout for editing course details and managing modules.
 *
 * Authorization: Only accessible to users who are:
 * - Course owner (created the course)
 * - Course teacher (listed as contributor)
 */
export default function StudioCourseEditPage() {
  const params = useParams();
  const courseNftPolicyId = params.coursenft as string;

  return (
    <RequireCourseAccess
      courseNftPolicyId={courseNftPolicyId}
      title="Edit Course"
      description="Connect your wallet to edit this course"
    >
      <CourseEditorContent courseNftPolicyId={courseNftPolicyId} />
    </RequireCourseAccess>
  );
}
