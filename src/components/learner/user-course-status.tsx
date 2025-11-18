"use client";

import React, { useEffect, useState } from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { AndamioProgress } from "~/components/andamio/andamio-progress";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Trophy,
  AlertTriangle,
} from "lucide-react";

/**
 * User Course Status Component
 *
 * Displays comprehensive course progress for the authenticated learner
 *
 * API Endpoint:
 * - GET /user-course-status/{courseNftPolicyId} (protected)
 */

interface UserCourseStatusProps {
  courseNftPolicyId: string;
}

interface CourseStatus {
  userId: string;
  learnerId: string;
  isEnrolled: boolean;
  awaitingApproval: string | null;
  completedAssignments: Array<{
    assignmentId: string;
    assignmentCode: string;
    moduleCode: string;
    networkStatus: string;
  }>;
  courseStateCompletedAssignments: string[];
  validatedCompletedAssignments: string[];
  syncSuccess: boolean;
  course: {
    id: string;
    courseCode: string;
    title: string;
    courseNftPolicyId: string | null;
  };
  requiredModules: Array<{
    id: string;
    title: string;
  }>;
}

export function UserCourseStatus({ courseNftPolicyId }: UserCourseStatusProps) {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();
  const [status, setStatus] = useState<CourseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const fetchStatus = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/user-course-status/${courseNftPolicyId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch course status");
        }

        const data = (await response.json()) as CourseStatus;
        setStatus(data);
      } catch (err) {
        console.error("Error fetching course status:", err);
        setError(err instanceof Error ? err.message : "Failed to load course status");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStatus();
  }, [isAuthenticated, authenticatedFetch, courseNftPolicyId]);

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Your Progress</AndamioCardTitle>
          <AndamioCardDescription>Loading your course progress...</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <AndamioSkeleton className="h-32 w-full" />
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  if (error || !status) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Your Progress</AndamioCardTitle>
        </AndamioCardHeader>
        <AndamioCardContent>
          <AndamioAlert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AndamioAlertDescription>
              {error ?? "Failed to load course status"}
            </AndamioAlertDescription>
          </AndamioAlert>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  const totalAssignments = status.requiredModules.length;
  const completedCount = status.completedAssignments.length;
  const progress = totalAssignments > 0 ? (completedCount / totalAssignments) * 100 : 0;

  return (
    <AndamioCard>
      <AndamioCardHeader>
        <AndamioCardTitle>Your Progress</AndamioCardTitle>
        <AndamioCardDescription>Track your completion status for {status.course.title}</AndamioCardDescription>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Completion</span>
            <span className="text-muted-foreground">
              {completedCount} / {totalAssignments} assignments
            </span>
          </div>
          <AndamioProgress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {Math.round(progress)}% complete
          </p>
        </div>

        <AndamioSeparator />

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-4">
          {/* Enrollment Status */}
          <div className="space-y-1">
            <p className="text-sm font-medium">Enrollment</p>
            <div className="flex items-center gap-2">
              {status.isEnrolled ? (
                <>
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AndamioBadge variant="default">Enrolled</AndamioBadge>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <AndamioBadge variant="secondary">Not Enrolled</AndamioBadge>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {status.isEnrolled
                ? "You are enrolled in this course"
                : "Enrollment requires indexer integration"}
            </p>
          </div>

          {/* Awaiting Approval */}
          <div className="space-y-1">
            <p className="text-sm font-medium">Pending Review</p>
            <div className="flex items-center gap-2">
              {status.awaitingApproval ? (
                <>
                  <Clock className="h-4 w-4 text-info" />
                  <AndamioBadge variant="outline">{status.awaitingApproval}</AndamioBadge>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AndamioBadge variant="secondary">None</AndamioBadge>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {status.awaitingApproval
                ? "Assignment waiting for approval"
                : "No assignments awaiting review"}
            </p>
          </div>
        </div>

        <AndamioSeparator />

        {/* Completed Assignments */}
        {status.completedAssignments.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warning" />
              <p className="text-sm font-medium">Completed Assignments</p>
            </div>
            <div className="space-y-2">
              {status.completedAssignments.map((assignment) => (
                <div
                  key={assignment.assignmentId}
                  className="flex items-center justify-between p-2 border rounded-md bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{assignment.assignmentCode}</p>
                    <p className="text-xs text-muted-foreground">
                      Module: {assignment.moduleCode}
                    </p>
                  </div>
                  <AndamioBadge variant="default" className="text-xs">
                    {assignment.networkStatus}
                  </AndamioBadge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Required Modules */}
        {status.requiredModules.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Required Modules</p>
            <div className="space-y-1">
              {status.requiredModules.map((module) => {
                const isCompleted = status.completedAssignments.some(
                  (a) => a.assignmentId === module.id
                );
                return (
                  <div
                    key={module.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                    )}
                    <span className={isCompleted ? "line-through text-muted-foreground" : ""}>
                      {module.title}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Required modules feature requires treasury integration
            </p>
          </div>
        )}

        {/* Sync Status */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>On-chain sync status:</span>
            {status.syncSuccess ? (
              <AndamioBadge variant="outline" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Synced
              </AndamioBadge>
            ) : (
              <AndamioBadge variant="secondary" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Pending indexer
              </AndamioBadge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Full sync requires indexer integration for on-chain validation
          </p>
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
