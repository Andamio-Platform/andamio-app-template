/**
 * Course filtering, sorting, and view mode utilities
 * Used by Course Creator interface for managing course data
 */

import { type ListOwnedCoursesOutput } from "@andamio/db-api";

// View mode options
export type CourseViewMode = "grid" | "table" | "list";

// Filter options (using only available API fields)
export type CourseFilter = {
  search: string;
  publicationStatus: "all" | "published" | "draft";
};

// Sort options (using only available API fields)
export type CourseSortField = "title" | "course_code" | "moduleCount";
export type CourseSortDirection = "asc" | "desc";
export type CourseSortConfig = {
  field: CourseSortField;
  direction: CourseSortDirection;
};

// Default filter state
export const defaultCourseFilter: CourseFilter = {
  search: "",
  publicationStatus: "all",
};

// Default sort config
export const defaultCourseSortConfig: CourseSortConfig = {
  field: "title",
  direction: "asc",
};

/**
 * Filter courses based on filter criteria
 */
export function filterCourses(
  courses: ListOwnedCoursesOutput,
  filter: CourseFilter
): ListOwnedCoursesOutput {
  return courses.filter((courseData) => {
    // Search filter (title, code, description)
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const matchesSearch =
        courseData.title.toLowerCase().includes(searchLower) ||
        courseData.course_code.toLowerCase().includes(searchLower) ||
        (courseData.description?.toLowerCase().includes(searchLower) ?? false);
      if (!matchesSearch) return false;
    }

    // Publication status filter
    if (filter.publicationStatus !== "all") {
      if (filter.publicationStatus === "published" && !courseData.course_nft_policy_id) {
        return false;
      }
      if (filter.publicationStatus === "draft" && courseData.course_nft_policy_id) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort courses based on sort configuration
 */
export function sortCourses(
  courses: ListOwnedCoursesOutput,
  sortConfig: CourseSortConfig,
  moduleCounts: Record<string, number>
): ListOwnedCoursesOutput {
  const sorted = [...courses];

  sorted.sort((a, b) => {
    let compareValue = 0;

    switch (sortConfig.field) {
      case "title":
        compareValue = a.title.localeCompare(b.title);
        break;
      case "course_code":
        compareValue = a.course_code.localeCompare(b.course_code);
        break;
      case "moduleCount": {
        const aCount = moduleCounts[a.course_code] ?? 0;
        const bCount = moduleCounts[b.course_code] ?? 0;
        compareValue = aCount - bCount;
        break;
      }
    }

    return sortConfig.direction === "asc" ? compareValue : -compareValue;
  });

  return sorted;
}

/**
 * Calculate course statistics
 */
export function calculateCourseStats(
  courses: ListOwnedCoursesOutput,
  moduleCounts: Record<string, number>
) {
  const total = courses.length;
  const published = courses.filter((c) => c.course_nft_policy_id !== null).length;
  const draft = total - published;

  const totalModules = Object.values(moduleCounts).reduce((sum, count) => sum + count, 0);

  return {
    total,
    published,
    draft,
    totalModules,
  };
}
