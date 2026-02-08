"use client";

import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useStudentCourses, type StudentCourse } from "~/hooks/api";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioCard, AndamioCardContent, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioEmptyState } from "~/components/andamio/andamio-empty-state";
import { AlertIcon, CourseIcon, NextIcon, SuccessIcon } from "~/components/icons";
import { cn } from "~/lib/utils";

/**
 * My Learning component - Shows learner's enrolled courses
 *
 * Data Source:
 * - Merged API: POST /api/v2/course/student/courses/list
 *
 * Returns courses with both on-chain enrollment status and DB content (title, description).
 */

function EnrolledCourseCard({ course }: { course: StudentCourse }) {
  const courseId = course.courseId ?? "";
  const title = course.title ?? `Course ${courseId.slice(0, 8)}...`;
  const isCompleted = course.enrollmentStatus === "completed";

  return (
    <Link
      href={`/course/${courseId}`}
      className="group flex items-center gap-3 rounded-md border px-3 py-2.5 hover:bg-accent transition-colors"
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isCompleted ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        {isCompleted ? (
          <SuccessIcon className="h-3.5 w-3.5" />
        ) : (
          <CourseIcon className="h-3.5 w-3.5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{title}</span>
          {isCompleted && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              Completed
            </span>
          )}
        </div>
        {course.description && (
          <AndamioText variant="small" className="line-clamp-1 text-xs">
            {course.description}
          </AndamioText>
        )}
      </div>
      <NextIcon className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
        <AndamioCardHeader className="pb-3">
          <AndamioCardTitle className="text-base">My Learning</AndamioCardTitle>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <AndamioSkeleton key={i} className="h-12 w-full" />
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
        <AndamioCardHeader className="pb-3">
          <AndamioCardTitle className="text-base">My Learning</AndamioCardTitle>
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
        <AndamioCardHeader className="pb-3">
          <AndamioCardTitle className="text-base">My Learning</AndamioCardTitle>
        </AndamioCardHeader>
        <AndamioCardContent>
          <AndamioEmptyState
            icon={CourseIcon}
            title="No Courses Yet"
            description="Browse courses and submit your first assignment to get started."
            action={
              <Link href="/course">
                <AndamioButton size="sm"><CourseIcon className="mr-2 h-3 w-3" />Browse Courses</AndamioButton>
              </Link>
            }
          />
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  const enrolledCount = enrolledCourses.filter((c) => c.enrollmentStatus !== "completed").length;
  const completedCount = enrolledCourses.filter((c) => c.enrollmentStatus === "completed").length;

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <AndamioCardTitle className="text-base">My Learning</AndamioCardTitle>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted-foreground">
                {enrolledCount} active
              </span>
              {completedCount > 0 && (
                <span className="text-xs text-primary">
                  {completedCount} completed
                </span>
              )}
            </div>
          </div>
          <Link href="/course">
            <AndamioButton variant="outline" size="sm" className="text-xs h-7">
              Browse More
            </AndamioButton>
          </Link>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent>
        <div className="space-y-1.5">
          {enrolledCourses.map((course) => (
            <EnrolledCourseCard key={course.courseId} course={course} />
          ))}
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
