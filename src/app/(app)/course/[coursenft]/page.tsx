"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { env } from "~/env";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AlertCircle, BookOpen, Blocks, ChevronRight, CheckCircle, Target } from "lucide-react";
import { type CourseOutput, type ListCourseModulesOutput } from "@andamio/db-api";
import { UserCourseStatus } from "~/components/learner/user-course-status";
import { OnChainSltsViewer, OnChainSltsBadge } from "~/components/courses/on-chain-slts-viewer";
import { AndamioCard, AndamioCardContent, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { useCourse } from "~/hooks/use-andamioscan";

/**
 * Public page displaying course details and module list with SLT counts
 *
 * API Endpoints:
 * - GET /courses/{courseNftPolicyId} (public)
 * - GET /courses/${courseNftPolicyId}/course-modules (public) - Optimized query for modules with SLTs
 * Type Reference: See API-TYPE-REFERENCE.md in @andamio/db-api
 */

export default function CourseDetailPage() {
  const params = useParams();
  const courseNftPolicyId = params.coursenft as string;

  const [course, setCourse] = useState<CourseOutput | null>(null);
  const [modules, setModules] = useState<ListCourseModulesOutput>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          const errorText = await courseResponse.text();
          console.error("Course fetch error:", {
            status: courseResponse.status,
            statusText: courseResponse.statusText,
            body: errorText,
            url: `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/get`
          });
          throw new Error(`Course not found (${courseResponse.status})`);
        }

        const courseData = (await courseResponse.json()) as CourseOutput;
        setCourse(courseData);

        // Fetch course modules with SLTs (POST with body)
        const modulesResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/list`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
          }
        );

        if (!modulesResponse.ok) {
          const errorText = await modulesResponse.text();
          console.error("Modules fetch error:", {
            status: modulesResponse.status,
            statusText: modulesResponse.statusText,
            body: errorText,
            url: `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/list`
          });
          throw new Error(`Failed to fetch course modules (${modulesResponse.status})`);
        }

        const modulesData = (await modulesResponse.json()) as ListCourseModulesOutput;
        setModules(modulesData ?? []);
      } catch (err) {
        console.error("Error fetching course and modules:", err);
        setError(err instanceof Error ? err.message : "Failed to load course");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCourseAndModules();
  }, [courseNftPolicyId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <AndamioSkeleton className="h-9 w-64 mb-2" />
          <AndamioSkeleton className="h-5 w-96" />
        </div>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <AndamioSkeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Course Not Found</h1>
        </div>

        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>
            {error ?? "Course not found"}
          </AndamioAlertDescription>
        </AndamioAlert>
      </div>
    );
  }

  // Empty modules state
  if (modules.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          {course.description && (
            <p className="text-muted-foreground">{course.description}</p>
          )}
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            No modules found for this course.
          </p>
        </div>
      </div>
    );
  }

  // Fetch on-chain course data
  const { data: onChainCourse } = useCourse(courseNftPolicyId);

  // Build map of on-chain SLTs per module by matching SLT text content
  const getOnChainStatus = (moduleSlts: Array<{ slt_text: string }>) => {
    if (!onChainCourse) return { onChainSlts: new Set<string>(), moduleHash: null };

    const dbSltTexts = new Set(moduleSlts.map((s) => s.slt_text));

    for (const mod of onChainCourse.modules) {
      const onChainTexts = new Set(mod.slts);
      const intersection = [...dbSltTexts].filter((t) => onChainTexts.has(t));
      if (intersection.length > 0 && intersection.length >= mod.slts.length * 0.5) {
        return { onChainSlts: onChainTexts, moduleHash: mod.assignment_id };
      }
    }

    return { onChainSlts: new Set<string>(), moduleHash: null };
  };

  // Calculate total SLT count
  const totalSlts = modules.reduce((sum, m) => sum + m.slts.length, 0);

  // Course and modules display
  return (
    <div className="space-y-8">
      {/* Course Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <OnChainSltsBadge courseNftPolicyId={courseNftPolicyId} />
        </div>
        {course.description && (
          <p className="text-muted-foreground text-lg">{course.description}</p>
        )}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            {modules.length} {modules.length === 1 ? "Module" : "Modules"}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            {totalSlts} Learning {totalSlts === 1 ? "Target" : "Targets"}
          </div>
        </div>
      </div>

      {/* User Course Status */}
      <UserCourseStatus courseNftPolicyId={courseNftPolicyId} />

      {/* Course Learning Journey - SLTs as the Story */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Your Learning Journey</h2>
          <p className="text-muted-foreground">
            This course is structured around specific learning targets. Complete each module to master these skills.
          </p>
        </div>

        {/* Module Cards with SLTs */}
        <div className="space-y-4">
          {modules.map((module, moduleIndex) => {
            const { onChainSlts, moduleHash } = getOnChainStatus(module.slts);
            const hasOnChain = moduleHash !== null;

            return (
              <AndamioCard key={module.module_code} className="overflow-hidden">
                <Link href={`/course/${courseNftPolicyId}/${module.module_code}`}>
                  <AndamioCardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                          {moduleIndex + 1}
                        </div>
                        <div>
                          <AndamioCardTitle className="text-lg flex items-center gap-2">
                            {module.title}
                            {hasOnChain && (
                              <span title="Module on-chain">
                                <Blocks className="h-4 w-4 text-success" />
                              </span>
                            )}
                          </AndamioCardTitle>
                          <p className="text-sm text-muted-foreground font-mono">
                            {module.module_code}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <AndamioBadge variant="secondary">
                          {module.slts.length} {module.slts.length === 1 ? "target" : "targets"}
                        </AndamioBadge>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </AndamioCardHeader>
                </Link>
                <AndamioCardContent className="pt-0 border-t bg-muted/30">
                  <div className="pt-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                      Learning Targets
                    </p>
                    <ul className="space-y-2">
                      {module.slts.map((slt, sltIndex) => {
                        const isOnChain = onChainSlts.has(slt.slt_text);
                        return (
                          <li key={sltIndex} className="flex items-start gap-3">
                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                              isOnChain
                                ? "bg-success/10 text-success"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {isOnChain ? (
                                <CheckCircle className="h-3.5 w-3.5" />
                              ) : (
                                sltIndex + 1
                              )}
                            </div>
                            <span className="text-sm pt-0.5">{slt.slt_text}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </AndamioCardContent>
              </AndamioCard>
            );
          })}
        </div>
      </div>

      {/* On-Chain Verified SLTs - Additional Detail Section */}
      {onChainCourse && onChainCourse.modules.length > 0 && (
        <div className="space-y-4 border-t pt-8">
          <div className="flex items-center gap-2">
            <Blocks className="h-5 w-5 text-success" />
            <h2 className="text-xl font-semibold">Blockchain Verification</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            This course has {onChainCourse.modules.length} {onChainCourse.modules.length === 1 ? "module" : "modules"} with learning targets verified on the Cardano blockchain.
          </p>
        </div>
      )}
    </div>
  );
}
