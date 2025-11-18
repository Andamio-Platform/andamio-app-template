"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import {
  useAndamioEditor,
  ContentEditor,
  AndamioFixedToolbar,
  RenderEditor,
} from "~/components/editor";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Checkbox } from "~/components/ui/checkbox";
import { Switch } from "~/components/ui/switch";
import { Separator } from "~/components/ui/separator";
import { AlertCircle, ArrowLeft, Save, Trash2 } from "lucide-react";
import {
  type AssignmentWithSLTsOutput,
  type ListSLTsOutput,
  type CreateAssignmentInput,
  type UpdateAssignmentInput,
  createAssignmentInputSchema,
  updateAssignmentInputSchema,
} from "andamio-db-api";
import type { JSONContent } from "@tiptap/core";

/**
 * Studio page for editing or creating course module assignments
 *
 * API Endpoints:
 * - POST /assignments (protected) - Create new assignment
 * - PATCH /assignments/{courseNftPolicyId}/{moduleCode} (protected) - Update assignment
 * - DELETE /assignments/{courseNftPolicyId}/{moduleCode} (protected) - Delete assignment
 * Input Validation: Uses createAssignmentInputSchema and updateAssignmentInputSchema
 * Type Reference: See API-TYPE-REFERENCE.md in andamio-db-api
 */

interface ApiError {
  message?: string;
}

