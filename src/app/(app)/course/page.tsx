"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { env } from "~/env";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AlertCircle, BookOpen } from "lucide-react";
import { type ListPublishedCoursesOutput } from "andamio-db-api";

/**
 * Public page displaying all published courses
 *
 * API Endpoint: GET /courses/published (public)
 * Type Reference: See API-TYPE-REFERENCE.md in andamio-db-api
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
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/published`
        );

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
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground">
            Browse all published courses
          </p>
        </div>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <AndamioSkeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground">
            Browse all published courses
          </p>
        </div>

        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{error}</AndamioAlertDescription>
        </AndamioAlert>
      </div>
    );
  }

  // Empty state
  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground">
            Browse all published courses
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            No published courses found.
          </p>
        </div>
      </div>
    );
  }

  // Courses list
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Courses</h1>
        <p className="text-muted-foreground">
          Browse all published courses
        </p>
      </div>

      <div className="border rounded-md">
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
              <AndamioTableRow key={course.courseNftPolicyId ?? course.courseCode}>
                <AndamioTableCell>
                  <Link
                    href={`/course/${course.courseNftPolicyId}`}
                    className="font-medium hover:underline"
                  >
                    {course.title}
                  </Link>
                </AndamioTableCell>
                <AndamioTableCell className="font-mono text-xs break-all">
                  {course.courseNftPolicyId}
                </AndamioTableCell>
                <AndamioTableCell>
                  {course.description}
                </AndamioTableCell>
              </AndamioTableRow>
            ))}
          </AndamioTableBody>
        </AndamioTable>
      </div>
    </div>
  );
}
