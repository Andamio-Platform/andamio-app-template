"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { ContentViewer } from "~/components/editor";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import {
  AndamioPageHeader,
  AndamioPageLoading,
  AndamioNotFoundCard,
} from "~/components/andamio";
import { AssignmentCommitment } from "~/components/learner/assignment-commitment";
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";
import { getCourse } from "~/lib/andamioscan";
import { type CourseResponse, type CourseModuleResponse } from "~/types/generated";
import { computeSltHashDefinite } from "@andamio/core/hashing";
import { AlertIcon, SuccessIcon } from "~/components/icons";
import type { JSONContent } from "@tiptap/core";

/**
 * Learner-facing assignment view page
 *
 * Shows assignment details and allows learners to:
 * - View assignment content
 * - Create commitments
 * - Submit evidence
 * - Track progress
 *
 * API Endpoints:
 * - GET /assignments/{courseNftPolicyId}/{moduleCode} (public)
 */

/**
 * Assignment data from the API
 * Uses snake_case to match the API response (AssignmentResponse type)
 */
interface Assignment {
  title?: string;
  description?: object; // NullableString in API
  content_json?: Record<string, unknown>;
  image_url?: object; // NullableString in API
  video_url?: object; // NullableString in API
  is_live?: boolean;
  created_by_alias?: string;
}

interface SLT {
  id: string;
  /** 1-based SLT index (API v2.0.0+) */
  slt_index: number;
  slt_text: string;
}

