"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useCourse } from "~/hooks/api";
import { useDashboardData } from "~/contexts/dashboard-context";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioEmptyState } from "~/components/andamio/andamio-empty-state";
import { AndamioProgress } from "~/components/andamio/andamio-progress";
import { AndamioText } from "~/components/andamio/andamio-text";
import { ProjectIcon } from "~/components/icons";

interface ProjectProgressItem {
  projectId: string;
  title: string;
  totalRequired: number;
  completed: number;
  isReady: boolean;
  nextMissingCourseId?: string;
  nextMissingCount?: number;
}

function MissingPrereqLabel({
  courseId,
  missingCount,
}: {
  courseId: string;
  missingCount: number;
}) {
  const { data: course } = useCourse(courseId);
  const courseLabel = course?.title ?? `Course ${courseId.slice(0, 8)}...`;

  return (
    <AndamioText variant="small" className="text-xs text-muted-foreground">
      Need: {missingCount} module{missingCount === 1 ? "" : "s"} from {courseLabel}
    </AndamioText>
  );
}

export function ProjectUnlockProgress() {
  const { isAuthenticated, user } = useAndamioAuth();
  const { projects, student, isLoading } = useDashboardData();

  // Get completed credential hashes from dashboard data
  const completedModuleHashes = useMemo(() => {
    const completed = new Set<string>();
    const credentialsByCourse = student?.credentialsByCourse ?? [];
    for (const courseCreds of credentialsByCourse) {
      for (const hash of courseCreds.credentials) {
        completed.add(hash);
      }
    }
    return completed;
  }, [student?.credentialsByCourse]);

  // Transform projects with prerequisites into progress items
  const progressItems = useMemo<ProjectProgressItem[]>(() => {
    const items: ProjectProgressItem[] = [];
    const projectsWithPrereqs = projects?.withPrerequisites ?? [];

    for (const project of projectsWithPrereqs) {
      const prerequisites = project.prerequisites ?? [];
      if (prerequisites.length === 0) continue;

      let totalRequired = 0;
      let completed = 0;
      let nextMissingCourseId: string | undefined;
      let nextMissingCount: number | undefined;

      for (const prereq of prerequisites) {
        const hashes = prereq.sltHashes ?? [];
        totalRequired += hashes.length;

        const missing = hashes.filter((hash) => !completedModuleHashes.has(hash));
        const completedInCourse = hashes.length - missing.length;
        completed += completedInCourse;

        if (missing.length > 0 && !nextMissingCourseId) {
          nextMissingCourseId = prereq.courseId;
          nextMissingCount = missing.length;
        }
      }

      // Only show projects where user has made some progress
      if (totalRequired === 0 || completed === 0) continue;

      items.push({
        projectId: project.projectId,
        title: project.title || "Untitled Project",
        totalRequired,
        completed,
        isReady: project.qualified,
        nextMissingCourseId,
        nextMissingCount,
      });
    }

    return items;
  }, [projects?.withPrerequisites, completedModuleHashes]);

  if (!isAuthenticated || !user?.accessTokenAlias) {
    return null;
  }

  if (isLoading) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <div className="flex items-center gap-2">
            <ProjectIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <AndamioCardTitle>Project Progress</AndamioCardTitle>
              <AndamioCardDescription>Loading unlocks...</AndamioCardDescription>
            </div>
          </div>
        </AndamioCardHeader>
        <AndamioCardContent>
          <AndamioText variant="small" className="text-muted-foreground">
            Checking your project prerequisites.
          </AndamioText>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  if (progressItems.length === 0) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <div className="flex items-center gap-2">
            <ProjectIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <AndamioCardTitle>Project Opportunities</AndamioCardTitle>
              <AndamioCardDescription>
                Unlock real projects as you complete modules
              </AndamioCardDescription>
            </div>
          </div>
        </AndamioCardHeader>
        <AndamioCardContent>
          <AndamioEmptyState
            icon={ProjectIcon}
            iconSize="md"
            title="Project Opportunities"
            description="As you complete course modules, you will unlock real project opportunities here."
            action={
              <Link href="/project">
                <AndamioButton size="sm"><ProjectIcon className="mr-2 h-3 w-3" />Browse Projects</AndamioButton>
              </Link>
            }
          />
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  return (
    <AndamioCard>
      <AndamioCardHeader>
        <div className="flex items-center gap-2">
          <ProjectIcon className="h-5 w-5 text-primary" />
          <div>
            <AndamioCardTitle>Project Progress</AndamioCardTitle>
            <AndamioCardDescription>
              Unlock real projects as you complete modules
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {progressItems.map((item) => {
          const progressPercent = Math.round((item.completed / item.totalRequired) * 100);
          return (
            <div key={item.projectId} className="rounded-md border p-4 bg-muted/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <AndamioText className="font-medium truncate">{item.title}</AndamioText>
                  <AndamioText variant="small" className="text-xs text-muted-foreground">
                    {item.completed}/{item.totalRequired} prerequisites complete
                  </AndamioText>
                </div>
                {item.isReady && (
                  <Link href={`/project/${item.projectId}/contributor`}>
                    <AndamioButton size="sm">Join as Contributor</AndamioButton>
                  </Link>
                )}
              </div>

              <div className="mt-3">
                <AndamioProgress value={progressPercent} />
              </div>

              {!item.isReady && item.nextMissingCourseId && item.nextMissingCount && (
                <div className="mt-2">
                  <MissingPrereqLabel
                    courseId={item.nextMissingCourseId}
                    missingCount={item.nextMissingCount}
                  />
                </div>
              )}
            </div>
          );
        })}
      </AndamioCardContent>
    </AndamioCard>
  );
}
