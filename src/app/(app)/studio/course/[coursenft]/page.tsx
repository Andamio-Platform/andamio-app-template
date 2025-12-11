"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
// TODO: Re-enable when Andamioscan is ready
// import { type DecodedAssignmentDecisionDatum, type DecodedModuleRefDatum } from "@andamiojs/datum-utils";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useSuccessNotification } from "~/hooks/use-success-notification";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioTextarea } from "~/components/andamio/andamio-textarea";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AndamioPageHeader, AndamioTableContainer } from "~/components/andamio";
// TODO: Re-enable when Andamioscan is ready
// import { AndamioAccordion, AndamioAccordionContent, AndamioAccordionItem, AndamioAccordionTrigger } from "~/components/andamio/andamio-accordion";
// import { AndamioCode } from "~/components/andamio/andamio-code";
import { AlertCircle, ArrowLeft, FileText, Link2, Save, Settings, Trash2, Users, BookOpen, Blocks } from "lucide-react";
import { CreateModuleDialog } from "~/components/courses/create-module-dialog";
import { AndamioConfirmDialog } from "~/components/andamio/andamio-confirm-dialog";
import { OnChainModulesSection } from "~/components/courses/on-chain-modules-section";
import { AndamioTabs, AndamioTabsList, AndamioTabsTrigger, AndamioTabsContent } from "~/components/andamio/andamio-tabs";
import {
  type CourseOutput,
  type ListCourseModulesOutput,
  type UpdateCourseInput,
  updateCourseInputSchema,
} from "@andamio/db-api";

