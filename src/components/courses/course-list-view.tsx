"use client";

import React from "react";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { AndamioText } from "~/components/andamio/andamio-text";
import { type ListOwnedCoursesOutput } from "@andamio/db-api";
import {
  CourseStatusBadge,
  CourseStatusIcon,
  CourseModuleCount,
  CourseManageButton,
} from "./course-ui";

interface CourseListViewProps {
  courses: ListOwnedCoursesOutput;
  moduleCounts: Record<string, number>;
}

/**
 * List view for courses - compact vertical layout
 * Uses shared components from course-ui.tsx for consistency
 * Fully responsive for mobile and desktop
 */
export function CourseListView({ courses, moduleCounts }: CourseListViewProps) {
  return (
    <div className="space-y-0">
      {courses.map((courseData, index) => (
        <div key={courseData.course_code}>
          <div className="flex flex-col sm:flex-row items-start gap-4 p-4 sm:p-6 border hover:bg-muted/50 transition-colors">
            {/* Status Icon */}
            <div className="flex-shrink-0">
              <CourseStatusIcon isPublished={!!courseData.course_nft_policy_id} size="lg" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Title & Code */}
              <div>
                <h3 className="font-semibold text-base sm:text-lg leading-tight mb-1">{courseData.title}</h3>
                <code className="text-xs font-mono text-muted-foreground">{courseData.course_code}</code>
              </div>

              {/* Description */}
              {courseData.description && (
                <AndamioText variant="small" className="line-clamp-2">{courseData.description}</AndamioText>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <CourseStatusBadge isPublished={!!courseData.course_nft_policy_id} />
                <CourseModuleCount count={moduleCounts[courseData.course_code]} showLabel />
              </div>
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0 w-full sm:w-auto">
              <CourseManageButton
                courseNftPolicyId={courseData.course_nft_policy_id}
                className="w-full sm:w-auto"
              />
            </div>
          </div>

          {/* Separator between items */}
          {index < courses.length - 1 && <AndamioSeparator />}
        </div>
      ))}
    </div>
  );
}
