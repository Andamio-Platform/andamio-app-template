"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { AlertCircle, ArrowLeft, Save } from "lucide-react";
import { type RouterOutputs } from "andamio-db-api";

type ModuleOutput = RouterOutputs["courseModule"]["getCourseModuleByCourseNftPolicyId"];

const MODULE_STATUSES = [
  "DRAFT",
  "APPROVED",
  "PENDING_TX",
  "ON_CHAIN",
  "DEPRECATED",
  "BACKLOG",
  "ARCHIVED",
] as const;

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["APPROVED", "BACKLOG", "ARCHIVED", "PENDING_TX"],
  APPROVED: ["DRAFT", "PENDING_TX", "BACKLOG", "ARCHIVED"],
  PENDING_TX: ["ON_CHAIN"],
  ON_CHAIN: ["DEPRECATED"],
  DEPRECATED: [],
  BACKLOG: ["DRAFT", "ARCHIVED"],
  ARCHIVED: ["BACKLOG", "DRAFT"],
};

export default function ModuleEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseNftPolicyId = params.coursenft as string;
  const moduleCode = params.modulecode as string;
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  const [module, setModule] = useState<ModuleOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchModule = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch module: ${response.statusText}`);
        }

        const data = (await response.json()) as ModuleOutput;
        setModule(data);
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setStatus(data.status ?? "DRAFT");
      } catch (err) {
        console.error("Error fetching module:", err);
        setError(err instanceof Error ? err.message : "Failed to load module");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchModule();
  }, [courseNftPolicyId, moduleCode]);

  const handleSave = async () => {
    if (!isAuthenticated) {
      setSaveError("You must be authenticated to edit modules");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Update title and description
      const updateResponse = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseNftPolicyId,
            moduleCode,
            title,
            description,
          }),
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message ?? "Failed to update module");
      }

      // Update status if changed
      if (status !== module?.status) {
        const statusResponse = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}/status`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              courseNftPolicyId,
              moduleCode,
              status,
            }),
          }
        );

        if (!statusResponse.ok) {
          const errorData = await statusResponse.json();
          throw new Error(errorData.message ?? "Failed to update status");
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Refetch module
      const response = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}`
      );
      const data = (await response.json()) as ModuleOutput;
      setModule(data);
    } catch (err) {
      console.error("Error saving module:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const getAvailableStatuses = () => {
    if (!module?.status) return MODULE_STATUSES;
    return MODULE_STATUSES.filter(
      (s) => s === module.status || STATUS_TRANSITIONS[module.status]?.includes(s)
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (error || !module) {
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
          <AlertDescription>{error ?? "Module not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const availableStatuses = getAvailableStatuses();
  const hasChanges =
    title !== (module.title ?? "") ||
    description !== (module.description ?? "") ||
    status !== module.status;

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
        <Badge variant="outline" className="font-mono text-xs">
          {module.moduleCode}
        </Badge>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Edit Module</h1>
        <p className="text-muted-foreground">Update module details and status</p>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Module updated successfully</AlertDescription>
        </Alert>
      )}

      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Module Details</CardTitle>
          <CardDescription>Edit the module title, description, and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Module title"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Module description"
              rows={4}
            />
          </div>

          {/* Module Code (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="moduleCode">Module Code</Label>
            <Input id="moduleCode" value={module.moduleCode} disabled />
            <p className="text-sm text-muted-foreground">
              Module code cannot be changed from this page
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Current: {module.status} • Available transitions shown
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/course/${courseNftPolicyId}/${moduleCode}`)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Module Management</CardTitle>
          <CardDescription>Manage module content and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href={`/studio/course/${courseNftPolicyId}/${moduleCode}/slts`}>
            <Button variant="outline" className="w-full justify-start">
              Manage Student Learning Targets
            </Button>
          </Link>
          <Link href={`/studio/course/${courseNftPolicyId}/${moduleCode}/introduction`}>
            <Button variant="outline" className="w-full justify-start">
              Edit Module Introduction
            </Button>
          </Link>
          <Link href={`/studio/course/${courseNftPolicyId}/${moduleCode}/assignment`}>
            <Button variant="outline" className="w-full justify-start">
              Edit Module Assignment
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
