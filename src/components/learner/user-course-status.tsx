"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useCourse, useCourseModules, useStudentCourses } from "~/hooks/api";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioCardLoading } from "~/components/andamio/andamio-loading";
import { AndamioText } from "~/components/andamio/andamio-text";
import {
  SuccessIcon,
  OnChainIcon,
  ModuleIcon,
  CourseIcon,
} from "~/components/icons";

/**
 * User Course Status Component
 *
 * Displays the authenticated learner's enrollment status in a course.
 * Uses the V2 merged API endpoints.
 *
 * Note: Detailed per-module progress is not available in V2 API.
 * This component shows enrollment and completion status only.
 */

interface UserCourseStatusProps {
  courseNftPolicyId: string;
}

export function UserCourseStatus({ courseNftPolicyId }: UserCourseStatusProps) {
  const { isAuthenticated } = useAndamioAuth();

  // Fetch merged course data
  const { data: course, isLoading: courseLoading } = useCourse(courseNftPolicyId);

  // Fetch database modules for count
  const { data: dbModules } = useCourseModules(courseNftPolicyId);

  // Fetch user's enrolled/completed courses
  const { data: studentCourses, isLoading: studentLoading, refetch: refetchStudent } = useStudentCourses();

  // Find this course in student's courses
  const studentCourseStatus = useMemo(() => {
    if (!studentCourses) return null;
    return studentCourses.find((c) => c.courseId === courseNftPolicyId);
  }, [studentCourses, courseNftPolicyId]);

  if (!isAuthenticated) {
    return null;
  }

  const isLoading = courseLoading || studentLoading;

  if (isLoading) {
    return <AndamioCardLoading title="Your Progress" lines={3} />;
  }

  // If not enrolled, show enrollment prompt
  if (!studentCourseStatus) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <div className="flex items-center gap-2">
            <CourseIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <AndamioCardTitle>Get Started</AndamioCardTitle>
              <AndamioCardDescription>
                Begin your learning journey in {course?.title ?? "this course"}
              </AndamioCardDescription>
            </div>
          </div>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
            <ModuleIcon className="h-4 w-4 text-muted-foreground" />
            <AndamioText variant="small">
              Commit to a module assignment to start tracking your progress.
            </AndamioText>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  const isCompleted = studentCourseStatus.enrollmentStatus === "completed";
  const totalModules = dbModules?.length ?? 0;
  const courseTitle = course?.title ?? "this course";

  // Completed state
  if (isCompleted) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <div className="flex items-center gap-2">
            <SuccessIcon className="h-5 w-5 text-primary" />
            <div>
              <AndamioCardTitle>Course Complete!</AndamioCardTitle>
              <AndamioCardDescription>
                You&apos;ve earned your credential for {courseTitle}
              </AndamioCardDescription>
            </div>
          </div>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-md bg-primary/10 border-primary/20">
            <div className="flex items-center gap-2">
              <OnChainIcon className="h-4 w-4 text-primary" />
              <AndamioText className="text-sm font-medium">Credential Earned</AndamioText>
            </div>
            <AndamioBadge status="success">Verified</AndamioBadge>
          </div>

          {totalModules > 0 && (
            <AndamioText variant="small" className="text-muted-foreground">
              All {totalModules} modules completed
            </AndamioText>
          )}

          <Link href="/credentials">
            <AndamioButton variant="outline" size="sm">
              View All Credentials
            </AndamioButton>
          </Link>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Enrolled (in progress) state
  return (
    <AndamioCard>
      <AndamioCardHeader>
        <div className="flex items-center gap-2">
          <OnChainIcon className="h-5 w-5 text-primary" />
          <div>
            <AndamioCardTitle>Enrolled</AndamioCardTitle>
            <AndamioCardDescription>
              You&apos;re enrolled in {courseTitle}
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
          <ModuleIcon className="h-4 w-4 text-muted-foreground" />
          <AndamioText variant="small">
            Continue working through the modules to earn your course credential.
          </AndamioText>
        </div>

        {totalModules > 0 && (
          <AndamioText variant="small" className="text-muted-foreground">
            This course has {totalModules} {totalModules === 1 ? "module" : "modules"}
          </AndamioText>
        )}

        {/* Refresh button */}
        <div className="pt-2 border-t">
          <AndamioButton
            size="sm"
            variant="ghost"
            onClick={() => refetchStudent()}
            className="text-xs"
          >
            Refresh status
          </AndamioButton>
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
