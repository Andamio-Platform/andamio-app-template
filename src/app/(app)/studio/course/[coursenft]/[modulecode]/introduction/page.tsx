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
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioTextarea } from "~/components/andamio/andamio-textarea";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioTabs, AndamioTabsContent, AndamioTabsList, AndamioTabsTrigger } from "~/components/andamio/andamio-tabs";
import { AndamioSwitch } from "~/components/andamio/andamio-switch";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { AlertCircle, ArrowLeft, Save } from "lucide-react";
import {
  type IntroductionOutput,
  type CreateIntroductionInput,
  type UpdateIntroductionInput,
  createIntroductionInputSchema,
  updateIntroductionInputSchema,
} from "@andamio/db-api";
import type { JSONContent } from "@tiptap/core";

/**
 * Studio page for editing or creating course module introductions
 *
 * API Endpoints:
 * - POST /introductions (protected) - Create new introduction
 * - PATCH /introductions/{courseNftPolicyId}/{moduleCode} (protected) - Update introduction
 * Input Validation: Uses createIntroductionInputSchema and updateIntroductionInputSchema
 * Type Reference: See API-TYPE-REFERENCE.md in @andamio/db-api
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
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);
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

  const handleTogglePublish = async () => {
    if (!isAuthenticated || !introductionExists) {
      return;
    }

    setIsTogglingPublish(true);
    setSaveError(null);

    try {
      const newLiveStatus = !live;
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/introductions/${courseNftPolicyId}/${moduleCode}/publish`,
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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <AndamioSkeleton className="h-8 w-32" />
        <AndamioSkeleton className="h-96 w-full" />
      </div>
    );
  }

  // Error state (only show error if it's not a 404)
  if (error) {
    return (
      <div className="space-y-6">
        <Link href={`/studio/course/${courseNftPolicyId}/${moduleCode}`}>
          <AndamioButton variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Module
          </AndamioButton>
        </Link>

        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{error}</AndamioAlertDescription>
        </AndamioAlert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/studio/course/${courseNftPolicyId}/${moduleCode}`}>
          <AndamioButton variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Module
          </AndamioButton>
        </Link>
        <AndamioBadge variant={introductionExists ? "default" : "secondary"}>
          {introductionExists ? "Editing Introduction" : "Create New Introduction"}
        </AndamioBadge>
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
        <AndamioAlert>
          <AndamioAlertTitle>Success</AndamioAlertTitle>
          <AndamioAlertDescription>Introduction saved successfully</AndamioAlertDescription>
        </AndamioAlert>
      )}

      {saveError && (
        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{saveError}</AndamioAlertDescription>
        </AndamioAlert>
      )}

      {/* Main Content Tabs */}
      <AndamioTabs defaultValue="edit" className="space-y-4">
        <AndamioTabsList>
          <AndamioTabsTrigger value="edit">Edit</AndamioTabsTrigger>
          <AndamioTabsTrigger value="preview">Preview</AndamioTabsTrigger>
        </AndamioTabsList>

        <AndamioTabsContent value="edit" className="space-y-6">
          {/* Metadata Card */}
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle>Introduction Details</AndamioCardTitle>
              <AndamioCardDescription>Basic information about the module introduction</AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
              <div className="space-y-2">
                <AndamioLabel htmlFor="title">Title *</AndamioLabel>
                <AndamioInput
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Module introduction title"
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <AndamioLabel htmlFor="description">Description</AndamioLabel>
                <AndamioTextarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the introduction"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <AndamioLabel htmlFor="imageUrl">Image URL</AndamioLabel>
                  <AndamioInput
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <AndamioLabel htmlFor="videoUrl">Video URL</AndamioLabel>
                  <AndamioInput
                    id="videoUrl"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AndamioSwitch id="live" checked={live} onCheckedChange={setLive} />
                  <AndamioLabel htmlFor="live">Live (visible to students)</AndamioLabel>
                </div>
                {introductionExists && (
                  <AndamioButton
                    variant="outline"
                    size="sm"
                    onClick={handleTogglePublish}
                    disabled={isTogglingPublish}
                  >
                    {isTogglingPublish ? "Toggling..." : live ? "Unpublish" : "Publish"}
                  </AndamioButton>
                )}
              </div>
            </AndamioCardContent>
          </AndamioCard>

          {/* Content Editor Card */}
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle>Introduction Content</AndamioCardTitle>
              <AndamioCardDescription>
                Write the module introduction using the rich text editor
              </AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
              {editor && (
                <>
                  <AndamioFixedToolbar editor={editor} />
                  <AndamioSeparator />
                  <ContentEditor editor={editor} height="500px" />
                </>
              )}
            </AndamioCardContent>
          </AndamioCard>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <AndamioButton
              variant="outline"
              onClick={() => router.push(`/studio/course/${courseNftPolicyId}/${moduleCode}`)}
            >
              Cancel
            </AndamioButton>
            <AndamioButton onClick={handleSave} disabled={isSaving || !title.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving
                ? "Saving..."
                : introductionExists
                  ? "Save Changes"
                  : "Create Introduction"}
            </AndamioButton>
          </div>
        </AndamioTabsContent>

        <AndamioTabsContent value="preview">
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle>Preview</AndamioCardTitle>
              <AndamioCardDescription>Read-only preview of the introduction content</AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{title || "Module Introduction"}</h2>
                {description && <p className="text-muted-foreground mt-2">{description}</p>}
              </div>

              <AndamioSeparator />

              {editor && <RenderEditor content={editor.getJSON()} />}
            </AndamioCardContent>
          </AndamioCard>
        </AndamioTabsContent>
      </AndamioTabs>

      {/* Info Card */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>About Module Introductions</AndamioCardTitle>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-2 text-sm text-muted-foreground">
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
        </AndamioCardContent>
      </AndamioCard>
    </div>
  );
}