export default function AssignmentEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseNftPolicyId = params.coursenft as string;
  const moduleCode = params.modulecode as string;
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  const [assignment, setAssignment] = useState<AssignmentWithSLTsOutput | null>(null);
  const [slts, setSlts] = useState<ListSLTsOutput>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignmentExists, setAssignmentExists] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [live, setLive] = useState(false);
  const [selectedSltIds, setSelectedSltIds] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize Tiptap editor
  const editor = useAndamioEditor({
    content: assignment?.contentJson as JSONContent,
  });

  // Update editor when assignment loads
  useEffect(() => {
    if (editor && assignment?.contentJson) {
      editor.commands.setContent(assignment.contentJson as JSONContent);
    }
  }, [editor, assignment]);

  useEffect(() => {
    const fetchAssignmentAndSLTs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch SLTs first (always available)
        const sltsResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slts/${courseNftPolicyId}/${moduleCode}`
        );

        if (!sltsResponse.ok) {
          throw new Error(`Failed to fetch SLTs: ${sltsResponse.statusText}`);
        }

        const sltsData = (await sltsResponse.json()) as ListSLTsOutput;
        setSlts(sltsData);

        // Try to fetch assignment (may not exist yet)
        try {
          const assignmentResponse = await fetch(
            `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignments/${courseNftPolicyId}/${moduleCode}`
          );

          if (assignmentResponse.ok) {
            const data = (await assignmentResponse.json()) as AssignmentWithSLTsOutput;
            setAssignment(data);
            setAssignmentExists(true);
            setTitle(data.title ?? "");
            setDescription(data.description ?? "");
            setImageUrl(data.imageUrl ?? "");
            setVideoUrl(data.videoUrl ?? "");
            setLive(data.live ?? false);
            setSelectedSltIds(data.slts.map((s) => s.id));
          } else if (assignmentResponse.status === 404) {
            // Assignment doesn't exist yet - that's OK
            setAssignmentExists(false);
          } else {
            throw new Error(`Failed to fetch assignment: ${assignmentResponse.statusText}`);
          }
        } catch {
          console.warn("Assignment not found, will create new one");
          setAssignmentExists(false);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAssignmentAndSLTs();
  }, [courseNftPolicyId, moduleCode]);

  const handleSave = async () => {
    if (!isAuthenticated) {
      setSaveError("You must be authenticated to edit assignments");
      return;
    }

    if (!title.trim()) {
      setSaveError("Title is required");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const contentJson = editor?.getJSON();

      if (assignmentExists) {
        // Build input object for assignment update
        const updateInput: UpdateAssignmentInput = {
          courseNftPolicyId,
          moduleCode,
          title,
          description,
          contentJson,
          imageUrl: imageUrl || undefined,
          videoUrl: videoUrl || undefined,
          live,
          sltIds: selectedSltIds,
        };

        // Validate update input
        const updateValidation = updateAssignmentInputSchema.safeParse(updateInput);

        if (!updateValidation.success) {
          const errors = updateValidation.error.errors
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join(", ");
          throw new Error(`Validation failed: ${errors}`);
        }

        // Send validated update
        const response = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignments/${courseNftPolicyId}/${moduleCode}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateValidation.data),
          }
        );

        if (!response.ok) {
          const errorData = (await response.json()) as ApiError;
          throw new Error(errorData.message ?? "Failed to update assignment");
        }

        const data = (await response.json()) as AssignmentWithSLTsOutput;
        setAssignment(data);
      } else {
        // Build input object for assignment creation
        const assignmentCode = `${moduleCode}-ASSIGNMENT`;
        const createInput: CreateAssignmentInput = {
          courseNftPolicyId,
          moduleCode,
          assignmentCode,
          title,
          description,
          contentJson,
          imageUrl: imageUrl || undefined,
          videoUrl: videoUrl || undefined,
          sltIds: selectedSltIds,
        };

        // Validate create input
        const createValidation = createAssignmentInputSchema.safeParse(createInput);

        if (!createValidation.success) {
          const errors = createValidation.error.errors
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join(", ");
          throw new Error(`Validation failed: ${errors}`);
        }

        // Send validated create
        const response = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(createValidation.data),
          }
        );

        if (!response.ok) {
          const errorData = (await response.json()) as ApiError;
          throw new Error(errorData.message ?? "Failed to create assignment");
        }

        const data = (await response.json()) as AssignmentWithSLTsOutput;
        setAssignment(data);
        setAssignmentExists(true);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving assignment:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthenticated || !assignmentExists) {
      return;
    }

    if (!confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    setSaveError(null);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignments/${courseNftPolicyId}/${moduleCode}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to delete assignment");
      }

      // Redirect to module page after successful deletion
      router.push(`/studio/course/${courseNftPolicyId}/${moduleCode}`);
    } catch (err) {
      console.error("Error deleting assignment:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to delete assignment");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!isAuthenticated || !assignmentExists) {
      return;
    }

    setIsTogglingPublish(true);
    setSaveError(null);

    try {
      const newLiveStatus = !live;
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignments/${courseNftPolicyId}/${moduleCode}/publish`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ live: newLiveStatus }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to toggle publish status");
      }

      const data = (await response.json()) as { success: boolean; live: boolean };
      setLive(data.live);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Error toggling publish status:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to toggle publish status");
    } finally {
      setIsTogglingPublish(false);
    }
  };

  const toggleSlt = (sltId: string) => {
    setSelectedSltIds((prev) =>
      prev.includes(sltId) ? prev.filter((id) => id !== sltId) : [...prev, sltId]
    );
  };

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
  if (error) {
    return (
      <div className="space-y-6">
        <Link href={`/studio/course/${courseNftPolicyId}/${moduleCode}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Module
          </Button>
        </Link>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/studio/course/${courseNftPolicyId}/${moduleCode}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Module
          </Button>
        </Link>
        <Badge variant={assignmentExists ? "default" : "secondary"}>
          {assignmentExists ? "Editing Assignment" : "Create New Assignment"}
        </Badge>
      </div>

      <div>
        <h1 className="text-3xl font-bold">
          {assignmentExists ? "Edit Assignment" : "Create Assignment"}
        </h1>
        <p className="text-muted-foreground">Manage the module assignment and linked SLTs</p>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Assignment saved successfully</AlertDescription>
        </Alert>
      )}

      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="edit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-6">
          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
              <CardDescription>Basic information about the assignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Assignment title"
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Assignment description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input
                    id="videoUrl"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch id="live" checked={live} onCheckedChange={setLive} />
                  <Label htmlFor="live">Live (visible to students)</Label>
                </div>
                {assignmentExists && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTogglePublish}
                    disabled={isTogglingPublish}
                  >
                    {isTogglingPublish ? "Toggling..." : live ? "Unpublish" : "Publish"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SLT Selection Card */}
          <Card>
            <CardHeader>
              <CardTitle>Linked Student Learning Targets</CardTitle>
              <CardDescription>
                Select which SLTs this assignment covers ({selectedSltIds.length} selected)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No SLTs available. Create SLTs first to link them to this assignment.
                </p>
              ) : (
                <div className="space-y-2">
                  {slts.map((slt: { id: string; moduleIndex: number; sltText: string }) => (
                    <div key={slt.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`slt-${slt.id}`}
                        checked={selectedSltIds.includes(slt.id)}
                        onCheckedChange={() => toggleSlt(slt.id)}
                      />
                      <label
                        htmlFor={`slt-${slt.id}`}
                        className="text-sm cursor-pointer leading-tight"
                      >
                        <Badge variant="outline" className="mr-2 font-mono text-xs">
                          {slt.moduleIndex}
                        </Badge>
                        {slt.sltText}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Editor Card */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Content</CardTitle>
              <CardDescription>Write the assignment instructions and details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editor && (
                <>
                  <AndamioFixedToolbar editor={editor} />
                  <Separator />
                  <ContentEditor editor={editor} height="400px" />
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div>
              {assignmentExists && (
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete Assignment"}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/studio/course/${courseNftPolicyId}/${moduleCode}`)}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : assignmentExists ? "Save Changes" : "Create Assignment"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Read-only preview of the assignment content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{title || "Untitled Assignment"}</h2>
                {description && <p className="text-muted-foreground mt-2">{description}</p>}
              </div>

              {selectedSltIds.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Covers Learning Targets:</h3>
                  <div className="flex flex-wrap gap-2">
                    {slts
                      .filter((slt: { id: string; moduleIndex: number; sltText: string }) => selectedSltIds.includes(slt.id))
                      .map((slt: { id: string; moduleIndex: number; sltText: string }) => (
                        <Badge key={slt.id} variant="secondary">
                          {slt.moduleIndex}: {slt.sltText}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              <Separator />

              {editor && <RenderEditor content={editor.getJSON()} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
