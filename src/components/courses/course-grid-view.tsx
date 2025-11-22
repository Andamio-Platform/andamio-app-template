"use client";

import React from "react";
import Link from "next/link";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardFooter, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { CheckCircle, FileText, Layers, Settings } from "lucide-react";
import { type ListOwnedCoursesOutput } from "@andamio/db-api";

interface CourseGridViewProps {
  courses: ListOwnedCoursesOutput;
  moduleCounts: Record<string, number>;
}

/**
 * Grid view for courses - card-based layout
 * Uses only semantic colors from globals.css
 * Fully responsive for mobile and desktop
 */
export function CourseGridView({ courses, moduleCounts }: CourseGridViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {courses.map((courseData) => (
        <AndamioCard key={courseData.courseCode} className="flex flex-col">
          <AndamioCardHeader>
            <div className="flex items-start justify-between gap-2">
              <AndamioCardTitle className="line-clamp-2 text-base sm:text-lg">{courseData.title}</AndamioCardTitle>
              {courseData.courseNftPolicyId ? (
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
              ) : (
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            {courseData.description && (
              <AndamioCardDescription className="line-clamp-2">{courseData.description}</AndamioCardDescription>
            )}
          </AndamioCardHeader>

          <AndamioCardContent className="space-y-3 flex-1">
            {/* Course Code */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Code:</span>
              <code className="text-xs font-mono">{courseData.courseCode}</code>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap gap-2">
              {/* Publication Status */}
              {courseData.courseNftPolicyId ? (
                <AndamioBadge variant="outline" className="text-success border-success">
                  Published
                </AndamioBadge>
              ) : (
                <AndamioBadge variant="outline" className="text-muted-foreground">
                  Draft
                </AndamioBadge>
              )}

              {/* Module Count */}
              {moduleCounts[courseData.courseCode] !== undefined && (
                <AndamioBadge variant="secondary">
                  <Layers className="h-3 w-3 mr-1" />
                  {moduleCounts[courseData.courseCode]}
                </AndamioBadge>
              )}
            </div>
          </AndamioCardContent>

          <AndamioCardFooter className="mt-auto">
            {courseData.courseNftPolicyId && (
              <Link href={`/studio/course/${courseData.courseNftPolicyId}`} className="w-full">
                <AndamioButton variant="outline" size="sm" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Course
                </AndamioButton>
              </Link>
            )}
          </AndamioCardFooter>
        </AndamioCard>
      ))}
    </div>
  );
}
