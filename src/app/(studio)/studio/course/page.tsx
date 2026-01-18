"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useStudioHeader } from "~/components/layout/studio-header";
import { StudioEditorPane } from "~/components/studio/studio-editor-pane";
import {
  AndamioResizablePanelGroup,
  AndamioResizablePanel,
  AndamioResizableHandle,
} from "~/components/andamio/andamio-resizable";
import { AndamioScrollArea } from "~/components/andamio/andamio-scroll-area";
import { useTeacherCourses, type TeacherCourse } from "~/hooks/api";
import {
  AndamioButton,
  AndamioBadge,
  AndamioSkeleton,
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
} from "~/components/andamio";
import { toast } from "sonner";
import { CreateCourseDialog } from "~/components/courses/create-course-dialog";
import {
  SearchIcon,
  OnChainIcon,
  RefreshIcon,
  CourseIcon,
  NextIcon,
  SuccessIcon,
  PendingIcon,
  AlertIcon,
  PreviewIcon,
  LoadingIcon,
  AddIcon,
  ExternalLinkIcon,
} from "~/components/icons";
import { getTokenExplorerUrl } from "~/lib/constants";
import { env } from "~/env";
import { AndamioText } from "~/components/andamio/andamio-text";
import { useCourseModules } from "~/hooks/api/use-course-module";
import { cn } from "~/lib/utils";
import { CourseTeachersCard } from "~/components/studio/course-teachers-card";

/**
 * Studio Course List Page
 * Split-pane layout: courses list on left, preview on right
 *
 * Uses merged teacher courses endpoint for clean, single-source data.
 */
export default function StudioCourseListPage() {
  const { isAuthenticated } = useAndamioAuth();
  const { setActions } = useStudioHeader();

  // Local UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Single merged API call for teacher courses
  const {
    data: courses = [],
    isLoading,
    refetch,
  } = useTeacherCourses();

  // Filter by search
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const query = searchQuery.toLowerCase();
    return courses.filter(
      (c) =>
        c.title?.toLowerCase().includes(query) ||
        c.course_id.toLowerCase().includes(query)
    );
  }, [courses, searchQuery]);

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  // Get selected course
  const selectedCourse = useMemo(
    () => courses.find((c) => c.course_id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
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
          <RefreshIcon className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
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
          <OnChainIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
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
              {isLoading && courses.length === 0 &&
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

              {!isLoading && courses.length === 0 && (
                <div className="py-8 text-center">
                  <CourseIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <AndamioText className="text-sm font-medium">No courses yet</AndamioText>
                  <AndamioText variant="small" className="mt-1 mb-3">
                    Create your first course
                  </AndamioText>
                  <CreateCourseDialog />
                </div>
              )}

              {filteredCourses.map((course) => (
                <CourseListItem
                  key={course.course_id}
                  course={course}
                  isSelected={course.course_id === selectedCourseId}
                  onClick={() => setSelectedCourseId(course.course_id)}
                />
              ))}

              {!isLoading && courses.length > 0 && filteredCourses.length === 0 && (
                <div className="py-8 text-center">
                  <SearchIcon className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                  <AndamioText variant="small">No matches</AndamioText>
                </div>
              )}
            </div>
          </AndamioScrollArea>

          {/* Search - Bottom */}
          <div className="border-t border-border px-3 py-2 bg-muted/30">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <AndamioInput
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        </div>
      </AndamioResizablePanel>

      <AndamioResizableHandle withHandle />

      {/* Right Panel: Course Preview or Welcome */}
      <AndamioResizablePanel defaultSize={65}>
        {selectedCourse ? (
          <CoursePreviewPanel course={selectedCourse} onImportSuccess={handleRefresh} />
        ) : (
          <WelcomePanel courseCount={courses.length} />
        )}
      </AndamioResizablePanel>
    </AndamioResizablePanelGroup>
  );
}

// =============================================================================
// Course List Item
// =============================================================================

interface CourseListItemProps {
  course: TeacherCourse;
  isSelected: boolean;
  onClick: () => void;
}

function CourseListItem({ course, isSelected, onClick }: CourseListItemProps) {
  // Determine status based on source field from API
  const hasDbContent = course.title !== undefined && course.title !== null;
  const isOnChain = course.source === "merged" || course.source === "chain_only";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 px-3 py-3 text-left rounded-lg border transition-all duration-150",
        isSelected
          ? "bg-primary/10 border-primary/30 shadow-sm"
          : "bg-transparent border-transparent hover:bg-muted/50 hover:border-border active:bg-muted/70",
        !hasDbContent && "opacity-60"
      )}
    >
      {/* Status indicator */}
      <div className={cn(
        "h-8 w-8 rounded-md flex items-center justify-center",
        isOnChain && hasDbContent ? "bg-success/10" : hasDbContent ? "bg-warning/10" : "bg-muted"
      )}>
        {isOnChain && hasDbContent ? (
          <SuccessIcon className="h-4 w-4 text-success" />
        ) : hasDbContent ? (
          <PendingIcon className="h-4 w-4 text-warning" />
        ) : (
          <AlertIcon className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

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
            {course.course_id.slice(0, 8)}…{course.course_id.slice(-6)}
          </span>
          {isOnChain && (
            <AndamioBadge variant="outline" className="text-[9px] h-4 px-1 bg-background/50">
              <OnChainIcon className="h-2.5 w-2.5" />
            </AndamioBadge>
          )}
        </div>
      </div>

      {/* Selection indicator */}
      <NextIcon className={cn(
        "h-4 w-4 flex-shrink-0 transition-all duration-150",
        isSelected
          ? "text-primary opacity-100 translate-x-0"
          : "text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-70 group-hover:translate-x-0"
      )} />
    </button>
  );
}

