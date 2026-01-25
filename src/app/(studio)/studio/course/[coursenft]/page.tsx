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
  VerifiedIcon,
  WarningIcon,
} from "~/components/icons";
import { AndamioTabs, AndamioTabsList, AndamioTabsTrigger, AndamioTabsContent } from "~/components/andamio/andamio-tabs";
import { AndamioConfirmDialog } from "~/components/andamio/andamio-confirm-dialog";
import { AndamioText } from "~/components/andamio/andamio-text";
import { useCourse } from "~/hooks/api/course/use-course";
import { useUpdateCourse, useDeleteCourse } from "~/hooks/api/course/use-course-owner";
import { useTeacherCourseModules, useDeleteCourseModule, useRegisterCourseModule } from "~/hooks/api/course/use-course-module";
import { MintModuleTokens } from "~/components/tx/mint-module-tokens";
import { BurnModuleTokens, type ModuleToBurn } from "~/components/tx/burn-module-tokens";
import { AndamioCheckbox } from "~/components/andamio/andamio-checkbox";
import { cn } from "~/lib/utils";
import { toast } from "sonner";
import type { CourseModule } from "~/hooks/api";
import { computeSltHashDefinite } from "@andamio/core/hashing";

// =============================================================================
// Types
// =============================================================================

/**
 * Sync status for modules - indicates where data exists
 */
type ModuleSyncStatus = "synced" | "db-only" | "onchain-only";

/**
 * How the module was matched between DB and on-chain
 */
type MatchType = "hash" | "slt-content" | "none";

/**
 * Hybrid module data combining DB and on-chain sources
 */
