"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useCoursesOwnedByAlias } from "~/hooks/use-andamioscan";
import { useStudioHeader } from "~/components/layout/studio-header";
import { StudioEditorPane } from "~/components/studio/studio-editor-pane";
import {
  AndamioResizablePanelGroup,
  AndamioResizablePanel,
  AndamioResizableHandle,
} from "~/components/andamio/andamio-resizable";
import { AndamioScrollArea } from "~/components/andamio/andamio-scroll-area";
import { env } from "~/env";
import {
  AndamioButton,
  AndamioBadge,
  AndamioSkeleton,
  AndamioStatusIcon,
  getCourseStatus,
} from "~/components/andamio";
import { CreateCourseDialog } from "~/components/courses/create-course-dialog";
import {
  Search,
  Blocks,
  RefreshCw,
  BookOpen,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
} from "lucide-react";
import { type ListOwnedCoursesOutput } from "@andamio/db-api";
import { type HybridCourseStatus } from "~/components/studio/studio-course-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import { useCourseModules } from "~/hooks/api/use-course-module";
import { cn } from "~/lib/utils";

/**
 * Studio Course List Page
 * Split-pane layout: courses list on left, preview on right
 */
export default function StudioCourseListPage() {
  const router = useRouter();
  const { user, isAuthenticated, authenticatedFetch } = useAndamioAuth();
  const alias = user?.accessTokenAlias ?? undefined;
  const { setActions } = useStudioHeader();

  // Local state
  const [dbCourses, setDbCourses] = useState<ListOwnedCoursesOutput>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Fetch on-chain courses
  const {
    data: onChainCourses,
    isLoading: isLoadingOnChain,
    refetch: refetchOnChain,
  } = useCoursesOwnedByAlias(alias);

  const fetchDbCourses = useCallback(async () => {
    if (!isAuthenticated) {
      setDbCourses([]);
      return;
    }

    setIsLoadingDb(true);
    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      if (response.ok) {
        const data = (await response.json()) as ListOwnedCoursesOutput;
        setDbCourses(data ?? []);
      }
    } catch (err) {
      console.error("Error fetching DB courses:", err);
    } finally {
      setIsLoadingDb(false);
    }
  }, [isAuthenticated, authenticatedFetch]);

  useEffect(() => {
    void fetchDbCourses();
  }, [fetchDbCourses]);

  // Merge and dedupe courses
  const hybridCourses = useMemo<HybridCourseStatus[]>(() => {
    const courseMap = new Map<string, HybridCourseStatus>();

    for (const dbCourse of dbCourses) {
      if (dbCourse.course_nft_policy_id) {
        courseMap.set(dbCourse.course_nft_policy_id, {
          courseId: dbCourse.course_nft_policy_id,
          title: dbCourse.title,
          inDb: true,
          onChain: false,
          onChainModuleCount: 0,
          dbCourse,
        });
      }
    }

    if (onChainCourses) {
      for (const onChainCourse of onChainCourses) {
        const existing = courseMap.get(onChainCourse.course_id);
        if (existing) {
          existing.onChain = true;
          existing.onChainModuleCount = onChainCourse.modules.length;
        } else {
          courseMap.set(onChainCourse.course_id, {
            courseId: onChainCourse.course_id,
            title: null,
            inDb: false,
            onChain: true,
            onChainModuleCount: onChainCourse.modules.length,
          });
        }
      }
    }

    return Array.from(courseMap.values()).sort((a, b) => {
      if (a.inDb && !b.inDb) return -1;
      if (!a.inDb && b.inDb) return 1;
      return a.courseId.localeCompare(b.courseId);
    });
  }, [dbCourses, onChainCourses]);

  // No auto-select - show welcome screen initially

  // Filter by search
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return hybridCourses;
    const query = searchQuery.toLowerCase();
    return hybridCourses.filter(
      (c) =>
        c.title?.toLowerCase().includes(query) ||
        c.courseId.toLowerCase().includes(query)
    );
  }, [hybridCourses, searchQuery]);

  const isLoading = isLoadingOnChain || isLoadingDb;

  const handleRefresh = useCallback(() => {
    void fetchDbCourses();
    void refetchOnChain();
  }, [fetchDbCourses, refetchOnChain]);

  // Get selected course
  const selectedCourse = useMemo(
    () => hybridCourses.find((c) => c.courseId === selectedCourseId) ?? null,
    [hybridCourses, selectedCourseId]
  );

  // Update studio header with contextual actions
  useEffect(() => {
    // Keep header minimal - CTA is in the course preview panel
    setActions(
      <div className="flex items-center gap-2">
        <AndamioButton
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="h-7 w-7 p-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </AndamioButton>
        <CreateCourseDialog />
      </div>
    );
  }, [setActions, isLoading, handleRefresh]);

  // Auth gate
  if (!isAuthenticated) {
    return (
      <StudioEditorPane padding="normal">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Blocks className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <AndamioText className="text-lg font-medium">Connect your wallet</AndamioText>
          <AndamioText variant="small" className="mt-1">
            Sign in to access Course Studio
          </AndamioText>
        </div>
      </StudioEditorPane>
    );
  }

  return (
    <AndamioResizablePanelGroup direction="horizontal" className="h-full">
      {/* Left Panel: Course List */}
      <AndamioResizablePanel defaultSize={35} minSize={25} maxSize={50}>
        <div className="flex h-full flex-col">
          {/* Course List */}
          <AndamioScrollArea className="flex-1">
            <div className="flex flex-col gap-3 p-3">
              {isLoading && hybridCourses.length === 0 &&
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg bg-muted/30">
                    <AndamioSkeleton className="h-8 w-8 rounded-md" />
                    <div className="flex-1 space-y-1.5">
                      <AndamioSkeleton className="h-3.5 w-32" />
                      <AndamioSkeleton className="h-2.5 w-24" />
                    </div>
                  </div>
                ))
              }

              {!isLoading && hybridCourses.length === 0 && (
                <div className="py-8 text-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <AndamioText className="text-sm font-medium">No courses yet</AndamioText>
                  <AndamioText variant="small" className="mt-1 mb-3">
                    Create your first course
                  </AndamioText>
                  <CreateCourseDialog />
                </div>
              )}

              {filteredCourses.map((course) => (
                <CourseListItem
                  key={course.courseId}
                  course={course}
                  isSelected={course.courseId === selectedCourseId}
                  onClick={() => setSelectedCourseId(course.courseId)}
                />
              ))}

              {!isLoading && hybridCourses.length > 0 && filteredCourses.length === 0 && (
                <div className="py-8 text-center">
                  <Search className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                  <AndamioText variant="small">No matches</AndamioText>
                </div>
              )}
            </div>
          </AndamioScrollArea>

          {/* Search - Bottom */}
          <div className="border-t border-border px-3 py-2 bg-muted/30">
            <div className="flex items-center gap-1.5 h-8 px-3 rounded-lg border bg-background shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
              <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>
      </AndamioResizablePanel>

      <AndamioResizableHandle withHandle />

      {/* Right Panel: Course Preview or Welcome */}
      <AndamioResizablePanel defaultSize={65}>
        {selectedCourse ? (
          <CoursePreviewPanel course={selectedCourse} />
        ) : (
          <WelcomePanel courseCount={hybridCourses.length} />
        )}
      </AndamioResizablePanel>
    </AndamioResizablePanelGroup>
  );
}

