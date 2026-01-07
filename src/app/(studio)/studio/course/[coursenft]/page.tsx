"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useStudioHeader } from "~/components/layout/studio-header";
import { RequireCourseAccess } from "~/components/auth/require-course-access";
import { StudioFormSection } from "~/components/studio/studio-editor-pane";
import { StudioModuleCard } from "~/components/studio/studio-module-card";
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
} from "~/components/icons";
import { AndamioTabs, AndamioTabsList, AndamioTabsTrigger, AndamioTabsContent } from "~/components/andamio/andamio-tabs";
import { AndamioConfirmDialog } from "~/components/andamio/andamio-confirm-dialog";
import { AndamioText } from "~/components/andamio/andamio-text";
import { useCourse, useUpdateCourse, useDeleteCourse } from "~/hooks/api/use-course";
import { useCourseModules } from "~/hooks/api/use-course-module";
import { MintModuleTokens } from "~/components/transactions/mint-module-tokens";
import { cn } from "~/lib/utils";
import { toast } from "sonner";

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
          <CompletedIcon className="h-3 w-3 text-success" />
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

function CourseEditorContent({ courseNftPolicyId }: { courseNftPolicyId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL-based tab persistence
  const urlTab = searchParams.get("tab");
  const validTabs = ["modules", "details", "on-chain", "settings"];
  const activeTab = urlTab && validTabs.includes(urlTab) ? urlTab : "modules";

  // Update studio header
  const { setBreadcrumbs, setTitle, setActions } = useStudioHeader();

  // React Query hooks
  const { data: course, isLoading: isLoadingCourse, error: courseError } = useCourse(courseNftPolicyId);
  const { data: modules = [], isLoading: isLoadingModules, refetch: refetchModules } = useCourseModules(courseNftPolicyId);

  // Mutations
  const updateCourseMutation = useUpdateCourse();
  const deleteCourseMutation = useDeleteCourse();

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formInitialized, setFormInitialized] = useState(false);

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
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          asChild
        >
          <Link href={`/course/${courseNftPolicyId}`}>
            <PreviewIcon className="h-3.5 w-3.5 mr-1" />
            Preview
          </Link>
        </AndamioButton>
      </div>
    );
  }, [setActions, courseNftPolicyId]);

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
      <div className="min-h-full bg-gradient-to-b from-background via-background to-muted/20">
        {/* Course Header - Contextual based on module count */}
        {!isEmpty ? (
          <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-4xl mx-auto px-6 py-6">
              <div className="flex items-start justify-between gap-6">
                {/* Left: Course Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      {course.course_code}
                    </span>
                    {course.course_nft_policy_id && (
                      <AndamioBadge variant="default" className="text-[10px]">
                        <OnChainIcon className="h-2.5 w-2.5 mr-1" />
                        Published
                      </AndamioBadge>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">
                    {course.title ?? "Untitled Course"}
                  </h1>
                  {course.description && (
                    <AndamioText variant="muted" className="line-clamp-2">
                      {course.description}
                    </AndamioText>
                  )}
                </div>

                {/* Right: Stats */}
                <div className="flex items-center gap-4 text-center flex-shrink-0">
                  <div>
                    <div className="text-2xl font-bold text-foreground">{moduleStats.total}</div>
                    <AndamioText variant="small" className="text-[10px]">Credentials</AndamioText>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div>
                    <div className="text-2xl font-bold text-success">{moduleStats.onChain}</div>
                    <AndamioText variant="small" className="text-[10px]">On-Chain</AndamioText>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Content Area */}
        <div className={cn(
          "mx-auto px-6",
          isEmpty ? "max-w-5xl py-12" : "max-w-4xl py-6"
        )}>
          {isEmpty ? (
            /* Empty State - Full Welcome Experience (No Tabs) */
            <div className="flex flex-col items-center">
              {/* Course Title Banner */}
              <div className="text-center mb-10">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                    {course.course_code}
                  </span>
                  {course.course_nft_policy_id && (
                    <AndamioBadge variant="default" className="text-[10px]">
                      <OnChainIcon className="h-2.5 w-2.5 mr-1" />
                      Published
                    </AndamioBadge>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                  {course.title ?? "Untitled Course"}
                </h1>
                {course.description && (
                  <AndamioText variant="muted" className="mt-2 max-w-lg mx-auto">
                    {course.description}
                  </AndamioText>
                )}
              </div>

              {/* Hero Section */}
              <div className="text-center max-w-2xl mb-12">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 mx-auto mb-6 shadow-xl shadow-primary/30">
                  <CredentialIcon className="h-12 w-12 text-primary-foreground" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                  Create Your First Credential
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Every module is a <strong className="text-foreground">verifiable credential</strong> that learners earn on-chain.
                  Design what mastery looks like, and Andamio handles the rest.
                </p>
              </div>

              {/* Two Path Options */}
              <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl mb-16">
                {/* Guided Path */}
                <button
                  type="button"
                  onClick={() => router.push(`/studio/course/${courseNftPolicyId}/new?step=credential&mode=wizard`)}
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
                  onClick={() => router.push(`/studio/course/${courseNftPolicyId}/new?step=credential&mode=pro`)}
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
                  <div className="relative p-5 rounded-2xl bg-gradient-to-br from-info/10 via-info/5 to-transparent border border-info/20">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-info/20 mb-3">
                      <SLTIcon className="h-5 w-5 text-info" />
                    </div>
                    <div className="font-bold mb-1">Learning Targets</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Clear, measurable outcomes that define what &quot;mastery&quot; means
                    </p>
                  </div>
                  <div className="relative p-5 rounded-2xl bg-gradient-to-br from-success/10 via-success/5 to-transparent border border-success/20">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/20 mb-3">
                      <CourseIcon className="h-5 w-5 text-success" />
                    </div>
                    <div className="font-bold mb-1">Lessons</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Rich content that guides learners toward each target
                    </p>
                  </div>
                  <div className="relative p-5 rounded-2xl bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border border-warning/20">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/20 mb-3">
                      <CredentialIcon className="h-5 w-5 text-warning" />
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

              {/* Credentials Tab */}
              <AndamioTabsContent value="modules" className="mt-0">
                <div className="space-y-4">
                  {/* Add Credential Button */}
                  <div className="flex justify-end">
                    <AndamioButton
                      variant="outline"
                      onClick={() => router.push(`/studio/course/${courseNftPolicyId}/new?step=credential`)}
                    >
                      <AddIcon className="h-4 w-4 mr-2" />
                      Add Credential
                    </AndamioButton>
                  </div>

                  {/* Module Cards */}
                  <div className="grid gap-4">
                    {modules.map((courseModule) => (
                      <StudioModuleCard
                        key={courseModule.module_code}
                        courseModule={courseModule}
                        courseNftPolicyId={courseNftPolicyId}
                      />
                    ))}
                  </div>

                  {/* Footer Stats */}
                  {moduleStats.pending > 0 && (
                    <AndamioAlert className="mt-6">
                      <PendingIcon className="h-4 w-4 text-info animate-pulse" />
                      <AndamioAlertDescription>
                        {moduleStats.pending} credential{moduleStats.pending !== 1 ? "s" : ""} pending blockchain confirmation
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
                        href={`https://preprod.cardanoscan.io/tokenPolicy/${courseNftPolicyId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <ExternalLinkIcon className="h-4 w-4 mr-1" />
                        View
                      </a>
                    </AndamioButton>
                  </div>
                  <CopyableAddress address={courseNftPolicyId} />
                </div>
              </StudioFormSection>

              <StudioFormSection title="Module Status">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-xl border p-4 text-center">
                    <div className="text-3xl font-bold">{moduleStats.total}</div>
                    <AndamioText variant="small">Total</AndamioText>
                  </div>
                  <div className="rounded-xl border p-4 text-center bg-success/5 border-success/20">
                    <div className="text-3xl font-bold text-success">{moduleStats.onChain}</div>
                    <AndamioText variant="small">On-Chain</AndamioText>
                  </div>
                  <div className="rounded-xl border p-4 text-center bg-warning/5 border-warning/20">
                    <div className="text-3xl font-bold text-warning">{moduleStats.approved}</div>
                    <AndamioText variant="small">Ready to Mint</AndamioText>
                  </div>
                  <div className="rounded-xl border p-4 text-center">
                    <div className="text-3xl font-bold text-muted-foreground">{moduleStats.draft}</div>
                    <AndamioText variant="small">Draft</AndamioText>
                  </div>
                </div>
              </StudioFormSection>

              {/* Mint Modules - Show when there are approved modules ready to mint */}
              {moduleStats.approved > 0 && (
                <MintModuleTokens
                  courseNftPolicyId={courseNftPolicyId}
                  courseModules={modules.filter((m) => m.status === "APPROVED")}
                  onSuccess={() => void refetchModules()}
                />
              )}

              <StudioFormSection title="Blockchain Links">
                <div className="flex flex-wrap gap-3">
                  <AndamioButton variant="outline" asChild>
                    <a
                      href={`https://preprod.cardanoscan.io/tokenPolicy/${courseNftPolicyId}`}
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
                      href={`https://preprod.cexplorer.io/policy/${courseNftPolicyId}`}
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
            </AndamioTabsContent>

            {/* Settings Tab */}
            <AndamioTabsContent value="settings" className="mt-0 space-y-6">
              <StudioFormSection title="Course Code">
                <div className="space-y-2">
                  <AndamioInput
                    value={course.course_code}
                    disabled
                    className="font-mono"
                  />
                  <AndamioText variant="small">
                    Course code cannot be changed after creation
                  </AndamioText>
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
  const courseNftPolicyId = params.coursenft as string;

  return (
    <RequireCourseAccess
      courseNftPolicyId={courseNftPolicyId}
      title="Edit Course"
      description="Connect your wallet to edit this course"
      loadingVariant="studio-centered"
    >
      <CourseEditorContent courseNftPolicyId={courseNftPolicyId} />
    </RequireCourseAccess>
  );
}
