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
  AndamioInput,
} from "~/components/andamio";
import { CreateCourseDialog } from "~/components/courses/create-course-dialog";
import {
  Plus,
  Search,
  Blocks,
  CheckCircle,
  Clock,
  Settings,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import { type ListOwnedCoursesOutput } from "@andamio/db-api";

interface HybridCourseStatus {
  courseId: string;
  title: string | null;
  inDb: boolean;
  onChain: boolean;
  onChainModuleCount: number;
  dbCourse?: ListOwnedCoursesOutput[number];
}

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
          <p className="text-lg font-medium">Connect your wallet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to access Course Studio
          </p>
        </div>
      </StudioEditorPane>
    );
  }

  return (
    <StudioEditorPane
      padding="tight"
      header={
        <div className="flex items-center justify-between gap-4 px-3 py-2">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <AndamioInput
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-sm"
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
      {/* Loading */}
      {isLoading && hybridCourses.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <AndamioSkeleton key={i} className="h-28" />
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
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
            Create your first course to start building learning content on Andamio
          </p>
          <CreateCourseDialog />
        </div>
      )}

      {/* Course Grid */}
      {filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredCourses.map((course) => (
            <CourseCard
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
          <p className="text-sm text-muted-foreground">
            No courses match &quot;{searchQuery}&quot;
          </p>
        </div>
      )}
    </StudioEditorPane>
  );
}

/**
 * Compact course card for grid layout
 */
function CourseCard({
  course,
  onClick,
}: {
  course: HybridCourseStatus;
  onClick: () => void;
}) {
  const truncatedId = `${course.courseId.slice(0, 6)}...${course.courseId.slice(-4)}`;

  return (
    <button
      onClick={onClick}
      disabled={!course.inDb}
      className="group relative flex flex-col rounded-lg border bg-card p-3 text-left transition-all hover:border-primary/50 hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {/* Status indicator */}
      <div className="absolute top-2 right-2">
        {course.inDb && course.onChain ? (
          <CheckCircle className="h-4 w-4 text-success" />
        ) : course.inDb ? (
          <Clock className="h-4 w-4 text-info animate-pulse" />
        ) : (
          <Plus className="h-4 w-4 text-warning" />
        )}
      </div>

      {/* Title */}
      <h3 className="font-medium text-sm truncate pr-6">
        {course.title ?? "Untitled Course"}
      </h3>

      {/* ID */}
      <code className="text-[10px] text-muted-foreground font-mono mt-0.5">
        {truncatedId}
      </code>

      {/* Stats row */}
      <div className="flex items-center gap-2 mt-2">
        {course.onChain && course.onChainModuleCount > 0 && (
          <AndamioBadge variant="secondary" className="text-[10px] h-5">
            <Blocks className="h-2.5 w-2.5 mr-0.5" />
            {course.onChainModuleCount} modules
          </AndamioBadge>
        )}
      </div>

      {/* Hover action hint */}
      {course.inDb && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
          <div className="flex items-center gap-1 text-xs font-medium text-primary">
            <Settings className="h-3.5 w-3.5" />
            Open
          </div>
        </div>
      )}
    </button>
  );
}
