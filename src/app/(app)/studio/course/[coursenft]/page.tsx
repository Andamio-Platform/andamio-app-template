"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioTextarea } from "~/components/andamio/andamio-textarea";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AndamioAccordion, AndamioAccordionContent, AndamioAccordionItem, AndamioAccordionTrigger } from "~/components/andamio/andamio-accordion";
import { AndamioCode } from "~/components/andamio/andamio-code";
import { AlertCircle, ArrowLeft, FileText, Link2, Save, Settings, Trash2, Users, Database } from "lucide-react";
import { CreateModuleDialog } from "~/components/courses/create-module-dialog";
import { AndamioConfirmDialog } from "~/components/andamio/andamio-confirm-dialog";
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
  const { isAuthenticated, authenticatedFetch, user } = useAndamioAuth();

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

  // NBA Course State data
  const [courseUtxos, setCourseUtxos] = useState<unknown | null>(null);
  const [isLoadingUtxos, setIsLoadingUtxos] = useState(false);
  const [courseDecodedDatum, setCourseDecodedDatum] = useState<unknown | null>(null);
  const [isLoadingDecodedDatum, setIsLoadingDecodedDatum] = useState(false);
  const [courseInfo, setCourseInfo] = useState<unknown | null>(null);
  const [isLoadingCourseInfo, setIsLoadingCourseInfo] = useState(false);

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

        // Fetch NBA course state data
        setIsLoadingUtxos(true);
        setIsLoadingCourseInfo(true);
        try {
          // Fetch UTXOs
          const utxosResponse = await fetch(
            `/api/nba/course-state/utxos?policy=${courseNftPolicyId}`
          );
          if (utxosResponse.ok) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const utxosData = await utxosResponse.json();
            setCourseUtxos(utxosData);
          }
        } catch (err) {
          console.error("Error fetching course UTXOs:", err);
        } finally {
          setIsLoadingUtxos(false);
        }

        // Fetch course info
        try {
          const infoResponse = await fetch(
            `/api/nba/course-state/info?policy=${courseNftPolicyId}`
          );
          if (infoResponse.ok) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const infoData = await infoResponse.json();
            setCourseInfo(infoData);
          }
        } catch (err) {
          console.error("Error fetching course info:", err);
        } finally {
          setIsLoadingCourseInfo(false);
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

  // Fetch decoded datum when user is available
  useEffect(() => {
    if (!user?.accessTokenAlias) return;

    const fetchDecodedDatum = async () => {
      setIsLoadingDecodedDatum(true);
      try {
        const datumResponse = await fetch(
          `/api/nba/course-state/decoded-datum?policy=${courseNftPolicyId}&alias=${user.accessTokenAlias}`
        );
        if (datumResponse.ok) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const datumData = await datumResponse.json();
          setCourseDecodedDatum(datumData);
        }
      } catch (err) {
        console.error("Error fetching decoded datum:", err);
      } finally {
        setIsLoadingDecodedDatum(false);
      }
    };

    void fetchDecodedDatum();
  }, [courseNftPolicyId, user?.accessTokenAlias]);

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
        <AndamioSkeleton className="h-8 w-32" />
        <AndamioSkeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <div className="space-y-6">
        <Link href="/studio/course">
          <AndamioButton variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Courses
          </AndamioButton>
        </Link>

        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{error ?? "Course not found"}</AndamioAlertDescription>
        </AndamioAlert>
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
          <AndamioButton variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Courses
          </AndamioButton>
        </Link>
        <div className="flex items-center gap-2">
          <AndamioBadge variant="outline" className="font-mono text-xs">
            {course.courseCode}
          </AndamioBadge>
          {course.courseNftPolicyId && (
            <AndamioBadge variant="default">Published</AndamioBadge>
          )}
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Edit Course</h1>
        <p className="text-muted-foreground">Update course details and manage modules</p>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <AndamioAlert>
          <AndamioAlertTitle>Success</AndamioAlertTitle>
          <AndamioAlertDescription>Course updated successfully</AndamioAlertDescription>
        </AndamioAlert>
      )}

      {saveError && (
        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{saveError}</AndamioAlertDescription>
        </AndamioAlert>
      )}

      {/* Course Details Form */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Course Details</AndamioCardTitle>
          <AndamioCardDescription>Edit course information</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          {/* Course Code (Read-only) */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="courseCode">Course Code</AndamioLabel>
            <AndamioInput id="courseCode" value={course.courseCode} disabled />
            <p className="text-sm text-muted-foreground">Course code cannot be changed</p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="title">Title *</AndamioLabel>
            <AndamioInput
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Course title"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="description">Description</AndamioLabel>
            <AndamioTextarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Course description"
              rows={4}
            />
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="imageUrl">Image URL</AndamioLabel>
            <AndamioInput
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Video URL */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="videoUrl">Video URL</AndamioLabel>
            <AndamioInput
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <AndamioButton variant="outline" onClick={() => router.push("/studio/course")}>
              Cancel
            </AndamioButton>
            <AndamioButton onClick={handleSave} disabled={isSaving || !hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </AndamioButton>
          </div>

          {/* Danger Zone */}
          <div className="border-t pt-4 mt-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete this course and all its modules, lessons, and assignments.
              </p>
              <AndamioConfirmDialog
                trigger={
                  <AndamioButton variant="destructive" size="sm" disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Course
                  </AndamioButton>
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
        </AndamioCardContent>
      </AndamioCard>

      {/* Instructor Tools */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Instructor Tools</AndamioCardTitle>
          <AndamioCardDescription>View student progress and manage submissions</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex flex-col gap-3">
            <Link href={`/studio/course/${courseNftPolicyId}/instructor`}>
              <AndamioButton variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Instructor Dashboard
                <span className="ml-auto text-sm text-muted-foreground">
                  View all student submissions
                </span>
              </AndamioButton>
            </Link>
          </div>
        </AndamioCardContent>
      </AndamioCard>

      {/* Course Modules */}
      <AndamioCard>
        <AndamioCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <AndamioCardTitle>Course Modules ({modules.length})</AndamioCardTitle>
              <AndamioCardDescription>Manage the modules in this course</AndamioCardDescription>
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
        </AndamioCardHeader>
        <AndamioCardContent>
          {modules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No modules found for this course.</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <AndamioTable>
                <AndamioTableHeader>
                  <AndamioTableRow>
                    <AndamioTableHead className="w-32">Module Code</AndamioTableHead>
                    <AndamioTableHead>Title</AndamioTableHead>
                    <AndamioTableHead className="w-32">Status</AndamioTableHead>
                    <AndamioTableHead className="w-40 text-right">Actions</AndamioTableHead>
                  </AndamioTableRow>
                </AndamioTableHeader>
                <AndamioTableBody>
                  {modules.map((module) => (
                    <AndamioTableRow key={module.moduleCode}>
                      <AndamioTableCell className="font-mono text-xs">
                        {module.moduleCode}
                      </AndamioTableCell>
                      <AndamioTableCell className="font-medium">{module.title}</AndamioTableCell>
                      <AndamioTableCell>
                        <AndamioBadge variant="outline">{module.status}</AndamioBadge>
                      </AndamioTableCell>
                      <AndamioTableCell className="text-right">
                        <Link
                          href={`/studio/course/${courseNftPolicyId}/${module.moduleCode}`}
                        >
                          <AndamioButton variant="ghost" size="sm">
                            <Settings className="h-4 w-4 mr-1" />
                            Edit Module
                          </AndamioButton>
                        </Link>
                      </AndamioTableCell>
                    </AndamioTableRow>
                  ))}
                </AndamioTableBody>
              </AndamioTable>
            </div>
          )}
        </AndamioCardContent>
      </AndamioCard>

      {/* Assignment Overview */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Assignment Overview</AndamioCardTitle>
          <AndamioCardDescription>
            All assignments across modules with their publication status
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          {isLoadingAssignments ? (
            <AndamioSkeleton className="h-32 w-full" />
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
                    <AndamioBadge variant="outline">
                      {module.assignments.length} {module.assignments.length === 1 ? "assignment" : "assignments"}
                    </AndamioBadge>
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
                          <AndamioBadge variant={assignment.live ? "default" : "secondary"}>
                            {assignment.live ? "Live" : "Draft"}
                          </AndamioBadge>
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
        </AndamioCardContent>
      </AndamioCard>

      {/* Course Prerequisites / Dependencies */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Course Dependencies</AndamioCardTitle>
          <AndamioCardDescription>
            Unpublished projects that require this course as a prerequisite
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          {isLoadingProjects ? (
            <AndamioSkeleton className="h-32 w-full" />
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
                  <AndamioBadge variant="outline" className="mt-2">
                    Unpublished Project
                  </AndamioBadge>
                </div>
              ))}
              <AndamioAlert>
                <Link2 className="h-4 w-4" />
                <AndamioAlertDescription>
                  These projects are using your course as a prerequisite. Ensure your course
                  content remains stable to avoid breaking their requirements.
                </AndamioAlertDescription>
              </AndamioAlert>
            </div>
          )}
        </AndamioCardContent>
      </AndamioCard>

      {/* NBA On-Chain Data - Developer Tools */}
      <AndamioCard>
        <AndamioCardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <AndamioCardTitle>On-Chain Data (NBA)</AndamioCardTitle>
          </div>
          <AndamioCardDescription>
            Raw blockchain data for development and debugging
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <AndamioAccordion type="single" collapsible>
            <AndamioAccordionItem value="utxos">
              <AndamioAccordionTrigger>Course UTXOs</AndamioAccordionTrigger>
              <AndamioAccordionContent>
                {isLoadingUtxos ? (
                  <div className="space-y-2">
                    <AndamioSkeleton className="h-4 w-full" />
                    <AndamioSkeleton className="h-4 w-3/4" />
                  </div>
                ) : courseUtxos ? (
                  <AndamioCode data={courseUtxos} />
                ) : (
                  <p className="text-sm text-muted-foreground">No UTXO data available</p>
                )}
              </AndamioAccordionContent>
            </AndamioAccordionItem>

            <AndamioAccordionItem value="decoded-datum">
              <AndamioAccordionTrigger>Decoded Datum</AndamioAccordionTrigger>
              <AndamioAccordionContent>
                {isLoadingDecodedDatum ? (
                  <div className="space-y-2">
                    <AndamioSkeleton className="h-4 w-full" />
                    <AndamioSkeleton className="h-4 w-3/4" />
                  </div>
                ) : courseDecodedDatum ? (
                  <AndamioCode data={courseDecodedDatum} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No decoded datum available (user may not be enrolled in course)
                  </p>
                )}
              </AndamioAccordionContent>
            </AndamioAccordionItem>

            <AndamioAccordionItem value="course-info">
              <AndamioAccordionTrigger>Course Info</AndamioAccordionTrigger>
              <AndamioAccordionContent>
                {isLoadingCourseInfo ? (
                  <div className="space-y-2">
                    <AndamioSkeleton className="h-4 w-full" />
                    <AndamioSkeleton className="h-4 w-3/4" />
                  </div>
                ) : courseInfo ? (
                  <AndamioCode data={courseInfo} />
                ) : (
                  <p className="text-sm text-muted-foreground">No course info available</p>
                )}
              </AndamioAccordionContent>
            </AndamioAccordionItem>
          </AndamioAccordion>
        </AndamioCardContent>
      </AndamioCard>
    </div>
  );
}
