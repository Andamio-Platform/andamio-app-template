"use client";

import React from "react";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardFooter, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { type ListOwnedCoursesOutput } from "@andamio/db-api";
import {
  CourseStatusBadge,
  CourseStatusIcon,
  CourseModuleCount,
  CourseManageButton,
  CourseCodeDisplay,
} from "./course-ui";

interface CourseGridViewProps {
  courses: ListOwnedCoursesOutput;
  moduleCounts: Record<string, number>;
}

/**
 * Grid view for courses - card-based layout
 * Uses shared components from course-ui.tsx for consistency
 * Fully responsive for mobile and desktop
 */
export function CourseGridView({ courses, moduleCounts }: CourseGridViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {courses.map((courseData) => (
        <AndamioCard key={courseData.course_code} className="flex flex-col">
          <AndamioCardHeader>
            <div className="flex items-start justify-between gap-2">
              <AndamioCardTitle className="line-clamp-2 text-base sm:text-lg">{courseData.title}</AndamioCardTitle>
              <CourseStatusIcon
                isPublished={!!courseData.course_nft_policy_id}
                className="flex-shrink-0"
              />
            </div>
            {courseData.description && (
              <AndamioCardDescription className="line-clamp-2">{courseData.description}</AndamioCardDescription>
            )}
          </AndamioCardHeader>

          <AndamioCardContent className="space-y-3 flex-1">
            <CourseCodeDisplay code={courseData.course_code} showLabel />

            {/* Badges Row */}
            <div className="flex flex-wrap gap-2">
              <CourseStatusBadge isPublished={!!courseData.course_nft_policy_id} />
              <CourseModuleCount count={moduleCounts[courseData.course_code]} />
            </div>
          </AndamioCardContent>

          <AndamioCardFooter className="mt-auto">
            <CourseManageButton
              courseNftPolicyId={courseData.course_nft_policy_id}
              label="Manage Course"
              className="w-full"
            />
          </AndamioCardFooter>
        </AndamioCard>
      ))}
    </div>
  );
}
