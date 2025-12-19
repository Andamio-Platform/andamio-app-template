"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Plus, ExternalLink, Check, BookOpen, Sparkles } from "lucide-react";
import { useWizard } from "../module-wizard";
import { WizardStep, WizardStepTip } from "../wizard-step";
import { WizardNavigation } from "../wizard-navigation";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioCard, AndamioCardContent } from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
import type { WizardStepConfig } from "../types";

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
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const slts = data.slts;
  const lessons = data.lessons;

  // Map lessons to their SLT's slt_index
  const lessonBySltIndex = lessons.reduce((acc, lesson) => {
    acc[lesson.slt_index] = lesson;
    return acc;
  }, {} as Record<number, typeof lessons[number]>);

  const handleCreateLesson = async (sltIndex: number) => {
    if (!isAuthenticated || !newLessonTitle.trim()) return;

    setIsCreating(true);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/lesson/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            module_index: sltIndex,
            title: newLessonTitle.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create lesson");
      }

      setNewLessonTitle("");
      setCreatingForSlt(null);
      await refetchData();
    } catch (err) {
      console.error("Error creating lesson:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const lessonsCreated = lessons.length;
  const totalSLTs = slts.length;

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
            const lesson = lessonBySltIndex[slt.module_index];
            const isCreatingThis = creatingForSlt === slt.module_index;

            return (
              <motion.div
                key={slt.module_index}
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
                          {lesson ? <Check className="h-4 w-4" /> : index + 1}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* SLT text */}
                        <AndamioText variant="small" className="mb-2">
                          {slt.slt_text}
                        </AndamioText>

                        {/* Lesson info or create */}
                        {lesson ? (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-success" />
                              <span className="font-medium">{lesson.title}</span>
                            </div>
                            <Link
                              href={`/studio/course/${courseNftPolicyId}/${moduleCode}/${slt.module_index}`}
                            >
                              <AndamioButton size="sm" variant="ghost">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Edit Full Lesson
                              </AndamioButton>
                            </Link>
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
                                  void handleCreateLesson(slt.module_index);
                                }
                                if (e.key === "Escape") {
                                  setCreatingForSlt(null);
                                  setNewLessonTitle("");
                                }
                              }}
                            />
                            <AndamioButton
                              size="sm"
                              onClick={() => handleCreateLesson(slt.module_index)}
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
                            onClick={() => setCreatingForSlt(slt.module_index)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
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
          <Sparkles className="h-4 w-4" />
          <span>
            You&apos;ve added {lessonsCreated} lesson{lessonsCreated !== 1 ? "s" : ""}.
            Feel free to add more or continue — you can always come back.
          </span>
        </motion.div>
      )}

      {/* Navigation */}
      <WizardNavigation
        onPrevious={goPrevious}
        onNext={goNext}
        canGoPrevious={canGoPrevious}
        canGoNext={true}
        nextLabel="Write Introduction"
        canSkip={true}
        skipLabel="Skip to Introduction"
        onSkip={goNext}
      />
    </WizardStep>
  );
}