// =============================================================================
// Course List Item
// =============================================================================

interface CourseListItemProps {
  course: HybridCourseStatus;
  isSelected: boolean;
  onClick: () => void;
}

function CourseListItem({ course, isSelected, onClick }: CourseListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 px-3 py-3 text-left rounded-lg border transition-all duration-150",
        isSelected
          ? "bg-primary/10 border-primary/30 shadow-sm"
          : "bg-transparent border-transparent hover:bg-muted/50 hover:border-border active:bg-muted/70",
        !course.inDb && "opacity-60"
      )}
    >
      {/* Status icon */}
      <AndamioStatusIcon status={getCourseStatus(course)} />

      {/* Course info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-medium truncate transition-colors",
            isSelected ? "text-primary" : "group-hover:text-foreground"
          )}>
            {course.title ?? "Untitled Course"}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground font-mono truncate">
            {course.courseId.slice(0, 8)}…{course.courseId.slice(-6)}
          </span>
          {course.onChain && course.onChainModuleCount > 0 && (
            <AndamioBadge variant="outline" className="text-[9px] h-4 px-1 bg-background/50">
              <Blocks className="h-2.5 w-2.5 mr-0.5" />
              {course.onChainModuleCount}
            </AndamioBadge>
          )}
        </div>
      </div>

      {/* Selection indicator */}
      <ChevronRight className={cn(
        "h-4 w-4 flex-shrink-0 transition-all duration-150",
        isSelected
          ? "text-primary opacity-100 translate-x-0"
          : "text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-70 group-hover:translate-x-0"
      )} />
    </button>
  );
}

