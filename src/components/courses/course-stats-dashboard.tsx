"use client";

import React from "react";
import { AndamioCard, AndamioCardContent, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { BookOpen, FileText, Layers } from "lucide-react";
import { type ListOwnedCoursesOutput } from "@andamio/db-api";
import { calculateCourseStats } from "~/lib/course-filters";

interface CourseStatsDashboardProps {
  courses: ListOwnedCoursesOutput;
  moduleCounts: Record<string, number>;
}

/**
 * Course statistics dashboard showing key metrics
 * Displays total courses, published/draft counts, and module count
 * Fully responsive for mobile and desktop
 */
export function CourseStatsDashboard({ courses, moduleCounts }: CourseStatsDashboardProps) {
  const stats = calculateCourseStats(courses, moduleCounts);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Total Courses */}
      <AndamioCard>
        <AndamioCardHeader className="flex flex-row items-center justify-between pb-2">
          <AndamioCardTitle className="text-sm font-medium">Total Courses</AndamioCardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.published} published, {stats.draft} draft
          </p>
        </AndamioCardContent>
      </AndamioCard>

      {/* Published Courses */}
      <AndamioCard>
        <AndamioCardHeader className="flex flex-row items-center justify-between pb-2">
          <AndamioCardTitle className="text-sm font-medium">Published</AndamioCardTitle>
          <FileText className="h-4 w-4 text-success" />
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="text-2xl font-bold text-success">{stats.published}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0}% of total
          </p>
        </AndamioCardContent>
      </AndamioCard>

      {/* Total Modules */}
      <AndamioCard className="sm:col-span-2 lg:col-span-1">
        <AndamioCardHeader className="flex flex-row items-center justify-between pb-2">
          <AndamioCardTitle className="text-sm font-medium">Total Modules</AndamioCardTitle>
          <Layers className="h-4 w-4 text-info" />
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="text-2xl font-bold">{stats.totalModules}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.total > 0 ? (stats.totalModules / stats.total).toFixed(1) : 0} avg per course
          </p>
        </AndamioCardContent>
      </AndamioCard>
    </div>
  );
}
