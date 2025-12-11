"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioTextarea } from "~/components/andamio/andamio-textarea";
import { AndamioCard, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import {
  AndamioDialog,
  AndamioDialogContent,
  AndamioDialogDescription,
  AndamioDialogFooter,
  AndamioDialogHeader,
  AndamioDialogTitle,
} from "~/components/andamio/andamio-dialog";
import { AlertCircle, Plus, Pencil, Trash2, BookOpen, GripVertical, Save, X, Search } from "lucide-react";
import { HybridSLTStatus } from "~/components/courses/hybrid-slt-status";
import {
  type CourseModuleOutput,
  type CourseOutput,
  type SLTOutput,
  type ListSLTsOutput,
  type ListLessonsOutput,
  type CreateSLTInput,
  type UpdateSLTInput,
  type BatchUpdateSLTIndexesInput,
  createSLTInputSchema,
  updateSLTInputSchema,
  batchUpdateSLTIndexesInputSchema,
} from "@andamio/db-api";
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AndamioPageHeader, AndamioTableContainer } from "~/components/andamio";

/**
 * Studio page for managing Student Learning Targets (SLTs)
 *
 * API Endpoints:
 * - GET /slts/{courseNftPolicyId}/{moduleCode}/{moduleIndex} (public) - Get single SLT
 * - POST /slts (protected) - Create new SLT
 * - PATCH /slts/{courseNftPolicyId}/{moduleCode}/{moduleIndex} (protected) - Update SLT
 * - DELETE /slts/{courseNftPolicyId}/{moduleCode}/{moduleIndex} (protected) - Delete SLT
 * - PATCH /slts/batch-update-indexes (protected) - Batch update SLT indexes
 * Input Validation: Uses createSLTInputSchema, updateSLTInputSchema, batchUpdateSLTIndexesInputSchema
 * Type Reference: See API-TYPE-REFERENCE.md in @andamio/db-api
 */

interface ApiError {
  message?: string;
}

// Combined SLT + Lesson type for management view
type CombinedSLTLesson = {
  module_index: number;
  slt_text: string;
  slt_id: string;
  lesson?: {
    title: string | null;
    description: string | null;
    live: boolean | null;
  };
};