// =============================================================================
// Course Preview Panel
// =============================================================================

interface CoursePreviewPanelProps {
  course: TeacherCourse;
  onImportSuccess?: () => void;
}

function CoursePreviewPanel({ course, onImportSuccess }: CoursePreviewPanelProps) {
  const router = useRouter();

  // Determine status from merged data
  const hasDbContent = course.title !== undefined && course.title !== null;
  const isOnChain = course.source === "merged" || course.source === "chain_only";

  // Fetch modules for this course (only if we have DB content)
  const { data: modules = [], isLoading: isLoadingModules } = useCourseModules(
    hasDbContent ? course.course_id : undefined
  );

  // Module stats
  const moduleStats = useMemo(() => {
    const total = modules.length;
    const onChain = modules.filter((m) => m.status === "ON_CHAIN").length;
    const draft = modules.filter((m) => m.status === "DRAFT").length;
    const approved = 0; // APPROVED status no longer exists
    const totalSlts = modules.reduce((sum, m) => sum + (m.slts?.length ?? 0), 0);
    return { total, onChain, draft, approved, totalSlts };
  }, [modules]);

  // Show register UI if on-chain but no DB content
  if (!hasDbContent) {
    return (
      <StudioEditorPane padding="normal">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <AlertIcon className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <AndamioText className="font-medium">Unregistered Course</AndamioText>
          <AndamioText variant="small" className="mt-1 max-w-sm">
            You own this Course NFT on-chain. Register it to start building your course content.
          </AndamioText>
          <div className="mt-4">
            <RegisterCourseDrawer
              courseId={course.course_id}
              onSuccess={onImportSuccess}
            />
          </div>
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
            <CourseStatusBadge isOnChain={isOnChain} hasDbContent={hasDbContent} />
          </div>

          {/* Course Title - Large & Prominent */}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text">
            {course.title ?? "Untitled Course"}
          </h1>

          {/* Course Description */}
          {course.description && (
            <AndamioText variant="muted" className="text-base leading-relaxed mb-8 max-w-md mx-auto">
              {course.description}
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
            onClick={() => router.push(`/studio/course/${course.course_id}`)}
          >
            Open Course
            <NextIcon className="h-5 w-5 ml-2" />
          </AndamioButton>

          {/* Secondary Actions */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <Link
              href={`/course/${course.course_id}`}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <PreviewIcon className="h-3.5 w-3.5" />
              <span>Preview as Learner</span>
            </Link>
            {isOnChain && (
              <a
                href={`https://preprod.cardanoscan.io/token/${course.course_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <OnChainIcon className="h-3.5 w-3.5" />
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

          {/* Course Team Card */}
          <CourseTeachersCard
            courseNftPolicyId={course.course_id}
            className="mt-8 max-w-sm mx-auto text-left"
          />
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
            <CourseIcon className="h-10 w-10 text-primary" />
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
                <SuccessIcon className="h-4 w-4 text-success" />
              </div>
              <AndamioText className="text-xs font-medium mb-1">On-Chain</AndamioText>
              <AndamioText variant="small" className="text-[10px] text-muted-foreground leading-relaxed">
                Publish modules to Cardano blockchain
              </AndamioText>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 p-4 ring-1 ring-border/50">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10 mb-2">
                <OnChainIcon className="h-4 w-4 text-info" />
              </div>
              <AndamioText className="text-xs font-medium mb-1">Modular</AndamioText>
              <AndamioText variant="small" className="text-[10px] text-muted-foreground leading-relaxed">
                Build courses with reusable modules
              </AndamioText>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 p-4 ring-1 ring-border/50">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 mb-2">
                <PreviewIcon className="h-4 w-4 text-warning" />
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
            <NextIcon className="h-4 w-4 rotate-180" />
            <AndamioText variant="small">
              Select a course to view its modules and content
            </AndamioText>
          </div>
        </div>
      )}
    </div>
  );
}

function CourseStatusBadge({ isOnChain, hasDbContent }: { isOnChain: boolean; hasDbContent: boolean }) {
  if (isOnChain && hasDbContent) {
    return (
      <AndamioBadge variant="default" className="text-[10px] h-5">
        <SuccessIcon className="h-2.5 w-2.5 mr-1" />
        Live
      </AndamioBadge>
    );
  }
  if (hasDbContent && !isOnChain) {
    return (
      <AndamioBadge variant="secondary" className="text-[10px] h-5">
        <PendingIcon className="h-2.5 w-2.5 mr-1" />
        Draft
      </AndamioBadge>
    );
  }
  return (
    <AndamioBadge variant="outline" className="text-[10px] h-5">
      Unregistered
    </AndamioBadge>
  );
}

// =============================================================================
// Register Course Drawer
// =============================================================================

interface RegisterCourseDrawerProps {
  courseId: string;
  onSuccess?: () => void;
}

function RegisterCourseDrawer({ courseId, onSuccess }: RegisterCourseDrawerProps) {
  const { authenticatedFetch } = useAndamioAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      // Go API: POST /course/owner/course/register
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/owner/course/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            course_id: courseId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message ?? "Failed to register course");
      }

      toast.success("Course Registered!", {
        description: `"${title.trim()}" is now ready for content.`,
      });

      setOpen(false);
      setTitle("");
      onSuccess?.();
    } catch (err) {
      console.error("Error registering course:", err);
      toast.error("Registration Failed", {
        description: err instanceof Error ? err.message : "Failed to register course",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const truncatedId = `${courseId.slice(0, 12)}...${courseId.slice(-12)}`;

  return (
    <AndamioDrawer open={open} onOpenChange={setOpen}>
      <AndamioDrawerTrigger asChild>
        <AndamioButton variant="default" size="sm">
          <AddIcon className="h-4 w-4 mr-1" />
          Register Course
        </AndamioButton>
      </AndamioDrawerTrigger>
      <AndamioDrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <AndamioDrawerHeader className="text-left">
            <AndamioDrawerTitle>Register Course</AndamioDrawerTitle>
            <AndamioDrawerDescription>
              You own this Course NFT on-chain. Give it a title to register it
              in your studio and start adding content.
            </AndamioDrawerDescription>
          </AndamioDrawerHeader>

          <div className="space-y-4 px-4">
            {/* Course ID display */}
            <div className="rounded-lg border bg-muted/50 p-3">
              <AndamioText variant="small" className="text-xs mb-1">Course NFT Policy ID</AndamioText>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono flex-1 truncate">
                  {truncatedId}
                </span>
                <a
                  href={getTokenExplorerUrl(courseId, env.NEXT_PUBLIC_CARDANO_NETWORK ?? "preprod")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Title input */}
            <div className="space-y-2">
              <AndamioLabel htmlFor="register-title">Course Title</AndamioLabel>
              <AndamioInput
                id="register-title"
                placeholder="Enter a title for your course"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
              <AndamioText variant="small" className="text-xs">
                You can change this later. This just gets your course registered.
              </AndamioText>
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
              onClick={handleRegister}
              disabled={!title.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingIcon className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <AddIcon className="h-4 w-4 mr-2" />
                  Register Course
                </>
              )}
            </AndamioButton>
          </AndamioDrawerFooter>
        </div>
      </AndamioDrawerContent>
    </AndamioDrawer>
  );
}
