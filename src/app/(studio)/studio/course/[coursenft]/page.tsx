"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useStudioHeader } from "~/components/layout/studio-header";
import { RequireCourseAccess } from "~/components/auth/require-course-access";
import {
  StudioEditorPane,
  StudioFormSection,
} from "~/components/studio/studio-editor-pane";
import {
  AndamioResizablePanelGroup,
  AndamioResizablePanel,
  AndamioResizableHandle,
} from "~/components/andamio/andamio-resizable";
import {
  AndamioButton,
  AndamioBadge,
  AndamioInput,
  AndamioLabel,
  AndamioTextarea,
  AndamioAlert,
  AndamioAlertDescription,
  AndamioScrollArea,
  AndamioStudioLoading,
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
  ExternalLink,
  ImageIcon,
  Video,
  Copy,
  Check,
  GripVertical,
  Eye,
} from "lucide-react";
import { AndamioTabs, AndamioTabsList, AndamioTabsTrigger, AndamioTabsContent } from "~/components/andamio/andamio-tabs";
import { AndamioConfirmDialog } from "~/components/andamio/andamio-confirm-dialog";
import { type CourseModuleOutput } from "@andamio/db-api";
import { AndamioText } from "~/components/andamio/andamio-text";
import { useCourse, useUpdateCourse, useDeleteCourse } from "~/hooks/api/use-course";
import { useCourseModules } from "~/hooks/api/use-course-module";
import { cn } from "~/lib/utils";
import { toast } from "sonner";

// =============================================================================
// Helper Components
// =============================================================================

/**
 * Compact address display with copy functionality
 */
function CopyableAddress({ address, label }: { address: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      {label && <AndamioText as="span" variant="small">{label}</AndamioText>}
      <code className="text-[10px] text-muted-foreground font-mono flex-1 truncate">
        {address}
      </code>
      <AndamioButton
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 flex-shrink-0"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3 w-3 text-success" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </AndamioButton>
    </div>
  );
}

/**
 * Image preview with fallback
 */
function ImagePreview({ url, alt }: { url: string; alt: string }) {
  const [error, setError] = useState(false);

  if (!url || error) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-dashed bg-muted/30">
        <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className="relative h-24 overflow-hidden rounded-lg border bg-muted/30">
      <Image
        src={url}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  );
}

/**
 * Video embed preview
 */