export default function LearnerAssignmentPage() {
  const params = useParams();
  const courseNftPolicyId = params.coursenft as string;
  const moduleCode = params.modulecode as string;

  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [courseModule, setCourseModule] = useState<CourseModuleResponse | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [slts, setSlts] = useState<SLT[]>([]);
  const [onChainModuleHash, setOnChainModuleHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Go API: GET /course/user/course/get/{policy_id}
        const courseResponse = await fetch(
          `/api/gateway/api/v2/course/user/course/get/${courseNftPolicyId}`
        );

        if (courseResponse.ok) {
          const courseData = (await courseResponse.json()) as CourseResponse;
          setCourse(courseData);
        }

        // Go API: GET /course/user/course-module/get/{policy_id}/{module_code}
        const moduleResponse = await fetch(
          `/api/gateway/api/v2/course/user/course-module/get/${courseNftPolicyId}/${moduleCode}`
        );

        if (moduleResponse.ok) {
          const moduleData = (await moduleResponse.json()) as CourseModuleResponse;
          setCourseModule(moduleData);
        }

        // Fetch SLTs for the module
        // Go API: GET /course/user/slts/{course_id}/{course_module_code}
        const sltsResponse = await fetch(
          `/api/gateway/api/v2/course/user/slts/${courseNftPolicyId}/${moduleCode}`
        );

        if (sltsResponse.ok) {
          const sltsData = (await sltsResponse.json()) as SLT[];
          setSlts(sltsData);
        }

        // Go API: GET /course/user/assignment/{course_id}/{course_module_code}
        const response = await fetch(
          `/api/gateway/api/v2/course/user/assignment/${courseNftPolicyId}/${moduleCode}`
        );

        if (response.status === 404) {
          setError("No assignment found for this module");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch assignment");
        }

        const assignmentResult = await response.json() as Assignment | { data?: Assignment };
        // Handle both wrapped { data: {...} } and raw object formats
        let assignmentData: Assignment | null = null;
        if (assignmentResult && typeof assignmentResult === "object") {
          if ("data" in assignmentResult && assignmentResult.data) {
            assignmentData = assignmentResult.data;
            console.log("[LearnerAssignmentPage] Assignment was wrapped, unwrapped:", assignmentData);
          } else if ("title" in assignmentResult || "content_json" in assignmentResult) {
            assignmentData = assignmentResult;
            console.log("[LearnerAssignmentPage] Assignment (raw):", assignmentData);
          } else {
            console.log("[LearnerAssignmentPage] Assignment has unexpected shape:", assignmentResult);
          }
        }
        setAssignment(assignmentData);
      } catch (err) {
        console.error("Error fetching assignment:", err);
        setError(err instanceof Error ? err.message : "Failed to load assignment");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAssignment();
  }, [courseNftPolicyId, moduleCode]);

  // Compute sltHash from fetched SLTs
  const computedSltHash = useMemo(() => {
    if (slts.length > 0) {
      // API v2.0.0+: slt_index is 1-based
      const sltTexts = [...slts]
        .sort((a, b) => a.slt_index - b.slt_index)
        .map((slt) => slt.slt_text);
      return computeSltHashDefinite(sltTexts);
    }
    return null;
  }, [slts]);

  // Fetch on-chain data and match after we have computed hash
  useEffect(() => {
    if (!computedSltHash || !courseNftPolicyId) return;

    const matchOnChain = async () => {
      try {
        const onChainCourse = await getCourse(courseNftPolicyId);
        if (onChainCourse?.modules) {
          // Find module with matching assignment_id (which is the slt_hash)
          const matchingModule = onChainCourse.modules.find(
            (m) => m.assignment_id === computedSltHash
          );
          if (matchingModule) {
            console.log("Found matching on-chain module:", matchingModule.assignment_id);
            setOnChainModuleHash(matchingModule.assignment_id);
          } else {
            console.warn(
              "No exact SLT hash match found on-chain. Computed:",
              computedSltHash,
              "On-chain modules:",
              onChainCourse.modules.map((m) => m.assignment_id)
            );
          }
        }
      } catch (err) {
        console.warn("Failed to fetch on-chain course data:", err);
      }
    };

    void matchOnChain();
  }, [computedSltHash, courseNftPolicyId]);

  // Determine the sltHash to use:
  // 1. On-chain hash (authoritative, from Andamioscan) - if verified to match
  // 2. Database slt_hash (if available)
  // 3. Computed hash (fallback)
  const dbSltHash = typeof courseModule?.slt_hash === "string" ? courseModule.slt_hash : null;
  const sltHash = onChainModuleHash ?? dbSltHash ?? computedSltHash;

  // Check for hash mismatch between computed and on-chain
  const hashMismatch = useMemo(() => {
    if (onChainModuleHash && computedSltHash && onChainModuleHash !== computedSltHash) {
      return { computed: computedSltHash, onChain: onChainModuleHash };
    }
    return null;
  }, [onChainModuleHash, computedSltHash]);

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="content" />;
  }

  // Error state
  if (error || !assignment) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        {course && courseModule && (
          <CourseBreadcrumb
            mode="public"
            course={{ nftPolicyId: courseNftPolicyId, title: typeof course.title === "string" ? course.title : "Course" }}
            courseModule={{ code: courseModule.course_module_code ?? "", title: courseModule.title ?? "Module" }}
            currentPage="assignment"
          />
        )}

        <AndamioNotFoundCard
          title="Assignment Not Found"
          message={error ?? "Assignment not found"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      {course && courseModule && (
        <CourseBreadcrumb
          mode="public"
          course={{ nftPolicyId: courseNftPolicyId, title: typeof course.title === "string" ? course.title : "Course" }}
          courseModule={{ code: courseModule.course_module_code ?? "", title: courseModule.title ?? "Module" }}
          currentPage="assignment"
        />
      )}

      <AndamioPageHeader
        title={assignment.title ?? "Assignment"}
        description={undefined}
      />

      <div className="flex items-center gap-2">
        <AndamioBadge variant="outline" className="font-mono text-xs">
          {moduleCode}
        </AndamioBadge>
        {assignment.is_live ? (
          <AndamioBadge>Live</AndamioBadge>
        ) : (
          <AndamioBadge variant="secondary">Draft</AndamioBadge>
        )}
      </div>

      {/* Linked SLTs */}
      {slts.length > 0 && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle>Learning Targets</AndamioCardTitle>
            <AndamioCardDescription>
              This assignment covers {slts.length} Student Learning Target{slts.length !== 1 ? 's' : ''}
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="space-y-2">
              {slts
                .sort((a, b) => a.slt_index - b.slt_index)
                .map((slt) => (
                  <div key={`slt-${slt.slt_index}`} className="flex items-start gap-3 p-3 border rounded-md">
                    <AndamioBadge variant="outline" className="mt-0.5">
                      {slt.slt_index}
                    </AndamioBadge>
                    <AndamioText variant="small" className="flex-1 text-foreground">{slt.slt_text}</AndamioText>
                  </div>
                ))}
            </div>
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* Assignment Content */}
      {assignment.content_json && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle>Assignment Details</AndamioCardTitle>
            <AndamioCardDescription>Read the full assignment below</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <ContentViewer content={assignment.content_json as JSONContent} />
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* Media section removed - image_url and video_url are NullableString (object type) */}

      <AndamioSeparator />

      {/* Hash Verification Status */}
      {hashMismatch && (
        <AndamioAlert variant="destructive">
          <AlertIcon className="h-4 w-4" />
          <AndamioAlertDescription>
            <div className="space-y-2">
              <p className="font-medium">SLT Hash Mismatch Detected</p>
              <p className="text-sm">The on-chain module hash does not match the computed hash from database SLTs. This may indicate the SLTs were modified after minting.</p>
              <div className="text-xs font-mono space-y-1 mt-2">
                <div><span className="text-muted-foreground">On-chain:</span> {hashMismatch.onChain}</div>
                <div><span className="text-muted-foreground">Computed:</span> {hashMismatch.computed}</div>
              </div>
            </div>
          </AndamioAlertDescription>
        </AndamioAlert>
      )}

      {onChainModuleHash && !hashMismatch && (
        <AndamioAlert>
          <SuccessIcon className="h-4 w-4 text-success" />
          <AndamioAlertDescription>
            <span className="font-medium">Module verified on-chain</span>
            <span className="ml-2 text-xs font-mono text-muted-foreground">
              {onChainModuleHash.slice(0, 16)}...
            </span>
          </AndamioAlertDescription>
        </AndamioAlert>
      )}

      {/* Assignment Commitment Component */}
      <AssignmentCommitment
        assignmentTitle={assignment.title}
        courseNftPolicyId={courseNftPolicyId}
        moduleCode={moduleCode}
        sltHash={sltHash}
      />
    </div>
  );
}
