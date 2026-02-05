"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioAuthButton } from "~/components/auth/andamio-auth-button";
import { AndamioPageLoading, AndamioStudioLoading, AndamioAlert, AndamioAlertDescription, AndamioButton, AndamioText } from "~/components/andamio";
import { AlertIcon, BackIcon, SecurityAlertIcon } from "~/components/icons";
import { useOwnerCourses } from "~/hooks/api";

interface RequireCourseAccessProps {
  /** Course NFT Policy ID to check access for */
  courseId: string;
  /** Title shown when not authenticated */
  title?: string;
  /** Description shown when not authenticated */
  description?: string;
  /** Loading variant - "page" for app pages, "studio-centered" or "studio-split" for studio pages */
  loadingVariant?: "page" | "studio-centered" | "studio-split";
  /** Content to render when user has access */
  children: React.ReactNode;
}

/**
 * Wrapper component that verifies the user has Owner or Teacher access to a course.
 *
 * Authorization logic:
 * - First checks if user is authenticated
 * - Then calls /api/v2/course/owner/courses/list to get courses owned by the user
 * - Checks if the specified course_id is in the owned courses list
 *
 * @example
 * ```tsx
 * <RequireCourseAccess
 *   courseId={courseId}
 *   title="Edit Module"
 *   description="You need access to this course to edit modules"
 * >
 *   <ModuleWizard />
 * </RequireCourseAccess>
 * ```
 */
export function RequireCourseAccess({
  courseId,
  title = "Course Access Required",
  description = "Connect your wallet to access this course",
  loadingVariant = "page",
  children,
}: RequireCourseAccessProps) {
  const router = useRouter();
  const { isAuthenticated } = useAndamioAuth();

  // Use React Query hook for owned courses
  const {
    data: ownedCourses,
    isLoading,
    error: queryError,
  } = useOwnerCourses();

  // Derive access check from hook data
  const hasAccess = ownedCourses?.some(
    (course) => course.courseId === courseId
  ) ?? false;
  const error = queryError?.message ?? null;

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <SecurityAlertIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h1>{title}</h1>
        <AndamioText variant="muted" className="text-center mb-6 max-w-md">
          {description}
        </AndamioText>
        <AndamioAuthButton />
      </div>
    );
  }

  // Loading - show skeleton matching the page type
  if (isLoading) {
    if (loadingVariant === "studio-split") {
      return <AndamioStudioLoading variant="split-pane" />;
    }
    if (loadingVariant === "studio-centered") {
      return <AndamioStudioLoading variant="centered" />;
    }
    return <AndamioPageLoading variant="detail" />;
  }

  // Error - show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <AndamioAlert variant="destructive" className="max-w-md">
          <AlertIcon className="h-4 w-4" />
          <AndamioAlertDescription>
            {error}
          </AndamioAlertDescription>
        </AndamioAlert>
        <AndamioButton
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          <BackIcon className="h-4 w-4 mr-2" />
          Go Back
        </AndamioButton>
      </div>
    );
  }

  // No access - show access denied
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <SecurityAlertIcon className="h-12 w-12 text-destructive/70 mb-4" />
        <h1>Access Denied</h1>
        <AndamioText variant="muted" className="text-center mb-6 max-w-md">
          You don&apos;t have permission to edit this course. Only course owners
          and teachers can access this page.
        </AndamioText>
        <div className="flex gap-3">
          <AndamioButton
            variant="outline"
            onClick={() => router.push("/studio/course")}
          >
            <BackIcon className="h-4 w-4 mr-2" />
            Back to Course Studio
          </AndamioButton>
          <AndamioButton
            variant="secondary"
            onClick={() => router.push(`/course/${courseId}`)}
          >
            View Course
          </AndamioButton>
        </div>
      </div>
    );
  }

  // Has access - render children
  return <>{children}</>;
}
