"use client";

import React from "react";
import { RequireAuth } from "~/components/auth/require-auth";
import { AndamioPageHeader } from "~/components/andamio";
import { StudioHubCard } from "~/components/studio/studio-hub-card";
import { CourseIcon, ProjectIcon } from "~/components/icons";

export default function StudioPage() {
  return (
    <RequireAuth
      title="Studio"
      description="Connect your wallet to access the creator studio"
    >
      <div className="space-y-6">
        <AndamioPageHeader
          title="Studio"
          description="Create and manage your courses and projects"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <StudioHubCard
            title="Course Studio"
            description="Create and manage your Andamio courses"
            href="/studio/course"
            icon={CourseIcon}
            buttonLabel="Manage Courses"
          />

          <StudioHubCard
            title="Project Studio"
            description="Create and manage your Andamio projects"
            href="/studio/project"
            icon={ProjectIcon}
            buttonLabel="Manage Projects"
          />
        </div>
      </div>
    </RequireAuth>
  );
}
