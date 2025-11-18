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
import { AlertCircle, ArrowLeft, Save } from "lucide-react";
import {
  type IntroductionOutput,
  type CreateIntroductionInput,
  type UpdateIntroductionInput,
  createIntroductionInputSchema,
  updateIntroductionInputSchema,
} from "andamio-db-api";
import type { JSONContent } from "@tiptap/core";

/**
 * Studio page for editing or creating course module introductions
 *
 * API Endpoints:
 * - POST /introductions (protected) - Create new introduction
 * - PATCH /introductions/{courseNftPolicyId}/{moduleCode} (protected) - Update introduction
 * Input Validation: Uses createIntroductionInputSchema and updateIntroductionInputSchema
 * Type Reference: See API-TYPE-REFERENCE.md in andamio-db-api
 */

interface ApiError {
  message?: string;
}

export default function IntroductionEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseNftPolicyId = params.coursenft as string;
  const moduleCode = params.modulecode as string;
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  const [introduction, setIntroduction] = useState<IntroductionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [introductionExists, setIntroductionExists] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [live, setLive] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize Tiptap editor
  const editor = useAndamioEditor({
    content: introduction?.contentJson as JSONContent,
  });

  // Update editor when introduction loads
  useEffect(() => {
    if (editor && introduction?.contentJson) {
      editor.commands.setContent(introduction.contentJson as JSONContent);
    }
  }, [editor, introduction]);

  useEffect(() => {
    const fetchIntroduction = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/introductions/${courseNftPolicyId}/${moduleCode}`
        );

        if (response.ok) {
          const data = (await response.json()) as IntroductionOutput;
          setIntroduction(data);
          setIntroductionExists(true);
          setTitle(data.title ?? "");
          setDescription(data.description ?? "");
          setImageUrl(data.imageUrl ?? "");
          setVideoUrl(data.videoUrl ?? "");
          setLive(data.live ?? false);
        } else if (response.status === 404) {
          // Introduction doesn't exist yet - that's OK, we'll create it
          setIntroductionExists(false);
        } else {
          throw new Error(`Failed to fetch introduction: ${response.statusText}`);
        }
      } catch (err) {
        console.error("Error fetching introduction:", err);
        setError(err instanceof Error ? err.message : "Failed to load introduction");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchIntroduction();
  }, [courseNftPolicyId, moduleCode]);

  const handleSave = async () => {
    if (!isAuthenticated) {
      setSaveError("You must be authenticated to edit introductions");
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

      if (introductionExists) {
        // Build input object for introduction update
        const updateInput: UpdateIntroductionInput = {
          courseNftPolicyId,
          moduleCode,
          title,
          description: description || undefined,
          contentJson,
          imageUrl: imageUrl || undefined,
          videoUrl: videoUrl || undefined,
          live,
        };

        // Validate update input
        const updateValidation = updateIntroductionInputSchema.safeParse(updateInput);

        if (!updateValidation.success) {
          const errors = updateValidation.error.errors
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join(", ");
          throw new Error(`Validation failed: ${errors}`);
        }

        // Send validated update
        const response = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/introductions/${courseNftPolicyId}/${moduleCode}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateValidation.data),
          }
        );

        if (!response.ok) {
          const errorData = (await response.json()) as ApiError;
          throw new Error(errorData.message ?? "Failed to update introduction");
        }

        const data = (await response.json()) as IntroductionOutput;
        setIntroduction(data);
      } else {
        // Build input object for introduction creation
        const createInput: CreateIntroductionInput = {
          courseNftPolicyId,
          moduleCode,
          title,
          description: description || undefined,
          contentJson,
          imageUrl: imageUrl || undefined,
          videoUrl: videoUrl || undefined,
        };

        // Validate create input
        const createValidation = createIntroductionInputSchema.safeParse(createInput);

        if (!createValidation.success) {
          const errors = createValidation.error.errors
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join(", ");
          throw new Error(`Validation failed: ${errors}`);
        }

        // Send validated create
        const response = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/introductions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(createValidation.data),
          }
        );

        if (!response.ok) {
          const errorData = (await response.json()) as ApiError;
          throw new Error(errorData.message ?? "Failed to create introduction");
        }

        const data = (await response.json()) as IntroductionOutput;
        setIntroduction(data);
        setIntroductionExists(true);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving introduction:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
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

  // Error state (only show error if it's not a 404)
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
        <Badge variant={introductionExists ? "default" : "secondary"}>
          {introductionExists ? "Editing Introduction" : "Create New Introduction"}
        </Badge>
      </div>

      <div>
        <h1 className="text-3xl font-bold">
          {introductionExists ? "Edit Module Introduction" : "Create Module Introduction"}
        </h1>
        <p className="text-muted-foreground">
          The introduction provides an overview of the module for students
        </p>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Introduction saved successfully</AlertDescription>
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
              <CardTitle>Introduction Details</CardTitle>
              <CardDescription>Basic information about the module introduction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Module introduction title"
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the introduction"
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
              <CardTitle>Introduction Content</CardTitle>
              <CardDescription>
                Write the module introduction using the rich text editor
              </CardDescription>
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
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/studio/course/${courseNftPolicyId}/${moduleCode}`)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving
                ? "Saving..."
                : introductionExists
                  ? "Save Changes"
                  : "Create Introduction"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Read-only preview of the introduction content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{title || "Module Introduction"}</h2>
                {description && <p className="text-muted-foreground mt-2">{description}</p>}
              </div>

              <Separator />

              {editor && <RenderEditor content={editor.getJSON()} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Module Introductions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            The module introduction provides students with an overview of what they&apos;ll learn in
            this module.
          </p>
          <p>
            Use it to set expectations, explain the module structure, and motivate students about
            the content they&apos;re about to explore.
          </p>
          <p className="font-medium text-foreground">
            Note: Introductions cannot be deleted, only updated.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
