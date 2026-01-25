/**
 * CoursePrereqsSelector Component
 *
 * UI for selecting course prerequisites when creating a project.
 * Allows project admins to require learners to have completed
 * specific course modules before contributing to the project.
 *
 * Lists courses where the user is EITHER an owner/admin OR a listed teacher.
 *
 * Data format for Atlas API:
 * course_prereqs: [[course_policy_id, [module_hash_1, module_hash_2, ...]]]
 */

"use client";

import React, { useState, useMemo } from "react";
import { useTeacherCoursesWithModules } from "~/hooks/api";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { CourseIcon, ModuleIcon, DeleteIcon, AddIcon } from "~/components/icons";
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

interface SelectedCourse {
  courseId: string;
  courseName: string;
  selectedModules: string[]; // Array of module hashes (assignment_ids)
}

export function CoursePrereqsSelector({
  value,
  onChange,
  disabled = false,
}: CoursePrereqsSelectorProps) {
  // Fetch courses where user is owner OR teacher (with module details)
  const { data: courses, isLoading: coursesLoading } =
    useTeacherCoursesWithModules();

  // Local state for the course being added
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  // Convert value prop to a more workable format
  const selectedCourses = useMemo(() => {
    const coursesMap: SelectedCourse[] = [];
    for (const [courseId, moduleHashes] of value) {
      const course = courses?.find((c) => c.courseId === courseId);
      coursesMap.push({
        courseId,
        courseName: course ? `Course ${courseId.slice(0, 8)}...` : courseId.slice(0, 8) + "...",
        selectedModules: moduleHashes,
      });
    }
    return coursesMap;
  }, [value, courses]);

  // Get available courses (not yet selected)
  const availableCourses = useMemo(() => {
    if (!courses) return [];
    const selectedIds = new Set(value.map(([id]) => id));
    return courses.filter((c) => !selectedIds.has(c.courseId) && c.modules.length > 0);
  }, [courses, value]);

  // Get the currently selected course for adding
  const courseToAdd = useMemo(() => {
    if (!selectedCourseId || !courses) return null;
    return courses.find((c) => c.courseId === selectedCourseId);
  }, [selectedCourseId, courses]);

  // Handle adding a course with selected modules
  const handleAddCourse = (moduleHashes: string[]) => {
    if (!selectedCourseId || moduleHashes.length === 0) return;

    const newPrereqs: CoursePrereq[] = [...value, [selectedCourseId, moduleHashes]];
    onChange(newPrereqs);
    setSelectedCourseId("");
  };

  // Handle removing a course prerequisite
  const handleRemoveCourse = (courseId: string) => {
    const newPrereqs = value.filter(([id]) => id !== courseId);
    onChange(newPrereqs);
  };

  // Handle toggling a module within an existing prerequisite
  const handleToggleModule = (courseId: string, moduleHash: string) => {
    const newPrereqs = value.map(([id, modules]): CoursePrereq => {
      if (id !== courseId) return [id, modules];

      const newModules = modules.includes(moduleHash)
        ? modules.filter((m) => m !== moduleHash)
        : [...modules, moduleHash];

      return [id, newModules];
    });

    // Remove courses with no modules selected
    onChange(newPrereqs.filter(([, modules]) => modules.length > 0));
  };

  if (coursesLoading) {
    return (
      <div className="space-y-2">
        <AndamioLabel>Course Prerequisites (Optional)</AndamioLabel>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <AndamioLabel>Course Prerequisites (Optional)</AndamioLabel>
        <AndamioText variant="small" className="text-xs mt-1">
          Require contributors to have completed specific course modules before joining this project.
        </AndamioText>
      </div>

      {/* Currently Selected Prerequisites */}
      {selectedCourses.length > 0 && (
        <div className="space-y-3">
          {selectedCourses.map((selected) => {
            const course = courses?.find((c) => c.courseId === selected.courseId);
            return (
              <div
                key={selected.courseId}
                className="border rounded-md p-3 bg-muted/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CourseIcon className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">
                      {course ? `Course` : "Unknown Course"}
                    </span>
                    <AndamioBadge variant="outline" className="font-mono text-xs">
                      {selected.courseId.slice(0, 12)}...
                    </AndamioBadge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCourse(selected.courseId)}
                    disabled={disabled}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <DeleteIcon className="h-4 w-4" />
                  </Button>
                </div>

                {/* Module Checkboxes */}
                {course && (
                  <div className="space-y-2 pl-6">
                    <AndamioText variant="small" className="text-xs text-muted-foreground">
                      Required modules ({selected.selectedModules.length} selected):
                    </AndamioText>
                    <div className="grid gap-2">
                      {course.modules.map((courseModule, idx) => (
                        <label
                          key={courseModule.assignmentId}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Checkbox
                            checked={selected.selectedModules.includes(courseModule.assignmentId)}
                            onCheckedChange={() =>
                              handleToggleModule(selected.courseId, courseModule.assignmentId)
                            }
                            disabled={disabled}
                          />
                          <ModuleIcon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            Module {idx + 1}
                          </span>
                          <AndamioBadge variant="secondary" className="font-mono text-xs">
                            {courseModule.assignmentId.slice(0, 8)}...
                          </AndamioBadge>
                          <span className="text-xs text-muted-foreground">
                            ({courseModule.slts.length} SLTs)
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Course Prerequisite */}
      {availableCourses.length > 0 && (
        <div className="border rounded-md p-3 border-dashed">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AddIcon className="h-4 w-4 text-muted-foreground" />
              <AndamioText variant="small" className="font-medium">
                Add Course Prerequisite
              </AndamioText>
            </div>

            <Select
              value={selectedCourseId}
              onValueChange={setSelectedCourseId}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a course..." />
              </SelectTrigger>
              <SelectContent>
                {availableCourses.map((course) => (
                  <SelectItem key={course.courseId} value={course.courseId}>
                    <div className="flex items-center gap-2">
                      <CourseIcon className="h-4 w-4" />
                      <span className="font-mono text-xs">
                        {course.courseId.slice(0, 12)}...
                      </span>
                      <span className="text-muted-foreground">
                        ({course.modules.length} modules)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Module Selection for New Course */}
            {courseToAdd && (
              <ModuleSelector
                course={courseToAdd}
                onAdd={handleAddCourse}
                disabled={disabled}
              />
            )}
          </div>
        </div>
      )}

      {/* No Courses Available Message */}
      {availableCourses.length === 0 && selectedCourses.length === 0 && (
        <div className="border rounded-md p-4 border-dashed text-center">
          <AndamioText variant="small" className="text-muted-foreground">
            No courses with on-chain modules available.
            <br />
            Create and publish a course first to use it as a prerequisite.
          </AndamioText>
        </div>
      )}
    </div>
  );
}

// Sub-component for selecting modules from a course
interface ModuleSelectorProps {
  course: {
    courseId: string;
    modules: Array<{
      assignmentId: string;
      slts: string[];
    }>;
  };
  onAdd: (moduleHashes: string[]) => void;
  disabled?: boolean;
}

function ModuleSelector({ course, onAdd, disabled }: ModuleSelectorProps) {
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const handleToggle = (moduleHash: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleHash)
        ? prev.filter((m) => m !== moduleHash)
        : [...prev, moduleHash]
    );
  };

  const handleSelectAll = () => {
    setSelectedModules(course.modules.map((m) => m.assignmentId));
  };

  const handleAdd = () => {
    onAdd(selectedModules);
    setSelectedModules([]);
  };

  return (
    <div className="space-y-3 pl-4 border-l-2 border-primary/20">
      <div className="flex items-center justify-between">
        <AndamioText variant="small" className="text-muted-foreground">
          Select required modules:
        </AndamioText>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
          disabled={disabled}
          className="h-6 text-xs"
        >
          Select All
        </Button>
      </div>

      <div className="grid gap-2">
        {course.modules.map((courseModule, idx) => (
          <label
            key={courseModule.assignmentId}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Checkbox
              checked={selectedModules.includes(courseModule.assignmentId)}
              onCheckedChange={() => handleToggle(courseModule.assignmentId)}
              disabled={disabled}
            />
            <ModuleIcon className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">Module {idx + 1}</span>
            <AndamioBadge variant="secondary" className="font-mono text-xs">
              {courseModule.assignmentId.slice(0, 8)}...
            </AndamioBadge>
            <span className="text-xs text-muted-foreground">
              ({courseModule.slts.length} SLTs)
            </span>
          </label>
        ))}
      </div>

      <Button
        size="sm"
        onClick={handleAdd}
        disabled={disabled || selectedModules.length === 0}
        className="w-full"
      >
        <AddIcon className="h-4 w-4 mr-2" />
        Add {selectedModules.length} Module{selectedModules.length !== 1 ? "s" : ""} as Prerequisite
      </Button>
    </div>
  );
}
