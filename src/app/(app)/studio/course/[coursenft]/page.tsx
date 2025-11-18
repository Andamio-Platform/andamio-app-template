"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { AlertCircle, ArrowLeft, FileText, Link2, Save, Settings, Trash2, Users } from "lucide-react";
import { CreateModuleDialog } from "~/components/courses/create-module-dialog";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import {
  type CourseOutput,
  type ListCourseModulesOutput,
  type UpdateCourseInput,
  updateCourseInputSchema,
} from "andamio-db-api";

/**
 * Studio page for editing course details
 *
 * API Endpoints:
 * - PATCH /courses/{courseNftPolicyId} (protected)
 * - GET /course-modules/assignment-summary/{courseNftPolicyId} (public)
 * - GET /courses/{courseCode}/unpublished-projects (protected)
 * Input Validation: Uses updateCourseInputSchema for runtime validation
 * Type Reference: See API-TYPE-REFERENCE.md in andamio-db-api
 *
 * Pattern:
 * 1. Build input object conforming to UpdateCourseInput type
 * 2. Validate with updateCourseInputSchema.safeParse()
 * 3. Handle validation errors
 * 4. Send validated data to API
 */

interface ApiError {
  message?: string;
}

export default function CourseEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseNftPolicyId = params.coursenft as string;
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  const [course, setCourse] = useState<CourseOutput | null>(null);
  const [modules, setModules] = useState<ListCourseModulesOutput>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assignment summary state
  interface ModuleWithAssignments {
    moduleCode: string;
    title: string;
    assignments: Array<{
      assignmentCode: string;
      title: string;
      live: boolean | null;
    }>;
  }
  const [assignmentSummary, setAssignmentSummary] = useState<ModuleWithAssignments[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  // Course prerequisites state
  interface UnpublishedProject {
    id: string;
    title: string;
    description: string | null;
  }
  const [unpublishedProjects, setUnpublishedProjects] = useState<UnpublishedProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchCourseAndModules = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch course details
        const courseResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/${courseNftPolicyId}`
        );

        if (!courseResponse.ok) {
          throw new Error(`Failed to fetch course: ${courseResponse.statusText}`);
        }

        const courseData = (await courseResponse.json()) as CourseOutput;
        setCourse(courseData);
        setTitle(courseData.title ?? "");
        setDescription(courseData.description ?? "");
        setImageUrl(courseData.imageUrl ?? "");
        setVideoUrl(courseData.videoUrl ?? "");

        // Fetch course modules
        const modulesResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/${courseNftPolicyId}/course-modules`
        );

        if (!modulesResponse.ok) {
          throw new Error(`Failed to fetch modules: ${modulesResponse.statusText}`);
        }

        const modulesData = (await modulesResponse.json()) as ListCourseModulesOutput;
        setModules(modulesData ?? []);

        // Fetch assignment summary
        setIsLoadingAssignments(true);
        try {
          const assignmentSummaryResponse = await fetch(
            `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/assignment-summary/${courseNftPolicyId}`
          );
          if (assignmentSummaryResponse.ok) {
            const summaryData = (await assignmentSummaryResponse.json()) as ModuleWithAssignments[];
            setAssignmentSummary(summaryData ?? []);
          }
        } catch (err) {
          console.error("Error fetching assignment summary:", err);
        } finally {
          setIsLoadingAssignments(false);
        }

        // Fetch unpublished projects with this course as prerequisite
        if (courseData.courseCode) {
          setIsLoadingProjects(true);
          try {
            const projectsResponse = await authenticatedFetch(
              `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/${courseData.courseCode}/unpublished-projects`
            );
            if (projectsResponse.ok) {
              const projectsData = (await projectsResponse.json()) as UnpublishedProject[];
              setUnpublishedProjects(projectsData ?? []);
            }
          } catch (err) {
            console.error("Error fetching unpublished projects:", err);
          } finally {
            setIsLoadingProjects(false);
          }
        }
      } catch (err) {
        console.error("Error fetching course and modules:", err);
        setError(err instanceof Error ? err.message : "Failed to load course");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCourseAndModules();
  }, [courseNftPolicyId]);

  const handleSave = async () => {
    if (!isAuthenticated || !course) {
      setSaveError("You must be authenticated to edit courses");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Build input object conforming to UpdateCourseInput type
      const input: UpdateCourseInput = {
        courseCode: course.courseCode,
        data: {
          title: title || undefined,
          description: description || undefined,
          imageUrl: imageUrl || undefined,
          videoUrl: videoUrl || undefined,
        },
      };

      // Validate input with schema
      const validationResult = updateCourseInputSchema.safeParse(input);

      if (!validationResult.success) {
        // Extract validation errors
        const errors = validationResult.error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        throw new Error(`Validation failed: ${errors}`);
      }

      // Send validated data to API
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/${course.courseCode}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validationResult.data),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to update course");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Refetch course to get updated data
      const refetchResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/${courseNftPolicyId}`
      );
      const data = (await refetchResponse.json()) as CourseOutput;
      setCourse(data);
    } catch (err) {
      console.error("Error saving course:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthenticated || !course) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/${courseNftPolicyId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to delete course");
      }

      // Redirect to course studio page
      router.push("/studio/course");
    } catch (err) {
      console.error("Error deleting course:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to delete course");
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <div className="space-y-6">
        <Link href="/studio/course">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Courses
          </Button>
        </Link>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error ?? "Course not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const hasChanges =
    title !== (course.title ?? "") ||
    description !== (course.description ?? "") ||
    imageUrl !== (course.imageUrl ?? "") ||
    videoUrl !== (course.videoUrl ?? "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/studio/course">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Courses
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {course.courseCode}
          </Badge>
          {course.courseNftPolicyId && (
            <Badge variant="default">Published</Badge>
          )}
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Edit Course</h1>
        <p className="text-muted-foreground">Update course details and manage modules</p>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Course updated successfully</AlertDescription>
        </Alert>
      )}

      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {/* Course Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
          <CardDescription>Edit course information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Course Code (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="courseCode">Course Code</Label>
            <Input id="courseCode" value={course.courseCode} disabled />
            <p className="text-sm text-muted-foreground">Course code cannot be changed</p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Course title"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Course description"
              rows={4}
            />
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Video URL */}
          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL</Label>
            <Input
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push("/studio/course")}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          {/* Danger Zone */}
          <div className="border-t pt-4 mt-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete this course and all its modules, lessons, and assignments.
              </p>
              <ConfirmDialog
                trigger={
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Course
                  </Button>
                }
                title="Delete Course"
                description={`Are you sure you want to delete "${course.title}"? This action cannot be undone. All modules, lessons, and assignments will be permanently removed.`}
                confirmText="Delete Course"
                variant="destructive"
                onConfirm={handleDelete}
                isLoading={isDeleting}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructor Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Instructor Tools</CardTitle>
          <CardDescription>View student progress and manage submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <Link href={`/studio/course/${courseNftPolicyId}/instructor`}>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Instructor Dashboard
                <span className="ml-auto text-sm text-muted-foreground">
                  View all student submissions
                </span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Course Modules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Course Modules ({modules.length})</CardTitle>
              <CardDescription>Manage the modules in this course</CardDescription>
            </div>
            <CreateModuleDialog
              courseNftPolicyId={courseNftPolicyId}
              onModuleCreated={() => {
                // Refetch modules after creation
                void fetch(
                  `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/${courseNftPolicyId}/course-modules`
                )
                  .then((res) => res.json())
                  .then((data) => setModules(data as ListCourseModulesOutput))
                  .catch(console.error);
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No modules found for this course.</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Module Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-40 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((module) => (
                    <TableRow key={module.moduleCode}>
                      <TableCell className="font-mono text-xs">
                        {module.moduleCode}
                      </TableCell>
                      <TableCell className="font-medium">{module.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{module.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/studio/course/${courseNftPolicyId}/${module.moduleCode}`}
                        >
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4 mr-1" />
                            Edit Module
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Overview</CardTitle>
          <CardDescription>
            All assignments across modules with their publication status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAssignments ? (
            <Skeleton className="h-32 w-full" />
          ) : assignmentSummary.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No assignments created yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignmentSummary.map((module) => (
                <div key={module.moduleCode} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{module.title}</h4>
                      <p className="text-xs text-muted-foreground font-mono">
                        {module.moduleCode}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {module.assignments.length} {module.assignments.length === 1 ? "assignment" : "assignments"}
                    </Badge>
                  </div>
                  {module.assignments.length > 0 ? (
                    <div className="space-y-2">
                      {module.assignments.map((assignment) => (
                        <div
                          key={assignment.assignmentCode}
                          className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{assignment.title}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {assignment.assignmentCode}
                            </p>
                          </div>
                          <Badge variant={assignment.live ? "default" : "secondary"}>
                            {assignment.live ? "Live" : "Draft"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No assignments in this module</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Prerequisites / Dependencies */}
      <Card>
        <CardHeader>
          <CardTitle>Course Dependencies</CardTitle>
          <CardDescription>
            Unpublished projects that require this course as a prerequisite
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingProjects ? (
            <Skeleton className="h-32 w-full" />
          ) : unpublishedProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Link2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No projects depend on this course yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unpublishedProjects.map((project) => (
                <div key={project.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-1">{project.title}</h4>
                  {project.description && (
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  )}
                  <Badge variant="outline" className="mt-2">
                    Unpublished Project
                  </Badge>
                </div>
              ))}
              <Alert>
                <Link2 className="h-4 w-4" />
                <AlertDescription>
                  These projects are using your course as a prerequisite. Ensure your course
                  content remains stable to avoid breaking their requirements.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
