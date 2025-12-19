"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useCoursesOwnedByAlias } from "~/hooks/use-andamioscan";
import { useStudioHeader } from "~/components/layout/studio-header";
import { StudioEditorPane } from "~/components/studio/studio-editor-pane";
import { env } from "~/env";
import {
  AndamioButton,
  AndamioBadge,
  AndamioSkeleton,
} from "~/components/andamio";
import { Input } from "~/components/ui/input";
import { CreateCourseDialog } from "~/components/courses/create-course-dialog";
import {
  Plus,
  Search,
  Blocks,
  RefreshCw,
  BookOpen,
  Clock,
  Grid,
  List,
} from "lucide-react";
import { type ListOwnedCoursesOutput } from "@andamio/db-api";
import { StudioCourseCard, type HybridCourseStatus } from "~/components/studio/studio-course-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import { cn } from "~/lib/utils";
import { CheckCircle, ChevronRight } from "lucide-react";

/**
 * Studio Course List Page
 * Dense grid layout with quick actions
 * Focused mode - no global sidebar
 */
export default function StudioCourseListPage() {
  const router = useRouter();
  const { user, isAuthenticated, authenticatedFetch } = useAndamioAuth();
  const alias = user?.accessTokenAlias ?? undefined;

  // Update studio header
  const { setActions } = useStudioHeader();

  useEffect(() => {
    setActions(<CreateCourseDialog />);
  }, [setActions]);

  // Fetch on-chain courses
  const {
    data: onChainCourses,
    isLoading: isLoadingOnChain,
    refetch: refetchOnChain,
  } = useCoursesOwnedByAlias(alias);

  // Fetch DB courses
  const [dbCourses, setDbCourses] = useState<ListOwnedCoursesOutput>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

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
  const onChainCount = hybridCourses.filter((c) => c.onChain).length;
  const pendingCount = hybridCourses.filter((c) => c.inDb && !c.onChain).length;

  const handleRefresh = () => {
    void fetchDbCourses();
    void refetchOnChain();
  };

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
    <StudioEditorPane
      padding="none"
      header={
        <div className="flex items-center justify-between gap-4 px-6 py-2.5">
          {/* Search */}
          <div className="relative w-52">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          {/* Stats & Actions */}
          <div className="flex items-center gap-2">
            <AndamioBadge variant="secondary" className="text-xs">
              {hybridCourses.length} courses
            </AndamioBadge>
            {pendingCount > 0 && (
              <AndamioBadge variant="outline" className="text-xs text-info border-info">
                <Clock className="h-3 w-3 mr-1" />
                {pendingCount} syncing
              </AndamioBadge>
            )}

            {/* View Toggle */}
            <div className="flex items-center border rounded-md">
              <AndamioButton
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 w-8 p-0 rounded-r-none"
              >
                <List className="h-4 w-4" />
              </AndamioButton>
              <AndamioButton
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8 p-0 rounded-l-none"
              >
                <Grid className="h-4 w-4" />
              </AndamioButton>
            </div>

            <AndamioButton
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </AndamioButton>
          </div>
        </div>
      }
    >
      <div className="px-6 py-4">
        {/* Loading */}
        {isLoading && hybridCourses.length === 0 && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <AndamioSkeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && hybridCourses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No courses yet</h3>
            <AndamioText variant="small" className="mt-1 mb-4 max-w-sm">
              Create your first course to start building learning content on Andamio
            </AndamioText>
            <CreateCourseDialog />
          </div>
        )}

        {/* Course List View */}
        {filteredCourses.length > 0 && viewMode === "list" && (
          <div className="space-y-2">
            {filteredCourses.map((course) => (
              <CourseListItem
                key={course.courseId}
                course={course}
                onClick={() => {
                  if (course.inDb) {
                    router.push(`/studio/course/${course.courseId}`);
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* Course Grid View */}
        {filteredCourses.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredCourses.map((course) => (
              <StudioCourseCard
                key={course.courseId}
                course={course}
                onClick={() => {
                  if (course.inDb) {
                    router.push(`/studio/course/${course.courseId}`);
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* No results */}
        {!isLoading && hybridCourses.length > 0 && filteredCourses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <AndamioText variant="small">
              No courses match &quot;{searchQuery}&quot;
            </AndamioText>
          </div>
        )}
      </div>
    </StudioEditorPane>
  );
}

/**
 * List item view for courses - cleaner overview
 */
function CourseListItem({
  course,
  onClick,
}: {
  course: HybridCourseStatus;
  onClick: () => void;
}) {
  const truncatedId = `${course.courseId.slice(0, 8)}...${course.courseId.slice(-6)}`;

  return (
    <button
      onClick={onClick}
      disabled={!course.inDb}
      className={cn(
        "group flex items-center gap-4 w-full px-4 py-3 text-left rounded-lg border bg-card",
        "transition-all hover:border-primary/50 hover:bg-accent/50",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        course.inDb && "cursor-pointer"
      )}
    >
      {/* Status indicator */}
      <div className="flex-shrink-0">
        {course.inDb && course.onChain ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
        ) : course.inDb ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
            <Clock className="h-5 w-5 text-info animate-pulse" />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
            <Plus className="h-5 w-5 text-warning" />
          </div>
        )}
      </div>

      {/* Course info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">
            {course.title ?? "Untitled Course"}
          </span>
          {course.onChain && course.onChainModuleCount > 0 && (
            <AndamioBadge variant="secondary" className="text-xs flex-shrink-0">
              <Blocks className="h-3 w-3 mr-1" />
              {course.onChainModuleCount} module{course.onChainModuleCount !== 1 ? "s" : ""}
            </AndamioBadge>
          )}
        </div>
        <code className="text-xs text-muted-foreground font-mono">
          {truncatedId}
        </code>
      </div>

      {/* Action hint */}
      {course.inDb && (
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
      )}
    </button>
  );
}
