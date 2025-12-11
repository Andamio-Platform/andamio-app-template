"use client";

import React from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useOwnedCourses } from "~/hooks/use-owned-courses";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AlertCircle, BookOpen } from "lucide-react";
import { CourseModuleCount, CourseManageButton } from "./course-ui";

/**
 * Component to display courses owned by the authenticated user
 *
 * Uses the useOwnedCourses hook for data fetching.
 * Type Reference: See API-TYPE-REFERENCE.md in @andamio/db-api
 */
export function OwnedCoursesList() {
  const { isAuthenticated } = useAndamioAuth();
  const { courses, moduleCounts, isLoading, error } = useOwnedCourses();

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
          <AndamioSkeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <AndamioAlert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AndamioAlertTitle>Error</AndamioAlertTitle>
        <AndamioAlertDescription>{error}</AndamioAlertDescription>
      </AndamioAlert>
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
    <div className="border rounded-md overflow-x-auto">
      <AndamioTable>
        <AndamioTableHeader>
          <AndamioTableRow>
            <AndamioTableHead className="min-w-[120px]">Course Code</AndamioTableHead>
            <AndamioTableHead className="min-w-[150px]">Title</AndamioTableHead>
            <AndamioTableHead className="min-w-[200px] hidden sm:table-cell">Description</AndamioTableHead>
            <AndamioTableHead className="text-center min-w-[80px]">Modules</AndamioTableHead>
            <AndamioTableHead className="text-right min-w-[100px]">Actions</AndamioTableHead>
          </AndamioTableRow>
        </AndamioTableHeader>
        <AndamioTableBody>
          {courses.map((course) => (
            <AndamioTableRow key={course.course_code}>
              <AndamioTableCell className="font-mono text-xs">
                {course.course_code}
              </AndamioTableCell>
              <AndamioTableCell className="font-medium">
                {course.title}
              </AndamioTableCell>
              <AndamioTableCell className="max-w-md truncate hidden sm:table-cell">
                {course.description}
              </AndamioTableCell>
              <AndamioTableCell className="text-center">
                <CourseModuleCount count={moduleCounts[course.course_code]} showIcon={false} />
                {moduleCounts[course.course_code] === undefined && (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </AndamioTableCell>
              <AndamioTableCell className="text-right">
                <CourseManageButton
                  courseNftPolicyId={course.course_nft_policy_id}
                  variant="ghost"
                />
              </AndamioTableCell>
            </AndamioTableRow>
          ))}
        </AndamioTableBody>
      </AndamioTable>
    </div>
  );
}
