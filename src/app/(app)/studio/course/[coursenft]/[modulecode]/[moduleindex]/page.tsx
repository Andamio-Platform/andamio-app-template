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
import { Switch } from "~/components/ui/switch";
import { Separator } from "~/components/ui/separator";
import { AlertCircle, ArrowLeft, Save, Trash2 } from "lucide-react";
import {
  type LessonOutput,
  type CreateLessonInput,
  type UpdateLessonInput,
  createLessonInputSchema,
  updateLessonInputSchema,
} from "andamio-db-api";
import type { JSONContent } from "@tiptap/core";

/**
 * Studio page for editing or creating lessons (Student Learning Target content)
 *
 * API Endpoints:
 * - POST /lessons (protected) - Create new lesson
 * - PATCH /lessons/{courseNftPolicyId}/{moduleCode}/{moduleIndex} (protected) - Update lesson
 * - DELETE /lessons/{courseNftPolicyId}/{moduleCode}/{moduleIndex} (protected) - Delete lesson
 * Input Validation: Uses createLessonInputSchema and updateLessonInputSchema
 * Type Reference: See API-TYPE-REFERENCE.md in andamio-db-api
 */

interface ApiError {
  message?: string;
}

export default function LessonEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseNftPolicyId = params.coursenft as string;
  const moduleCode = params.modulecode as string;
  const moduleIndex = parseInt(params.moduleindex as string);
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  const [lesson, setLesson] = useState<LessonOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonExists, setLessonExists] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [live, setLive] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize Tiptap editor
  const editor = useAndamioEditor({
    content: lesson?.contentJson as JSONContent,
  });

  // Update editor when lesson loads
  useEffect(() => {
    if (editor && lesson?.contentJson) {
      editor.commands.setContent(lesson.contentJson as JSONContent);
    }
  }, [editor, lesson]);

  useEffect(() => {
    const fetchLesson = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/lessons/${courseNftPolicyId}/${moduleCode}/${moduleIndex}`
        );

        if (response.ok) {
          const data = (await response.json()) as LessonOutput;
          setLesson(data);
          setLessonExists(true);
          setTitle(data.title ?? "");
          setDescription(data.description ?? "");
          setImageUrl(data.imageUrl ?? "");
          setVideoUrl(data.videoUrl ?? "");
          setLive(data.live ?? false);
        } else if (response.status === 404) {
          // Lesson doesn't exist yet - that's OK, we'll create it
          setLessonExists(false);
        } else {
          throw new Error(`Failed to fetch lesson: ${response.statusText}`);
        }
      } catch (err) {
        console.error("Error fetching lesson:", err);
        setError(err instanceof Error ? err.message : "Failed to load lesson");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchLesson();
  }, [courseNftPolicyId, moduleCode, moduleIndex]);

  const handleSave = async () => {
    if (!isAuthenticated) {
      setSaveError("You must be authenticated to edit lessons");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const contentJson = editor?.getJSON();

      if (lessonExists) {
        // Build input object for lesson update
        const updateInput: UpdateLessonInput = {
          courseNftPolicyId,
          moduleCode,
          moduleIndex,
          title: title || undefined,
          description: description || undefined,
          contentJson,
          imageUrl: imageUrl || undefined,
          videoUrl: videoUrl || undefined,
          live,
        };

        // Validate update input
        const updateValidation = updateLessonInputSchema.safeParse(updateInput);

        if (!updateValidation.success) {
          const errors = updateValidation.error.errors
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join(", ");
          throw new Error(`Validation failed: ${errors}`);
        }

        // Send validated update
        const response = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/lessons/${courseNftPolicyId}/${moduleCode}/${moduleIndex}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateValidation.data),
          }
        );

        if (!response.ok) {
          const errorData = (await response.json()) as ApiError;
          throw new Error(errorData.message ?? "Failed to update lesson");
        }

        // Refetch lesson
        const refetchResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/lessons/${courseNftPolicyId}/${moduleCode}/${moduleIndex}`
        );
        const data = (await refetchResponse.json()) as LessonOutput;
        setLesson(data);
      } else {
        // Build input object for lesson creation
        const createInput: CreateLessonInput = {
          courseNftPolicyId,
          moduleCode,
          moduleIndex,
          title: title || undefined,
          description: description || undefined,
          contentJson,
          imageUrl: imageUrl || undefined,
          videoUrl: videoUrl || undefined,
        };

        // Validate create input
        const createValidation = createLessonInputSchema.safeParse(createInput);

        if (!createValidation.success) {
          const errors = createValidation.error.errors
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join(", ");
          throw new Error(`Validation failed: ${errors}`);
        }

        // Send validated create
        const response = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/lessons`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(createValidation.data),
          }
        );

        if (!response.ok) {
          const errorData = (await response.json()) as ApiError;
          throw new Error(errorData.message ?? "Failed to create lesson");
        }

        // Refetch lesson
        const refetchResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/lessons/${courseNftPolicyId}/${moduleCode}/${moduleIndex}`
        );
        const data = (await refetchResponse.json()) as LessonOutput;
        setLesson(data);
        setLessonExists(true);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving lesson:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthenticated || !lessonExists) {
      return;
    }

    if (!confirm("Are you sure you want to delete this lesson? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    setSaveError(null);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/lessons/${courseNftPolicyId}/${moduleCode}/${moduleIndex}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to delete lesson");
      }

      // Redirect back to module page
      router.push(`/course/${courseNftPolicyId}/${moduleCode}`);
    } catch (err) {
      console.error("Error deleting lesson:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to delete lesson");
    } finally {
      setIsDeleting(false);
    }
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
        <Link href={`/course/${courseNftPolicyId}/${moduleCode}`}>
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
        <Link href={`/course/${courseNftPolicyId}/${moduleCode}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Module
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            SLT {moduleIndex}
          </Badge>
          <Badge variant={lessonExists ? "default" : "secondary"}>
            {lessonExists ? "Editing Lesson" : "Create New Lesson"}
          </Badge>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold">
          {lessonExists ? "Edit Lesson" : "Create Lesson"}
        </h1>
        <p className="text-muted-foreground">
          {lesson?.sltText || `Lesson for SLT ${moduleIndex}`}
        </p>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Lesson saved successfully</AlertDescription>
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
              <CardTitle>Lesson Details</CardTitle>
              <CardDescription>Basic information about the lesson</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lesson?.sltText && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Student Learning Target:</p>
                  <p className="text-sm">{lesson.sltText}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={lesson?.sltText || "Lesson title"}
                  maxLength={200}
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty to use the SLT text as the title
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Lesson description"
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

              <div className="flex items-center space-x-2">
                <Switch id="live" checked={live} onCheckedChange={setLive} />
                <Label htmlFor="live">Live (visible to students)</Label>
              </div>
            </CardContent>
          </Card>

          {/* Content Editor Card */}
          <Card>
            <CardHeader>
              <CardTitle>Lesson Content</CardTitle>
              <CardDescription>Write the lesson content using the rich text editor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editor && (
                <>
                  <AndamioFixedToolbar editor={editor} />
                  <Separator />
                  <ContentEditor editor={editor} height="500px" />
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div>
              {lessonExists && (
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete Lesson"}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/course/${courseNftPolicyId}/${moduleCode}`)}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : lessonExists ? "Save Changes" : "Create Lesson"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Read-only preview of the lesson content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {title || lesson?.sltText || `Lesson ${moduleIndex}`}
                </h2>
                {description && <p className="text-muted-foreground mt-2">{description}</p>}
              </div>

              {lesson?.sltText && (
                <div>
                  <Badge variant="secondary">Learning Target: {lesson.sltText}</Badge>
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
