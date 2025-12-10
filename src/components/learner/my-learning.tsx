"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
import { learnerLogger } from "~/lib/debug-logger";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AlertCircle, BookOpen, CheckCircle, Clock, FileText } from "lucide-react";
import { type z } from "zod";
import { type getMyLearningOutputSchema } from "@andamio/db-api";

/**
 * My Learning component - Shows learner's enrolled courses and assignment progress
 *
 * API Endpoints:
 * - GET /learner/my-learning (protected) - Single efficient endpoint that returns all courses with commitments
 *
 * Performance: 1 API call instead of 50-100+ calls with previous implementation
 */

type MyLearningData = z.infer<typeof getMyLearningOutputSchema>;
type CourseWithProgress = MyLearningData['courses'][number];

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
        learnerLogger.debug("Fetching my learning from:", `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/learner/my-learning`);

        // Single API call to get all courses with learner's commitments (POST /learner/my-learning)
        const response = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/learner/my-learning`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          }
        );

        learnerLogger.debug("Response status:", response.status);

        // 404 means no learner record exists yet - treat as empty state, not error
        if (response.status === 404) {
          learnerLogger.info("No learner record found - user hasn't enrolled in any courses yet");
          setCourses([]);
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          learnerLogger.error("Failed to fetch my learning:", response.status, errorText);
          throw new Error(`Failed to fetch my learning: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as MyLearningData;
        learnerLogger.info("My Learning data loaded:", data.courses.length, "courses");

        setCourses(data.courses);
      } catch (err) {
        learnerLogger.error("Error fetching learning progress:", err);
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
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>My Learning</AndamioCardTitle>
          <AndamioCardDescription>Your enrolled courses and progress</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <AndamioSkeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Error state
  if (error) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>My Learning</AndamioCardTitle>
          <AndamioCardDescription>Your enrolled courses and progress</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <AndamioAlert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AndamioAlertTitle>Error</AndamioAlertTitle>
            <AndamioAlertDescription>{error}</AndamioAlertDescription>
          </AndamioAlert>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Empty state
  if (courses.length === 0) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>My Learning</AndamioCardTitle>
          <AndamioCardDescription>Your enrolled courses and progress</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              You haven&apos;t started any courses yet.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Browse courses and commit to assignments to see them here.
            </p>
            <Link href="/course">
              <AndamioButton>Browse Courses</AndamioButton>
            </Link>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Courses list
  return (
    <AndamioCard>
      <AndamioCardHeader>
        <div className="flex items-center justify-between">
          <div>
            <AndamioCardTitle>My Learning</AndamioCardTitle>
            <AndamioCardDescription>Your enrolled courses and progress</AndamioCardDescription>
          </div>
          <Link href="/course">
            <AndamioButton variant="outline" size="sm">
              Browse More Courses
            </AndamioButton>
          </Link>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent>
        <div className="space-y-4">
          {courses.map((course) => {
            const progress = course.commitment_count > 0
              ? Math.round((course.completed_count / course.commitment_count) * 100)
              : 0;

            return (
              <div
                key={course.course_nft_policy_id}
                className="border rounded-lg p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Link
                      href={`/course/${course.course_nft_policy_id}`}
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
                        <span>{course.commitment_count} assignments</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        <span>{course.completed_count} completed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{progress}% progress</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <AndamioBadge variant={progress === 100 ? "default" : "secondary"}>
                      {progress === 100 ? "Complete" : "In Progress"}
                    </AndamioBadge>
                    <Link href={`/course/${course.course_nft_policy_id}`}>
                      <AndamioButton size="sm" variant="ghost">
                        Continue Learning
                      </AndamioButton>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
