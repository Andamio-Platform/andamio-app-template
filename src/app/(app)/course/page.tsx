"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { env } from "~/env";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Skeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { AlertCircle, BookOpen } from "lucide-react";
import { type RouterOutputs } from "andamio-db-api";

type ListCoursesOutput = RouterOutputs["course"]["getPublishedCourses"];

export default function CoursePage() {
  const [courses, setCourses] = useState<ListCoursesOutput>([]);
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

        const data = (await response.json()) as ListCoursesOutput;
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
            <Skeleton key={i} className="h-12 w-full" />
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

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Course NFT Policy ID</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.courseNftPolicyId ?? course.courseCode}>
                <TableCell>
                  <Link
                    href={`/course/${course.courseNftPolicyId}`}
                    className="font-medium hover:underline"
                  >
                    {course.title}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs max-w-xs truncate">
                  {course.courseNftPolicyId}
                </TableCell>
                <TableCell className="max-w-md truncate">
                  {course.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
