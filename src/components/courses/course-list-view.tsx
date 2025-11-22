"use client";

import React from "react";
import Link from "next/link";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { CheckCircle, FileText, Layers, Settings } from "lucide-react";
import { type ListOwnedCoursesOutput } from "@andamio/db-api";

interface CourseListViewProps {
  courses: ListOwnedCoursesOutput;
  moduleCounts: Record<string, number>;
}

/**
 * List view for courses - compact vertical layout
 * Uses only semantic colors from globals.css
 * Fully responsive for mobile and desktop
 */
export function CourseListView({ courses, moduleCounts }: CourseListViewProps) {
  return (
    <div className="space-y-0">
      {courses.map((courseData, index) => (
        <div key={courseData.courseCode}>
          <div className="flex flex-col sm:flex-row items-start gap-4 p-4 sm:p-6 border hover:bg-muted/50 transition-colors">
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {courseData.courseNftPolicyId ? (
                <CheckCircle className="h-6 w-6 text-success" />
              ) : (
                <FileText className="h-6 w-6 text-muted-foreground" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Title & Code */}
              <div>
                <h3 className="font-semibold text-base sm:text-lg leading-tight mb-1">{courseData.title}</h3>
                <code className="text-xs font-mono text-muted-foreground">{courseData.courseCode}</code>
              </div>

              {/* Description */}
              {courseData.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{courseData.description}</p>
              )}

              {/* Badges */}
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
                    {moduleCounts[courseData.courseCode]} modules
                  </AndamioBadge>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0 w-full sm:w-auto">
              {courseData.courseNftPolicyId && (
                <Link href={`/studio/course/${courseData.courseNftPolicyId}`} className="block sm:inline-block">
                  <AndamioButton variant="outline" size="sm" className="w-full sm:w-auto">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </AndamioButton>
                </Link>
              )}
            </div>
          </div>

          {/* Separator between items */}
          {index < courses.length - 1 && <AndamioSeparator />}
        </div>
      ))}
    </div>
  );
}
