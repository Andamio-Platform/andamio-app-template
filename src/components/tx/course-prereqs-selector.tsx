/**
 * CoursePrereqsSelector Component (V2 - Redesigned)
 *
 * Elevated UI for selecting course prerequisites when creating a project.
 * Prerequisites define what courses a contributor must complete to join
 * a project and start earning — this is the core decision of project creation.
 *
 * Data format for Atlas API:
 * course_prereqs: [[course_policy_id, [module_hash_1, module_hash_2, ...]]]
 */

"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  useTeacherCoursesWithModules,
  type TeacherCourseWithModules,
} from "~/hooks/api";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import {
  CourseIcon,
  ModuleIcon,
  SLTIcon,
  ShieldIcon,
  ExpandIcon,
  CollapseIcon,
  InfoIcon,
  SuccessIcon,
} from "~/components/icons";
import { Skeleton } from "~/components/ui/skeleton";

// Type for the course_prereqs format expected by Atlas API
export type CoursePrereq = [string, string[]]; // [course_policy_id, module_hashes[]]

interface CoursePrereqsSelectorProps {
  /** Current value of course prerequisites */
  value: CoursePrereq[];
  /** Callback when prerequisites change */
  onChange: (prereqs: CoursePrereq[]) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

export function CoursePrereqsSelector({
  value,
  onChange,
  disabled = false,
}: CoursePrereqsSelectorProps) {
  const { data: courses, isLoading: coursesLoading } =
    useTeacherCoursesWithModules();

  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  // Build a lookup: courseId -> selected module hashes
  const selectionMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const [courseId, moduleHashes] of value) {
      map.set(courseId, new Set(moduleHashes));
    }
    return map;
  }, [value]);

  // Summary stats
  const selectedCourseCount = value.length;
  const selectedModuleCount = value.reduce(
    (sum, [, modules]) => sum + modules.length,
    0,
  );

  const handleToggleModule = useCallback(
    (courseId: string, moduleHash: string) => {
      const existing = selectionMap.get(courseId);

      if (existing?.has(moduleHash)) {
        // Remove module
        const newModules = [...existing].filter((m) => m !== moduleHash);
        if (newModules.length === 0) {
          // Remove course entirely
          onChange(value.filter(([id]) => id !== courseId));
        } else {
          onChange(
            value.map(([id, modules]): CoursePrereq =>
              id === courseId ? [id, newModules] : [id, modules],
            ),
          );
        }
      } else {
        // Add module
        if (existing) {
          onChange(
            value.map(([id, modules]): CoursePrereq =>
              id === courseId
                ? [id, [...modules, moduleHash]]
                : [id, modules],
            ),
          );
        } else {
          onChange([...value, [courseId, [moduleHash]]]);
        }
      }
    },
    [value, onChange, selectionMap],
  );

  const handleToggleCourse = useCallback(
    (courseId: string, allModuleHashes: string[]) => {
      const existing = selectionMap.get(courseId);
      const allSelected =
        existing && allModuleHashes.every((h) => existing.has(h));

      if (allSelected) {
        // Deselect all → remove course
        onChange(value.filter(([id]) => id !== courseId));
      } else {
        // Select all modules
        if (existing) {
          onChange(
            value.map(([id, modules]): CoursePrereq =>
              id === courseId ? [id, [...allModuleHashes]] : [id, modules],
            ),
          );
        } else {
          onChange([...value, [courseId, [...allModuleHashes]]]);
        }
      }
    },
    [value, onChange, selectionMap],
  );

  const handleSelectAll = useCallback(
    (courseId: string, allModuleHashes: string[]) => {
      const existing = selectionMap.get(courseId);
      if (existing) {
        onChange(
          value.map(([id, modules]): CoursePrereq =>
            id === courseId ? [id, [...allModuleHashes]] : [id, modules],
          ),
        );
      } else {
        onChange([...value, [courseId, [...allModuleHashes]]]);
      }
    },
    [value, onChange, selectionMap],
  );

  const handleClearCourse = useCallback(
    (courseId: string) => {
      onChange(value.filter(([id]) => id !== courseId));
    },
    [value, onChange],
  );

  if (coursesLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const availableCourses = courses?.filter((c) => c.modules.length > 0) ?? [];

  return (
    <div className="space-y-4">
      {/* Hero Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10">
          <ShieldIcon className="h-5 w-5 text-secondary" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-lg font-semibold">
            Define Contributor Requirements
          </h3>
          <AndamioText variant="muted" className="text-sm">
            Prerequisites determine which courses a contributor must have
            completed to join this project. This is how you ensure every
            contributor has the skills your project needs.
          </AndamioText>
        </div>
      </div>

      {/* Summary Badges */}
      {selectedCourseCount > 0 && (
        <div className="flex items-center gap-2">
          <AndamioBadge variant="secondary">
            {selectedCourseCount} course{selectedCourseCount !== 1 ? "s" : ""}
          </AndamioBadge>
          <AndamioBadge variant="outline">
            {selectedModuleCount} module{selectedModuleCount !== 1 ? "s" : ""}{" "}
            required
          </AndamioBadge>
        </div>
      )}

      {/* Course Cards */}
      {availableCourses.length > 0 ? (
        <div className="space-y-3">
          <AndamioText variant="small" className="font-medium uppercase tracking-wide text-muted-foreground">
            Your Courses
          </AndamioText>

          {availableCourses.map((course) => {
            const allModuleHashes = course.modules.map(
              (m) => m.assignmentId,
            );
            const selected = selectionMap.get(course.courseId);
            const selectedCount = selected?.size ?? 0;
            const isExpanded = expandedCourseId === course.courseId;

            return (
              <CoursePrereqCard
                key={course.courseId}
                course={course}
                selectedModules={selected ? [...selected] : []}
                selectedCount={selectedCount}
                totalModules={course.modules.length}
                isExpanded={isExpanded}
                onToggleExpand={() =>
                  setExpandedCourseId(
                    isExpanded ? null : course.courseId,
                  )
                }
                onToggleCourse={() =>
                  handleToggleCourse(course.courseId, allModuleHashes)
                }
                onToggleModule={(hash) =>
                  handleToggleModule(course.courseId, hash)
                }
                onSelectAll={() =>
                  handleSelectAll(course.courseId, allModuleHashes)
                }
                onClear={() => handleClearCourse(course.courseId)}
                disabled={disabled}
              />
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <CourseIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <AndamioText variant="muted" className="mt-2">
            No courses with published modules available.
          </AndamioText>
          <AndamioText variant="small" className="text-muted-foreground">
            Create and publish a course first to use it as a prerequisite.
          </AndamioText>
        </div>
      )}

      {/* Permanence Notice */}
      <div className="flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2.5">
        <InfoIcon className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <AndamioText variant="small" className="text-muted-foreground">
          {selectedCourseCount === 0
            ? "No prerequisites? That\u2019s OK. Your project will be open to all access token holders. You can\u2019t change this after creation."
            : "Prerequisites are set at project creation and become part of the on-chain record. Choose carefully."}
        </AndamioText>
      </div>
    </div>
  );
}

// =============================================================================
// CoursePrereqCard
// =============================================================================

interface CoursePrereqCardProps {
  course: TeacherCourseWithModules;
  selectedModules: string[];
  selectedCount: number;
  totalModules: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleCourse: () => void;
  onToggleModule: (moduleHash: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  disabled?: boolean;
}

function CoursePrereqCard({
  course,
  selectedModules,
  selectedCount,
  totalModules,
  isExpanded,
  onToggleExpand,
  onToggleCourse,
  onToggleModule,
  onSelectAll,
  onClear,
  disabled = false,
}: CoursePrereqCardProps) {
  const selectedSet = useMemo(
    () => new Set(selectedModules),
    [selectedModules],
  );
  const allSelected = selectedCount === totalModules && totalModules > 0;
  const someSelected = selectedCount > 0 && !allSelected;

  // Visual state classes
  const borderClass = allSelected
    ? "border-primary/40 bg-primary/5"
    : someSelected
      ? "border-l-primary border-l-2"
      : "";

  return (
    <div className={`rounded-lg border ${borderClass}`}>
      {/* Course Header — clickable to expand */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={onToggleExpand}
      >
        <Checkbox
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={() => onToggleCourse()}
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select all modules from ${course.title ?? course.courseId}`}
        />

        <CourseIcon className="h-4 w-4 text-primary shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {course.title ?? `Course ${course.courseId.slice(0, 8)}...`}
            </span>
            {allSelected && (
              <SuccessIcon className="h-4 w-4 text-primary shrink-0" />
            )}
          </div>
          <AndamioText variant="small" className="text-muted-foreground">
            {selectedCount === 0
              ? `${totalModules} module${totalModules !== 1 ? "s" : ""} available`
              : allSelected
                ? `All ${totalModules} module${totalModules !== 1 ? "s" : ""} required`
                : `${selectedCount} of ${totalModules} module${totalModules !== 1 ? "s" : ""} selected`}
          </AndamioText>
        </div>

        <div className="shrink-0 text-muted-foreground">
          {isExpanded ? (
            <CollapseIcon className="h-4 w-4" />
          ) : (
            <ExpandIcon className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* Expanded Module List */}
      {isExpanded && (
        <div className="border-t px-3 pb-3 pt-2 space-y-2">
          {course.modules.map((courseModule) => (
            <ModuleCheckboxRow
              key={courseModule.assignmentId}
              moduleCode={courseModule.moduleCode}
              title={courseModule.title}
              sltCount={courseModule.slts.length}
              checked={selectedSet.has(courseModule.assignmentId)}
              onToggle={() => onToggleModule(courseModule.assignmentId)}
              disabled={disabled}
            />
          ))}

          {/* Select All / Clear buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              disabled={disabled || allSelected}
              className="h-7 text-xs"
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={disabled || selectedCount === 0}
              className="h-7 text-xs"
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ModuleCheckboxRow
// =============================================================================

interface ModuleCheckboxRowProps {
  moduleCode?: string;
  title?: string;
  sltCount: number;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function ModuleCheckboxRow({
  moduleCode,
  title,
  sltCount,
  checked,
  onToggle,
  disabled = false,
}: ModuleCheckboxRowProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors">
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        disabled={disabled}
      />
      {moduleCode && (
        <AndamioBadge variant="outline" className="font-mono text-xs shrink-0">
          {moduleCode}
        </AndamioBadge>
      )}
      <ModuleIcon className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-sm truncate flex-1">
        {title ?? "Untitled Module"}
      </span>
      <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
        <SLTIcon className="h-3 w-3" />
        <span className="text-xs">{sltCount}</span>
      </div>
    </label>
  );
}