interface HybridModule {
  /** Module code from database (or derived from on-chain data) */
  moduleCode: string;
  /** Module hash stored in database (may be null if not yet minted) */
  dbStoredHash: string | null;
  /** Hash computed from current DB SLTs (for verification) */
  dbComputedHash: string | null;
  /** On-chain hash (assignment_id from merged API) */
  onChainHash: string | null;
  /** Title from database */
  title: string | null;
  /** Where this module exists */
  syncStatus: ModuleSyncStatus;
  /** How the match was determined */
  matchType: MatchType;
  /** Whether there's a hash mismatch (SLTs match but hashes don't) */
  hashMismatch: boolean;
  /** Database record (if exists) */
  dbModule: CourseModule | null;
  /** On-chain data (if exists) */
  onChainModule: CourseModule | null;
  /** SLTs from database */
  dbSlts: string[];
  /** SLTs from on-chain (source of truth when on-chain) */
  onChainSlts: string[];
}

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

  // React Query hooks - Database
  const { data: course, isLoading: isLoadingCourse, error: courseError, refetch: refetchCourse } = useCourse(courseNftPolicyId);
  const { data: modules = [], isLoading: isLoadingModules, refetch: refetchModules } = useTeacherCourseModules(courseNftPolicyId);

  // On-chain modules from merged course data
  const onChainModules = useMemo(() => course?.modules ?? [], [course?.modules]);

  // Helper to get sorted SLT texts from a DB module
  const getDbSlts = (dbModule: CourseModule): string[] => {
    if (!dbModule.slts || dbModule.slts.length === 0) return [];
    // API v2.0.0+: moduleIndex is 1-based
    return [...dbModule.slts]
      .sort((a, b) => (a.moduleIndex ?? 1) - (b.moduleIndex ?? 1))
      .map((slt) => slt.sltText)
      .filter((text): text is string => typeof text === "string");
  };

  // Helper to check if two SLT arrays match
  const sltsMatch = (dbSlts: string[], onChainSlts: string[]): boolean => {
    if (dbSlts.length !== onChainSlts.length) return false;
    return dbSlts.every((slt, i) => slt === onChainSlts[i]);
  };

  // Merge database and on-chain modules into hybrid view
  const hybridModules = useMemo<HybridModule[]>(() => {
    const result: HybridModule[] = [];
    const matchedOnChainIds = new Set<string>();

    // Step 1: Process all database modules
    for (const dbModule of modules) {
      const dbSlts = getDbSlts(dbModule);
      const dbComputedHash = dbSlts.length > 0 ? computeSltHashDefinite(dbSlts) : null;

      // Try to find matching on-chain module
      let matchedOnChain: CourseModule | null = null;
      let matchType: MatchType = "none";
      let hashMismatch = false;

      // First, try hash match (using stored hash)
      if (dbModule.sltHash) {
        const hashMatch = onChainModules.find(
          (m) => m.sltHash === dbModule.sltHash
        );
        if (hashMatch?.sltHash) {
          matchedOnChain = hashMatch;
          matchType = "hash";
          matchedOnChainIds.add(hashMatch.sltHash);
        }
      }

      // If no hash match, try computed hash match
      if (!matchedOnChain && dbComputedHash) {
        const computedHashMatch = onChainModules.find(
          (m) => m.sltHash === dbComputedHash
        );
        if (computedHashMatch?.sltHash && !matchedOnChainIds.has(computedHashMatch.sltHash)) {
          matchedOnChain = computedHashMatch;
          matchType = "hash";
          matchedOnChainIds.add(computedHashMatch.sltHash);
        }
      }

      // If still no match, try SLT content matching
      if (!matchedOnChain && dbSlts.length > 0) {
        for (const onChainModule of onChainModules) {
          if (!onChainModule.sltHash || matchedOnChainIds.has(onChainModule.sltHash)) continue;

          if (sltsMatch(dbSlts, onChainModule.onChainSlts ?? [])) {
            matchedOnChain = onChainModule;
            matchType = "slt-content";
            hashMismatch = true; // SLTs match but hashes don't
            matchedOnChainIds.add(onChainModule.sltHash);
            break;
          }
        }
      }

      result.push({
        moduleCode: dbModule.moduleCode ?? "",
        dbStoredHash: typeof dbModule.sltHash === "string" ? dbModule.sltHash : null,
        dbComputedHash,
        onChainHash: matchedOnChain?.sltHash ?? null,
        title: typeof dbModule.title === "string" ? dbModule.title : null,
        syncStatus: matchedOnChain ? "synced" : "db-only",
        matchType,
        hashMismatch,
        dbModule,
        onChainModule: matchedOnChain,
        dbSlts,
        onChainSlts: matchedOnChain?.onChainSlts ?? [],
      });
    }

    // Step 2: Add any unmatched on-chain modules (orphans)
    for (const onChainModule of onChainModules) {
      const moduleHash = onChainModule.sltHash;
      if (!moduleHash || matchedOnChainIds.has(moduleHash)) continue;

      result.push({
        moduleCode: `hash:${moduleHash.slice(0, 8)}`,
        dbStoredHash: null,
        dbComputedHash: null,
        onChainHash: moduleHash,
        title: null,
        syncStatus: "onchain-only",
        matchType: "none",
        hashMismatch: false,
        dbModule: null,
        onChainModule,
        dbSlts: [],
        onChainSlts: onChainModule.onChainSlts ?? [],
      });
    }

    return result;
  }, [modules, onChainModules]);

  // Get module codes that are already on-chain (synced)
  const syncedModuleCodes = useMemo(() =>
    new Set(hybridModules.filter((m) => m.syncStatus === "synced").map((m) => m.moduleCode)),
    [hybridModules]
  );

  // Modules that are approved in DB but NOT yet on-chain (truly ready to mint)
  const modulesReadyToMint = useMemo(() =>
    modules.filter((m) =>
      m.status === "approved" && !syncedModuleCodes.has(m.moduleCode ?? "")
    ),
    [modules, syncedModuleCodes]
  );

  // Hybrid module stats
  // Use database modules.length for total since that's the authoritative source
  // hybridModules can double-count when db modules don't have slt_hash set yet
  const hybridStats = useMemo(() => ({
    total: modules.length, // Database is source of truth for "how many modules"
    synced: hybridModules.filter((m) => m.syncStatus === "synced").length,
    syncedByHash: hybridModules.filter((m) => m.syncStatus === "synced" && m.matchType === "hash").length,
    syncedBySlt: hybridModules.filter((m) => m.syncStatus === "synced" && m.matchType === "slt-content").length,
    hashMismatches: hybridModules.filter((m) => m.hashMismatch).length,
    dbOnly: hybridModules.filter((m) => m.syncStatus === "db-only").length,
    // On-chain only modules (need registration)
    unregistered: hybridModules.filter((m) => m.syncStatus === "onchain-only").length,
    // Database status breakdown (for modules that exist in DB)
    dbOnChain: modules.filter((m) => m.status === "active").length,
    dbPending: modules.filter((m) => m.status === "pending_tx").length,
    dbApproved: modules.filter((m) => m.status === "approved").length,
    dbDraft: modules.filter((m) => m.status === "draft").length,
    // Truly ready to mint: APPROVED but not yet on-chain
    readyToMint: modulesReadyToMint.length,
  }), [hybridModules, modules, modulesReadyToMint]);

  // Unregistered modules (on-chain only, need DB registration)
  const unregisteredModules = useMemo(() =>
    hybridModules.filter((m) => m.syncStatus === "onchain-only"),
    [hybridModules]
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
  const modulesToBurn = useMemo<ModuleToBurn[]>(() => {
    return hybridModules
      .filter((m) => m.syncStatus === "synced" && m.onChainHash && selectedForBurn.has(m.onChainHash))
      .map((m) => ({
        moduleCode: m.moduleCode,
        title: m.title,
        onChainHash: m.onChainHash!,
        sltCount: m.onChainSlts.length,
      }));
  }, [hybridModules, selectedForBurn]);

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
        courseId: courseNftPolicyId,
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
      await deleteCourseMutation.mutateAsync(courseNftPolicyId);
      toast.success("Course deleted");
      router.push("/studio/course");
    } catch (err) {
      toast.error("Failed to delete", {
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
        courseId: courseNftPolicyId,
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
        courseId: courseNftPolicyId,
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
                      {courseNftPolicyId.slice(0, 12) + "..."}
                    </span>
                    {course.courseId && (
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
                    <div className="text-2xl font-bold text-foreground">{hybridStats.total}</div>
                    <AndamioText variant="small" className="text-[10px]">Credentials</AndamioText>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div>
                    <div className="text-2xl font-bold text-success">{onChainModules.length}</div>
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
                    {courseNftPolicyId.slice(0, 12) + "..."}
                  </span>
                  {course.courseId && (
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
                  {/* Module Cards */}
                  <div className="grid gap-4">
                    {modules.map((courseModule, index) => (
                      <StudioModuleCard
                        key={courseModule.sltHash || courseModule.moduleCode || `module-${index}`}
                        courseModule={courseModule}
                        courseNftPolicyId={courseNftPolicyId}
                        onDelete={() => handleDeleteModule(courseModule.moduleCode ?? "", courseModule.title ?? null)}
                        isDeleting={deleteModuleMutation.isPending}
                      />
                    ))}
                  </div>

                  {/* Add Credential Button - Centered at bottom */}
                  <div className="flex justify-center pt-4">
                    <AndamioButton
                      variant="outline"
                      onClick={() => router.push(`/studio/course/${courseNftPolicyId}/new?step=credential`)}
                    >
                      <AddIcon className="h-4 w-4 mr-2" />
                      Add Credential
                    </AndamioButton>
                  </div>

                  {/* Footer Stats */}
                  {hybridStats.dbPending > 0 && (
                    <AndamioAlert className="mt-6">
                      <PendingIcon className="h-4 w-4 text-info animate-pulse" />
                      <AndamioAlertDescription>
                        {hybridStats.dbPending} credential{hybridStats.dbPending !== 1 ? "s" : ""} pending blockchain confirmation
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

              <StudioFormSection title="Module Verification">
                {/* Summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="rounded-xl border p-3 text-center">
                    <div className="text-2xl font-bold">{hybridStats.total}</div>
                    <AndamioText variant="small" className="text-[10px]">Total Modules</AndamioText>
                  </div>
                  <div className="rounded-xl border p-3 text-center bg-success/5 border-success/20">
                    <div className="flex items-center justify-center gap-1.5">
                      <VerifiedIcon className="h-4 w-4 text-success" />
                      <span className="text-2xl font-bold text-success">{hybridStats.syncedByHash}</span>
                    </div>
                    <AndamioText variant="small" className="text-[10px]">Verified</AndamioText>
                  </div>
                  {hybridStats.hashMismatches > 0 && (
                    <div className="rounded-xl border p-3 text-center bg-warning/5 border-warning/20">
                      <div className="flex items-center justify-center gap-1.5">
                        <WarningIcon className="h-4 w-4 text-warning" />
                        <span className="text-2xl font-bold text-warning">{hybridStats.hashMismatches}</span>
                      </div>
                      <AndamioText variant="small" className="text-[10px]">Hash Mismatch</AndamioText>
                    </div>
                  )}
                  {hybridStats.dbPending > 0 && (
                    <div className="rounded-xl border p-3 text-center bg-info/5 border-info/20">
                      <div className="flex items-center justify-center gap-1.5">
                        <PendingIcon className="h-4 w-4 text-info animate-pulse" />
                        <span className="text-2xl font-bold text-info">{hybridStats.dbPending}</span>
                      </div>
                      <AndamioText variant="small" className="text-[10px]">Pending</AndamioText>
                    </div>
                  )}
                  {hybridStats.readyToMint > 0 && (
                    <div className="rounded-xl border p-3 text-center bg-warning/5 border-warning/20">
                      <span className="text-2xl font-bold text-warning">{hybridStats.readyToMint}</span>
                      <AndamioText variant="small" className="text-[10px]">Ready to Mint</AndamioText>
                    </div>
                  )}
                  {hybridStats.unregistered > 0 && (
                    <div className="rounded-xl border p-3 text-center bg-info/5 border-info/20">
                      <div className="flex items-center justify-center gap-1.5">
                        <OnChainIcon className="h-4 w-4 text-info" />
                        <span className="text-2xl font-bold text-info">{hybridStats.unregistered}</span>
                      </div>
                      <AndamioText variant="small" className="text-[10px]">Unregistered</AndamioText>
                    </div>
                  )}
                </div>

                {/* Module verification list - filter out archived/orphaned on-chain modules */}
                <div className="space-y-3">
                  {hybridModules.filter((m) => m.syncStatus !== "onchain-only").map((m) => (
                    <div
                      key={m.moduleCode}
                      className={cn(
                        "rounded-xl border p-4 space-y-3",
                        m.syncStatus === "synced" && !m.hashMismatch && "bg-success/5 border-success/20",
                        m.hashMismatch && "bg-warning/5 border-warning/20",
                        m.syncStatus === "db-only" && "bg-muted/30"
                      )}
                    >
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Selection checkbox for synced modules */}
                          {m.syncStatus === "synced" && m.onChainHash ? (
                            <AndamioCheckbox
                              checked={selectedForBurn.has(m.onChainHash)}
                              onCheckedChange={() => toggleBurnSelection(m.onChainHash!)}
                              aria-label={`Select ${m.moduleCode} for removal`}
                            />
                          ) : null}
                          {/* Status icon */}
                          {m.syncStatus === "synced" && !m.hashMismatch && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/20">
                              <VerifiedIcon className="h-4 w-4 text-success" />
                            </div>
                          )}
                          {m.hashMismatch && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/20">
                              <WarningIcon className="h-4 w-4 text-warning" />
                            </div>
                          )}
                          {m.syncStatus === "db-only" && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              <CredentialIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          {/* Module info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-medium">{m.moduleCode}</span>
                              {m.syncStatus === "synced" && !m.hashMismatch && (
                                <AndamioBadge className="bg-success/20 text-success border-0 text-[10px]">
                                  Verified
                                </AndamioBadge>
                              )}
                              {m.hashMismatch && (
                                <AndamioBadge className="bg-warning/20 text-warning border-0 text-[10px]">
                                  Hash Mismatch
                                </AndamioBadge>
                              )}
                              {m.syncStatus === "db-only" && (
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
                          <div className="text-sm font-medium">{m.onChainSlts.length || m.dbSlts.length} SLTs</div>
                          <AndamioText variant="small" className="text-[10px]">
                            {m.onChainSlts.length > 0 ? "On-Chain" : "Database"}
                          </AndamioText>
                        </div>
                      </div>

                      {/* SLTs from on-chain */}
                      {m.onChainSlts.length > 0 && (
                        <div className="space-y-1.5 pl-11">
                          <AndamioText variant="small" className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            On-Chain Learning Targets
                          </AndamioText>
                          <div className="space-y-1">
                            {m.onChainSlts.map((slt, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <SLTIcon className="h-3.5 w-3.5 mt-0.5 text-success flex-shrink-0" />
                                <span>{slt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hash comparison (only show for synced modules or mismatches) */}
                      {(m.syncStatus === "synced" || m.hashMismatch) && (
                        <div className="space-y-2 pl-11">
                          <AndamioText variant="small" className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Token Name (Hash)
                          </AndamioText>
                          <div className="space-y-1.5">
                            {/* On-chain hash */}
                            {m.onChainHash && (
                              <div className="flex items-center gap-2">
                                <OnChainIcon className="h-3 w-3 text-success flex-shrink-0" />
                                <code className="text-[10px] font-mono text-foreground bg-success/10 px-1.5 py-0.5 rounded break-all">
                                  {m.onChainHash}
                                </code>
                              </div>
                            )}
                            {/* DB computed hash (show if different from on-chain) */}
                            {m.hashMismatch && m.dbComputedHash && (
                              <div className="flex items-center gap-2">
                                <WarningIcon className="h-3 w-3 text-warning flex-shrink-0" />
                                <code className="text-[10px] font-mono text-muted-foreground bg-warning/10 px-1.5 py-0.5 rounded break-all">
                                  {m.dbComputedHash}
                                </code>
                                <AndamioText variant="small" className="text-[10px] text-warning">(computed)</AndamioText>
                              </div>
                            )}
                          </div>
                          {m.hashMismatch && (
                            <AndamioText variant="small" className="text-[10px] text-warning">
                              SLTs match but hashes differ — possible encoding inconsistency
                            </AndamioText>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </StudioFormSection>

              {/* Mint Modules - Show when there are modules ready to mint (APPROVED but not yet on-chain) */}
              {hybridStats.readyToMint > 0 && (
                <MintModuleTokens
                  courseNftPolicyId={courseNftPolicyId}
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
                  courseNftPolicyId={courseNftPolicyId}
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
                    <OnChainIcon className="h-4 w-4 text-info" />
                    <AndamioAlertDescription>
                      These modules exist on-chain but aren&apos;t registered in the database yet.
                      Register them to add lessons, assignments, and other content.
                    </AndamioAlertDescription>
                  </AndamioAlert>

                  <div className="space-y-3">
                    {unregisteredModules.map((m) => (
                      <div
                        key={m.onChainHash}
                        className="rounded-xl border p-4 bg-info/5 border-info/20 space-y-4"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-info/20">
                              <OnChainIcon className="h-4 w-4 text-info" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-sm font-medium text-info">
                                  On-Chain Only
                                </span>
                                <AndamioBadge className="bg-info/20 text-info border-0 text-[10px]">
                                  Needs Registration
                                </AndamioBadge>
                              </div>
                              <AndamioText variant="small" className="font-mono text-[10px] truncate">
                                {m.onChainHash}
                              </AndamioText>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-medium">{m.onChainSlts.length} SLTs</div>
                            <AndamioText variant="small" className="text-[10px]">On-Chain</AndamioText>
                          </div>
                        </div>

                        {/* SLTs preview */}
                        {m.onChainSlts.length > 0 && (
                          <div className="space-y-1.5 pl-11">
                            <AndamioText variant="small" className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              Learning Targets (On-Chain)
                            </AndamioText>
                            <div className="space-y-1">
                              {m.onChainSlts.map((slt, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                  <SLTIcon className="h-3.5 w-3.5 mt-0.5 text-info flex-shrink-0" />
                                  <span className="text-muted-foreground">{slt}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Registration form */}
                        {registeringHash === m.onChainHash ? (
                          <div className="space-y-3 pl-11">
                            <div className="space-y-2">
                              <AndamioLabel htmlFor={`module-code-${m.onChainHash}`}>
                                Module Code
                              </AndamioLabel>
                              <AndamioInput
                                id={`module-code-${m.onChainHash}`}
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
                                onClick={() => handleRegisterModule(m.onChainHash!)}
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
                              onClick={() => setRegisteringHash(m.onChainHash)}
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
              {onChainModules.length > 0 && (
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
              )}
            </AndamioTabsContent>

            {/* Settings Tab */}
            <AndamioTabsContent value="settings" className="mt-0 space-y-6">
              <StudioFormSection title="Course ID">
                <div className="space-y-2">
                  <AndamioInput
                    value={course.courseId ?? courseNftPolicyId}
                    disabled
                    className="font-mono"
                  />
                  <AndamioText variant="small">
                    Course ID cannot be changed after creation
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
