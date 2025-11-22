"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { env } from "~/env";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AlertCircle, BookOpen } from "lucide-react";
import { type CourseOutput, type ListCourseModulesOutput } from "@andamio/db-api";
import { UserCourseStatus } from "~/components/learner/user-course-status";

/**
 * Public page displaying course details and module list with SLT counts
 *
 * API Endpoints:
 * - GET /courses/{courseNftPolicyId} (public)
 * - GET /courses/${courseNftPolicyId}/course-modules (public) - Optimized query for modules with SLTs
 * Type Reference: See API-TYPE-REFERENCE.md in @andamio/db-api
 */

export default function CourseDetailPage() {
  const params = useParams();
  const courseNftPolicyId = params.coursenft as string;

  const [course, setCourse] = useState<CourseOutput | null>(null);
  const [modules, setModules] = useState<ListCourseModulesOutput>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseAndModules = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch course details
        const courseResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/${courseNftPolicyId}`
        );

        if (!courseResponse.ok) {
          const errorText = await courseResponse.text();
          console.error("Course fetch error:", {
            status: courseResponse.status,
            statusText: courseResponse.statusText,
            body: errorText,
            url: `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/${courseNftPolicyId}`
          });
          throw new Error(`Course not found (${courseResponse.status})`);
        }

        const courseData = (await courseResponse.json()) as CourseOutput;
        setCourse(courseData);

        // Fetch course modules with SLTs (optimized single query)
        const modulesResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/${courseNftPolicyId}/course-modules`
        );

        if (!modulesResponse.ok) {
          const errorText = await modulesResponse.text();
          console.error("Modules fetch error:", {
            status: modulesResponse.status,
            statusText: modulesResponse.statusText,
            body: errorText,
            url: `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/${courseNftPolicyId}/course-modules`
          });
          throw new Error(`Failed to fetch course modules (${modulesResponse.status})`);
        }

        const modulesData = (await modulesResponse.json()) as ListCourseModulesOutput;
        setModules(modulesData ?? []);
      } catch (err) {
        console.error("Error fetching course and modules:", err);
        setError(err instanceof Error ? err.message : "Failed to load course");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCourseAndModules();
  }, [courseNftPolicyId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <AndamioSkeleton className="h-9 w-64 mb-2" />
          <AndamioSkeleton className="h-5 w-96" />
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
  if (error || !course) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Course Not Found</h1>
        </div>

        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>
            {error ?? "Course not found"}
          </AndamioAlertDescription>
        </AndamioAlert>
      </div>
    );
  }

  // Empty modules state
  if (modules.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          {course.description && (
            <p className="text-muted-foreground">{course.description}</p>
          )}
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            No modules found for this course.
          </p>
        </div>
      </div>
    );
  }

  // Course and modules display
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{course.title}</h1>
        {course.description && (
          <p className="text-muted-foreground">{course.description}</p>
        )}
      </div>

      {/* User Course Status */}
      <UserCourseStatus courseNftPolicyId={courseNftPolicyId} />

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Course Modules</h2>
        <div className="border rounded-md">
          <AndamioTable>
            <AndamioTableHeader>
              <AndamioTableRow>
                <AndamioTableHead className="w-32">Module Code</AndamioTableHead>
                <AndamioTableHead>Title</AndamioTableHead>
                <AndamioTableHead className="w-32 text-center">Learning Objectives</AndamioTableHead>
              </AndamioTableRow>
            </AndamioTableHeader>
            <AndamioTableBody>
              {modules.map((module) => (
                <AndamioTableRow key={module.moduleCode}>
                  <AndamioTableCell className="font-mono text-xs">
                    {module.moduleCode}
                  </AndamioTableCell>
                  <AndamioTableCell>
                    <Link
                      href={`/course/${courseNftPolicyId}/${module.moduleCode}`}
                      className="font-medium hover:underline"
                    >
                      {module.title}
                    </Link>
                  </AndamioTableCell>
                  <AndamioTableCell className="text-center">
                    <AndamioBadge variant="secondary">
                      {module.slts.length} {module.slts.length === 1 ? "SLT" : "SLTs"}
                    </AndamioBadge>
                  </AndamioTableCell>
                </AndamioTableRow>
              ))}
            </AndamioTableBody>
          </AndamioTable>
        </div>
      </div>
    </div>
  );
}
