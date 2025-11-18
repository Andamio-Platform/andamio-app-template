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
import { AlertCircle, ArrowLeft, Edit2, Save, Trash2, Upload } from "lucide-react";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  type CourseModuleOutput,
  type UpdateCourseModuleInput,
  type UpdateModuleStatusInput,
  updateCourseModuleInputSchema,
  updateModuleStatusInputSchema,
} from "andamio-db-api";

/**
 * Studio page for editing course module details and status
 *
 * API Endpoints:
 * - PATCH /course-modules/{courseNftPolicyId}/{moduleCode} (protected)
 * - PATCH /course-modules/{courseNftPolicyId}/{moduleCode}/status (protected)
 * - PATCH /course-modules/{courseNftPolicyId}/{moduleCode}/code (protected) - Rename module code
 * - PATCH /course-modules/{courseNftPolicyId}/{moduleCode}/pending-tx (protected) - Set pending transaction
 * - POST /course-modules/{courseNftPolicyId}/{moduleCode}/publish (protected) - Publish all module content
 * Input Validation: Uses updateCourseModuleInputSchema and updateModuleStatusInputSchema
 * Type Reference: See API-TYPE-REFERENCE.md in andamio-db-api
 */

interface ApiError {
  message?: string;
}

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

  const [module, setModule] = useState<CourseModuleOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  // Rename dialog state
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newModuleCode, setNewModuleCode] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  // Pending transaction state
  const [isPendingTxDialogOpen, setIsPendingTxDialogOpen] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState("");
  const [isSettingPendingTx, setIsSettingPendingTx] = useState(false);
  const [pendingTxError, setPendingTxError] = useState<string | null>(null);

  // Publish content state
  const [isPublishing, setIsPublishing] = useState(false);

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

        const data = (await response.json()) as CourseModuleOutput;
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
      // Build input object for module update
      const updateInput: UpdateCourseModuleInput = {
        courseNftPolicyId,
        moduleCode,
        title,
        description,
      };

      // Validate module update input
      const updateValidation = updateCourseModuleInputSchema.safeParse(updateInput);

      if (!updateValidation.success) {
        const errors = updateValidation.error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        throw new Error(`Validation failed: ${errors}`);
      }

      // Send validated module update
      const updateResponse = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateValidation.data),
        }
      );

      if (!updateResponse.ok) {
        const errorData = (await updateResponse.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to update module");
      }

      // Update status if changed
      if (status !== module?.status) {
        // Build input object for status update
        const statusInput: UpdateModuleStatusInput = {
          courseNftPolicyId,
          moduleCode,
          status: status as UpdateModuleStatusInput["status"],
        };

        // Validate status update input
        const statusValidation = updateModuleStatusInputSchema.safeParse(statusInput);

        if (!statusValidation.success) {
          const errors = statusValidation.error.errors
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join(", ");
          throw new Error(`Status validation failed: ${errors}`);
        }

        // Send validated status update
        const statusResponse = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}/status`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(statusValidation.data),
          }
        );

        if (!statusResponse.ok) {
          const errorData = (await statusResponse.json()) as ApiError;
          throw new Error(errorData.message ?? "Failed to update status");
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Refetch module
      const response = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}`
      );
      const data = (await response.json()) as CourseModuleOutput;
      setModule(data);
    } catch (err) {
      console.error("Error saving module:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthenticated || !module) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to delete module");
      }

      // Redirect to course edit page
      router.push(`/studio/course/${courseNftPolicyId}`);
    } catch (err) {
      console.error("Error deleting module:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to delete module");
    } finally {
      setIsDeleting(false);
    }
  };

  const getAvailableStatuses = () => {
    if (!module?.status) return MODULE_STATUSES;
    return MODULE_STATUSES.filter(
      (s) => s === module.status || STATUS_TRANSITIONS[module.status]?.includes(s)
    );
  };

  const handleRenameModule = async () => {
    if (!newModuleCode.trim()) {
      setRenameError("Module code cannot be empty");
      return;
    }

    if (newModuleCode === moduleCode) {
      setRenameError("New module code must be different");
      return;
    }

    setIsRenaming(true);
    setRenameError(null);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}/code`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseNftPolicyId,
            moduleCode,
            newModuleCode: newModuleCode.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to rename module");
      }

      // Redirect to the new module code URL
      router.push(`/studio/course/${courseNftPolicyId}/${newModuleCode.trim()}`);
    } catch (err) {
      console.error("Error renaming module:", err);
      setRenameError(err instanceof Error ? err.message : "Failed to rename module");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleSetPendingTx = async () => {
    if (!pendingTxHash.trim()) {
      setPendingTxError("Transaction hash cannot be empty");
      return;
    }

    setIsSettingPendingTx(true);
    setPendingTxError(null);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}/pending-tx`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseNftPolicyId,
            moduleCode,
            pendingTxHash: pendingTxHash.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to set pending transaction");
      }

      const updatedModule = (await response.json()) as CourseModuleOutput;
      setModule(updatedModule);
      setIsPendingTxDialogOpen(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error setting pending transaction:", err);
      setPendingTxError(err instanceof Error ? err.message : "Failed to set pending transaction");
    } finally {
      setIsSettingPendingTx(false);
    }
  };

  const handlePublishAllContent = async () => {
    setIsPublishing(true);
    setSaveError(null);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseNftPolicyId,
            moduleCode,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to publish content");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error publishing content:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to publish content");
    } finally {
      setIsPublishing(false);
    }
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

          {/* Module Code with Rename */}
          <div className="space-y-2">
            <Label htmlFor="moduleCode">Module Code</Label>
            <div className="flex gap-2">
              <Input id="moduleCode" value={module.moduleCode} disabled className="flex-1" />
              <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewModuleCode(module.moduleCode);
                      setRenameError(null);
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Rename
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rename Module Code</DialogTitle>
                    <DialogDescription>
                      Enter a new code for this module. This will update the module identifier.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-module-code">New Module Code</Label>
                      <Input
                        id="new-module-code"
                        value={newModuleCode}
                        onChange={(e) => setNewModuleCode(e.target.value)}
                        placeholder="e.g., module-102"
                        maxLength={50}
                        disabled={isRenaming}
                      />
                      <p className="text-xs text-muted-foreground">
                        Current: <code className="font-mono">{module.moduleCode}</code>
                      </p>
                    </div>
                    {renameError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{renameError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsRenameDialogOpen(false)}
                      disabled={isRenaming}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleRenameModule} disabled={isRenaming}>
                      {isRenaming ? "Renaming..." : "Rename Module"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-sm text-muted-foreground">
              Use the rename button to change the module code identifier
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

          {/* Pending Transaction */}
          <div className="space-y-2">
            <Label>Pending Transaction</Label>
            {module.pendingTxHash ? (
              <div className="flex gap-2">
                <Input
                  value={module.pendingTxHash}
                  disabled
                  className="flex-1 font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a
                    href={`https://cardanoscan.io/transaction/${module.pendingTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Explorer
                  </a>
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value="No pending transaction"
                  disabled
                  className="flex-1"
                />
                {module.status === "DRAFT" && (
                  <Dialog open={isPendingTxDialogOpen} onOpenChange={setIsPendingTxDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPendingTxHash("");
                          setPendingTxError(null);
                        }}
                      >
                        Set Transaction
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Set Pending Transaction</DialogTitle>
                        <DialogDescription>
                          Enter the transaction hash for the on-chain operation related to this module.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="pending-tx-hash">Transaction Hash</Label>
                          <Input
                            id="pending-tx-hash"
                            value={pendingTxHash}
                            onChange={(e) => setPendingTxHash(e.target.value)}
                            placeholder="Enter Cardano transaction hash"
                            className="font-mono text-xs"
                            disabled={isSettingPendingTx}
                          />
                        </div>
                        {pendingTxError && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{pendingTxError}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsPendingTxDialogOpen(false)}
                          disabled={isSettingPendingTx}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSetPendingTx} disabled={isSettingPendingTx}>
                          {isSettingPendingTx ? "Setting..." : "Set Transaction"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {module.status === "DRAFT"
                ? "Track on-chain transactions for this module (DRAFT only)"
                : "Pending transactions can only be set for DRAFT modules"}
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

          {/* Danger Zone */}
          <div className="border-t pt-4 mt-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete this module and all its lessons, SLTs, and assignments.
              </p>
              <ConfirmDialog
                trigger={
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Module
                  </Button>
                }
                title="Delete Module"
                description={`Are you sure you want to delete "${module.title}"? This action cannot be undone. All lessons, SLTs, introduction, and assignments will be permanently removed.`}
                confirmText="Delete Module"
                variant="destructive"
                onConfirm={handleDelete}
                isLoading={isDeleting}
              />
            </div>
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

          {/* Publish Content */}
          <div className="border-t pt-4 mt-4">
            <ConfirmDialog
              trigger={
                <Button
                  variant="default"
                  className="w-full justify-start"
                  disabled={isPublishing}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isPublishing ? "Publishing..." : "Publish All Content"}
                </Button>
              }
              title="Publish All Module Content"
              description={`This will make all content (lessons, introduction, and assignments) for "${module.title}" live and visible to learners. Are you sure you want to continue?`}
              confirmText="Publish Content"
              onConfirm={handlePublishAllContent}
              isLoading={isPublishing}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Sets all lessons, introduction, and assignments to live status
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
