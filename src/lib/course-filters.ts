/**
 * Course filtering, sorting, and view mode utilities
 * Used by Course Creator interface for managing course data
 */

import { type FlattenedCourseListItem } from "~/hooks/api/course/use-course";

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
  courses: FlattenedCourseListItem[],
  filter: CourseFilter
): FlattenedCourseListItem[] {
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
    // In the new API, "source" indicates data origin:
    // - "merged" or "chain_only" = published (on-chain)
    // - "db_only" = draft (not yet on chain)
    if (filter.publicationStatus !== "all") {
      const isPublished = courseData.source === "merged" || courseData.source === "chain_only";
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
  courses: FlattenedCourseListItem[],
  sortConfig: CourseSortConfig,
  moduleCounts: Record<string, number>
): FlattenedCourseListItem[] {
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
  courses: FlattenedCourseListItem[],
  moduleCounts: Record<string, number>
) {
  const total = courses.length;
  // Published = on-chain (merged or chain_only source)
  const published = courses.filter(
    (c) => c.source === "merged" || c.source === "chain_only"
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
