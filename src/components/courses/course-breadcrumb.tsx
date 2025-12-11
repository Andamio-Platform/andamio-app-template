"use client";

import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";

/**
 * Breadcrumb navigation for course pages (public and studio views)
 *
 * Usage:
 * // Course page
 * <CourseBreadcrumb
 *   mode="public"
 *   course={{ nftPolicyId: "abc", title: "My Course" }}
 * />
 *
 * // Module page
 * <CourseBreadcrumb
 *   mode="studio"
 *   course={{ nftPolicyId: "abc", title: "My Course" }}
 *   courseModule={{ code: "mod-1", title: "Module 1" }}
 * />
 *
 * // Lesson page
 * <CourseBreadcrumb
 *   mode="public"
 *   course={{ nftPolicyId: "abc", title: "My Course" }}
 *   courseModule={{ code: "mod-1", title: "Module 1" }}
 *   lesson={{ index: 1, title: "Lesson 1" }}
 * />
 */

export interface CourseBreadcrumbProps {
  /** Navigation mode: public (/course/...) or studio (/studio/course/...) */
  mode: "public" | "studio";

  /** Course information (required for all course-related pages) */
  course?: {
    nftPolicyId: string;
    title: string;
  };

  /** Module information (for module, lesson, assignment pages) */
  courseModule?: {
    code: string;
    title: string;
  };

  /** Lesson information (for lesson detail pages) */
  lesson?: {
    index: number;
    title?: string;
  };

  /** Current page type (determines which item is the current page) */
  currentPage?: "courses" | "course" | "module" | "lesson" | "assignment" | "introduction" | "slts" | "instructor";
}

/**
 * Truncate text to specified length with ellipsis
 */
function truncate(text: string, maxLength = 30): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export function CourseBreadcrumb({
  mode,
  course,
  courseModule,
  lesson,
  currentPage = "course",
}: CourseBreadcrumbProps) {
  const basePath = mode === "studio" ? "/studio/course" : "/course";
  const coursesLabel = mode === "studio" ? "Course Studio" : "Courses";
  const coursesPath = mode === "studio" ? "/studio/course" : "/courses";

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {/* Courses / Course Studio link */}
        <BreadcrumbItem>
          {currentPage === "courses" ? (
            <BreadcrumbPage>{coursesLabel}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link href={coursesPath}>{coursesLabel}</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {/* Course link (if course is provided) */}
        {course && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {currentPage === "course" ? (
                <BreadcrumbPage className="max-w-[200px] truncate">
                  {truncate(course.title, 40)}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    href={`${basePath}/${course.nftPolicyId}`}
                    className="max-w-[200px] truncate inline-block"
                  >
                    {truncate(course.title, 40)}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </>
        )}

        {/* Module link (if module is provided) */}
        {course && courseModule && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {currentPage === "module" ? (
                <BreadcrumbPage className="max-w-[200px] truncate">
                  {truncate(courseModule.title, 30)}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    href={`${basePath}/${course.nftPolicyId}/${courseModule.code}`}
                    className="max-w-[200px] truncate inline-block"
                  >
                    {truncate(courseModule.title, 30)}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </>
        )}

        {/* Lesson (current page indicator) */}
        {course && courseModule && lesson && currentPage === "lesson" && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[200px] truncate">
                {lesson.title ? truncate(lesson.title, 30) : `Lesson ${lesson.index}`}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}

        {/* Assignment (current page indicator) */}
        {course && courseModule && currentPage === "assignment" && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Assignment</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}

        {/* Introduction (current page indicator - studio only) */}
        {course && courseModule && currentPage === "introduction" && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Introduction</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}

        {/* SLTs (current page indicator - studio only) */}
        {course && courseModule && currentPage === "slts" && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Learning Targets</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}

        {/* Instructor Dashboard (current page indicator - studio only) */}
        {course && currentPage === "instructor" && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Instructor</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
