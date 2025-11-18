"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { AlertCircle, BookOpen, CheckCircle, Clock, FileText } from "lucide-react";
import { type ListPublishedCoursesOutput } from "andamio-db-api";

/**
 * My Learning component - Shows learner's enrolled courses and assignment progress
 *
 * API Endpoints:
 * - GET /courses/published (public) - List all published courses
 * - GET /courses/{courseNftPolicyId}/course-modules (public) - List course modules
 * - GET /assignment-commitments/{courseNftPolicyId}/{moduleCode}/has-commitments (public) - Check for commitments
 * - GET /assignment-commitments/learner/course/{courseNftPolicyId} (protected) - Get learner commitments
 *
 * This component will be enhanced to show actual enrollment status
 * once the indexer integration is complete
 */

interface AssignmentCommitment {
  id: string;
  assignmentId: string;
  learnerId: string;
  privateStatus: string;
  networkStatus: string;
  favorite: boolean;
  archived: boolean;
  assignment: {
    id: string;
    assignmentCode: string;
    title: string;
  };
}

interface CourseWithProgress {
  courseCode: string;
  courseNftPolicyId: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  commitmentCount: number;
  completedCount: number;
}

export function MyLearning() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setCourses([]);
      setError(null);
      return;
    }

    const fetchLearningProgress = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all published courses
        const coursesResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/published`
        );

        if (!coursesResponse.ok) {
          const errorText = await coursesResponse.text();
          console.error("Failed to fetch courses:", coursesResponse.status, errorText);
          throw new Error(`Failed to fetch courses: ${coursesResponse.status} ${coursesResponse.statusText}`);
        }

        const allCourses = (await coursesResponse.json()) as ListPublishedCoursesOutput;

        // For each course, check if there are commitments before fetching full list
        const coursesWithProgress: CourseWithProgress[] = [];

        for (const course of allCourses) {
          if (!course.courseNftPolicyId) continue;

          try {
            // First, check if this course has any commitments (optimization)
            // This uses the public endpoint to avoid fetching full commitment list unnecessarily
            const moduleResponse = await fetch(
              `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/${course.courseNftPolicyId}/course-modules`
            );

            if (!moduleResponse.ok) continue;

            const modules = (await moduleResponse.json()) as Array<{ moduleCode: string }>;

            // Check each module for commitments
            let hasAnyCommitments = false;
            for (const courseModule of modules) {
              const hasCommitmentsResponse = await fetch(
                `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignment-commitments/${course.courseNftPolicyId}/${courseModule.moduleCode}/has-commitments`
              );

              if (hasCommitmentsResponse.ok) {
                const hasCommitmentsData = (await hasCommitmentsResponse.json()) as {
                  hasCommitments: boolean;
                  count: number;
                };

                if (hasCommitmentsData.hasCommitments) {
                  hasAnyCommitments = true;
                  break; // Found commitments, no need to check other modules
                }
              }
            }

            // Only fetch full commitment list if we know there are commitments
            if (hasAnyCommitments) {
              const commitmentsResponse = await authenticatedFetch(
                `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignment-commitments/learner/course/${course.courseNftPolicyId}`
              );

              if (commitmentsResponse.ok) {
                const commitments = (await commitmentsResponse.json()) as AssignmentCommitment[];

                // Only include courses where learner has commitments
                if (commitments.length > 0) {
                  const completedCount = commitments.filter(
                    (c) => c.privateStatus === "COMPLETE" || c.networkStatus === "ASSIGNMENT_ACCEPTED"
                  ).length;

                  coursesWithProgress.push({
                    courseCode: course.courseCode,
                    courseNftPolicyId: course.courseNftPolicyId,
                    title: course.title,
                    description: course.description,
                    imageUrl: course.imageUrl,
                    videoUrl: course.videoUrl,
                    commitmentCount: commitments.length,
                    completedCount,
                  });
                }
              }
            }
          } catch (err) {
            console.error(`Error fetching commitments for ${course.courseCode}:`, err);
          }
        }

        setCourses(coursesWithProgress);
      } catch (err) {
        console.error("Error fetching learning progress:", err);
        setError(err instanceof Error ? err.message : "Failed to load learning progress");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchLearningProgress();
  }, [isAuthenticated, authenticatedFetch]);

  // Not authenticated state
  if (!isAuthenticated) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Learning</CardTitle>
          <CardDescription>Your enrolled courses and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Learning</CardTitle>
          <CardDescription>Your enrolled courses and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (courses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Learning</CardTitle>
          <CardDescription>Your enrolled courses and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              You haven&apos;t started any courses yet.
            </p>
            <Link href="/course">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Courses list
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>My Learning</CardTitle>
            <CardDescription>Your enrolled courses and progress</CardDescription>
          </div>
          <Link href="/course">
            <Button variant="outline" size="sm">
              Browse More Courses
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {courses.map((course) => {
            const progress = course.commitmentCount > 0
              ? Math.round((course.completedCount / course.commitmentCount) * 100)
              : 0;

            return (
              <div
                key={course.courseNftPolicyId}
                className="border rounded-lg p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Link
                      href={`/course/${course.courseNftPolicyId}`}
                      className="hover:underline"
                    >
                      <h3 className="font-semibold mb-1">{course.title}</h3>
                    </Link>
                    {course.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {course.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{course.commitmentCount} assignments</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        <span>{course.completedCount} completed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{progress}% progress</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={progress === 100 ? "default" : "secondary"}>
                      {progress === 100 ? "Complete" : "In Progress"}
                    </Badge>
                    <Link href={`/course/${course.courseNftPolicyId}`}>
                      <Button size="sm" variant="ghost">
                        Continue Learning
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
