"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AddIcon, CompletedIcon, LessonIcon, SparkleIcon, CollapseIcon, EditIcon } from "~/components/icons";
import { useWizard } from "../module-wizard";
import { WizardStep, WizardStepTip } from "../wizard-step";
import { WizardNavigation } from "../wizard-navigation";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSaveButton } from "~/components/andamio/andamio-save-button";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioCard, AndamioCardContent } from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import { ContentEditor } from "~/components/editor";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import type { WizardStepConfig } from "../types";
import type { JSONContent } from "@tiptap/core";
import type { LessonResponse } from "~/types/generated";

interface StepLessonsProps {
  config: WizardStepConfig;
  direction: number;
}

export function StepLessons({ config, direction }: StepLessonsProps) {
  const {
    data,
    goNext,
    goPrevious,
    canGoPrevious,
    refetchData,
    courseNftPolicyId,
    moduleCode,
  } = useWizard();
  const { authenticatedFetch, isAuthenticated } = useAndamioAuth();

  const [creatingForSlt, setCreatingForSlt] = useState<number | null>(null);
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const slts = data.slts;
  const lessons = data.lessons;

  // Map lessons to their SLT's index
  const lessonBySltIndex = lessons.reduce((acc, lesson) => {
    const sltIndex = lesson.slt_index ?? 0;
    acc[sltIndex] = lesson;
    return acc;
  }, {} as Record<number, typeof lessons[number]>);

  const handleCreateLesson = async (sltIndex: number) => {
    if (!isAuthenticated || !newLessonTitle.trim()) return;

    setIsCreating(true);

    try {
      // Go API: POST /course/teacher/lesson/create
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/lesson/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            course_module_code: moduleCode,
            slt_index: sltIndex,
            title: newLessonTitle.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(errorData.message ?? "Failed to create lesson");
      }

      setNewLessonTitle("");
      setCreatingForSlt(null);
      await refetchData();
      // Auto-expand the newly created lesson for editing
      setEditingLessonIndex(sltIndex);
    } catch (err) {
      console.error("Error creating lesson:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const lessonsCreated = lessons.length;
  const totalSLTs = slts.length;
  const hasAssignment = !!data.assignment;

  return (
    <WizardStep config={config} direction={direction}>
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <div>
          <AndamioText variant="small">
            {lessonsCreated} of {totalSLTs} lessons created
          </AndamioText>
        </div>
        <AndamioBadge variant="outline">Optional Step</AndamioBadge>
      </div>

      {/* SLT-Lesson mapping */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {slts.map((slt, index) => {
            const sltIndex = slt.index ?? 0;
            const lesson = lessonBySltIndex[sltIndex];
            const isCreatingThis = creatingForSlt === sltIndex;
            const isEditingThis = editingLessonIndex === sltIndex;

            return (
              <motion.div
                key={sltIndex}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <AndamioCard className={lesson ? "border-success/30 bg-success/5" : ""}>
                  <AndamioCardContent className="py-4">
                    <div className="flex items-start gap-4">
                      {/* SLT indicator */}
                      <div className="shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            lesson
                              ? "bg-success text-success-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {lesson ? <CompletedIcon className="h-4 w-4" /> : index + 1}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* SLT text */}
                        <AndamioText variant="small" className="mb-2">
                          {typeof slt.slt_text === "string" ? slt.slt_text : ""}
                        </AndamioText>

                        {/* Lesson info or create */}
                        {lesson ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <LessonIcon className="h-4 w-4 text-success" />
                                <span className="font-medium">{typeof lesson.title === "string" ? lesson.title : "Untitled Lesson"}</span>
                              </div>
                              <AndamioButton
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingLessonIndex(isEditingThis ? null : sltIndex)}
                              >
                                {isEditingThis ? (
                                  <>
                                    <CollapseIcon className="h-3 w-3 mr-1" />
                                    Collapse
                                  </>
                                ) : (
                                  <>
                                    <EditIcon className="h-3 w-3 mr-1" />
                                    Edit
                                  </>
                                )}
                              </AndamioButton>
                            </div>

                            {/* Inline Editor */}
                            <AnimatePresence>
                              {isEditingThis && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <LessonEditor
                                    lesson={lesson}
                                    courseNftPolicyId={courseNftPolicyId}
                                    moduleCode={moduleCode}
                                    onSave={refetchData}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : isCreatingThis ? (
                          <div className="flex gap-2">
                            <AndamioInput
                              value={newLessonTitle}
                              onChange={(e) => setNewLessonTitle(e.target.value)}
                              placeholder="Lesson title..."
                              className="flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && newLessonTitle.trim()) {
                                  void handleCreateLesson(sltIndex);
                                }
                                if (e.key === "Escape") {
                                  setCreatingForSlt(null);
                                  setNewLessonTitle("");
                                }
                              }}
                            />
                            <AndamioButton
                              size="sm"
                              onClick={() => handleCreateLesson(sltIndex)}
                              disabled={!newLessonTitle.trim() || isCreating}
                              isLoading={isCreating}
                            >
                              Create
                            </AndamioButton>
                            <AndamioButton
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setCreatingForSlt(null);
                                setNewLessonTitle("");
                              }}
                            >
                              Cancel
                            </AndamioButton>
                          </div>
                        ) : (
                          <AndamioButton
                            size="sm"
                            variant="outline"
                            onClick={() => setCreatingForSlt(sltIndex)}
                          >
                            <AddIcon className="h-3 w-3 mr-1" />
                            Add Lesson
                          </AndamioButton>
                        )}
                      </div>
                    </div>
                  </AndamioCardContent>
                </AndamioCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {lessonsCreated === 0 && (
        <WizardStepTip>
          <strong>Lessons are optional!</strong> Some modules work great with just
          an assignment. You can always add lessons later — click &quot;Skip to Introduction&quot;
          to move on.
        </WizardStepTip>
      )}

      {lessonsCreated > 0 && lessonsCreated < totalSLTs && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg"
        >
          <SparkleIcon className="h-4 w-4" />
          <span>
            You&apos;ve added {lessonsCreated} lesson{lessonsCreated !== 1 ? "s" : ""}.
            Feel free to add more or continue — you can always come back.
          </span>
        </motion.div>
      )}

      {/* Warning if no assignment */}
      {!hasAssignment && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-warning bg-warning/10 p-3 rounded-lg border border-warning/20"
        >
          <span>
            Complete the <strong>Assignment</strong> step before writing the introduction.
          </span>
        </motion.div>
      )}

      {/* Navigation */}
      <WizardNavigation
        onPrevious={goPrevious}
        onNext={goNext}
        canGoPrevious={canGoPrevious}
        canGoNext={hasAssignment}
        nextLabel="Write Introduction"
        canSkip={hasAssignment}
        skipLabel="Skip to Introduction"
        onSkip={goNext}
      />
    </WizardStep>
  );
}

