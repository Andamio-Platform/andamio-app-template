/**
 * Course filtering, sorting, and view mode utilities
 * Used by Course Creator interface for managing course data
 */

import { type CourseListResponse } from "~/types/generated";

// View mode options
export type CourseViewMode = "grid" | "table" | "list";

// Filter options (using only available API fields)
export type CourseFilter = {
  search: string;
  publicationStatus: "all" | "published" | "draft";
};

// Sort options (using only available API fields)
export type CourseSortField = "title" | "course_id" | "moduleCount";
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

// Helper to safely get string value from NullableString
function getStringValue(value: string | object | undefined | null): string {
  if (typeof value === "string") return value;
  return "";
}

/**
 * Filter courses based on filter criteria
 */
export function filterCourses(
  courses: CourseListResponse,
  filter: CourseFilter
): CourseListResponse {
  return courses.filter((courseData) => {
    // Search filter (title, id, description)
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const title = getStringValue(courseData.title);
      const courseId = courseData.course_id ?? "";
      const description = getStringValue(courseData.description);
      const matchesSearch =
        title.toLowerCase().includes(searchLower) ||
        courseId.toLowerCase().includes(searchLower) ||
        description.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Publication status filter
    // Note: In the new API, course_id serves as the identifier
    // Published courses have course_status set
    if (filter.publicationStatus !== "all") {
      const isPublished = courseData.course_status === "PUBLISHED" || courseData.course_status === "ON_CHAIN";
      if (filter.publicationStatus === "published" && !isPublished) {
        return false;
      }
      if (filter.publicationStatus === "draft" && isPublished) {
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
  courses: CourseListResponse,
  sortConfig: CourseSortConfig,
  moduleCounts: Record<string, number>
): CourseListResponse {
  const sorted = [...courses];

  sorted.sort((a, b) => {
    let compareValue = 0;

    switch (sortConfig.field) {
      case "title": {
        const aTitle = getStringValue(a.title);
        const bTitle = getStringValue(b.title);
        compareValue = aTitle.localeCompare(bTitle);
        break;
      }
      case "course_id": {
        const aId = a.course_id ?? "";
        const bId = b.course_id ?? "";
        compareValue = aId.localeCompare(bId);
        break;
      }
      case "moduleCount": {
        const aCount = moduleCounts[a.course_id ?? ""] ?? 0;
        const bCount = moduleCounts[b.course_id ?? ""] ?? 0;
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
  courses: CourseListResponse,
  moduleCounts: Record<string, number>
) {
  const total = courses.length;
  const published = courses.filter(
    (c) => c.course_status === "PUBLISHED" || c.course_status === "ON_CHAIN"
  ).length;
  const draft = total - published;

  const totalModules = Object.values(moduleCounts).reduce((sum, count) => sum + count, 0);

  return {
    total,
    published,
    draft,
    totalModules,
  };
}
