"use client";

import React from "react";
import Link from "next/link";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import {
  AndamioPageHeader,
  AndamioTableContainer,
  AndamioPageLoading,
  AndamioNotFoundCard,
  AndamioEmptyState,
} from "~/components/andamio";
import { CourseIcon } from "~/components/icons";
import { usePublishedCourses } from "~/hooks/api";

/**
 * Public page displaying all published courses
 *
 * Uses React Query for cached, deduplicated data fetching:
 * - usePublishedCourses: All published courses (cached globally)
 *
 * Benefits: Automatic caching, background refetching, request deduplication
 */
export default function CoursePage() {
  const {
    data: courses = [],
    isLoading,
    error: coursesError,
  } = usePublishedCourses();

  const error = coursesError?.message ?? null;

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="list" />;
  }

  // Error state
  if (error) {
    return (
      <AndamioNotFoundCard
        title="Courses"
        message={error}
      />
    );
  }

  // Empty state
  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <AndamioPageHeader
          title="Courses"
          description="Browse all published courses"
        />
        <AndamioEmptyState
          icon={CourseIcon}
          title="No Published Courses"
          description="There are currently no published courses available. Check back later or create your own course."
        />
      </div>
    );
  }

  // Courses list
  return (
    <div className="space-y-6">
      <AndamioPageHeader
        title="Courses"
        description="Browse all published courses"
      />

      <AndamioTableContainer>
        <AndamioTable>
          <AndamioTableHeader>
            <AndamioTableRow>
              <AndamioTableHead>Title</AndamioTableHead>
              <AndamioTableHead>Course NFT Policy ID</AndamioTableHead>
              <AndamioTableHead>Description</AndamioTableHead>
            </AndamioTableRow>
          </AndamioTableHeader>
          <AndamioTableBody>
            {courses.map((course) => (
              <AndamioTableRow key={course.course_nft_policy_id ?? course.course_code}>
                <AndamioTableCell>
                  <Link
                    href={`/course/${course.course_nft_policy_id}`}
                    className="font-medium hover:underline"
                  >
                    {course.title}
                  </Link>
                </AndamioTableCell>
                <AndamioTableCell className="font-mono text-xs break-all">
                  {course.course_nft_policy_id}
                </AndamioTableCell>
                <AndamioTableCell>
                  {course.description}
                </AndamioTableCell>
              </AndamioTableRow>
            ))}
          </AndamioTableBody>
        </AndamioTable>
      </AndamioTableContainer>
    </div>
  );
}