// =============================================================================
// Lesson Editor Component
// =============================================================================

interface LessonEditorProps {
  lesson: LessonResponse;
  courseNftPolicyId: string;
  moduleCode: string;
  onSave: () => Promise<void>;
}

function LessonEditor({ lesson, courseNftPolicyId, moduleCode, onSave }: LessonEditorProps) {
  const { authenticatedFetch, isAuthenticated } = useAndamioAuth();

  const lessonTitle = typeof lesson.title === "string" ? lesson.title : "";
  const [title, setTitle] = useState(lessonTitle);
  const [content, setContent] = useState<JSONContent | null>(
    lesson.content_json ? (lesson.content_json as JSONContent) : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track unsaved changes
  useEffect(() => {
    const originalTitle = typeof lesson.title === "string" ? lesson.title : "";
    const titleChanged = title !== originalTitle;
    const contentChanged = JSON.stringify(content) !== JSON.stringify(lesson.content_json ?? null);
    setHasUnsavedChanges(titleChanged || contentChanged);
  }, [title, content, lesson]);

  const handleSave = async () => {
    if (!isAuthenticated) return;

    setIsSaving(true);

    try {
      // Go API: POST /course/teacher/lesson/update
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/lesson/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            course_module_code: moduleCode,
            slt_index: lesson.slt_index,
            title,
            content_json: content,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(errorData.message ?? "Failed to update lesson");
      }

      await onSave();
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error("Error saving lesson:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 pt-3 border-t border-border/50">
      <div className="flex items-center justify-between">
        <AndamioInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lesson title"
          className="font-medium flex-1 mr-3"
        />
        {hasUnsavedChanges && (
          <AndamioSaveButton
            onClick={handleSave}
            isSaving={isSaving}
            compact
          />
        )}
      </div>

      <div className="min-h-[200px] border rounded-lg overflow-hidden bg-background">
        <ContentEditor
          content={content}
          onContentChange={setContent}
          minHeight="200px"
        />
      </div>
    </div>
  );
}