// Sortable row component
function SortableSLTRow({
  item,
  courseNftPolicyId,
  moduleCode,
  isReorderMode,
  onEdit,
  onDelete,
}: {
  item: CombinedSLTLesson;
  courseNftPolicyId: string;
  moduleCode: string;
  isReorderMode: boolean;
  onEdit: (slt: SLTOutput) => void;
  onDelete: (slt: SLTOutput) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.slt_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <AndamioTableRow ref={setNodeRef} style={style}>
      {isReorderMode && (
        <AndamioTableCell className="w-12">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
        </AndamioTableCell>
      )}
      <AndamioTableCell className="font-mono text-xs">
        <AndamioBadge variant="outline">{item.module_index}</AndamioBadge>
      </AndamioTableCell>
      <AndamioTableCell className="font-medium">{item.slt_text}</AndamioTableCell>
      <AndamioTableCell>
        {item.lesson ? (
          <div>
            <div className="font-medium">
              <Link
                href={`/studio/course/${courseNftPolicyId}/${moduleCode}/${item.module_index}`}
                className="hover:underline text-primary"
              >
                {item.lesson.title ?? `Lesson ${item.module_index}`}
              </Link>
            </div>
            {item.lesson.description && (
              <div className="text-sm text-muted-foreground">
                {item.lesson.description}
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground italic text-sm">No lesson yet</span>
        )}
      </AndamioTableCell>
      <AndamioTableCell>
        {item.lesson ? (
          item.lesson.live ? (
            <AndamioBadge variant="default">Live</AndamioBadge>
          ) : (
            <AndamioBadge variant="secondary">Draft</AndamioBadge>
          )
        ) : (
          <AndamioBadge variant="outline">No Lesson</AndamioBadge>
        )}
      </AndamioTableCell>
      {!isReorderMode && (
        <AndamioTableCell className="text-right">
          <div className="flex justify-end gap-2">
            <AndamioButton
              variant="ghost"
              size="sm"
              onClick={() => onEdit({
                id: item.slt_id,
                module_index: item.module_index,
                slt_text: item.slt_text,
              })}
            >
              <Pencil className="h-4 w-4" />
            </AndamioButton>
            <AndamioButton
              variant="ghost"
              size="sm"
              onClick={() => onDelete({
                id: item.slt_id,
                module_index: item.module_index,
                slt_text: item.slt_text,
              })}
            >
              <Trash2 className="h-4 w-4" />
            </AndamioButton>
          </div>
        </AndamioTableCell>
      )}
    </AndamioTableRow>
  );
}

export default function SLTManagementPage() {
  const params = useParams();
  const courseNftPolicyId = params.coursenft as string;
  const moduleCode = params.modulecode as string;
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  const [course, setCourse] = useState<CourseOutput | null>(null);
  const [courseModule, setCourseModule] = useState<CourseModuleOutput | null>(null);
  const [combinedData, setCombinedData] = useState<CombinedSLTLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reorder mode
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderedData, setReorderedData] = useState<CombinedSLTLesson[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

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

  // Quick jump dialog
  const [isJumpDialogOpen, setIsJumpDialogOpen] = useState(false);
  const [jumpToIndex, setJumpToIndex] = useState<string>("");
  const [isJumping, setIsJumping] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Utility function to fetch and combine SLTs with lessons
  const fetchCombinedData = async () => {
    // Fetch SLTs for the module (POST /slts/list)
    const sltsResponse = await fetch(
      `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slts/list`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_nft_policy_id: courseNftPolicyId,
          module_code: moduleCode,
        }),
      }
    );

    if (!sltsResponse.ok) {
      throw new Error(`Failed to fetch SLTs: ${sltsResponse.statusText}`);
    }

    const sltsData = (await sltsResponse.json()) as ListSLTsOutput;

    // Fetch module lessons (POST /lessons/list)
    const lessonsResponse = await fetch(
      `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/lessons/list`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_nft_policy_id: courseNftPolicyId,
          module_code: moduleCode,
        }),
      }
    );

    if (!lessonsResponse.ok) {
      throw new Error(`Failed to fetch lessons: ${lessonsResponse.statusText}`);
    }

    const lessonsData = (await lessonsResponse.json()) as ListLessonsOutput;

    // Combine SLTs and Lessons
    const combined: CombinedSLTLesson[] = sltsData.map((slt) => {
      const lesson = lessonsData.find((l) => l.slt_index === slt.module_index);
      return {
        module_index: slt.module_index,
        slt_text: slt.slt_text,
        slt_id: slt.id,
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
    setReorderedData(combined);
  };

  useEffect(() => {
    const fetchModuleAndSLTs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch course details for breadcrumb (POST /courses/get)
        const courseResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/get`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
          }
        );

        if (courseResponse.ok) {
          const courseData = (await courseResponse.json()) as CourseOutput;
          setCourse(courseData);
        }

        // Fetch course module details (POST /course-modules/get)
        const moduleResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/get`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              course_nft_policy_id: courseNftPolicyId,
              module_code: moduleCode,
            }),
          }
        );

        if (!moduleResponse.ok) {
          throw new Error(`Failed to fetch course module: ${moduleResponse.statusText}`);
        }

        const moduleData = (await moduleResponse.json()) as CourseModuleOutput;
        setCourseModule(moduleData);

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setReorderedData((items) => {
        const oldIndex = items.findIndex((item) => item.slt_id === active.id);
        const newIndex = items.findIndex((item) => item.slt_id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveOrder = async () => {
    if (!isAuthenticated) {
      setActionError("You must be authenticated to reorder SLTs");
      return;
    }

    setIsSavingOrder(true);
    setActionError(null);

    try {
      // Build the updates array mapping each SLT to its new index (starting from 1)
      const updates = reorderedData.map((item, index) => ({
        id: item.slt_id,
        module_index: index + 1,
      }));

      const batchInput: BatchUpdateSLTIndexesInput = { updates };

      // Validate batch update input
      const validation = batchUpdateSLTIndexesInputSchema.safeParse(batchInput);

      if (!validation.success) {
        const errors = validation.error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        throw new Error(`Validation failed: ${errors}`);
      }

      // Send batch update request (POST /slts/batch-update-indexes)
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slts/batch-update-indexes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validation.data),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to update SLT order");
      }

      // Refresh data
      await fetchCombinedData();

      // Exit reorder mode
      setIsReorderMode(false);
    } catch (err) {
      console.error("Error saving SLT order:", err);
      setActionError(err instanceof Error ? err.message : "Failed to save order");
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleCancelReorder = () => {
    setReorderedData(combinedData);
    setIsReorderMode(false);
    setActionError(null);
  };

  const handleCreateSLT = async () => {
    if (!isAuthenticated) {
      setActionError("You must be authenticated to create SLTs");
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      // Build input object for SLT creation
      const createInput: CreateSLTInput = {
        course_nft_policy_id: courseNftPolicyId,
        module_code: moduleCode,
        module_index: newSLTIndex,
        slt_text: newSLTText,
      };

      // Validate create input
      const createValidation = createSLTInputSchema.safeParse(createInput);

      if (!createValidation.success) {
        const errors = createValidation.error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        throw new Error(`Validation failed: ${errors}`);
      }

      // Send validated create (POST /slts/create)
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slts/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createValidation.data),
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
      // Build input object for SLT update
      const updateInput: UpdateSLTInput = {
        course_nft_policy_id: courseNftPolicyId,
        module_code: moduleCode,
        module_index: selectedSLT.module_index,
        slt_text: editSLTText,
        new_module_index: editSLTIndex !== selectedSLT.module_index ? editSLTIndex : undefined,
      };

      // Validate update input
      const updateValidation = updateSLTInputSchema.safeParse(updateInput);

      if (!updateValidation.success) {
        const errors = updateValidation.error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        throw new Error(`Validation failed: ${errors}`);
      }

      // Send validated update (POST /slts/update)
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slts/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateValidation.data),
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
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slts/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            module_index: selectedSLT.module_index,
          }),
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
    setEditSLTText(slt.slt_text);
    setEditSLTIndex(slt.module_index);
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
    const maxIndex = combinedData.reduce((max, item) => Math.max(max, item.module_index), -1);
    setNewSLTIndex(maxIndex + 1);
    setNewSLTText("");
    setActionError(null);
    setIsCreateDialogOpen(true);
  };

  const handleQuickJump = async () => {
    const indexNum = parseInt(jumpToIndex, 10);
    if (isNaN(indexNum)) {
      setActionError("Please enter a valid module index");
      return;
    }

    setIsJumping(true);
    setActionError(null);

    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slts/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            module_index: indexNum,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("SLT not found at this index");
      }

      const slt = (await response.json()) as SLTOutput;
      setIsJumpDialogOpen(false);
      setJumpToIndex("");
      // Open edit dialog with the fetched SLT
      openEditDialog(slt);
    } catch (err) {
      console.error("Error jumping to SLT:", err);
      setActionError(err instanceof Error ? err.message : "Failed to find SLT");
    } finally {
      setIsJumping(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <AndamioSkeleton className="h-9 w-64 mb-2" />
          <AndamioSkeleton className="h-5 w-96" />
        </div>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <AndamioSkeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !courseModule) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        {course && (
          <CourseBreadcrumb
            mode="studio"
            course={{ nftPolicyId: courseNftPolicyId, title: course.title ?? "Course" }}
            currentPage="slts"
          />
        )}

        <AndamioPageHeader title="Module Not Found" />

        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{error ?? "Module not found"}</AndamioAlertDescription>
        </AndamioAlert>
      </div>
    );
  }

  const dataToDisplay = isReorderMode ? reorderedData : combinedData;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      {course && (
        <CourseBreadcrumb
          mode="studio"
          course={{ nftPolicyId: courseNftPolicyId, title: course.title ?? "Course" }}
          courseModule={{ code: courseModule.module_code, title: courseModule.title }}
          currentPage="slts"
        />
      )}

      <div className="flex items-center justify-between">
        <AndamioPageHeader
          title={`Manage SLTs: ${courseModule.title}`}
          description={`Student Learning Targets for ${courseModule.module_code}`}
        />
        <div className="flex gap-2 self-start mt-2">
          {isReorderMode ? (
            <>
              <AndamioButton
                variant="outline"
                onClick={handleCancelReorder}
                disabled={isSavingOrder}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </AndamioButton>
              <AndamioButton
                onClick={handleSaveOrder}
                disabled={isSavingOrder}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSavingOrder ? "Saving..." : "Save Order"}
              </AndamioButton>
            </>
          ) : (
            <>
              <AndamioButton
                variant="outline"
                onClick={() => setIsJumpDialogOpen(true)}
                disabled={combinedData.length === 0}
              >
                <Search className="h-4 w-4 mr-2" />
                Jump to SLT
              </AndamioButton>
              <AndamioButton
                variant="outline"
                onClick={() => setIsReorderMode(true)}
                disabled={combinedData.length === 0}
              >
                <GripVertical className="h-4 w-4 mr-2" />
                Reorder
              </AndamioButton>
              <AndamioButton onClick={openCreateDialog} disabled={combinedData.length >= 25}>
                <Plus className="h-4 w-4 mr-2" />
                Add SLT
              </AndamioButton>
            </>
          )}
        </div>
      </div>

      {/* Action Error */}
      {actionError && (
        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertDescription>{actionError}</AndamioAlertDescription>
        </AndamioAlert>
      )}

      {/* SLT Count Info */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Learning Targets ({combinedData.length}/25)</AndamioCardTitle>
          <AndamioCardDescription>
            {isReorderMode
              ? "Drag and drop to reorder SLTs. Changes will be saved when you click 'Save Order'."
              : "Each module can have up to 25 Student Learning Targets"}
          </AndamioCardDescription>
        </AndamioCardHeader>
      </AndamioCard>

      {/* On-Chain SLT Status */}
      <HybridSLTStatus
        courseNftPolicyId={courseNftPolicyId}
        moduleCode={moduleCode}
        onRefresh={fetchCombinedData}
      />

      {/* SLTs Table */}
      {dataToDisplay.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            No learning targets defined for this module.
          </p>
          <AndamioButton onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create First SLT
          </AndamioButton>
        </div>
      ) : (
        <AndamioTableContainer>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <AndamioTable>
              <AndamioTableHeader>
                <AndamioTableRow>
                  {isReorderMode && <AndamioTableHead className="w-12"></AndamioTableHead>}
                  <AndamioTableHead className="w-20">Index</AndamioTableHead>
                  <AndamioTableHead>Learning Target</AndamioTableHead>
                  <AndamioTableHead>Lesson</AndamioTableHead>
                  <AndamioTableHead className="w-24">Status</AndamioTableHead>
                  {!isReorderMode && <AndamioTableHead className="w-32 text-right">Actions</AndamioTableHead>}
                </AndamioTableRow>
              </AndamioTableHeader>
              <AndamioTableBody>
                <SortableContext
                  items={dataToDisplay.map((item) => item.slt_id)}
                  strategy={verticalListSortingStrategy}
                  disabled={!isReorderMode}
                >
                  {dataToDisplay.map((item) => (
                    <SortableSLTRow
                      key={item.slt_id}
                      item={item}
                      courseNftPolicyId={courseNftPolicyId}
                      moduleCode={moduleCode}
                      isReorderMode={isReorderMode}
                      onEdit={openEditDialog}
                      onDelete={openDeleteDialog}
                    />
                  ))}
                </SortableContext>
              </AndamioTableBody>
            </AndamioTable>
          </DndContext>
        </AndamioTableContainer>
      )}

      {/* Create SLT Dialog */}
      <AndamioDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <AndamioDialogContent>
          <AndamioDialogHeader>
            <AndamioDialogTitle>Create New SLT</AndamioDialogTitle>
            <AndamioDialogDescription>
              Add a new Student Learning Target to this module
            </AndamioDialogDescription>
          </AndamioDialogHeader>

          <div className="space-y-4">
            {actionError && (
              <AndamioAlert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AndamioAlertDescription>{actionError}</AndamioAlertDescription>
              </AndamioAlert>
            )}

            <div>
              <AndamioLabel htmlFor="new-slt-index">Module Index (0-25)</AndamioLabel>
              <AndamioInput
                id="new-slt-index"
                type="number"
                min={0}
                max={25}
                value={newSLTIndex}
                onChange={(e) => setNewSLTIndex(parseInt(e.target.value))}
              />
            </div>

            <div>
              <AndamioLabel htmlFor="new-slt-text">Learning Target Text</AndamioLabel>
              <AndamioTextarea
                id="new-slt-text"
                placeholder="Describe what students will learn..."
                value={newSLTText}
                onChange={(e) => setNewSLTText(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <AndamioDialogFooter>
            <AndamioButton
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </AndamioButton>
            <AndamioButton onClick={handleCreateSLT} disabled={actionLoading || !newSLTText}>
              {actionLoading ? "Creating..." : "Create SLT"}
            </AndamioButton>
          </AndamioDialogFooter>
        </AndamioDialogContent>
      </AndamioDialog>

      {/* Edit SLT Dialog */}
      <AndamioDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <AndamioDialogContent>
          <AndamioDialogHeader>
            <AndamioDialogTitle>Edit SLT</AndamioDialogTitle>
            <AndamioDialogDescription>Update the learning target details</AndamioDialogDescription>
          </AndamioDialogHeader>

          <div className="space-y-4">
            {actionError && (
              <AndamioAlert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AndamioAlertDescription>{actionError}</AndamioAlertDescription>
              </AndamioAlert>
            )}

            <div>
              <AndamioLabel htmlFor="edit-slt-index">Module Index (0-25)</AndamioLabel>
              <AndamioInput
                id="edit-slt-index"
                type="number"
                min={0}
                max={25}
                value={editSLTIndex}
                onChange={(e) => setEditSLTIndex(parseInt(e.target.value))}
              />
            </div>

            <div>
              <AndamioLabel htmlFor="edit-slt-text">Learning Target Text</AndamioLabel>
              <AndamioTextarea
                id="edit-slt-text"
                value={editSLTText}
                onChange={(e) => setEditSLTText(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <AndamioDialogFooter>
            <AndamioButton
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </AndamioButton>
            <AndamioButton onClick={handleEditSLT} disabled={actionLoading || !editSLTText}>
              {actionLoading ? "Updating..." : "Update SLT"}
            </AndamioButton>
          </AndamioDialogFooter>
        </AndamioDialogContent>
      </AndamioDialog>

      {/* Delete SLT Dialog */}
      <AndamioDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AndamioDialogContent>
          <AndamioDialogHeader>
            <AndamioDialogTitle>Delete SLT</AndamioDialogTitle>
            <AndamioDialogDescription>
              Are you sure you want to delete this learning target? This action cannot be
              undone.
            </AndamioDialogDescription>
          </AndamioDialogHeader>

          {actionError && (
            <AndamioAlert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AndamioAlertDescription>{actionError}</AndamioAlertDescription>
            </AndamioAlert>
          )}

          {selectedSLT && (
            <div className="p-4 border rounded-md bg-muted">
              <p className="text-sm font-mono mb-2">Index: {selectedSLT.module_index}</p>
              <p className="text-sm">{selectedSLT.slt_text}</p>
            </div>
          )}

          <AndamioDialogFooter>
            <AndamioButton
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </AndamioButton>
            <AndamioButton
              variant="destructive"
              onClick={handleDeleteSLT}
              disabled={actionLoading}
            >
              {actionLoading ? "Deleting..." : "Delete SLT"}
            </AndamioButton>
          </AndamioDialogFooter>
        </AndamioDialogContent>
      </AndamioDialog>

      {/* Quick Jump Dialog */}
      <AndamioDialog open={isJumpDialogOpen} onOpenChange={setIsJumpDialogOpen}>
        <AndamioDialogContent>
          <AndamioDialogHeader>
            <AndamioDialogTitle>Jump to SLT</AndamioDialogTitle>
            <AndamioDialogDescription>
              Enter a module index to quickly find and edit a specific SLT
            </AndamioDialogDescription>
          </AndamioDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <AndamioLabel htmlFor="jump-index">Module Index</AndamioLabel>
              <AndamioInput
                id="jump-index"
                type="number"
                value={jumpToIndex}
                onChange={(e) => setJumpToIndex(e.target.value)}
                placeholder="e.g., 101"
                disabled={isJumping}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void handleQuickJump();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Available indexes: {combinedData.map((item) => item.module_index).join(", ")}
              </p>
            </div>

            {actionError && (
              <AndamioAlert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AndamioAlertDescription>{actionError}</AndamioAlertDescription>
              </AndamioAlert>
            )}
          </div>

          <AndamioDialogFooter>
            <AndamioButton
              variant="outline"
              onClick={() => {
                setIsJumpDialogOpen(false);
                setJumpToIndex("");
                setActionError(null);
              }}
              disabled={isJumping}
            >
              Cancel
            </AndamioButton>
            <AndamioButton onClick={handleQuickJump} disabled={isJumping || !jumpToIndex}>
              {isJumping ? "Finding..." : "Find SLT"}
            </AndamioButton>
          </AndamioDialogFooter>
        </AndamioDialogContent>
      </AndamioDialog>
    </div>
  );
}
