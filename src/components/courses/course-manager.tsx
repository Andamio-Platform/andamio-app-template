"use client";

import React, { useEffect, useState } from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
import { type ListOwnedCoursesOutput } from "@andamio/db-api";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AlertCircle, BookOpen } from "lucide-react";
import { CourseStatsDashboard } from "./course-stats-dashboard";
import { CourseFilterToolbar } from "./course-filter-toolbar";
import { CourseGridView } from "./course-grid-view";
import { CourseListView } from "./course-list-view";
import { CourseTableView } from "./course-table-view";
import {
  type CourseFilter,
  type CourseSortConfig,
  type CourseViewMode,
  defaultCourseFilter,
  defaultCourseSortConfig,
  filterCourses,
  sortCourses,
} from "~/lib/course-filters";

/**
 * Comprehensive course management interface
 * Features:
 * - Multiple view modes (Grid, Table, List)
 * - Advanced filtering (search, status, tier, category)
 * - Sorting by multiple fields
 * - Quick stats dashboard
 * - Responsive design
 */
export function CourseManager() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();
  const [allCourses, setAllCourses] = useState<ListOwnedCoursesOutput>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moduleCounts, setModuleCounts] = useState<Record<string, number>>({});

  // Filter, sort, and view state
  const [filter, setFilter] = useState<CourseFilter>(defaultCourseFilter);
  const [sortConfig, setSortConfig] = useState<CourseSortConfig>(defaultCourseSortConfig);
  const [viewMode, setViewMode] = useState<CourseViewMode>("grid");

  // Fetch courses
  useEffect(() => {
    if (!isAuthenticated) {
      setAllCourses([]);
      setError(null);
      return;
    }

    const fetchOwnedCourses = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/owned`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch courses: ${response.statusText}`);
        }

        const data = (await response.json()) as ListOwnedCoursesOutput;
        setAllCourses(data ?? []);

        // Fetch module counts for all courses using batch endpoint
        if (data && data.length > 0) {
          try {
            const courseCodes = data.map((c) => c.course_code);
            const modulesResponse = await fetch(`${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/list-by-courses`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ course_codes: courseCodes }),
            });

            if (modulesResponse.ok) {
              const modulesData = (await modulesResponse.json()) as Record<
                string,
                Array<{ module_code: string; title: string }>
              >;

              // Convert to counts
              const counts: Record<string, number> = {};
              for (const [courseCode, modules] of Object.entries(modulesData)) {
                counts[courseCode] = modules.length;
              }
              setModuleCounts(counts);
            }
          } catch (err) {
            console.error("Error fetching module counts:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching owned courses:", err);
        setError(err instanceof Error ? err.message : "Failed to load courses");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchOwnedCourses();
  }, [isAuthenticated, authenticatedFetch]);

  // Calculate filtered and sorted courses
  const filteredCourses = filterCourses(allCourses, filter);
  const displayedCourses = sortCourses(filteredCourses, sortConfig, moduleCounts);

  // Count active filters
  const activeFilterCount = [
    filter.search !== "",
    filter.publicationStatus !== "all",
  ].filter(Boolean).length;

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center border">
        <p className="text-sm text-muted-foreground">Connect and authenticate to view your courses</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <AndamioSkeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        {/* Content skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <AndamioSkeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <AndamioAlert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AndamioAlertTitle>Error</AndamioAlertTitle>
        <AndamioAlertDescription>{error}</AndamioAlertDescription>
      </AndamioAlert>
    );
  }

  // Empty state
  if (allCourses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">No courses found. Create your first course to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Dashboard */}
      <CourseStatsDashboard courses={allCourses} moduleCounts={moduleCounts} />

      {/* Filter Toolbar */}
      <CourseFilterToolbar
        filter={filter}
        sortConfig={sortConfig}
        viewMode={viewMode}
        onFilterChange={setFilter}
        onSortChange={setSortConfig}
        onViewModeChange={setViewMode}
        activeFilterCount={activeFilterCount}
      />

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {displayedCourses.length} of {allCourses.length} courses
        </p>
      </div>

      {/* View Mode Content */}
      {displayedCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">No courses match your filters.</p>
        </div>
      ) : (
        <>
          {viewMode === "grid" && <CourseGridView courses={displayedCourses} moduleCounts={moduleCounts} />}
          {viewMode === "list" && <CourseListView courses={displayedCourses} moduleCounts={moduleCounts} />}
          {viewMode === "table" && <CourseTableView courses={displayedCourses} moduleCounts={moduleCounts} />}
        </>
      )}
    </div>
  );
}
