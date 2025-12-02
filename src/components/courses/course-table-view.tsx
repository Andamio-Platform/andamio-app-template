"use client";

import React from "react";
import Link from "next/link";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { CheckCircle, FileText, Settings } from "lucide-react";
import { type ListOwnedCoursesOutput } from "@andamio/db-api";

interface CourseTableViewProps {
  courses: ListOwnedCoursesOutput;
  moduleCounts: Record<string, number>;
}

/**
 * Table view for courses - detailed data grid
 * Uses only semantic colors from globals.css
 * Horizontal scroll on mobile for better responsiveness
 */
export function CourseTableView({ courses, moduleCounts }: CourseTableViewProps) {
  return (
    <div className="border overflow-x-auto">
      <AndamioTable>
        <AndamioTableHeader>
          <AndamioTableRow>
            <AndamioTableHead className="w-12">Status</AndamioTableHead>
            <AndamioTableHead className="min-w-[120px]">Course Code</AndamioTableHead>
            <AndamioTableHead className="min-w-[200px]">Title</AndamioTableHead>
            <AndamioTableHead className="min-w-[250px] hidden md:table-cell">Description</AndamioTableHead>
            <AndamioTableHead className="text-center min-w-[80px]">Modules</AndamioTableHead>
            <AndamioTableHead className="text-right min-w-[120px]">Actions</AndamioTableHead>
          </AndamioTableRow>
        </AndamioTableHeader>
        <AndamioTableBody>
          {courses.map((courseData) => (
            <AndamioTableRow key={courseData.course_code}>
              {/* Status Icon */}
              <AndamioTableCell>
                {courseData.course_nft_policy_id ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <FileText className="h-5 w-5 text-muted-foreground" />
                )}
              </AndamioTableCell>

              {/* Course Code */}
              <AndamioTableCell className="font-mono text-xs">{courseData.course_code}</AndamioTableCell>

              {/* Title */}
              <AndamioTableCell className="font-medium">
                <div className="line-clamp-2">{courseData.title}</div>
              </AndamioTableCell>

              {/* Description (hidden on mobile) */}
              <AndamioTableCell className="hidden md:table-cell">
                {courseData.description ? (
                  <div className="line-clamp-2 text-sm text-muted-foreground">{courseData.description}</div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </AndamioTableCell>

              {/* Module Count */}
              <AndamioTableCell className="text-center">
                {moduleCounts[courseData.course_code] !== undefined ? (
                  <AndamioBadge variant="secondary">{moduleCounts[courseData.course_code]}</AndamioBadge>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </AndamioTableCell>

              {/* Actions */}
              <AndamioTableCell className="text-right">
                {courseData.course_nft_policy_id && (
                  <Link href={`/studio/course/${courseData.course_nft_policy_id}`}>
                    <AndamioButton variant="ghost" size="sm">
                      <Settings className="h-4 w-4 md:mr-1" />
                      <span className="hidden md:inline">Manage</span>
                    </AndamioButton>
                  </Link>
                )}
              </AndamioTableCell>
            </AndamioTableRow>
          ))}
        </AndamioTableBody>
      </AndamioTable>
    </div>
  );
}
