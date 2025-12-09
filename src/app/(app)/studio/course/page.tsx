"use client";

import React from "react";
import { RequireAuth } from "~/components/auth/require-auth";
import { OnChainCoursesSection } from "~/components/courses/on-chain-courses-section";
import { CreateCourseDialog } from "~/components/courses/create-course-dialog";

export default function CourseStudioPage() {
  return (
    <RequireAuth
      title="Course Studio"
      description="Connect your wallet to manage your courses"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Course Studio</h1>
            <p className="text-muted-foreground">
              Manage and edit your Andamio courses
            </p>
          </div>
          <CreateCourseDialog />
        </div>

        <OnChainCoursesSection />
      </div>
    </RequireAuth>
  );
}
