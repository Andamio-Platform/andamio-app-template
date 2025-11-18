"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { AlertCircle, BookOpen, Settings } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { type ListOwnedCoursesOutput } from "andamio-db-api";

/**
 * Component to display courses owned by the authenticated user
 *
 * API Endpoints:
 * - GET /courses/owned (protected)
 * - POST /course-modules/list (public) - Batch query for modules
 * Type Reference: See API-TYPE-REFERENCE.md in andamio-db-api
 *
 * @example
 * // The ListOwnedCoursesOutput type is auto-generated from the API
 * const courses: ListOwnedCoursesOutput = [
 *   {
 *     id: "...",
 *     courseCode: "example-101",
 *     title: "Example Course",
 *     // ... more fields
 *   }
 * ];
 */
export function OwnedCoursesList() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();
  const [courses, setCourses] = useState<ListOwnedCoursesOutput>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Module counts per course
  const [moduleCounts, setModuleCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      setCourses([]);
      setError(null);
      return;
    }

    const fetchOwnedCourses = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/owned`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch courses: ${response.statusText}`);
        }

        const data = (await response.json()) as ListOwnedCoursesOutput;
        setCourses(data ?? []);

        // Fetch module counts for all courses using batch endpoint
        if (data && data.length > 0) {
          try {
            const courseCodes = data.map((c) => c.courseCode);
            const modulesResponse = await fetch(
              `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/list`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courseCodes }),
              }
            );

            if (modulesResponse.ok) {
              const modulesData = (await modulesResponse.json()) as Record<
                string,
                Array<{ moduleCode: string; title: string }>
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
            // Don't set error state, module counts are optional enhancement
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

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center border rounded-md">
        <p className="text-sm text-muted-foreground">
          Connect and authenticate to view your courses
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          No courses found. Create your first course to get started.
        </p>
      </div>
    );
  }

  // Courses list
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Course Code</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-center">Modules</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.courseCode}>
              <TableCell className="font-mono text-xs">
                {course.courseCode}
              </TableCell>
              <TableCell className="font-medium">
                {course.title}
              </TableCell>
              <TableCell className="max-w-md truncate">
                {course.description}
              </TableCell>
              <TableCell className="text-center">
                {moduleCounts[course.courseCode] !== undefined ? (
                  <Badge variant="secondary">
                    {moduleCounts[course.courseCode]}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {course.courseNftPolicyId && (
                  <Link href={`/studio/course/${course.courseNftPolicyId}`}>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                  </Link>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
