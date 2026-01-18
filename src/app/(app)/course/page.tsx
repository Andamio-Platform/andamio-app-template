"use client";

import React from "react";
import Link from "next/link";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import {
  AndamioPageHeader,
  AndamioTableContainer,
  AndamioPageLoading,
  AndamioNotFoundCard,
  AndamioEmptyState,
  AndamioText,
} from "~/components/andamio";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioTooltip, AndamioTooltipContent, AndamioTooltipTrigger } from "~/components/andamio/andamio-tooltip";
import { CourseIcon, OnChainIcon, SuccessIcon, PendingIcon } from "~/components/icons";
import { usePublishedCourses } from "~/hooks/api";

/**
 * Public page displaying all published courses
 *
 * Uses the merged V2 API endpoint that returns both on-chain and off-chain data.
 * API Endpoint: GET /api/v2/course/user/courses/list
 *
 * Benefits: Automatic caching, background refetching, request deduplication
 */
export default function CoursePage() {
  const {
    data: courses = [],
    isLoading,
    error: coursesError,
  } = usePublishedCourses();

  const error = coursesError?.message ?? null;

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="list" />;
  }

  // Error state
  if (error) {
    return (
      <AndamioNotFoundCard
        title="Courses"
        message={error}
      />
    );
  }

  // Empty state
  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <AndamioPageHeader
          title="Courses"
          description="Browse all published courses"
        />
        <AndamioEmptyState
          icon={CourseIcon}
          title="No Published Courses"
          description="There are currently no published courses available. Check back later or create your own course."
        />
      </div>
    );
  }

  // Courses list
  return (
    <div className="space-y-6">
      <AndamioPageHeader
        title="Courses"
        description="Browse all published courses"
      />

      <AndamioTableContainer>
        <AndamioTable>
          <AndamioTableHeader>
            <AndamioTableRow>
              <AndamioTableHead>Title</AndamioTableHead>
              <AndamioTableHead className="hidden md:table-cell">Course ID</AndamioTableHead>
              <AndamioTableHead className="hidden lg:table-cell">Description</AndamioTableHead>
              <AndamioTableHead className="text-center">Status</AndamioTableHead>
            </AndamioTableRow>
          </AndamioTableHeader>
          <AndamioTableBody>
            {courses.map((course, index) => {
              // Handle both merged format (content.title, course_id) and legacy format (title, course_nft_policy_id)
              const courseId = course.course_id ?? (course as unknown as { course_nft_policy_id?: string }).course_nft_policy_id;
              const title = course.content?.title ?? (course as unknown as { title?: string }).title;
              const description = course.content?.description ?? (course as unknown as { description?: string }).description;
              const code = course.content?.code ?? (course as unknown as { course_code?: string }).course_code;

              return (
                <AndamioTableRow key={courseId ?? code ?? `course-${index}`}>
                  <AndamioTableCell>
                    <Link
                      href={`/course/${courseId}`}
                      className="font-medium hover:underline"
                    >
                      {title ?? courseId?.slice(0, 16) ?? "Untitled"}
                    </Link>
                    {code && (
                      <AndamioText variant="small" className="text-muted-foreground">
                        {code}
                      </AndamioText>
                    )}
                  </AndamioTableCell>
                  <AndamioTableCell className="hidden md:table-cell font-mono text-xs break-all max-w-xs">
                    {courseId ? (
                      <span title={courseId}>
                        {courseId.slice(0, 16)}...
                      </span>
                    ) : (
                      "-"
                    )}
                  </AndamioTableCell>
                  <AndamioTableCell className="hidden lg:table-cell max-w-md">
                    <AndamioText variant="small" className="text-muted-foreground line-clamp-2">
                      {description ?? "-"}
                    </AndamioText>
                  </AndamioTableCell>
                <AndamioTableCell className="text-center">
                  {course.source === "merged" ? (
                    <AndamioTooltip>
                      <AndamioTooltipTrigger asChild>
                        <div className="flex items-center justify-center gap-1.5">
                          <SuccessIcon className="h-4 w-4 text-success" />
                          <AndamioBadge variant="outline" className="text-success border-success/30">
                            <OnChainIcon className="h-3 w-3 mr-1" />
                            Live
                          </AndamioBadge>
                        </div>
                      </AndamioTooltipTrigger>
                      <AndamioTooltipContent>
                        Published on-chain with verified off-chain content
                      </AndamioTooltipContent>
                    </AndamioTooltip>
                  ) : course.source === "chain_only" ? (
                    <AndamioTooltip>
                      <AndamioTooltipTrigger asChild>
                        <div className="flex items-center justify-center gap-1.5">
                          <OnChainIcon className="h-4 w-4 text-info" />
                          <AndamioBadge variant="outline" className="text-info border-info/30">
                            On-Chain
                          </AndamioBadge>
                        </div>
                      </AndamioTooltipTrigger>
                      <AndamioTooltipContent>
                        Published on-chain (off-chain content pending)
                      </AndamioTooltipContent>
                    </AndamioTooltip>
                  ) : (
                    <AndamioTooltip>
                      <AndamioTooltipTrigger asChild>
                        <div className="flex items-center justify-center gap-1.5">
                          <PendingIcon className="h-4 w-4 text-warning" />
                          <AndamioBadge variant="outline" className="text-warning border-warning/30">
                            {course.source === "db_only" ? "Draft" : "Unknown"}
                          </AndamioBadge>
                        </div>
                      </AndamioTooltipTrigger>
                      <AndamioTooltipContent>
                        {course.source === "db_only"
                          ? "Not yet published on-chain"
                          : `Source: ${course.source ?? "unknown"}`}
                      </AndamioTooltipContent>
                    </AndamioTooltip>
                  )}
                </AndamioTableCell>
              </AndamioTableRow>
              );
            })}
          </AndamioTableBody>
        </AndamioTable>
      </AndamioTableContainer>
    </div>
  );
}
