"use client";

import React from "react";
import { useCourse } from "~/hooks/api/course/use-course";
import { useCourseModules } from "~/hooks/api/course/use-course-module";
import type { ProjectPrerequisite } from "~/hooks/api/project/use-project";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import { CourseIcon, SLTIcon } from "~/components/icons";

/**
 * Renders a single prerequisite row, fetching course title and module names by ID.
 */
export function PrerequisiteRow({ prereq }: { prereq: ProjectPrerequisite }) {
  const { data: courseData, isLoading: isCourseLoading } = useCourse(prereq.courseId);
  const { data: modules = [], isLoading: isModulesLoading } = useCourseModules(prereq.courseId);
  const courseTitle = courseData?.title;
  const isLoading = isCourseLoading || isModulesLoading;

  // Build lookup: sltHash → { moduleCode, title }
  const moduleMap = new Map(
    modules.map((m) => [m.sltHash, { moduleCode: m.moduleCode, title: m.title }])
  );

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg">
      <CourseIcon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">
          {isLoading ? (
            <span className="text-muted-foreground">Loading...</span>
          ) : courseTitle ? (
            courseTitle
          ) : (
            <span className="font-mono truncate">{prereq.courseId}</span>
          )}
        </div>
        {courseTitle && (
          <div className="font-mono text-xs text-muted-foreground truncate">
            {prereq.courseId}
          </div>
        )}
        {prereq.sltHashes && prereq.sltHashes.length > 0 && (
          <div className="mt-2 space-y-1">
            <AndamioText variant="small" className="text-muted-foreground">
              {prereq.sltHashes.length} required module{prereq.sltHashes.length !== 1 ? "s" : ""}
            </AndamioText>
            <div className="flex flex-wrap gap-1">
              {prereq.sltHashes.map((hash) => {
                const mod = moduleMap.get(hash);
                const label = mod?.moduleCode && mod?.title
                  ? `${mod.moduleCode}: ${mod.title}`
                  : mod?.moduleCode
                    ? mod.moduleCode
                    : `${hash.slice(0, 12)}...`;
                return (
                  <AndamioBadge key={hash} variant="outline" className="text-xs">
                    <SLTIcon className="h-3 w-3 mr-1" />
                    {label}
                  </AndamioBadge>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Resolves a module hash to a human-readable label using the module map from a course.
 */
export function useModuleLabel(courseId: string, sltHash: string): { label: string; isLoading: boolean } {
  const { data: modules = [], isLoading } = useCourseModules(courseId);
  const mod = modules.find((m) => m.sltHash === sltHash);
  const label = mod?.moduleCode && mod?.title
    ? `${mod.moduleCode}: ${mod.title}`
    : mod?.moduleCode
      ? mod.moduleCode
      : `${sltHash.slice(0, 12)}...`;
  return { label, isLoading };
}

/**
 * Renders a list of prerequisites with course titles and module names.
 */
export function PrerequisiteList({ prerequisites }: { prerequisites: ProjectPrerequisite[] }) {
  if (prerequisites.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <CourseIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <AndamioText variant="muted">No prerequisites required</AndamioText>
        <AndamioText variant="small">Any contributor can join this project</AndamioText>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prerequisites.map((prereq, i) => (
        <PrerequisiteRow key={prereq.courseId || i} prereq={prereq} />
      ))}
    </div>
  );
}
