"use client";

import React from "react";
import { RequireAuth } from "~/components/auth/require-auth";
import { CourseManager } from "~/components/courses/course-manager";
import { AndamioPageHeader } from "~/components/andamio";

export default function CoursesPage() {
  return (
    <RequireAuth
      title="Courses"
      description="Connect your wallet to view your courses"
    >
      <div className="space-y-6">
        <AndamioPageHeader
          title="Course Creator Studio"
          description="Manage and view all your Andamio courses with powerful filtering and sorting"
        />

        {/* Course Manager with all features */}
        <CourseManager />
      </div>
    </RequireAuth>
  );
}
