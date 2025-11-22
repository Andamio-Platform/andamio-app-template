"use client";

import React from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAuthButton } from "~/components/auth/andamio-auth-button";
import { CourseManager } from "~/components/courses/course-manager";

export default function CoursesPage() {
  const { isAuthenticated } = useAndamioAuth();

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground">
            Connect your wallet to view your courses
          </p>
        </div>

        <div className="max-w-md">
          <AndamioAuthButton />
        </div>
      </div>
    );
  }

  return (
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
  );
}
