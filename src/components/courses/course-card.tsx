"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CourseIcon,
  OnChainIcon,
  SuccessIcon,
  PendingIcon,
  NextIcon,
  UserIcon,
  TeacherIcon,
} from "~/components/icons";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioCardDescription,
  AndamioCardFooter,
} from "~/components/andamio/andamio-card";
import { AndamioTooltip, AndamioTooltipContent, AndamioTooltipTrigger } from "~/components/andamio/andamio-tooltip";
import type { Course, CourseStatus } from "~/hooks/api";

interface CourseCardProps {
  course: Course;
}

/**
 * Status badge component with tooltip
 */
function CourseStatusBadge({ status }: { status: CourseStatus }) {
  switch (status) {
    case "active":
      return (
        <AndamioTooltip>
          <AndamioTooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <AndamioBadge variant="outline" className="text-primary-foreground border-primary/80 bg-primary/80 shadow-sm">
                <OnChainIcon className="h-3 w-3 mr-1" />
                Active
              </AndamioBadge>
            </div>
          </AndamioTooltipTrigger>
          <AndamioTooltipContent>
            Published on-chain with verified off-chain content
          </AndamioTooltipContent>
        </AndamioTooltip>
      );
    case "unregistered":
      return (
        <AndamioTooltip>
          <AndamioTooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <AndamioBadge variant="outline" className="text-secondary border-secondary/30 bg-secondary/10">
                <OnChainIcon className="h-3 w-3 mr-1" />
                Unregistered
              </AndamioBadge>
            </div>
          </AndamioTooltipTrigger>
          <AndamioTooltipContent>
            On-chain but needs DB registration
          </AndamioTooltipContent>
        </AndamioTooltip>
      );
    default:
      return (
        <AndamioTooltip>
          <AndamioTooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <AndamioBadge variant="outline" className="text-muted-foreground border-muted-foreground/30 bg-muted/10">
                <PendingIcon className="h-3 w-3 mr-1" />
                Draft
              </AndamioBadge>
            </div>
          </AndamioTooltipTrigger>
          <AndamioTooltipContent>
            Not yet published on-chain
          </AndamioTooltipContent>
        </AndamioTooltip>
      );
  }
}

/**
 * CourseCard - Display a course in a beautiful card format
 *
 * Shows course title, description, status, and metadata.
 * Links to the course detail page on click.
 */
export function CourseCard({ course }: CourseCardProps) {
  const {
    courseId,
    title,
    description,
    imageUrl,
    status,
    owner,
    teachers,
  } = course;

  const displayTitle = title || courseId?.slice(0, 24) || "Untitled Course";
  const teacherCount = teachers?.length ?? 0;

  return (
    <Link href={`/course/${courseId}`} className="block group">
      <AndamioCard className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/20 group-hover:bg-accent/5">
        {/* Image or Gradient Header */}
        <div className="relative h-32 sm:h-40 overflow-hidden rounded-t-xl -mt-6 -mx-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={displayTitle}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 flex items-center justify-center">
              <CourseIcon className="h-12 w-12 text-primary/40" />
            </div>
          )}
          {/* Status badge overlay */}
          <div className="absolute top-3 right-3">
            <CourseStatusBadge status={status} />
          </div>
        </div>

        <AndamioCardHeader className="pt-4">
          <div className="flex items-start justify-between gap-2">
            <AndamioCardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {displayTitle}
            </AndamioCardTitle>
            <NextIcon className="h-5 w-5 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-1" />
          </div>
          {courseId && (
            <AndamioText variant="small" className="font-mono text-muted-foreground truncate">
              {courseId.slice(0, 20)}...
            </AndamioText>
          )}
        </AndamioCardHeader>

        <AndamioCardContent className="flex-1">
          {description ? (
            <AndamioCardDescription className="line-clamp-3">
              {description}
            </AndamioCardDescription>
          ) : (
            <AndamioText variant="small" className="text-muted-foreground italic">
              No description available
            </AndamioText>
          )}
        </AndamioCardContent>

        <AndamioCardFooter className="border-t pt-4 mt-auto">
          <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
            {/* Owner info */}
            {owner && (
              <div className="flex items-center gap-1.5 truncate">
                <UserIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate font-mono text-xs">
                  {owner.slice(0, 12)}...
                </span>
              </div>
            )}

            {/* Teacher count */}
            {teacherCount > 0 && (
              <div className="flex items-center gap-1.5">
                <TeacherIcon className="h-3.5 w-3.5" />
                <span>{teacherCount} {teacherCount === 1 ? "teacher" : "teachers"}</span>
              </div>
            )}

            {/* Active indicator */}
            {status === "active" && (
              <div className="flex items-center gap-1">
                <SuccessIcon className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary text-xs">Live</span>
              </div>
            )}
          </div>
        </AndamioCardFooter>
      </AndamioCard>
    </Link>
  );
}
