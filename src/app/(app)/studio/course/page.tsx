"use client";

import React from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAuthButton } from "~/components/auth/andamio-auth-button";
import { OwnedCoursesList } from "~/components/courses/owned-courses-list";

export default function CourseStudioPage() {
  const { isAuthenticated } = useAndamioAuth();

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Course Studio</h1>
          <p className="text-muted-foreground">
            Connect your wallet to manage your courses
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
      <div>
        <h1 className="text-3xl font-bold">Course Studio</h1>
        <p className="text-muted-foreground">
          Manage and edit your Andamio courses
        </p>
      </div>

      <OwnedCoursesList />
    </div>
  );
}
