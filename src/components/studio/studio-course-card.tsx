"use client";

import React from "react";
import { SuccessIcon, PendingIcon, AlertIcon, OnChainIcon } from "~/components/icons";
import { type ListOwnedCoursesOutput } from "@andamio/db-api";
import { cn } from "~/lib/utils";

export interface HybridCourseStatus {
  courseId: string;
  title: string | null;
  inDb: boolean;
  onChain: boolean;
  onChainModuleCount: number;
  /** Whether user is admin/owner of the course (from /courses/owned) */
  isOwned?: boolean;
  dbCourse?: ListOwnedCoursesOutput[number];
}

interface StudioCourseCardProps {
  course: HybridCourseStatus;
  onClick: () => void;
}

type CourseStatus = "synced" | "syncing" | "onchain-only";

function getStatus(course: HybridCourseStatus): CourseStatus {
  if (course.inDb && course.onChain) return "synced";
  if (course.inDb && !course.onChain) return "syncing";
  return "onchain-only";
}

/**
 * Compact course card for grid layout
 * Matches CourseList styling for consistency
 */
export function StudioCourseCard({ course, onClick }: StudioCourseCardProps) {
  const truncatedId = `${course.courseId.slice(0, 8)}…${course.courseId.slice(-6)}`;
  const status = getStatus(course);
  const isClickable = course.inDb;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        "flex flex-col p-3 text-left rounded-lg border bg-card transition-colors",
        isClickable && "hover:bg-muted/50 cursor-pointer",
        !isClickable && "opacity-60 cursor-not-allowed"
      )}
    >
      {/* Header: Status + Title */}
      <div className="flex items-start gap-2">
        <StatusIcon status={status} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {course.title ?? "Untitled Course"}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
            {truncatedId}
          </div>
        </div>
      </div>

      {/* Footer: Stats + Status label */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
        {course.onChain && course.onChainModuleCount > 0 ? (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <OnChainIcon className="h-3 w-3" />
            {course.onChainModuleCount} module{course.onChainModuleCount !== 1 ? "s" : ""}
          </span>
        ) : (
          <span />
        )}
        <StatusLabel status={status} />
      </div>
    </button>
  );
}

function StatusIcon({ status }: { status: CourseStatus }) {
  const baseClass = "h-6 w-6 flex items-center justify-center rounded-md flex-shrink-0";
  const iconClass = "h-3.5 w-3.5";

  switch (status) {
    case "synced":
      return (
        <div className={cn(baseClass, "bg-success/10")}>
          <SuccessIcon className={cn(iconClass, "text-success")} />
        </div>
      );
    case "syncing":
      return (
        <div className={cn(baseClass, "bg-info/10")}>
          <PendingIcon className={cn(iconClass, "text-info")} />
        </div>
      );
    case "onchain-only":
      return (
        <div className={cn(baseClass, "bg-muted")}>
          <AlertIcon className={cn(iconClass, "text-muted-foreground")} />
        </div>
      );
  }
}

function StatusLabel({ status }: { status: CourseStatus }) {
  const baseClass = "text-[10px] font-medium uppercase tracking-wide";

  switch (status) {
    case "synced":
      return <span className={cn(baseClass, "text-success")}>Live</span>;
    case "syncing":
      return <span className={cn(baseClass, "text-info")}>Syncing</span>;
    case "onchain-only":
      return <span className={cn(baseClass, "text-muted-foreground")}>Import</span>;
  }
}
