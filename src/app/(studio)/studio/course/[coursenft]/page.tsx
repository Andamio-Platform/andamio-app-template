"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useStudioHeader } from "~/components/layout/studio-header";
import { RequireCourseAccess } from "~/components/auth/require-course-access";
import { StudioFormSection } from "~/components/studio/studio-editor-pane";
import { StudioModuleCard } from "~/components/studio/studio-module-card";
import { CourseTeachersCard } from "~/components/studio/course-teachers-card";
import {
  AndamioButton,
  AndamioBadge,
  AndamioInput,
  AndamioLabel,
  AndamioTextarea,
  AndamioAlert,
  AndamioAlertTitle,
  AndamioAlertDescription,
  AndamioScrollArea,
  AndamioStudioLoading,
  AndamioSaveButton,
} from "~/components/andamio";
import {
  AlertIcon,
  AddIcon,
  SettingsIcon,
  CourseIcon,
  OnChainIcon,
  LessonIcon,
  DeleteIcon,
  PendingIcon,
  ExternalLinkIcon,
  ImagePlaceholderIcon,
  VideoIcon,
  CopyIcon,
  CompletedIcon,
  PreviewIcon,
  SparkleIcon,
  NextIcon,
  SLTIcon,
  CredentialIcon,
  VerifiedIcon,
  TeacherIcon,
} from "~/components/icons";
import { AndamioTabs, AndamioTabsList, AndamioTabsTrigger, AndamioTabsContent } from "~/components/andamio/andamio-tabs";
import { AndamioConfirmDialog } from "~/components/andamio/andamio-confirm-dialog";
import { AndamioText } from "~/components/andamio/andamio-text";
import { useCourse } from "~/hooks/api/course/use-course";
import { useUpdateCourse, useDeleteCourse } from "~/hooks/api/course/use-course-owner";
import { useTeacherCourseModules, useDeleteCourseModule, useRegisterCourseModule } from "~/hooks/api/course/use-course-module";
import { useTeacherCourses, useTeacherAssignmentCommitments } from "~/hooks/api/course/use-course-teacher";
import { TeachersUpdate } from "~/components/tx/teachers-update";
import { MintModuleTokens } from "~/components/tx/mint-module-tokens";
import { BurnModuleTokens, type ModuleToBurn } from "~/components/tx/burn-module-tokens";
import { AndamioCheckbox } from "~/components/andamio/andamio-checkbox";
import { AndamioSwitch } from "~/components/andamio/andamio-switch";
import { cn } from "~/lib/utils";
import { toast } from "sonner";
// Note: computeSltHashDefinite removed - no longer needed with hook-based data

// =============================================================================
// Types - Using hook types directly (CourseModule, CourseModuleStatus)
// =============================================================================
// The useTeacherCourseModules hook returns merged data with status:
// - "active": On-chain + DB (synced)
// - "draft" / "approved" / "pending_tx": DB only
// - "unregistered": On-chain only (needs registration)

// =============================================================================
// Helper Components
// =============================================================================

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
      <span className="text-[10px] text-muted-foreground font-mono flex-1 truncate">
        {address}
      </span>
      <AndamioButton
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 flex-shrink-0"
        onClick={handleCopy}
      >
        {copied ? (
          <CompletedIcon className="h-3 w-3 text-primary" />
        ) : (
          <CopyIcon className="h-3 w-3" />
        )}
      </AndamioButton>
    </div>
  );
}