/**
 * Studio page for editing course details
 *
 * API Endpoints:
 * - PATCH /courses/{courseNftPolicyId} (protected)
 * - GET /course-modules/assignment-summary/{courseNftPolicyId} (public)
 * - GET /courses/{courseCode}/unpublished-projects (protected)
 * Input Validation: Uses updateCourseInputSchema for runtime validation
 * Type Reference: See API-TYPE-REFERENCE.md in @andamio/db-api
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const courseNftPolicyId = params.coursenft as string;
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  // URL-based tab persistence
  const urlTab = searchParams.get("tab");
  const validTabs = ["modules", "on-chain", "assignments", "settings"];
  const activeTab = urlTab && validTabs.includes(urlTab) ? urlTab : "modules";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [course, setCourse] = useState<CourseOutput | null>(null);
  const [modules, setModules] = useState<ListCourseModulesOutput>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assignment summary state
  interface ModuleWithAssignments {
    module_code: string;
    title: string;
    assignments: Array<{
      assignment_code: string;
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

  // TODO: Re-enable when Andamioscan API is ready
  // Andamioscan Course State data
  // const [courseUtxos, setCourseUtxos] = useState<unknown>(null);
  // const [isLoadingUtxos, setIsLoadingUtxos] = useState(false);
  // const [courseDecodedDatum, setCourseDecodedDatum] = useState<unknown>(null);
  // const [isLoadingDecodedDatum, setIsLoadingDecodedDatum] = useState(false);
  // const [courseInfo, setCourseInfo] = useState<unknown>(null);
  // const [isLoadingCourseInfo, setIsLoadingCourseInfo] = useState(false);

  // Andamioscan Assignment Validator data
  // const [assignmentUtxos, setAssignmentUtxos] = useState<unknown>(null);
  // const [isLoadingAssignmentUtxos, setIsLoadingAssignmentUtxos] = useState(false);
  // const [assignmentDecodedDatum, setAssignmentDecodedDatum] = useState<DecodedAssignmentDecisionDatum | null>(null);
  // const [isLoadingAssignmentDatum, setIsLoadingAssignmentDatum] = useState(false);

  // Andamioscan Module Ref Validator data
  // const [moduleRefUtxos, setModuleRefUtxos] = useState<unknown>(null);
  // const [isLoadingModuleRefUtxos, setIsLoadingModuleRefUtxos] = useState(false);
  // const [moduleRefDecodedDatum, setModuleRefDecodedDatum] = useState<DecodedModuleRefDatum | null>(null);
  // const [isLoadingModuleRefDatum, setIsLoadingModuleRefDatum] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { isSuccess: saveSuccess, showSuccess } = useSuccessNotification();

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchCourseAndModules = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch course details (POST with body)
        const courseResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/get`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
          }
        );

        if (!courseResponse.ok) {
          throw new Error(`Failed to fetch course: ${courseResponse.statusText}`);
        }

        const courseData = (await courseResponse.json()) as CourseOutput;
        setCourse(courseData);
        setTitle(courseData.title ?? "");
        setDescription(courseData.description ?? "");
        setImageUrl(courseData.image_url ?? "");
        setVideoUrl(courseData.video_url ?? "");

        // Fetch course modules (POST with body)
        const modulesResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/list`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
          }
        );

        if (!modulesResponse.ok) {
          throw new Error(`Failed to fetch modules: ${modulesResponse.statusText}`);
        }

        const modulesData = (await modulesResponse.json()) as ListCourseModulesOutput;
        setModules(modulesData ?? []);

        // Fetch assignment summary (POST with body)
        setIsLoadingAssignments(true);
        try {
          const assignmentSummaryResponse = await fetch(
            `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/assignment-summary`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
            }
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

        // Fetch unpublished projects with this course as prerequisite (POST with body)
        if (courseData.course_code) {
          setIsLoadingProjects(true);
          try {
            const projectsResponse = await authenticatedFetch(
              `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/unpublished-projects`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ course_code: courseData.course_code }),
              }
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

        // TODO: Re-enable when Andamioscan API is ready
        // Fetch on-chain course state data via Andamioscan
        // setIsLoadingUtxos(true);
        // setIsLoadingCourseInfo(true);
        // try {
        //   const utxosResponse = await fetch(
        //     `/api/andamioscan/course-state/utxos?policy=${courseNftPolicyId}`
        //   );
        //   if (utxosResponse.ok) {
        //     const utxosData = await utxosResponse.json();
        //     setCourseUtxos(utxosData);
        //   }
        // } catch (err) {
        //   console.error("Error fetching course UTXOs:", err);
        // } finally {
        //   setIsLoadingUtxos(false);
        // }
        //
        // try {
        //   const infoResponse = await fetch(
        //     `/api/andamioscan/course-state/info?policy=${courseNftPolicyId}`
        //   );
        //   if (infoResponse.ok) {
        //     const infoData = await infoResponse.json();
        //     setCourseInfo(infoData);
        //   }
        // } catch (err) {
        //   console.error("Error fetching course info:", err);
        // } finally {
        //   setIsLoadingCourseInfo(false);
        // }
        //
        // setIsLoadingAssignmentUtxos(true);
        // try {
        //   const assignmentUtxosResponse = await fetch(
        //     `/api/andamioscan/assignment-validator/utxos?policy=${courseNftPolicyId}`
        //   );
        //   if (assignmentUtxosResponse.ok) {
        //     const assignmentUtxosData = await assignmentUtxosResponse.json();
        //     setAssignmentUtxos(assignmentUtxosData);
        //   }
        // } catch (err) {
        //   console.error("Error fetching assignment UTXOs:", err);
        // } finally {
        //   setIsLoadingAssignmentUtxos(false);
        // }
        //
        // setIsLoadingModuleRefUtxos(true);
        // try {
        //   const moduleRefUtxosResponse = await fetch(
        //     `/api/andamioscan/module-ref-validator/utxos?policy=${courseNftPolicyId}`
        //   );
        //   if (moduleRefUtxosResponse.ok) {
        //     const moduleRefUtxosData = await moduleRefUtxosResponse.json();
        //     setModuleRefUtxos(moduleRefUtxosData);
        //   }
        // } catch (err) {
        //   console.error("Error fetching module ref UTXOs:", err);
        // } finally {
        //   setIsLoadingModuleRefUtxos(false);
        // }
      } catch (err) {
        console.error("Error fetching course and modules:", err);
        setError(err instanceof Error ? err.message : "Failed to load course");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCourseAndModules();
  }, [courseNftPolicyId, authenticatedFetch]);

  // TODO: Re-enable when Andamioscan API is ready
  // Fetch decoded datum when user is available
  // useEffect(() => {
  //   if (!user?.accessTokenAlias) return;
  //
  //   const fetchDecodedData = async () => {
  //     setIsLoadingDecodedDatum(true);
  //     try {
  //       const datumResponse = await fetch(
  //         `/api/andamioscan/course-state/decoded-datum?policy=${courseNftPolicyId}&alias=${user.accessTokenAlias}`
  //       );
  //       if (datumResponse.ok) {
  //         const datumData = await datumResponse.json();
  //         setCourseDecodedDatum(datumData);
  //       }
  //     } catch (err) {
  //       console.error("Error fetching decoded datum:", err);
  //     } finally {
  //       setIsLoadingDecodedDatum(false);
  //     }
  //
  //     setIsLoadingAssignmentDatum(true);
  //     try {
  //       const assignmentDatumResponse = await fetch(
  //         `/api/andamioscan/assignment-validator/decoded-datum?policy=${courseNftPolicyId}&alias=${user.accessTokenAlias}`
  //       );
  //       if (assignmentDatumResponse.ok) {
  //         const assignmentDatumData = (await assignmentDatumResponse.json()) as DecodedAssignmentDecisionDatum;
  //         setAssignmentDecodedDatum(assignmentDatumData);
  //       }
  //     } catch (err) {
  //       console.error("Error fetching assignment decoded datum:", err);
  //     } finally {
  //       setIsLoadingAssignmentDatum(false);
  //     }
  //
  //     setIsLoadingModuleRefDatum(true);
  //     try {
  //       const moduleRefDatumResponse = await fetch(
  //         `/api/andamioscan/module-ref-validator/decoded-datum?policy=${courseNftPolicyId}&alias=${user.accessTokenAlias}`
  //       );
  //       if (moduleRefDatumResponse.ok) {
  //         const moduleRefDatumData = (await moduleRefDatumResponse.json()) as DecodedModuleRefDatum;
  //         setModuleRefDecodedDatum(moduleRefDatumData);
  //       }
  //     } catch (err) {
  //       console.error("Error fetching module ref decoded datum:", err);
  //     } finally {
  //       setIsLoadingModuleRefDatum(false);
  //     }
  //   };
  //
  //   void fetchDecodedData();
  // }, [courseNftPolicyId, user?.accessTokenAlias]);

  const handleSave = async () => {
    if (!isAuthenticated || !course) {
      setSaveError("You must be authenticated to edit courses");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Build input object conforming to UpdateCourseInput type
      const input: UpdateCourseInput = {
        course_code: course.course_code,
        data: {
          title: title || undefined,
          description: description || undefined,
          image_url: imageUrl || undefined,
          video_url: videoUrl || undefined,
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

      // Send validated data to API (POST /courses/update)
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_code: course.course_code,
            data: validationResult.data,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to update course");
      }

      showSuccess();

      // Refetch course to get updated data (POST /courses/get)
      const refetchResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
        }
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
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_code: course.course_code }),
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
    imageUrl !== (course.image_url ?? "") ||
    videoUrl !== (course.video_url ?? "");

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
            {course.course_code}
          </AndamioBadge>
          {course.course_nft_policy_id && (
            <AndamioBadge variant="default">Published</AndamioBadge>
          )}
        </div>
      </div>

      <AndamioPageHeader
        title={course.title ?? "Untitled Course"}
        description="Manage your course content and settings"
      />

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

      {/* Tabbed Content */}
      <AndamioTabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <AndamioTabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 sm:gap-0 sm:h-10">
          <AndamioTabsTrigger value="modules" className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-0">
            <BookOpen className="h-4 w-4 shrink-0" />
            <span className="text-xs sm:text-sm">Modules</span>
          </AndamioTabsTrigger>
          <AndamioTabsTrigger value="on-chain" className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-0">
            <Blocks className="h-4 w-4 shrink-0" />
            <span className="text-xs sm:text-sm">On-Chain</span>
          </AndamioTabsTrigger>
          <AndamioTabsTrigger value="assignments" className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-0">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="text-xs sm:text-sm">Tasks</span>
          </AndamioTabsTrigger>
          <AndamioTabsTrigger value="settings" className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-0">
            <Settings className="h-4 w-4 shrink-0" />
            <span className="text-xs sm:text-sm">Settings</span>
          </AndamioTabsTrigger>
        </AndamioTabsList>

        {/* Modules Tab */}
        <AndamioTabsContent value="modules" className="space-y-6 mt-6">
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
                    void fetch(
                      `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/list`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
                      }
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
                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No modules found for this course.</p>
                  <p className="text-sm mt-1">Create a module to get started.</p>
                </div>
              ) : (
                <AndamioTableContainer>
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
                        <AndamioTableRow key={module.module_code}>
                          <AndamioTableCell className="font-mono text-xs">
                            {module.module_code}
                          </AndamioTableCell>
                          <AndamioTableCell className="font-medium">{module.title}</AndamioTableCell>
                          <AndamioTableCell>
                            <AndamioBadge variant="outline">{module.status}</AndamioBadge>
                          </AndamioTableCell>
                          <AndamioTableCell className="text-right">
                            <Link href={`/studio/course/${courseNftPolicyId}/${module.module_code}`}>
                              <AndamioButton variant="ghost" size="sm">
                                <Settings className="h-4 w-4 mr-1" />
                                Edit
                              </AndamioButton>
                            </Link>
                          </AndamioTableCell>
                        </AndamioTableRow>
                      ))}
                    </AndamioTableBody>
                  </AndamioTable>
                </AndamioTableContainer>
              )}
            </AndamioCardContent>
          </AndamioCard>
        </AndamioTabsContent>

        {/* On-Chain Tab */}
        <AndamioTabsContent value="on-chain" className="space-y-6 mt-6">
          {/* On-Chain Modules */}
          <OnChainModulesSection courseNftPolicyId={courseNftPolicyId} />
        </AndamioTabsContent>

        {/* Assignments Tab */}
        <AndamioTabsContent value="assignments" className="space-y-6 mt-6">
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
                    <div key={module.module_code} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{module.title}</h4>
                          <p className="text-xs text-muted-foreground font-mono">
                            {module.module_code}
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
                              key={assignment.assignment_code}
                              className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium">{assignment.title}</p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {assignment.assignment_code}
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
        </AndamioTabsContent>

        {/* Settings Tab */}
        <AndamioTabsContent value="settings" className="space-y-6 mt-6">
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
                <AndamioInput id="courseCode" value={course.course_code} disabled />
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
            </AndamioCardContent>
          </AndamioCard>

          {/* Course Dependencies */}
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

          {/* Danger Zone */}
          <AndamioCard className="border-destructive/50">
            <AndamioCardHeader>
              <AndamioCardTitle className="text-destructive">Danger Zone</AndamioCardTitle>
              <AndamioCardDescription>
                Irreversible actions for this course
              </AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent>
              <div className="space-y-2">
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
            </AndamioCardContent>
          </AndamioCard>
        </AndamioTabsContent>
      </AndamioTabs>
    </div>
  );
}