function VideoPreview({ url }: { url: string }) {
  const embedUrl = useMemo(() => {
    if (!url) return null;
    // YouTube
    const ytRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/;
    const ytMatch = ytRegex.exec(url);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    // Vimeo
    const vimeoRegex = /vimeo\.com\/(\d+)/;
    const vimeoMatch = vimeoRegex.exec(url);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return null;
  }, [url]);

  if (!url) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-dashed bg-muted/30">
        <Video className="h-6 w-6 text-muted-foreground/50" />
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border bg-muted/30">
        <div className="text-center">
          <Video className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
          <AndamioText variant="small" className="text-[10px]">Video URL set</AndamioText>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-24 overflow-hidden rounded-lg border bg-black">
      <iframe
        src={embedUrl}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

/**
 * Module status badge component
 */
function ModuleStatusBadge({ status }: { status: CourseModuleOutput["status"] }) {
  const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string; animate?: boolean }> = {
    ON_CHAIN: { icon: CheckCircle, color: "text-success", bg: "bg-success/10", label: "On-Chain" },
    PENDING_TX: { icon: Clock, color: "text-info", bg: "bg-info/10", label: "Pending", animate: true },
    APPROVED: { icon: Circle, color: "text-warning fill-warning", bg: "bg-warning/10", label: "Ready" },
    DRAFT: { icon: Circle, color: "text-muted-foreground", bg: "bg-muted", label: "Draft" },
    ARCHIVED: { icon: Circle, color: "text-muted-foreground/50", bg: "bg-muted/50", label: "Archived" },
    BACKLOG: { icon: Circle, color: "text-muted-foreground", bg: "bg-muted", label: "Backlog" },
    DEPRECATED: { icon: Circle, color: "text-destructive/50", bg: "bg-destructive/5", label: "Deprecated" },
  };

  const config = statusConfig[status] ?? { icon: Circle, color: "text-muted-foreground", bg: "bg-muted", label: status };
  const Icon = config.icon;

  return (
    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", config.bg)}>
      <Icon className={cn("h-4 w-4", config.color, config.animate && "animate-pulse")} />
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Course Editor Content - The main editing UI
 *
 * Rendered only after RequireCourseAccess verifies the user has access.
 * Uses React Query for data fetching and caching.
 */
function CourseEditorContent({ courseNftPolicyId }: { courseNftPolicyId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL-based tab persistence
  const urlTab = searchParams.get("tab");
  const validTabs = ["details", "on-chain", "settings"];
  const activeTab = urlTab && validTabs.includes(urlTab) ? urlTab : "details";

  // Update studio header
  const { setBreadcrumbs, setTitle, setActions } = useStudioHeader();

  // React Query hooks
  const { data: course, isLoading: isLoadingCourse, error: courseError } = useCourse(courseNftPolicyId);
  const { data: modules = [], isLoading: isLoadingModules } = useCourseModules(courseNftPolicyId);

  // Mutations
  const updateCourseMutation = useUpdateCourse();
  const deleteCourseMutation = useDeleteCourse();

  // Form state (local, synced from course data)
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formInitialized, setFormInitialized] = useState(false);

  // Panel collapse state
  const [, setIsOutlineCollapsed] = useState(false);

  // Sync form state when course data loads
  useEffect(() => {
    if (course && !formInitialized) {
      setFormTitle(course.title ?? "");
      setFormDescription(course.description ?? "");
      setFormImageUrl(course.image_url ?? "");
      setFormVideoUrl(course.video_url ?? "");
      setFormInitialized(true);
    }
  }, [course, formInitialized]);

  // Update header when course loads
  useEffect(() => {
    if (course) {
      setTitle(course.title ?? "Untitled Course");
      setBreadcrumbs([
        { label: "Course Studio", href: "/studio/course" },
        { label: course.title ?? "Course" },
      ]);
    }
  }, [course, setBreadcrumbs, setTitle]);

  // Update header actions
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <AndamioButton
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          asChild
        >
          <Link href={`/course/${courseNftPolicyId}`}>
            <Eye className="h-3.5 w-3.5 mr-1" />
            Preview
          </Link>
        </AndamioButton>
        <AndamioButton
          size="sm"
          className="h-7 text-xs"
          onClick={() => router.push(`/studio/course/${courseNftPolicyId}/new?step=blueprint`)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          <span className="hidden sm:inline">Add Module</span>
        </AndamioButton>
      </div>
    );
  }, [setActions, courseNftPolicyId, router]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSave = async () => {
    if (!course) return;

    try {
      await updateCourseMutation.mutateAsync({
        courseNftPolicyId,
        data: {
          course_code: course.course_code,
          data: {
            title: formTitle || undefined,
            description: formDescription || undefined,
            image_url: formImageUrl || undefined,
            video_url: formVideoUrl || undefined,
          },
        },
      });
      toast.success("Course updated");
    } catch (err) {
      toast.error("Failed to save", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCourseMutation.mutateAsync(courseNftPolicyId);
      toast.success("Course deleted");
      router.push("/studio/course");
    } catch (err) {
      toast.error("Failed to delete", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  // Computed values
  const isLoading = isLoadingCourse || isLoadingModules;
  const hasChanges = course && (
    formTitle !== (course.title ?? "") ||
    formDescription !== (course.description ?? "") ||
    formImageUrl !== (course.image_url ?? "") ||
    formVideoUrl !== (course.video_url ?? "")
  );

  // Module stats
  const moduleStats = useMemo(() => ({
    total: modules.length,
    onChain: modules.filter((m) => m.status === "ON_CHAIN").length,
    pending: modules.filter((m) => m.status === "PENDING_TX").length,
    approved: modules.filter((m) => m.status === "APPROVED").length,
    draft: modules.filter((m) => m.status === "DRAFT").length,
  }), [modules]);

  // Loading state
  if (isLoading && !course) {
    return <AndamioStudioLoading variant="split-pane" />;
  }

  // Error state
  if (courseError || !course) {
    return (
      <StudioEditorPane padding="normal">
        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertDescription>
            {courseError instanceof Error ? courseError.message : "Course not found"}
          </AndamioAlertDescription>
        </AndamioAlert>
      </StudioEditorPane>
    );
  }

  return (
    <AndamioResizablePanelGroup direction="horizontal" className="h-full">
      {/* Left Panel: Module Outline */}
      <AndamioResizablePanel
        defaultSize={28}
        minSize={18}
        maxSize={40}
        collapsible
        collapsedSize={0}
        onCollapse={() => setIsOutlineCollapsed(true)}
        onExpand={() => setIsOutlineCollapsed(false)}
      >
        <div className="flex h-full flex-col border-r border-border bg-muted/30">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <div className="flex items-center gap-2">
              <AndamioText as="span" variant="overline">
                Modules
              </AndamioText>
              <AndamioBadge variant="secondary" className="text-[10px] h-4 px-1">
                {moduleStats.total}
              </AndamioBadge>
            </div>
            <AndamioButton
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => router.push(`/studio/course/${courseNftPolicyId}/new?step=blueprint`)}
            >
              <Plus className="h-3.5 w-3.5" />
            </AndamioButton>
          </div>

          {/* Module List */}
          <AndamioScrollArea className="flex-1">
            <div className="py-1">
              {modules.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <AndamioText className="text-sm font-medium">No modules yet</AndamioText>
                  <AndamioText variant="small" className="mt-1 mb-3">
                    Create your first module to get started
                  </AndamioText>
                  <AndamioButton
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => router.push(`/studio/course/${courseNftPolicyId}/new?step=blueprint`)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create Module
                  </AndamioButton>
                </div>
              ) : (
                modules.map((courseModule) => (
                  <Link
                    key={courseModule.module_code}
                    href={`/studio/course/${courseNftPolicyId}/${courseModule.module_code}`}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors group border-b border-border/50 last:border-0"
                  >
                    {/* Drag handle (visual only for now) */}
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Status indicator */}
                    <ModuleStatusBadge status={courseModule.status} />

                    {/* Module info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <AndamioText variant="small" className="font-medium truncate text-foreground">
                          {courseModule.title ?? "Untitled"}
                        </AndamioText>
                        {courseModule.slts?.length > 0 && (
                          <AndamioBadge variant="outline" className="text-[9px] h-4 px-1">
                            {courseModule.slts.length} SLT{courseModule.slts.length !== 1 ? "s" : ""}
                          </AndamioBadge>
                        )}
                      </div>
                      <AndamioText variant="small" className="text-[10px] font-mono truncate text-muted-foreground">
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
          {modules.length > 0 && (
            <div className="border-t border-border px-3 py-2 bg-background/50">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-success" />
                    {moduleStats.onChain}
                  </span>
                  {moduleStats.pending > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-info" />
                      {moduleStats.pending}
                    </span>
                  )}
                  {moduleStats.approved > 0 && (
                    <span className="flex items-center gap-1">
                      <Circle className="h-3 w-3 fill-warning text-warning" />
                      {moduleStats.approved}
                    </span>
                  )}
                </div>
                <AndamioText as="span" variant="small">{moduleStats.draft} draft</AndamioText>
              </div>
            </div>
          )}
        </div>
      </AndamioResizablePanel>

      <AndamioResizableHandle withHandle />

      {/* Right Panel: Course Details */}
      <AndamioResizablePanel defaultSize={72}>
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
                disabled={updateCourseMutation.isPending || !hasChanges}
                className="h-7 text-xs"
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                {updateCourseMutation.isPending ? "Saving..." : "Save"}
              </AndamioButton>
            </div>
          }
        >
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
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
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
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Course description"
                      rows={3}
                      className="text-sm resize-none"
                    />
                  </div>
                </div>
              </StudioFormSection>

              <StudioFormSection title="Media">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Image */}
                  <div className="space-y-2">
                    <AndamioLabel htmlFor="imageUrl" className="text-xs flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      Cover Image
                    </AndamioLabel>
                    <ImagePreview url={formImageUrl} alt={formTitle || "Course cover"} />
                    <AndamioInput
                      id="imageUrl"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="h-7 text-xs"
                    />
                  </div>

                  {/* Video */}
                  <div className="space-y-2">
                    <AndamioLabel htmlFor="videoUrl" className="text-xs flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      Intro Video
                    </AndamioLabel>
                    <VideoPreview url={formVideoUrl} />
                    <AndamioInput
                      id="videoUrl"
                      value={formVideoUrl}
                      onChange={(e) => setFormVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/... or vimeo.com/..."
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </StudioFormSection>
            </AndamioTabsContent>

            {/* On-Chain Tab */}
            <AndamioTabsContent value="on-chain" className="mt-3 space-y-4">
              <StudioFormSection title="Course NFT">
                <div className="rounded-lg border p-3 bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Blocks className="h-4 w-4 text-primary" />
                      <AndamioText as="span" className="text-sm font-medium">Policy ID</AndamioText>
                    </div>
                    <AndamioButton
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px]"
                      asChild
                    >
                      <a
                        href={`https://preprod.cardanoscan.io/token/${courseNftPolicyId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </a>
                    </AndamioButton>
                  </div>
                  <CopyableAddress address={courseNftPolicyId} />
                </div>
              </StudioFormSection>

              <StudioFormSection title="Module Status">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-lg border p-3 text-center">
                    <AndamioText className="text-2xl font-bold">{moduleStats.total}</AndamioText>
                    <AndamioText variant="small" className="text-[10px]">Total</AndamioText>
                  </div>
                  <div className="rounded-lg border p-3 text-center bg-success/5">
                    <AndamioText className="text-2xl font-bold text-success">{moduleStats.onChain}</AndamioText>
                    <AndamioText variant="small" className="text-[10px]">On-Chain</AndamioText>
                  </div>
                  <div className="rounded-lg border p-3 text-center bg-warning/5">
                    <AndamioText className="text-2xl font-bold text-warning">{moduleStats.approved}</AndamioText>
                    <AndamioText variant="small" className="text-[10px]">Ready to Mint</AndamioText>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <AndamioText className="text-2xl font-bold text-muted-foreground">{moduleStats.draft}</AndamioText>
                    <AndamioText variant="small" className="text-[10px]">Draft</AndamioText>
                  </div>
                </div>

                {moduleStats.pending > 0 && (
                  <AndamioAlert className="mt-3">
                    <Clock className="h-4 w-4 text-info animate-pulse" />
                    <AndamioAlertDescription>
                      {moduleStats.pending} module{moduleStats.pending !== 1 ? "s" : ""} pending blockchain confirmation
                    </AndamioAlertDescription>
                  </AndamioAlert>
                )}
              </StudioFormSection>

              <StudioFormSection title="Blockchain Links">
                <div className="flex flex-wrap gap-2">
                  <AndamioButton variant="outline" size="sm" className="h-7 text-xs" asChild>
                    <a
                      href={`https://preprod.cardanoscan.io/token/${courseNftPolicyId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      CardanoScan
                    </a>
                  </AndamioButton>
                  <AndamioButton variant="outline" size="sm" className="h-7 text-xs" asChild>
                    <a
                      href={`https://preprod.cexplorer.io/policy/${courseNftPolicyId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Cexplorer
                    </a>
                  </AndamioButton>
                </div>
              </StudioFormSection>
            </AndamioTabsContent>

            {/* Settings Tab */}
            <AndamioTabsContent value="settings" className="mt-3 space-y-4">
              <StudioFormSection title="Course Code">
                <div className="space-y-1.5">
                  <AndamioInput
                    value={course.course_code}
                    disabled
                    className="h-8 text-sm font-mono"
                  />
                  <AndamioText variant="small" className="text-[10px]">
                    Course code cannot be changed after creation
                  </AndamioText>
                </div>
              </StudioFormSection>

              <StudioFormSection title="Danger Zone">
                <div className="rounded-lg border border-destructive/50 p-3 space-y-2">
                  <AndamioText variant="small" className="text-xs">
                    Permanently delete this course and all its content. This action cannot be undone.
                  </AndamioText>
                  <AndamioConfirmDialog
                    trigger={
                      <AndamioButton
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={deleteCourseMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete Course
                      </AndamioButton>
                    }
                    title="Delete Course"
                    description={`Are you sure you want to delete "${course.title}"? This will remove all modules, lessons, and assignments.`}
                    confirmText="Delete Course"
                    variant="destructive"
                    onConfirm={handleDelete}
                    isLoading={deleteCourseMutation.isPending}
                  />
                </div>
              </StudioFormSection>
            </AndamioTabsContent>
          </AndamioTabs>
        </StudioEditorPane>
      </AndamioResizablePanel>
    </AndamioResizablePanelGroup>
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
