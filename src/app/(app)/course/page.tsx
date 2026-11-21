"use client";

import React, { useState, useMemo } from "react";
import {
  AndamioPageHeader,
  AndamioPageLoading,
  AndamioEmptyState,
} from "~/components/andamio";
import { CourseIcon, SuccessIcon } from "~/components/icons";
import { useActiveCourses, useStudentCourses } from "~/hooks/api";
import { useOwnerCourses } from "~/hooks/api/course/use-course-owner";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { CourseCard } from "~/components/courses/course-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { Button } from "~/components/ui/button";

type OwnershipTab = "all" | "mine";

/**
 * Course catalog page
 *
 * Shows all active courses, or just courses owned by the authenticated user.
 *
 * API Endpoints:
 *   All courses:  GET /api/v2/course/user/courses/list
 *   My courses:   POST /api/v2/course/owner/courses/list
 */
export default function CoursePage() {
  const { isAuthenticated } = useAndamioAuth();
  const [tab, setTab] = useState<OwnershipTab>("all");

  const { data: allCourses = [], isLoading: allLoading } = useActiveCourses();
  const { data: ownedCourses = [], isLoading: ownedLoading } = useOwnerCourses();
  const { data: studentCourses } = useStudentCourses();

  const courses = tab === "mine" ? ownedCourses : allCourses;
  const isLoading = tab === "mine" ? ownedLoading : allLoading;

  // Build enrollment map for authenticated users
  const enrollmentMap = useMemo(() => {
    if (!isAuthenticated || !studentCourses) return new Map<string, "enrolled" | "completed">();
    const map = new Map<string, "enrolled" | "completed">();
    for (const sc of studentCourses) {
      if (sc.courseId && sc.enrollmentStatus) {
        map.set(sc.courseId, sc.enrollmentStatus);
      }
    }
    return map;
  }, [isAuthenticated, studentCourses]);

  if (isLoading) {
    return <AndamioPageLoading variant="cards" />;
  }

  return (
    <div className="space-y-6">
      <AndamioPageHeader
        title="Courses"
        description={
          tab === "mine"
            ? "Courses you own and manage."
            : "Browse available courses and start building your skills."
        }
      />

      {/* Tab + stats row */}
      <div className="flex flex-wrap items-center gap-3">
        {isAuthenticated && (
          <>
            <Button
              variant={tab === "all" ? "secondary" : "outline"}
              size="sm"
              className={`h-7 text-xs ${tab === "all" ? "font-medium" : ""}`}
              onClick={() => setTab("all")}
            >
              {tab === "all" && <SuccessIcon className="h-3 w-3 mr-1" />}
              All Courses
            </Button>
            <Button
              variant={tab === "mine" ? "secondary" : "outline"}
              size="sm"
              className={`h-7 text-xs ${tab === "mine" ? "font-medium" : ""}`}
              onClick={() => setTab("mine")}
            >
              {tab === "mine" && <SuccessIcon className="h-3 w-3 mr-1" />}
              My Courses
            </Button>
            <div className="w-px bg-border mx-1 self-stretch" />
          </>
        )}

        <AndamioBadge variant="secondary" className="text-sm px-3 py-1.5">
          <CourseIcon className="h-4 w-4 mr-1.5" />
          {courses.length} {courses.length === 1 ? "course" : "courses"}
        </AndamioBadge>
      </div>

      {/* Empty states */}
      {courses.length === 0 && tab === "all" && (
        <AndamioEmptyState
          icon={CourseIcon}
          title="No Courses Available Yet"
          description="Courses are being prepared. Check back later."
        />
      )}
      {courses.length === 0 && tab === "mine" && (
        <AndamioEmptyState
          icon={CourseIcon}
          title="No Courses Yet"
          description="You haven't created any courses. Use andamio init or the Studio to create your first course."
        />
      )}

      {/* Course cards grid */}
      {courses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.courseId}
              course={course}
              enrollmentStatus={enrollmentMap.get(course.courseId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
