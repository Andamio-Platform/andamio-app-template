"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { RenderEditor } from "~/components/editor";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { AssignmentCommitment } from "~/components/learner/assignment-commitment";
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

interface Assignment {
  id: string;
  assignmentCode: string;
  title: string;
  description: string | null;
  contentJson: Record<string, unknown> | null;
  imageUrl: string | null;
  videoUrl: string | null;
  live: boolean | null;
  slts: Array<{
    id: string;
    moduleIndex: number;
    sltText: string;
  }>;
}

export default function LearnerAssignmentPage() {
  const params = useParams();
  const courseNftPolicyId = params.coursenft as string;
  const moduleCode = params.modulecode as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignments/${courseNftPolicyId}/${moduleCode}`
        );

        if (response.status === 404) {
          setError("No assignment found for this module");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch assignment");
        }

        const data = (await response.json()) as Assignment;
        setAssignment(data);
      } catch (err) {
        console.error("Error fetching assignment:", err);
        setError(err instanceof Error ? err.message : "Failed to load assignment");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAssignment();
  }, [courseNftPolicyId, moduleCode]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Error state
  if (error || !assignment) {
    return (
      <div className="space-y-6">
        <Link href={`/course/${courseNftPolicyId}/${moduleCode}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Module
          </Button>
        </Link>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error ?? "Assignment not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/course/${courseNftPolicyId}/${moduleCode}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Module
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {assignment.assignmentCode}
          </Badge>
          {assignment.live ? (
            <Badge>Live</Badge>
          ) : (
            <Badge variant="secondary">Draft</Badge>
          )}
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold">{assignment.title}</h1>
        {assignment.description && (
          <p className="text-muted-foreground mt-2">{assignment.description}</p>
        )}
      </div>

      {/* Linked SLTs */}
      {assignment.slts && assignment.slts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Learning Targets</CardTitle>
            <CardDescription>
              This assignment covers {assignment.slts.length} Student Learning Target{assignment.slts.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assignment.slts.map((slt) => (
                <div key={slt.id} className="flex items-start gap-3 p-3 border rounded-md">
                  <Badge variant="outline" className="mt-0.5">
                    {slt.moduleIndex}
                  </Badge>
                  <p className="text-sm flex-1">{slt.sltText}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignment Content */}
      {assignment.contentJson && (
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>Read the full assignment below</CardDescription>
          </CardHeader>
          <CardContent>
            <RenderEditor content={assignment.contentJson as JSONContent} />
          </CardContent>
        </Card>
      )}

      {/* Media */}
      {(assignment.imageUrl || assignment.videoUrl) && (
        <Card>
          <CardHeader>
            <CardTitle>Assignment Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignment.imageUrl && (
              <div>
                <p className="text-sm font-medium mb-2">Image</p>
                <a
                  href={assignment.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {assignment.imageUrl}
                </a>
              </div>
            )}
            {assignment.videoUrl && (
              <div>
                <p className="text-sm font-medium mb-2">Video</p>
                <a
                  href={assignment.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {assignment.videoUrl}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Assignment Commitment Component */}
      <AssignmentCommitment
        assignmentId={assignment.id}
        assignmentTitle={assignment.title}
        courseNftPolicyId={courseNftPolicyId}
        moduleCode={moduleCode}
      />
    </div>
  );
}
