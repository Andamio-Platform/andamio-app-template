"use client";

import React from "react";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { CheckCircle, Clock, Plus, Settings, Blocks } from "lucide-react";
import { type ListOwnedCoursesOutput } from "@andamio/db-api";
import { cn } from "~/lib/utils";

export interface HybridCourseStatus {
  courseId: string;
  title: string | null;
  inDb: boolean;
  onChain: boolean;
  onChainModuleCount: number;
  dbCourse?: ListOwnedCoursesOutput[number];
}

interface StudioCourseCardProps {
  course: HybridCourseStatus;
  onClick: () => void;
}

/**
 * Compact course card for the Course Studio grid layout
 * Shows course status with on-chain verification indicators
 */
export function StudioCourseCard({ course, onClick }: StudioCourseCardProps) {
  const truncatedId = `${course.courseId.slice(0, 6)}...${course.courseId.slice(-4)}`;

  return (
    <button
      onClick={onClick}
      disabled={!course.inDb}
      className={cn(
        "group relative flex flex-col p-3 text-left w-full rounded-lg border bg-card text-card-foreground shadow-sm",
        "transition-all hover:border-primary/50 hover:shadow-sm",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        course.inDb && "cursor-pointer"
      )}
    >
        {/* Status indicator */}
        <div className="absolute top-2 right-2">
          {course.inDb && course.onChain ? (
            <CheckCircle className="h-4 w-4 text-success" />
          ) : course.inDb ? (
            <Clock className="h-4 w-4 text-info animate-pulse" />
          ) : (
            <Plus className="h-4 w-4 text-warning" />
          )}
        </div>

        {/* Title */}
        <h3 className="font-medium text-sm truncate pr-6">
          {course.title ?? "Untitled Course"}
        </h3>

        {/* ID */}
        <code className="text-[10px] text-muted-foreground font-mono mt-0.5">
          {truncatedId}
        </code>

        {/* Stats row */}
        <div className="flex items-center gap-2 mt-2">
          {course.onChain && course.onChainModuleCount > 0 && (
            <AndamioBadge variant="secondary" className="text-[10px] h-5">
              <Blocks className="h-2.5 w-2.5 mr-0.5" />
              {course.onChainModuleCount} modules
            </AndamioBadge>
          )}
        </div>

        {/* Hover action hint */}
        {course.inDb && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
            <div className="flex items-center gap-1 text-xs font-medium text-primary">
              <Settings className="h-3.5 w-3.5" />
              Open
            </div>
          </div>
        )}
    </button>
  );
}
