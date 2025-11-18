"use client";

import React, { useEffect, useState } from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
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
      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
          <CardDescription>Loading your course progress...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error ?? "Failed to load course status"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const totalAssignments = status.requiredModules.length;
  const completedCount = status.completedAssignments.length;
  const progress = totalAssignments > 0 ? (completedCount / totalAssignments) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Progress</CardTitle>
        <CardDescription>Track your completion status for {status.course.title}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Completion</span>
            <span className="text-muted-foreground">
              {completedCount} / {totalAssignments} assignments
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {Math.round(progress)}% complete
          </p>
        </div>

        <Separator />

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-4">
          {/* Enrollment Status */}
          <div className="space-y-1">
            <p className="text-sm font-medium">Enrollment</p>
            <div className="flex items-center gap-2">
              {status.isEnrolled ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Badge variant="default">Enrolled</Badge>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <Badge variant="secondary">Not Enrolled</Badge>
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
                  <Clock className="h-4 w-4 text-blue-600" />
                  <Badge variant="outline">{status.awaitingApproval}</Badge>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Badge variant="secondary">None</Badge>
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

        <Separator />

        {/* Completed Assignments */}
        {status.completedAssignments.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-600" />
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
                  <Badge variant="default" className="text-xs">
                    {assignment.networkStatus}
                  </Badge>
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
                      <CheckCircle className="h-4 w-4 text-green-600" />
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
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Synced
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Pending indexer
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Full sync requires indexer integration for on-chain validation
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
