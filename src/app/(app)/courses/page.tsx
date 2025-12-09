"use client";

import React from "react";
import { RequireAuth } from "~/components/auth/require-auth";
import { CourseManager } from "~/components/courses/course-manager";

export default function CoursesPage() {
  return (
    <RequireAuth
      title="Courses"
      description="Connect your wallet to view your courses"
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Course Creator Studio</h1>
          <p className="text-muted-foreground">
            Manage and view all your Andamio courses with powerful filtering and sorting
          </p>
        </div>

        {/* Course Manager with all features */}
        <CourseManager />
      </div>
    </RequireAuth>
  );
}
