"use client";

import React, { useEffect, useState } from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { AlertCircle, BookOpen } from "lucide-react";
import { type ListOwnedCoursesOutput } from "andamio-database-api"

/**
 * Component to display courses owned by the authenticated user
 * Fetches from Andamio Database API /courses/owned endpoint
 */
export function OwnedCoursesList() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();
  const [courses, setCourses] = useState<ListOwnedCoursesOutput>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Connect and authenticate to view your courses
          </p>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
          </Card>
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
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            No courses found. Create your first course to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Courses list
  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <Card key={course.courseCode}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  {course.live && (
                    <Badge variant="default">Live</Badge>
                  )}
                  {!course.live && (
                    <Badge variant="secondary">Draft</Badge>
                  )}
                </div>
                {course.description && (
                  <CardDescription>{course.description}</CardDescription>
                )}
                <div className="flex gap-2 pt-1">
                  <Badge variant="outline" className="font-mono text-xs">
                    {course.courseCode}
                  </Badge>
                  {course.category && (
                    <Badge variant="outline">{course.category}</Badge>
                  )}
                  {course.accessTier && (
                    <Badge variant="outline">{course.accessTier}</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
