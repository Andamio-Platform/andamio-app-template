"use client";

import React from "react";
import { RequireAuth } from "~/components/auth/require-auth";
import { OnChainCoursesSection } from "~/components/courses/on-chain-courses-section";
import { CreateCourseDialog } from "~/components/courses/create-course-dialog";
import { AndamioPageHeader } from "~/components/andamio";

export default function CourseStudioPage() {
  return (
    <RequireAuth
      title="Course Studio"
      description="Connect your wallet to manage your courses"
    >
      <div className="space-y-6">
        <AndamioPageHeader
          title="Course Studio"
          description="Manage and edit your Andamio courses"
          action={<CreateCourseDialog />}
        />

        <OnChainCoursesSection />
      </div>
    </RequireAuth>
  );
}
