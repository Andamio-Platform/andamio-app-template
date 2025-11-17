"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { AlertCircle, Plus, Pencil, Trash2, ArrowLeft, BookOpen } from "lucide-react";
import { type RouterOutputs } from "andamio-db-api";
import Link from "next/link";

type ModuleOutput = RouterOutputs["courseModule"]["getCourseModuleByCourseNftPolicyId"];
type SLTListOutput = RouterOutputs["slt"]["getModuleSLTs"];
type SLTOutput = RouterOutputs["slt"]["getSLT"];
type LessonListOutput = RouterOutputs["lesson"]["getModuleLessons"];

interface ApiError {
  message?: string;
}

// Combined SLT + Lesson type for management view
type CombinedSLTLesson = {
  moduleIndex: number;
  sltText: string;
  sltId: string;
  lesson?: {
    title: string | null;
    description: string | null;
    live: boolean | null;
  };
};

export default function SLTManagementPage() {
  const params = useParams();
  const courseNftPolicyId = params.coursenft as string;
  const moduleCode = params.modulecode as string;
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  const [module, setModule] = useState<ModuleOutput | null>(null);
  const [combinedData, setCombinedData] = useState<CombinedSLTLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSLT, setSelectedSLT] = useState<SLTOutput | null>(null);

  // Form states
  const [newSLTIndex, setNewSLTIndex] = useState<number>(0);
  const [newSLTText, setNewSLTText] = useState("");
  const [editSLTText, setEditSLTText] = useState("");
  const [editSLTIndex, setEditSLTIndex] = useState<number>(0);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Utility function to fetch and combine SLTs with lessons
  const fetchCombinedData = async () => {
    // Fetch SLTs for the module
    const sltsResponse = await fetch(
      `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slts/${courseNftPolicyId}/${moduleCode}`
    );

    if (!sltsResponse.ok) {
      throw new Error(`Failed to fetch SLTs: ${sltsResponse.statusText}`);
    }

    const sltsData = (await sltsResponse.json()) as SLTListOutput;

    // Fetch module lessons
    const lessonsResponse = await fetch(
      `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/${courseNftPolicyId}/modules/${moduleCode}/lessons`
    );

    if (!lessonsResponse.ok) {
      throw new Error(`Failed to fetch lessons: ${lessonsResponse.statusText}`);
    }

    const lessonsData = (await lessonsResponse.json()) as LessonListOutput;

    // Combine SLTs and Lessons
    const combined: CombinedSLTLesson[] = sltsData.map((slt) => {
      const lesson = lessonsData.find((l) => l.sltIndex === slt.moduleIndex);
      return {
        moduleIndex: slt.moduleIndex,
        sltText: slt.sltText,
        sltId: slt.id,
        lesson: lesson
          ? {
              title: lesson.title,
              description: lesson.description,
              live: lesson.live,
            }
          : undefined,
      };
    });

    setCombinedData(combined);
  };

  useEffect(() => {
    const fetchModuleAndSLTs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch course module details
        const moduleResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}`
        );

        if (!moduleResponse.ok) {
          throw new Error(`Failed to fetch course module: ${moduleResponse.statusText}`);
        }

        const moduleData = (await moduleResponse.json()) as ModuleOutput;
        setModule(moduleData);

        // Fetch combined SLT and lesson data
        await fetchCombinedData();
      } catch (err) {
        console.error("Error fetching module and SLTs:", err);
        setError(err instanceof Error ? err.message : "Failed to load module");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchModuleAndSLTs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseNftPolicyId, moduleCode]);

  const handleCreateSLT = async () => {
    if (!isAuthenticated) {
      setActionError("You must be authenticated to create SLTs");
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseNftPolicyId,
            moduleCode,
            moduleIndex: newSLTIndex,
            sltText: newSLTText,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to create SLT");
      }

      // Refresh combined data
      await fetchCombinedData();

      // Reset form and close dialog
      setNewSLTIndex(0);
      setNewSLTText("");
      setIsCreateDialogOpen(false);
    } catch (err) {
      console.error("Error creating SLT:", err);
      setActionError(err instanceof Error ? err.message : "Failed to create SLT");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSLT = async () => {
    if (!isAuthenticated || !selectedSLT) {
      setActionError("You must be authenticated to edit SLTs");
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slts/${courseNftPolicyId}/${moduleCode}/${selectedSLT.moduleIndex}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sltText: editSLTText,
            newModuleIndex: editSLTIndex !== selectedSLT.moduleIndex ? editSLTIndex : undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to update SLT");
      }

      // Refresh combined data
      await fetchCombinedData();

      // Reset and close dialog
      setSelectedSLT(null);
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error("Error updating SLT:", err);
      setActionError(err instanceof Error ? err.message : "Failed to update SLT");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSLT = async () => {
    if (!isAuthenticated || !selectedSLT) {
      setActionError("You must be authenticated to delete SLTs");
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slts/${courseNftPolicyId}/${moduleCode}/${selectedSLT.moduleIndex}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to delete SLT");
      }

      // Refresh combined data
      await fetchCombinedData();

      // Reset and close dialog
      setSelectedSLT(null);
      setIsDeleteDialogOpen(false);
    } catch (err) {
      console.error("Error deleting SLT:", err);
      setActionError(err instanceof Error ? err.message : "Failed to delete SLT");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditDialog = (slt: SLTOutput) => {
    setSelectedSLT(slt);
    setEditSLTText(slt.sltText);
    setEditSLTIndex(slt.moduleIndex);
    setActionError(null);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (slt: SLTOutput) => {
    setSelectedSLT(slt);
    setActionError(null);
    setIsDeleteDialogOpen(true);
  };

  const openCreateDialog = () => {
    // Suggest next available index
    const maxIndex = combinedData.reduce((max, item) => Math.max(max, item.moduleIndex), -1);
    setNewSLTIndex(maxIndex + 1);
    setNewSLTText("");
    setActionError(null);
    setIsCreateDialogOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !module) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Module Not Found</h1>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error ?? "Module not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/course/${courseNftPolicyId}/${moduleCode}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Module
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Manage SLTs: {module.title}</h1>
          <p className="text-muted-foreground">
            Student Learning Targets for {module.moduleCode}
          </p>
        </div>
        <Button onClick={openCreateDialog} disabled={combinedData.length >= 25}>
          <Plus className="h-4 w-4 mr-2" />
          Add SLT
        </Button>
      </div>

      {/* SLT Count Info */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Targets ({combinedData.length}/25)</CardTitle>
          <CardDescription>
            Each module can have up to 25 Student Learning Targets
          </CardDescription>
        </CardHeader>
      </Card>

      {/* SLTs Table */}
      {combinedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            No learning targets defined for this module.
          </p>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create First SLT
          </Button>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Index</TableHead>
                <TableHead>Learning Target</TableHead>
                <TableHead>Lesson</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combinedData.map((item) => (
                <TableRow key={item.moduleIndex}>
                  <TableCell className="font-mono text-xs">
                    <Badge variant="outline">{item.moduleIndex}</Badge>
                  </TableCell>
                  <TableCell className="font-medium max-w-xs">{item.sltText}</TableCell>
                  <TableCell className="max-w-sm">
                    {item.lesson ? (
                      <div>
                        <div className="font-medium">
                          <Link
                            href={`/course/${courseNftPolicyId}/${moduleCode}/${item.moduleIndex}`}
                            className="hover:underline text-primary"
                          >
                            {item.lesson.title ?? `Lesson ${item.moduleIndex}`}
                          </Link>
                        </div>
                        {item.lesson.description && (
                          <div className="text-sm text-muted-foreground truncate">
                            {item.lesson.description}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic text-sm">No lesson yet</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.lesson ? (
                      item.lesson.live ? (
                        <Badge variant="default">Live</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )
                    ) : (
                      <Badge variant="outline">No Lesson</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog({
                          id: item.sltId,
                          moduleIndex: item.moduleIndex,
                          sltText: item.sltText,
                        })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog({
                          id: item.sltId,
                          moduleIndex: item.moduleIndex,
                          sltText: item.sltText,
                        })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create SLT Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New SLT</DialogTitle>
            <DialogDescription>
              Add a new Student Learning Target to this module
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="new-slt-index">Module Index (0-25)</Label>
              <Input
                id="new-slt-index"
                type="number"
                min={0}
                max={25}
                value={newSLTIndex}
                onChange={(e) => setNewSLTIndex(parseInt(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="new-slt-text">Learning Target Text</Label>
              <Textarea
                id="new-slt-text"
                placeholder="Describe what students will learn..."
                value={newSLTText}
                onChange={(e) => setNewSLTText(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateSLT} disabled={actionLoading || !newSLTText}>
              {actionLoading ? "Creating..." : "Create SLT"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit SLT Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit SLT</DialogTitle>
            <DialogDescription>Update the learning target details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="edit-slt-index">Module Index (0-25)</Label>
              <Input
                id="edit-slt-index"
                type="number"
                min={0}
                max={25}
                value={editSLTIndex}
                onChange={(e) => setEditSLTIndex(parseInt(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="edit-slt-text">Learning Target Text</Label>
              <Textarea
                id="edit-slt-text"
                value={editSLTText}
                onChange={(e) => setEditSLTText(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSLT} disabled={actionLoading || !editSLTText}>
              {actionLoading ? "Updating..." : "Update SLT"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete SLT Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete SLT</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this learning target? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}

          {selectedSLT && (
            <div className="p-4 border rounded-md bg-muted">
              <p className="text-sm font-mono mb-2">Index: {selectedSLT.moduleIndex}</p>
              <p className="text-sm">{selectedSLT.sltText}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSLT}
              disabled={actionLoading}
            >
              {actionLoading ? "Deleting..." : "Delete SLT"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