function ImagePreview({ url, alt }: { url: string; alt: string }) {
  const [error, setError] = useState(false);

  if (!url || error) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-dashed bg-muted/30">
        <ImagePlaceholderIcon className="h-6 w-6 text-muted-foreground/50" />
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

function VideoPreview({ url }: { url: string }) {
  const embedUrl = useMemo(() => {
    if (!url) return null;
    const ytRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/;
    const ytMatch = ytRegex.exec(url);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoRegex = /vimeo\.com\/(\d+)/;
    const vimeoMatch = vimeoRegex.exec(url);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return null;
  }, [url]);

  if (!url) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-dashed bg-muted/30">
        <VideoIcon className="h-6 w-6 text-muted-foreground/50" />
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border bg-muted/30">
        <div className="text-center">
          <VideoIcon className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
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

// =============================================================================
// Main Component
// =============================================================================

function CourseEditorContent({ courseId }: { courseId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL-based tab persistence
  const urlTab = searchParams.get("tab");
  const validTabs = ["modules", "details", "on-chain", "settings"];
  const activeTab = urlTab && validTabs.includes(urlTab) ? urlTab : "modules";

  // Update studio header
  const { setBreadcrumbs, setTitle, setActions } = useStudioHeader();

  // React Query hooks - Database
  const { data: course, isLoading: isLoadingCourse, error: courseError, refetch: refetchCourse } = useCourse(courseId);
  const { data: modules = [], isLoading: isLoadingModules, refetch: refetchModules } = useTeacherCourseModules(courseId);
  const { data: teacherCourses = [] } = useTeacherCourses();

  // Get course title - prefer teacher courses list (has DB title) over course detail
  const courseTitle = useMemo(() => {
    const teacherCourse = teacherCourses.find(c => c.courseId === courseId);
    return teacherCourse?.title || course?.title || "Untitled Course";
  }, [teacherCourses, courseId, course?.title]);

  // Fetch assignment commitments for this course, filter to pending review only
  const { data: allCommitmentsForCourse = [] } = useTeacherAssignmentCommitments(courseId);
  const pendingCommitmentsForCourse = useMemo(
    () => allCommitmentsForCourse.filter((c) => c.commitmentStatus === "PENDING_APPROVAL"),
    [allCommitmentsForCourse]
  );

  // =============================================================================
  // Module Stats - All derived from hook data (useTeacherCourseModules)
  // =============================================================================
  // The hook returns merged data where status indicates lifecycle:
  // - "active": On-chain + DB (synced, verified)
  // - "approved": DB only, ready to mint
  // - "draft": DB only, still editing
  // - "pending_tx": TX submitted, awaiting confirmation
  // - "unregistered": On-chain only, needs DB registration

  // Modules by status (for UI filtering)
  const activeModules = useMemo(() =>
    modules.filter((m) => m.status === "active"),
    [modules]
  );

  const modulesReadyToMint = useMemo(() =>
    modules.filter((m) => m.status === "approved"),
    [modules]
  );

  const draftModules = useMemo(() =>
    modules.filter((m) => m.status === "draft"),
    [modules]
  );

  const pendingModules = useMemo(() =>
    modules.filter((m) => m.status === "pending_tx"),
    [modules]
  );

  // Module stats for display
  const moduleStats = useMemo(() => ({
    total: modules.length,
    active: activeModules.length,
    approved: modulesReadyToMint.length,
    draft: draftModules.length,
    pending: pendingModules.length,
    unregistered: modules.filter((m) => m.status === "unregistered").length,
    readyToMint: modulesReadyToMint.length,
  }), [modules, activeModules, modulesReadyToMint, draftModules, pendingModules]);

  // Unregistered modules (on-chain only, need DB registration)
  // Use hook data directly instead of hybridModules for consistency
  const unregisteredModules = useMemo(() =>
    modules.filter((m) => m.status === "unregistered"),
    [modules]
  );

  // Mutations
  const updateCourseMutation = useUpdateCourse();
  const deleteCourseMutation = useDeleteCourse();
  const deleteModuleMutation = useDeleteCourseModule();
  const registerModuleMutation = useRegisterCourseModule();

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formInitialized, setFormInitialized] = useState(false);

  // Burn selection state - stores on-chain hashes of selected modules
  const [selectedForBurn, setSelectedForBurn] = useState<Set<string>>(new Set());

  // Registration state for unregistered modules
  const [registeringHash, setRegisteringHash] = useState<string | null>(null);
  const [registerModuleCode, setRegisterModuleCode] = useState("");

  // Get modules selected for burn with full details
  // Active modules are on-chain, use sltHash as the on-chain identifier
  const modulesToBurn = useMemo<ModuleToBurn[]>(() => {
    return activeModules
      .filter((m) => m.sltHash && selectedForBurn.has(m.sltHash))
      .map((m) => ({
        moduleCode: m.moduleCode ?? "",
        title: m.title ?? null,
        onChainHash: m.sltHash,
        sltCount: m.onChainSlts?.length ?? 0,
      }));
  }, [activeModules, selectedForBurn]);

  // Toggle selection for a module
  const toggleBurnSelection = (onChainHash: string) => {
    setSelectedForBurn((prev) => {
      const next = new Set(prev);
      if (next.has(onChainHash)) {
        next.delete(onChainHash);
      } else {
        next.add(onChainHash);
      }
      return next;
    });
  };

  // Clear all burn selections
  const clearBurnSelection = () => {
    setSelectedForBurn(new Set());
  };

  // Sync form state when course data loads
  useEffect(() => {
    if (course && !formInitialized) {
      setFormTitle(course.title ?? "");
      setFormDescription(course.description ?? "");
      setFormImageUrl(course.imageUrl ?? "");
      // Note: video_url not available in merged OrchestrationCourseContent
      setFormVideoUrl("");
      setFormInitialized(true);
    }
  }, [course, formInitialized]);

  // Update header when course loads
  useEffect(() => {
    if (course) {
      setTitle(courseTitle);
      setBreadcrumbs([
        { label: "Studio", href: "/studio" },
        { label: courseTitle },
      ]);
    }
  }, [course, courseTitle, setBreadcrumbs, setTitle]);

  // Update header actions
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <AndamioButton
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          asChild
        >
          <Link href={`/course/${courseId}?preview=teacher`}>
            <PreviewIcon className="h-3.5 w-3.5 mr-1" />
            Preview
          </Link>
        </AndamioButton>
      </div>
    );
  }, [setActions, courseId]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSave = async () => {
    if (!course) return;

    try {
      await updateCourseMutation.mutateAsync({
        courseId: courseId,
        data: {
          title: formTitle || undefined,
          description: formDescription || undefined,
          imageUrl: formImageUrl || undefined,
          videoUrl: formVideoUrl || undefined,
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
      await deleteCourseMutation.mutateAsync(courseId);
      toast.success("Course deleted");
      router.push("/studio");
    } catch (err) {
      toast.error("Failed to delete", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleToggleVisibility = async (isPublic: boolean) => {
    if (!course) return;
    try {
      await updateCourseMutation.mutateAsync({
        courseId: courseId,
        data: { isPublic },
      });
      toast.success(isPublic ? "Course is now public" : "Course is now private");
    } catch (err) {
      toast.error("Failed to update visibility", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleDeleteModule = async (moduleCode: string, moduleTitle: string | null) => {
    if (!confirm(`Delete module "${moduleTitle ?? moduleCode}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteModuleMutation.mutateAsync({
        courseId: courseId,
        moduleCode,
      });
      toast.success(`Module "${moduleCode}" deleted`);
    } catch (err) {
      toast.error("Failed to delete module", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleRegisterModule = async (sltHash: string) => {
    if (!registerModuleCode.trim()) {
      toast.error("Please enter a module code");
      return;
    }
    try {
      const result = await registerModuleMutation.mutateAsync({
        courseId: courseId,
        moduleCode: registerModuleCode.trim(),
        sltHash,
      });
      toast.success(`Registered module "${registerModuleCode}" with ${result?.sltCount ?? 0} SLTs`);
      setRegisteringHash(null);
      setRegisterModuleCode("");
      // Refetch to show updated data
      await refetchModules();
      await refetchCourse();
    } catch (err) {
      toast.error("Failed to register module", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  // Computed values
  const isLoading = isLoadingCourse || isLoadingModules;
  // Note: video_url comparison is always vs "" since it's not in merged type
  const hasChanges = course && (
    formTitle !== (course.title ?? "") ||
    formDescription !== (course.description ?? "") ||
    formImageUrl !== (course.imageUrl ?? "") ||
    formVideoUrl !== ""
  );

  // Loading state
  if (isLoading && !course) {
    return <AndamioStudioLoading variant="centered" />;
  }

  // Error state
  if (courseError || !course) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <AndamioAlert variant="destructive" className="max-w-md">
          <AlertIcon className="h-4 w-4" />
          <AndamioAlertDescription>
            {courseError instanceof Error ? courseError.message : "Course not found"}
          </AndamioAlertDescription>
        </AndamioAlert>
      </div>
    );
  }

  // Check if we're in empty state (no modules)
  const isEmpty = modules.length === 0;

  return (
    <AndamioScrollArea className="h-full">
      <div className="min-h-full">
        {/* Content Area */}
        <div className={cn(
          "mx-auto px-6",
          isEmpty ? "max-w-5xl py-8" : "max-w-4xl py-6"
        )}>
          {/* Course Header - Always visible */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">{courseTitle}</h1>
            {!isEmpty && (
              <div className="flex items-center gap-3">
                <AndamioBadge variant="default" className="text-[10px]">
                  <OnChainIcon className="h-2.5 w-2.5 mr-1" />
                  Published
                </AndamioBadge>
                <span className="text-sm text-muted-foreground">
                  {moduleStats.active} active · {moduleStats.draft + moduleStats.approved} draft
                </span>
              </div>
            )}
          </div>
          {isEmpty ? (
            /* Empty State - Full Welcome Experience (No Tabs) */
            <div className="flex flex-col items-center">
              {/* Hero Section */}
              <div className="text-center max-w-2xl mb-12">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 mx-auto mb-6 shadow-xl shadow-primary/30">
                  <CredentialIcon className="h-12 w-12 text-primary-foreground" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                  Create Your First Credential
                </h2>
                <AndamioText variant="muted" className="text-lg leading-relaxed">
                  Every module is a <strong className="text-foreground">verifiable credential</strong> that learners earn on-chain.
                  Design what mastery looks like, and Andamio handles the rest.
                </AndamioText>
              </div>

              {/* Two Path Options */}
              <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl mb-16">
                {/* Guided Path */}
                <button
                  type="button"
                  onClick={() => router.push(`/studio/course/${courseId}/new?step=credential&mode=wizard`)}
                  className="group relative text-left p-6 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300"
                >
                  <div className="absolute top-4 right-4">
                    <AndamioBadge variant="default" className="text-[10px] shadow-sm">
                      Recommended
                    </AndamioBadge>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 mb-4 group-hover:scale-110 group-hover:bg-primary/30 transition-all">
                    <SparkleIcon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Guided Setup</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    Walk through each step: define the credential, set learning targets, write lessons, and create an assignment.
                  </p>
                  <div className="flex items-center text-primary font-semibold">
                    Start Building
                    <NextIcon className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Pro Path */}
                <button
                  type="button"
                  onClick={() => router.push(`/studio/course/${courseId}/new?step=credential&mode=pro`)}
                  className="group text-left p-6 rounded-2xl border-2 border-border bg-gradient-to-br from-muted/50 via-muted/20 to-background hover:border-border/80 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4 group-hover:scale-110 group-hover:bg-muted/80 transition-all">
                    <OnChainIcon className="h-7 w-7 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Quick Create</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    Jump directly into the editor. Best for experienced builders who want full control from the start.
                  </p>
                  <div className="flex items-center text-muted-foreground group-hover:text-foreground font-semibold transition-colors">
                    Create Credential
                    <NextIcon className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Credential Anatomy */}
              <div className="w-full max-w-3xl">
                <div className="text-center mb-8">
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Anatomy of a Credential
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Each credential (module) contains everything needed to verify competency
                  </p>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="relative p-5 rounded-2xl bg-gradient-to-br from-info/10 via-info/5 to-transparent border border-secondary/20">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/20 mb-3">
                      <SLTIcon className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="font-bold mb-1">Learning Targets</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Clear, measurable outcomes that define what &quot;mastery&quot; means
                    </p>
                  </div>
                  <div className="relative p-5 rounded-2xl bg-gradient-to-br from-success/10 via-success/5 to-transparent border border-primary/20">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/20 mb-3">
                      <CourseIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="font-bold mb-1">Lessons</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Rich content that guides learners toward each target
                    </p>
                  </div>
                  <div className="relative p-5 rounded-2xl bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border border-muted-foreground/20">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/20 mb-3">
                      <CredentialIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="font-bold mb-1">Assignment</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Real-world contribution that proves competency
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Has Modules - Show Tabs Interface */
            <AndamioTabs value={activeTab} onValueChange={handleTabChange}>
              {course.isPublic === false && (
                <AndamioAlert className="mb-4">
                  <AlertIcon className="h-4 w-4" />
                  <AndamioAlertTitle>Course is private</AndamioAlertTitle>
                  <AndamioAlertDescription>
                    <AndamioText>
                      Private courses are hidden from Browse Courses. Set this course to Public to
                      make it visible to learners.
                    </AndamioText>
                    <AndamioButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleTabChange("settings")}
                      className="mt-2"
                    >
                      Open Settings
                    </AndamioButton>
                  </AndamioAlertDescription>
                </AndamioAlert>
              )}
              <AndamioTabsList className="w-auto inline-flex h-9 mb-6">
                <AndamioTabsTrigger value="modules" className="text-sm gap-1.5 px-4">
                  <CredentialIcon className="h-4 w-4" />
                  Credentials
                </AndamioTabsTrigger>
                <AndamioTabsTrigger value="details" className="text-sm gap-1.5 px-4">
                  <LessonIcon className="h-4 w-4" />
                  Details
                </AndamioTabsTrigger>
                <AndamioTabsTrigger value="on-chain" className="text-sm gap-1.5 px-4">
                  <OnChainIcon className="h-4 w-4" />
                  On-Chain
                </AndamioTabsTrigger>
                <AndamioTabsTrigger value="settings" className="text-sm gap-1.5 px-4">
                  <SettingsIcon className="h-4 w-4" />
                  Settings
                </AndamioTabsTrigger>
              </AndamioTabsList>

              {/* Pending Reviews CTA - Show when there are commitments awaiting teacher review */}
              {pendingCommitmentsForCourse.length > 0 && (
                <AndamioAlert className="mb-6 border-secondary/30 bg-secondary/5">
                  <TeacherIcon className="h-4 w-4 text-secondary" />
                  <AndamioAlertTitle className="text-secondary">
                    {pendingCommitmentsForCourse.length} Assignment{pendingCommitmentsForCourse.length !== 1 ? "s" : ""} Pending Review
                  </AndamioAlertTitle>
                  <AndamioAlertDescription className="flex items-center justify-between gap-4">
                    <span>
                      Student{pendingCommitmentsForCourse.length !== 1 ? "s have" : " has"} submitted work that needs your assessment.
                    </span>
                    <AndamioButton
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0 border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary dark:hover:bg-secondary/10"
                      asChild
                    >
                      <Link href={`/studio/course/${courseId}/teacher`}>
                        Review Submissions
                      </Link>
                    </AndamioButton>
                  </AndamioAlertDescription>
                </AndamioAlert>
              )}

              {/* Credentials Tab */}
              <AndamioTabsContent value="modules" className="mt-0">
                <div className="space-y-4">
                  {/* Module Cards */}
                  <div className="grid gap-4">
                    {modules.map((courseModule, index) => (
                      <StudioModuleCard
                        key={courseModule.sltHash || courseModule.moduleCode || `module-${index}`}
                        courseModule={courseModule}
                        courseId={courseId}
                        onDelete={() => handleDeleteModule(courseModule.moduleCode ?? "", courseModule.title ?? null)}
                        isDeleting={deleteModuleMutation.isPending}
                      />
                    ))}
                  </div>

                  {/* Add Credential Button - Centered at bottom */}
                  <div className="flex justify-center pt-4">
                    <AndamioButton
                      variant="outline"
                      onClick={() => router.push(`/studio/course/${courseId}/new?step=credential`)}
                    >
                      <AddIcon className="h-4 w-4 mr-2" />
                      Add Credential
                    </AndamioButton>
                  </div>

                  {/* Footer Stats */}
                  {moduleStats.pending > 0 && (
                    <AndamioAlert className="mt-6">
                      <PendingIcon className="h-4 w-4 text-secondary animate-pulse" />
                      <AndamioAlertDescription>
                        {moduleStats.pending} credential{moduleStats.pending !== 1 ? "s" : ""} pending blockchain confirmation
                      </AndamioAlertDescription>
                    </AndamioAlert>
                  )}

                  {/* Unregistered Modules CTA */}
                  {moduleStats.unregistered > 0 && (
                    <AndamioAlert className="mt-6 border-secondary/30 bg-secondary/5">
                      <OnChainIcon className="h-4 w-4 text-secondary" />
                      <AndamioAlertDescription className="flex items-center justify-between gap-4">
                        <span>
                          {moduleStats.unregistered} on-chain module{moduleStats.unregistered !== 1 ? "s need" : " needs"} to be registered before you can add content.
                        </span>
                        <AndamioButton
                          size="sm"
                          variant="outline"
                          className="flex-shrink-0 border-secondary/30 text-secondary hover:bg-secondary/10"
                          onClick={() => handleTabChange("on-chain")}
                        >
                          Go to On-Chain Tab
                        </AndamioButton>
                      </AndamioAlertDescription>
                    </AndamioAlert>
                  )}
                </div>
              </AndamioTabsContent>

            {/* Details Tab */}
            <AndamioTabsContent value="details" className="mt-0 space-y-6">
              <div className="flex justify-end">
                <AndamioSaveButton
                  onClick={handleSave}
                  isSaving={updateCourseMutation.isPending}
                  disabled={!hasChanges}
                />
              </div>

              <StudioFormSection title="Course Information">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <AndamioLabel htmlFor="title">Title</AndamioLabel>
                    <AndamioInput
                      id="title"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Course title"
                    />
                  </div>

                  <div className="space-y-2">
                    <AndamioLabel htmlFor="description">Description</AndamioLabel>
                    <AndamioTextarea
                      id="description"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Course description"
                      rows={4}
                    />
                  </div>
                </div>
              </StudioFormSection>

              <StudioFormSection title="Media">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <AndamioLabel htmlFor="imageUrl" className="flex items-center gap-2">
                      <ImagePlaceholderIcon className="h-4 w-4" />
                      Cover Image
                    </AndamioLabel>
                    <ImagePreview url={formImageUrl} alt={formTitle || "Course cover"} />
                    <AndamioInput
                      id="imageUrl"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-3">
                    <AndamioLabel htmlFor="videoUrl" className="flex items-center gap-2">
                      <VideoIcon className="h-4 w-4" />
                      Intro Video
                    </AndamioLabel>
                    <VideoPreview url={formVideoUrl} />
                    <AndamioInput
                      id="videoUrl"
                      value={formVideoUrl}
                      onChange={(e) => setFormVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                </div>
              </StudioFormSection>

              {/* Course Team */}
              <CourseTeachersCard courseId={courseId} />

              {/* Manage Teachers (On-Chain Transaction) */}
              <TeachersUpdate
                courseId={courseId}
                currentTeachers={course.teachers ?? []}
                onSuccess={() => {
                  void refetchCourse();
                }}
              />
            </AndamioTabsContent>

            {/* On-Chain Tab */}
            <AndamioTabsContent value="on-chain" className="mt-0 space-y-6">
              <StudioFormSection title="Course NFT">
                <div className="rounded-xl border p-4 bg-muted/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <OnChainIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <AndamioText className="font-medium">Policy ID</AndamioText>
                        <AndamioText variant="small">Unique on-chain identifier</AndamioText>
                      </div>
                    </div>
                    <AndamioButton variant="outline" size="sm" asChild>
                      <a
                        href={`https://preprod.cardanoscan.io/tokenPolicy/${courseId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <ExternalLinkIcon className="h-4 w-4 mr-1" />
                        View
                      </a>
                    </AndamioButton>
                  </div>
                  <CopyableAddress address={courseId} />
                </div>
              </StudioFormSection>

              <StudioFormSection title="Module Verification">
                {/* Summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="rounded-xl border p-3 text-center">
                    <div className="text-2xl font-bold">{moduleStats.total}</div>
                    <AndamioText variant="small" className="text-[10px]">Total Modules</AndamioText>
                  </div>
                  <div className="rounded-xl border p-3 text-center bg-primary/5 border-primary/20">
                    <div className="flex items-center justify-center gap-1.5">
                      <VerifiedIcon className="h-4 w-4 text-primary" />
                      <span className="text-2xl font-bold text-primary">{moduleStats.active}</span>
                    </div>
                    <AndamioText variant="small" className="text-[10px]">Verified</AndamioText>
                  </div>
                  {moduleStats.pending > 0 && (
                    <div className="rounded-xl border p-3 text-center bg-secondary/5 border-secondary/20">
                      <div className="flex items-center justify-center gap-1.5">
                        <PendingIcon className="h-4 w-4 text-secondary animate-pulse" />
                        <span className="text-2xl font-bold text-secondary">{moduleStats.pending}</span>
                      </div>
                      <AndamioText variant="small" className="text-[10px]">Pending</AndamioText>
                    </div>
                  )}
                  {moduleStats.readyToMint > 0 && (
                    <div className="rounded-xl border p-3 text-center bg-muted/5 border-muted-foreground/20">
                      <span className="text-2xl font-bold text-muted-foreground">{moduleStats.readyToMint}</span>
                      <AndamioText variant="small" className="text-[10px]">Ready to Mint</AndamioText>
                    </div>
                  )}
                  {moduleStats.unregistered > 0 && (
                    <div className="rounded-xl border p-3 text-center bg-secondary/5 border-secondary/20">
                      <div className="flex items-center justify-center gap-1.5">
                        <OnChainIcon className="h-4 w-4 text-secondary" />
                        <span className="text-2xl font-bold text-secondary">{moduleStats.unregistered}</span>
                      </div>
                      <AndamioText variant="small" className="text-[10px]">Unregistered</AndamioText>
                    </div>
                  )}
                </div>

                {/* Module verification list - show registered modules by status */}
                <div className="space-y-3">
                  {modules.filter((m) => m.status !== "unregistered").map((m) => {
                    const isActive = m.status === "active";
                    const isPending = m.status === "pending_tx";
                    const isDbOnly = m.status === "draft" || m.status === "approved";
                    const sltCount = m.onChainSlts?.length ?? m.slts?.length ?? 0;

                    return (
                      <div
                        key={m.sltHash || m.moduleCode || m.title}
                        className={cn(
                          "rounded-xl border p-4 space-y-3",
                          isActive && "bg-primary/5 border-primary/20",
                          isPending && "bg-secondary/5 border-secondary/20",
                          isDbOnly && "bg-muted/30"
                        )}
                      >
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Selection checkbox for active (on-chain) modules */}
                            {isActive && m.sltHash ? (
                              <AndamioCheckbox
                                checked={selectedForBurn.has(m.sltHash)}
                                onCheckedChange={() => toggleBurnSelection(m.sltHash)}
                                aria-label={`Select ${m.moduleCode} for removal`}
                              />
                            ) : null}
                            {/* Status icon */}
                            {isActive && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                                <VerifiedIcon className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            {isPending && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/20">
                                <PendingIcon className="h-4 w-4 text-secondary animate-pulse" />
                              </div>
                            )}
                            {isDbOnly && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                <CredentialIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            {/* Module info */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-sm font-medium">{m.moduleCode}</span>
                                {isActive && (
                                  <AndamioBadge className="bg-primary/20 text-primary border-0 text-[10px]">
                                    Verified
                                  </AndamioBadge>
                                )}
                                {isPending && (
                                  <AndamioBadge className="bg-secondary/20 text-secondary border-0 text-[10px]">
                                    Pending
                                  </AndamioBadge>
                                )}
                                {isDbOnly && (
                                  <AndamioBadge variant="outline" className="text-[10px]">
                                    Not Minted
                                  </AndamioBadge>
                                )}
                              </div>
                              {m.title && (
                                <AndamioText variant="small" className="truncate">{m.title}</AndamioText>
                              )}
                            </div>
                          </div>
                          {/* SLT count */}
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-medium">{sltCount} SLTs</div>
                            <AndamioText variant="small" className="text-[10px]">
                              {isActive ? "On-Chain" : "Database"}
                            </AndamioText>
                          </div>
                        </div>

                        {/* SLTs from on-chain (for active modules) */}
                        {isActive && (m.onChainSlts?.length ?? 0) > 0 && (
                          <div className="space-y-1.5 pl-11">
                            <AndamioText variant="small" className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              On-Chain Learning Targets
                            </AndamioText>
                            <div className="space-y-1">
                              {m.onChainSlts?.map((slt, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                  <SLTIcon className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                                  <span>{slt}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hash display for on-chain modules */}
                        {isActive && m.sltHash && (
                          <div className="space-y-2 pl-11">
                            <AndamioText variant="small" className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              Token Name (Hash)
                            </AndamioText>
                            <div className="flex items-center gap-2">
                              <OnChainIcon className="h-3 w-3 text-primary flex-shrink-0" />
                              <code className="text-[10px] font-mono text-foreground bg-primary/10 px-1.5 py-0.5 rounded break-all">
                                {m.sltHash}
                              </code>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </StudioFormSection>

              {/* Mint Modules - Show when there are modules ready to mint (APPROVED but not yet on-chain) */}
              {moduleStats.readyToMint > 0 && (
                <MintModuleTokens
                  courseId={courseId}
                  courseModules={modulesReadyToMint}
                  onSuccess={async () => {
                    await refetchModules();
                    await refetchCourse();
                  }}
                />
              )}

              {/* Burn Modules - Show when modules are selected for removal */}
              {modulesToBurn.length > 0 && (
                <BurnModuleTokens
                  courseId={courseId}
                  modulesToBurn={modulesToBurn}
                  onClearSelection={clearBurnSelection}
                  onSuccess={async () => {
                    await refetchModules();
                    await refetchCourse();
                  }}
                />
              )}

              {/* Unregistered Modules - On-chain but not in database */}
              {unregisteredModules.length > 0 && (
                <StudioFormSection title="Unregistered Modules">
                  <AndamioAlert className="mb-4">
                    <OnChainIcon className="h-4 w-4 text-secondary" />
                    <AndamioAlertDescription>
                      These modules exist on-chain but aren&apos;t registered in the database yet.
                      Register them to add lessons, assignments, and other content.
                    </AndamioAlertDescription>
                  </AndamioAlert>

                  <div className="space-y-3">
                    {unregisteredModules.map((m) => (
                      <div
                        key={m.sltHash}
                        className="rounded-xl border p-4 bg-secondary/5 border-secondary/20 space-y-4"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/20">
                              <OnChainIcon className="h-4 w-4 text-secondary" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-sm font-medium text-secondary">
                                  On-Chain Only
                                </span>
                                <AndamioBadge className="bg-secondary/20 text-secondary border-0 text-[10px]">
                                  Needs Registration
                                </AndamioBadge>
                              </div>
                              <AndamioText variant="small" className="font-mono text-[10px] truncate">
                                {m.sltHash}
                              </AndamioText>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-medium">{m.onChainSlts?.length ?? 0} SLTs</div>
                            <AndamioText variant="small" className="text-[10px]">On-Chain</AndamioText>
                          </div>
                        </div>

                        {/* SLTs preview */}
                        {(m.onChainSlts?.length ?? 0) > 0 && (
                          <div className="space-y-1.5 pl-11">
                            <AndamioText variant="small" className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              Learning Targets (On-Chain)
                            </AndamioText>
                            <div className="space-y-1">
                              {m.onChainSlts?.map((slt, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                  <SLTIcon className="h-3.5 w-3.5 mt-0.5 text-secondary flex-shrink-0" />
                                  <span className="text-muted-foreground">{slt}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Registration form */}
                        {registeringHash === m.sltHash ? (
                          <div className="space-y-3 pl-11">
                            <div className="space-y-2">
                              <AndamioLabel htmlFor={`module-code-${m.sltHash}`}>
                                Module Code
                              </AndamioLabel>
                              <AndamioInput
                                id={`module-code-${m.sltHash}`}
                                value={registerModuleCode}
                                onChange={(e) => setRegisterModuleCode(e.target.value)}
                                placeholder="e.g., 101 or MODULE-A"
                                className="max-w-xs font-mono"
                              />
                              <AndamioText variant="small">
                                Choose a unique code to identify this module in your course
                              </AndamioText>
                            </div>
                            <div className="flex gap-2">
                              <AndamioButton
                                size="sm"
                                onClick={() => handleRegisterModule(m.sltHash)}
                                disabled={registerModuleMutation.isPending || !registerModuleCode.trim()}
                              >
                                {registerModuleMutation.isPending ? (
                                  <>
                                    <PendingIcon className="h-4 w-4 mr-1 animate-spin" />
                                    Registering...
                                  </>
                                ) : (
                                  <>
                                    <AddIcon className="h-4 w-4 mr-1" />
                                    Register Module
                                  </>
                                )}
                              </AndamioButton>
                              <AndamioButton
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setRegisteringHash(null);
                                  setRegisterModuleCode("");
                                }}
                                disabled={registerModuleMutation.isPending}
                              >
                                Cancel
                              </AndamioButton>
                            </div>
                          </div>
                        ) : (
                          <div className="pl-11">
                            <AndamioButton
                              size="sm"
                              variant="outline"
                              onClick={() => setRegisteringHash(m.sltHash)}
                            >
                              <AddIcon className="h-4 w-4 mr-1" />
                              Register This Module
                            </AndamioButton>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </StudioFormSection>
              )}

              {/* Only show blockchain links after modules are minted */}
              {activeModules.length > 0 && (
                <StudioFormSection title="Blockchain Links">
                  <div className="flex flex-wrap gap-3">
                    <AndamioButton variant="outline" asChild>
                      <a
                        href={`https://preprod.cardanoscan.io/tokenPolicy/${courseId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <ExternalLinkIcon className="h-4 w-4 mr-2" />
                        CardanoScan
                      </a>
                    </AndamioButton>
                    <AndamioButton variant="outline" asChild>
                      <a
                        href={`https://preprod.cexplorer.io/policy/${courseId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <ExternalLinkIcon className="h-4 w-4 mr-2" />
                        Cexplorer
                      </a>
                    </AndamioButton>
                  </div>
                </StudioFormSection>
              )}
            </AndamioTabsContent>

            {/* Settings Tab */}
            <AndamioTabsContent value="settings" className="mt-0 space-y-6">
              <StudioFormSection title="Course ID">
                <div className="space-y-2">
                  <AndamioInput
                    value={course.courseId ?? courseId}
                    disabled
                    className="font-mono"
                  />
                  <AndamioText variant="small">
                    Course ID cannot be changed after creation
                  </AndamioText>
                </div>
              </StudioFormSection>

              <StudioFormSection title="Visibility">
                <div className="rounded-xl border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <AndamioLabel htmlFor="visibility-toggle" className="text-base font-medium">
                        Public Course
                      </AndamioLabel>
                      <AndamioText variant="small">
                        Public courses appear in the course catalog and can be discovered by learners.
                        Private courses are only visible to owners and teachers.
                      </AndamioText>
                    </div>
                    <AndamioSwitch
                      id="visibility-toggle"
                      checked={course.isPublic ?? false}
                      onCheckedChange={handleToggleVisibility}
                      disabled={updateCourseMutation.isPending}
                    />
                  </div>
                  {course.isPublic ? (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CompletedIcon className="h-4 w-4" />
                      This course is visible in Browse Courses
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertIcon className="h-4 w-4" />
                      This course is hidden from Browse Courses
                    </div>
                  )}
                </div>
              </StudioFormSection>

              <StudioFormSection title="Danger Zone">
                <div className="rounded-xl border border-destructive/50 p-4 space-y-3">
                  <AndamioText variant="muted">
                    Permanently delete this course and all its content. This action cannot be undone.
                  </AndamioText>
                  <AndamioConfirmDialog
                    trigger={
                      <AndamioButton
                        variant="destructive"
                        disabled={deleteCourseMutation.isPending}
                      >
                        <DeleteIcon className="h-4 w-4 mr-2" />
                        Delete Course
                      </AndamioButton>
                    }
                    title="Delete Course"
                    description={`Are you sure you want to delete "${course.title ?? "this course"}"? This will remove all modules, lessons, and assignments.`}
                    confirmText="Delete Course"
                    variant="destructive"
                    onConfirm={handleDelete}
                    isLoading={deleteCourseMutation.isPending}
                  />
                </div>
              </StudioFormSection>
            </AndamioTabsContent>
            </AndamioTabs>
          )}
        </div>
      </div>
    </AndamioScrollArea>
  );
}

/**
 * Studio Course Edit Page
 *
 * Clean, breathable layout for course overview and module management.
 * Modules are front and center - the heart of every course.
 */
export default function StudioCourseEditPage() {
  const params = useParams();
  const courseId = params.coursenft as string;

  return (
    <RequireCourseAccess
      courseId={courseId}
      title="Edit Course"
      description="Connect your wallet to edit this course"
      loadingVariant="studio-centered"
    >
      <CourseEditorContent courseId={courseId} />
    </RequireCourseAccess>
  );
}
