"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { env } from "~/env";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { AlertCircle, BookOpen } from "lucide-react";
import { type CourseOutput, type ListCourseModulesOutput } from "andamio-db-api";

/**
 * Public page displaying course details and module list
 *
 * API Endpoints:
 * - GET /courses/{courseNftPolicyId} (public)
 * - GET /course-modules/{courseNftPolicyId} (public)
 * Type Reference: See API-TYPE-REFERENCE.md in andamio-db-api
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

        // Fetch course modules
        const modulesResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}`
        );

        if (!modulesResponse.ok) {
          const errorText = await modulesResponse.text();
          console.error("Modules fetch error:", {
            status: modulesResponse.status,
            statusText: modulesResponse.statusText,
            body: errorText,
            url: `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}`
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
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
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

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error ?? "Course not found"}
          </AlertDescription>
        </Alert>
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

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Modules</h2>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Module Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-32">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((module) => (
                <TableRow key={module.moduleCode}>
                  <TableCell className="font-mono text-xs">
                    {module.moduleCode}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/course/${courseNftPolicyId}/${module.moduleCode}`}
                      className="font-medium hover:underline"
                    >
                      {module.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {module.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{module.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
