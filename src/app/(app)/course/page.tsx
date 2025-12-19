"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { env } from "~/env";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import {
  AndamioPageHeader,
  AndamioTableContainer,
  AndamioPageLoading,
  AndamioNotFoundCard,
  AndamioEmptyState,
} from "~/components/andamio";
import { BookOpen } from "lucide-react";
import { type ListPublishedCoursesOutput } from "@andamio/db-api";

/**
 * Public page displaying all published courses
 *
 * API Endpoint: GET /courses/published (public)
 * Type Reference: See API-TYPE-REFERENCE.md in @andamio/db-api
 */
export default function CoursePage() {
  const [courses, setCourses] = useState<ListPublishedCoursesOutput>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublishedCourses = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/published`,
          {
            method: "GET",
            headers: { "Accept": "application/json" },
          }
        );

        // 404 means no published courses exist yet - treat as empty state, not error
        if (response.status === 404) {
          setCourses([]);
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch courses: ${response.statusText}`);
        }

        const data = (await response.json()) as ListPublishedCoursesOutput;
        setCourses(data ?? []);
      } catch (err) {
        console.error("Error fetching published courses:", err);
        setError(err instanceof Error ? err.message : "Failed to load courses");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPublishedCourses();
  }, []);

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
          icon={BookOpen}
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