type CourseStatus = "synced" | "syncing" | "onchain-only";

function getStatusFromCourse(course: HybridCourseStatus): CourseStatus {
  if (course.inDb && course.onChain) return "synced";
  if (course.inDb && !course.onChain) return "syncing";
  return "onchain-only";
}

// =============================================================================
// Course Preview Panel
// =============================================================================

interface CoursePreviewPanelProps {
  course: HybridCourseStatus;
}

function CoursePreviewPanel({ course }: CoursePreviewPanelProps) {
  const router = useRouter();

  // Fetch modules for this course
  const { data: modules = [], isLoading: isLoadingModules } = useCourseModules(
    course.inDb ? course.courseId : undefined
  );

  const status = getStatusFromCourse(course);
  const dbCourse = course.dbCourse;

  // Module stats
  const moduleStats = useMemo(() => {
    const total = modules.length;
    const onChain = modules.filter((m) => m.status === "ON_CHAIN").length;
    const draft = modules.filter((m) => m.status === "DRAFT").length;
    const approved = modules.filter((m) => m.status === "APPROVED").length;
    const totalSlts = modules.reduce((sum, m) => sum + (m.slts?.length ?? 0), 0);
    return { total, onChain, draft, approved, totalSlts };
  }, [modules]);

  if (!course.inDb) {
    return (
      <StudioEditorPane padding="normal">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <AndamioText className="font-medium">On-chain Only</AndamioText>
          <AndamioText variant="small" className="mt-1 max-w-sm">
            This course exists on-chain but hasn&apos;t been imported to your database yet.
          </AndamioText>
          <AndamioButton variant="outline" size="sm" className="mt-4">
            Import Course
          </AndamioButton>
        </div>
      </StudioEditorPane>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section - Prominent Course Title */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-xl w-full text-center">
          {/* Status Badge */}
          <div className="mb-6">
            <StatusLabel status={status} />
          </div>

          {/* Course Title - Large & Prominent */}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text">
            {course.title ?? "Untitled Course"}
          </h1>

          {/* Course Description */}
          {dbCourse?.description && (
            <AndamioText variant="muted" className="text-base leading-relaxed mb-8 max-w-md mx-auto">
              {dbCourse.description}
            </AndamioText>
          )}

          {/* Key Stats - Poppy Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm mx-auto">
            {/* Modules */}
            <div className="group relative">
              <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 p-4 ring-1 ring-primary/20 transition-all hover:ring-primary/40 hover:shadow-lg hover:shadow-primary/10">
                {isLoadingModules ? (
                  <AndamioSkeleton className="h-8 w-8 mx-auto mb-1" />
                ) : (
                  <div className="text-3xl font-bold text-primary">{moduleStats.total}</div>
                )}
                <AndamioText variant="small" className="text-[11px] text-primary/70 font-medium">
                  Modules
                </AndamioText>
              </div>
            </div>

            {/* On-Chain */}
            <div className="group relative">
              <div className="rounded-2xl bg-gradient-to-br from-success/15 via-success/10 to-success/5 p-4 ring-1 ring-success/20 transition-all hover:ring-success/40 hover:shadow-lg hover:shadow-success/10">
                {isLoadingModules ? (
                  <AndamioSkeleton className="h-8 w-8 mx-auto mb-1" />
                ) : (
                  <div className="text-3xl font-bold text-success">{moduleStats.onChain}</div>
                )}
                <AndamioText variant="small" className="text-[11px] text-success/70 font-medium">
                  On-Chain
                </AndamioText>
              </div>
            </div>

            {/* Learning Targets */}
            <div className="group relative">
              <div className="rounded-2xl bg-gradient-to-br from-info/15 via-info/10 to-info/5 p-4 ring-1 ring-info/20 transition-all hover:ring-info/40 hover:shadow-lg hover:shadow-info/10">
                {isLoadingModules ? (
                  <AndamioSkeleton className="h-8 w-8 mx-auto mb-1" />
                ) : (
                  <div className="text-3xl font-bold text-info">{moduleStats.totalSlts}</div>
                )}
                <AndamioText variant="small" className="text-[11px] text-info/70 font-medium">
                  SLTs
                </AndamioText>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <AndamioButton
            size="lg"
            className="px-8 h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            onClick={() => router.push(`/studio/course/${course.courseId}`)}
          >
            Open Course
            <ChevronRight className="h-5 w-5 ml-2" />
          </AndamioButton>

          {/* Secondary Actions */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <Link
              href={`/course/${course.courseId}`}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview as Learner</span>
            </Link>
            {course.onChain && (
              <a
                href={`https://preprod.cardanoscan.io/token/${course.courseId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Blocks className="h-3.5 w-3.5" />
                <span>View On-Chain</span>
              </a>
            )}
          </div>

          {/* Module List */}
          {modules.length > 0 && !isLoadingModules && (
            <div className="mt-8 pt-6 border-t border-border/30 max-w-sm mx-auto">
              <AndamioText variant="small" className="text-muted-foreground mb-3">
                Modules
              </AndamioText>
              <ul className="space-y-1.5 text-left">
                {modules.map((courseModule) => (
                  <li key={courseModule.module_code} className="text-sm text-foreground/80">
                    <span className="font-mono text-primary/80">{courseModule.module_code}</span>
                    {courseModule.title && (
                      <span className="text-muted-foreground ml-2">— {courseModule.title}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Welcome Panel
// =============================================================================

function WelcomePanel({ courseCount }: { courseCount: number }) {
  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-lg text-center">
          {/* Icon */}
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent ring-1 ring-primary/20 mx-auto mb-6 shadow-lg shadow-primary/10">
            <BookOpen className="h-10 w-10 text-primary" />
          </div>

          {/* Title */}
          <h1>Course Studio</h1>
          <AndamioText variant="muted" className="text-base mb-8">
            Create, manage, and publish learning content on Cardano
          </AndamioText>

          {/* Quick Actions */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <CreateCourseDialog />
            {courseCount > 0 && (
              <AndamioText variant="small" className="text-muted-foreground">
                or select a course from the list
              </AndamioText>
            )}
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-3 gap-3 text-left">
            <div className="rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 p-4 ring-1 ring-border/50">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 mb-2">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <AndamioText className="text-xs font-medium mb-1">On-Chain</AndamioText>
              <AndamioText variant="small" className="text-[10px] text-muted-foreground leading-relaxed">
                Publish modules to Cardano blockchain
              </AndamioText>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 p-4 ring-1 ring-border/50">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10 mb-2">
                <Blocks className="h-4 w-4 text-info" />
              </div>
              <AndamioText className="text-xs font-medium mb-1">Modular</AndamioText>
              <AndamioText variant="small" className="text-[10px] text-muted-foreground leading-relaxed">
                Build courses with reusable modules
              </AndamioText>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 p-4 ring-1 ring-border/50">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 mb-2">
                <Eye className="h-4 w-4 text-warning" />
              </div>
              <AndamioText className="text-xs font-medium mb-1">Preview</AndamioText>
              <AndamioText variant="small" className="text-[10px] text-muted-foreground leading-relaxed">
                See how learners will experience it
              </AndamioText>
            </div>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      {courseCount > 0 && (
        <div className="border-t border-border/50 px-6 py-3 bg-muted/20">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <ChevronRight className="h-4 w-4 rotate-180" />
            <AndamioText variant="small">
              Select a course to view its modules and content
            </AndamioText>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusLabel({ status }: { status: CourseStatus }) {
  switch (status) {
    case "synced":
      return (
        <AndamioBadge variant="default" className="text-[10px] h-5">
          <CheckCircle className="h-2.5 w-2.5 mr-1" />
          Live
        </AndamioBadge>
      );
    case "syncing":
      return (
        <AndamioBadge variant="secondary" className="text-[10px] h-5">
          <Clock className="h-2.5 w-2.5 mr-1" />
          Syncing
        </AndamioBadge>
      );
    case "onchain-only":
      return (
        <AndamioBadge variant="outline" className="text-[10px] h-5">
          Import Required
        </AndamioBadge>
      );
  }
}

