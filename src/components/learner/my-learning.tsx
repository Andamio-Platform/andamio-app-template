"use client";

import React from "react";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useStudentCourses, type StudentCourse } from "~/hooks/api";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AlertIcon, CourseIcon, OnChainIcon } from "~/components/icons";

/**
 * My Learning component - Shows learner's enrolled courses
 *
 * Data Source:
 * - Merged API: POST /api/v2/course/student/courses/list
 *
 * Returns courses with both on-chain enrollment status and DB content (title, description).
 */

/**
 * Individual course card - title comes from merged API response
 */
function EnrolledCourseCard({ course }: { course: StudentCourse }) {
  const courseId = course.courseId ?? "";
  const title = course.title ?? `Course ${courseId.slice(0, 8)}...`;
  const description = course.description;

  return (
    <Link
      href={`/course/${courseId}`}
      className="block border rounded-lg p-4 hover:bg-accent transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <OnChainIcon className="h-4 w-4 text-success shrink-0" />
            <h3 className="font-semibold truncate">{title}</h3>
          </div>
          {description && (
            <AndamioText variant="small" className="line-clamp-2 mb-2">
              {description}
            </AndamioText>
          )}
          <code className="text-xs text-muted-foreground font-mono">
            {courseId.slice(0, 16)}...
          </code>
        </div>
        <AndamioButton size="sm" variant="ghost">
          Continue
        </AndamioButton>
      </div>
    </Link>
  );
}

export function MyLearning() {
  const { isAuthenticated, user } = useAndamioAuth();

  // Fetch enrolled courses from merged API
  const { data: enrolledCourses, isLoading, error } = useStudentCourses();

  // Not authenticated or no access token
  if (!isAuthenticated || !user?.accessTokenAlias) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>My Learning</AndamioCardTitle>
          <AndamioCardDescription>Your enrolled courses on-chain</AndamioCardDescription>
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
          <AndamioCardDescription>Your enrolled courses on-chain</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <AndamioAlert variant="destructive">
            <AlertIcon className="h-4 w-4" />
            <AndamioAlertTitle>Error</AndamioAlertTitle>
            <AndamioAlertDescription>{error.message}</AndamioAlertDescription>
          </AndamioAlert>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Empty state
  if (!enrolledCourses || enrolledCourses.length === 0) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>My Learning</AndamioCardTitle>
          <AndamioCardDescription>Your enrolled courses on-chain</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CourseIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <AndamioText variant="small" className="mb-2">
              You haven&apos;t enrolled in any courses yet.
            </AndamioText>
            <AndamioText variant="small" className="text-xs mb-4">
              Browse courses and submit an assignment to enroll.
            </AndamioText>
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
            <AndamioCardDescription>
              {enrolledCourses.length} {enrolledCourses.length === 1 ? "course" : "courses"} enrolled on-chain
            </AndamioCardDescription>
          </div>
          <Link href="/course">
            <AndamioButton variant="outline" size="sm">
              Browse More
            </AndamioButton>
          </Link>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent>
        <div className="space-y-3">
          {enrolledCourses.map((course) => (
            <EnrolledCourseCard key={course.courseId} course={course} />
          ))}
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
