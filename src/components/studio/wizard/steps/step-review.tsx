"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  VerifiedIcon,
  NeutralIcon,
  AlertIcon,
  CredentialIcon,
  SLTIcon,
  AssignmentIcon,
  LessonIcon,
  IntroductionIcon,
  SendIcon,
  CelebrateIcon,
} from "~/components/icons";
import { useWizard } from "../module-wizard";
import { WizardStep, WizardStepHighlight } from "../wizard-step";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioCard, AndamioCardContent, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { AndamioText } from "~/components/andamio/andamio-text";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { computeSltHashDefinite } from "@andamio/core/hashing";
import { courseModuleKeys, useUpdateCourseModuleStatus } from "~/hooks/api/course/use-course-module";
import type { WizardStepConfig } from "../types";
import { GATEWAY_API_BASE } from "~/lib/api-utils";

interface StepReviewProps {
  config: WizardStepConfig;
  direction: number;
}

export function StepReview({ config, direction }: StepReviewProps) {
  const {
    data,
    goPrevious,
    canGoPrevious,
    completion,
    goToStep,
    refetchData,
    courseNftPolicyId,
    moduleCode,
    saveAndSync,
    isDirty,
    isSaving,
    draftSlts,
  } = useWizard();
  const { authenticatedFetch, isAuthenticated } = useAndamioAuth();
  const queryClient = useQueryClient();
  const updateModuleStatus = useUpdateCourseModuleStatus();

  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const moduleStatus = data.courseModule?.status;
  const [isApproved, setIsApproved] = useState(moduleStatus === "approved" || moduleStatus === "active");

  const slts = data.slts;
  const lessons = data.lessons;
  const moduleTitle = typeof data.courseModule?.title === "string" ? data.courseModule.title : "Untitled Module";
  const assignmentTitle = typeof data.assignment?.title === "string" ? data.assignment.title : "Not created";
  const introductionTitle = typeof data.introduction?.title === "string" ? data.introduction.title : "Not created";

  const reviewItems = [
    {
      id: "credential",
      icon: CredentialIcon,
      label: "Module Title",
      value: moduleTitle,
      completed: completion.credential,
      step: "credential" as const,
    },
    {
      id: "slts",
      icon: SLTIcon,
      label: "Learning Targets",
      value: `${slts.length} SLT${slts.length !== 1 ? "s" : ""} defined`,
      completed: completion.slts,
      step: "slts" as const,
    },
    {
      id: "assignment",
      icon: AssignmentIcon,
      label: "Assignment",
      value: assignmentTitle,
      completed: completion.assignment,
      step: "assignment" as const,
    },
    {
      id: "lessons",
      icon: LessonIcon,
      label: "Lessons",
      value: `${lessons.length} of ${slts.length} lessons`,
      completed: lessons.length > 0,
      optional: true,
      step: "lessons" as const,
    },
    {
      id: "introduction",
      icon: IntroductionIcon,
      label: "Introduction",
      value: introductionTitle,
      completed: completion.introduction,
      step: "introduction" as const,
    },
  ];

  const allRequiredComplete = completion.credential && completion.slts && completion.assignment && completion.introduction;

  const handleApprove = async () => {
    if (!isAuthenticated || !allRequiredComplete) return;

    setIsApproving(true);
    setError(null);

    try {
      // Step 1: Save any unsaved draft changes first
      if (isDirty && saveAndSync) {
        const saveSuccess = await saveAndSync();
        if (!saveSuccess) {
          throw new Error("Failed to save draft before approving");
        }
      }

      // Step 2: Compute the SLT hash from draft SLTs (sorted by moduleIndex)
      // Use draftSlts if available (local draft), otherwise fall back to data.slts
      // API v2.0.0+: moduleIndex is 1-based
      const sltsToHash = draftSlts ?? slts;
      const sortedSltTexts = [...sltsToHash]
        .filter((slt) => !("_isDeleted" in slt && slt._isDeleted))
        .sort((a, b) => (a.moduleIndex ?? 1) - (b.moduleIndex ?? 1))
        .map((slt) => slt.sltText)
        .filter((text): text is string => typeof text === "string" && text.length > 0);
      const sltHash = computeSltHashDefinite(sortedSltTexts);

      // Step 3: Use aggregate-update endpoint with status field to approve
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/teacher/course-module/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            course_module_code: moduleCode,
            status: "APPROVED",
            slt_hash: sltHash,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(errorData.message ?? "Failed to approve module");
      }

      // Refetch all relevant queries to ensure fresh data is loaded
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: courseModuleKeys.list(courseNftPolicyId),
        }),
        queryClient.refetchQueries({
          queryKey: courseModuleKeys.teacherList(courseNftPolicyId),
        }),
        queryClient.refetchQueries({
          queryKey: courseModuleKeys.detail(courseNftPolicyId, moduleCode),
        }),
      ]);

      setIsApproved(true);
      await refetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve module");
    } finally {
      setIsApproving(false);
    }
  };

  /**
   * Revert module from APPROVED back to DRAFT status.
   * Uses the dedicated update-status endpoint (v2.0.0-dev-20260128-a+).
   * This unlocks SLTs for editing again.
   */
  const handleUnapprove = async () => {
    if (!isAuthenticated) return;

    setError(null);

    try {
      await updateModuleStatus.mutateAsync({
        courseId: courseNftPolicyId,
        moduleCode,
        status: "DRAFT",
        // slt_hash not required for APPROVED → DRAFT
      });

      setIsApproved(false);
      await refetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to return to draft");
    }
  };

  return (
    <WizardStep config={config} direction={direction}>
      {isApproved ? (
        // Success state
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <WizardStepHighlight>
            <div className="flex flex-col items-center gap-4 py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <CelebrateIcon className="h-10 w-10 text-primary" />
                </div>
              </motion.div>

              <div className="flex flex-col items-center">
                <h3 className="text-xl font-bold">Module Approved!</h3>
                <AndamioText variant="muted" className="mt-1 text-center">
                  &quot;{moduleTitle}&quot; is ready for the blockchain.
                </AndamioText>
              </div>

              <div className="flex flex-col items-center gap-2 text-sm">
                <AndamioBadge className="bg-primary text-primary-foreground">
                  APPROVED
                </AndamioBadge>
                {data.courseModule?.sltHash && (
                  <div className="flex flex-col items-center gap-1">
                    <AndamioText variant="small" className="text-muted-foreground">
                      SLT Hash
                    </AndamioText>
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded max-w-[280px] truncate">
                      {data.courseModule.sltHash}
                    </code>
                  </div>
                )}
                <Link
                  href={`/studio/course/${courseNftPolicyId}?tab=on-chain`}
                  className="hover:opacity-80 transition-opacity"
                >
                  <AndamioBadge variant="outline" className="cursor-pointer hover:bg-accent">
                    Ready to Mint →
                  </AndamioBadge>
                </Link>
              </div>

              <AndamioText variant="small" className="text-center max-w-md">
                Head to the{" "}
                <Link
                  href={`/studio/course/${courseNftPolicyId}?tab=on-chain`}
                  className="font-semibold text-primary hover:underline"
                >
                  On-Chain tab
                </Link>{" "}
                to mint your module tokens on Cardano.
              </AndamioText>

              <AndamioText variant="small" className="text-center text-muted-foreground/60 max-w-sm">
                Once approved, SLTs are locked. You can still edit lessons, assignment, and introduction.
              </AndamioText>

              <AndamioButton
                variant="outline"
                size="sm"
                onClick={handleUnapprove}
                disabled={updateModuleStatus.isPending}
                isLoading={updateModuleStatus.isPending}
                className="mt-2"
              >
                Return to Draft
              </AndamioButton>
            </div>
          </WizardStepHighlight>
        </motion.div>
      ) : (
        // Review checklist
        <>
          <WizardStepHighlight>
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <SendIcon className="h-7 w-7 text-primary" />
              </div>
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-semibold">Ready to Publish?</h3>
                <AndamioText variant="small" className="mt-1 text-center max-w-md">
                  Review your module content below. When everything looks good,
                  click <strong>Approve Module</strong> to mark it as ready for
                  on-chain minting.
                </AndamioText>
              </div>
            </div>
          </WizardStepHighlight>

          <AndamioCard>
            <AndamioCardHeader className="pb-3">
              <AndamioCardTitle className="text-base">Module Checklist</AndamioCardTitle>
            </AndamioCardHeader>
            <AndamioCardContent>
              <div className="space-y-3">
                {reviewItems.map((item, index) => {
                  const Icon = item.icon;
                  const StatusIcon = item.completed ? VerifiedIcon : NeutralIcon;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <StatusIcon
                          className={`h-5 w-5 ${
                            item.completed ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.label}</span>
                          {item.optional && (
                            <span className="text-xs text-muted-foreground">(optional)</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{item.value}</span>
                        {!item.completed && !item.optional && (
                          <AndamioButton
                            size="sm"
                            variant="ghost"
                            onClick={() => goToStep(item.step)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Fix
                          </AndamioButton>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AndamioCardContent>
          </AndamioCard>

          {!allRequiredComplete && (
            <AndamioAlert>
              <AlertIcon className="h-4 w-4" />
              <AndamioAlertDescription>
                Complete all required items before approving. Click &quot;Fix&quot; next to any
                incomplete item.
              </AndamioAlertDescription>
            </AndamioAlert>
          )}

          {error && (
            <AndamioAlert variant="destructive">
              <AlertIcon className="h-4 w-4" />
              <AndamioAlertDescription>{error}</AndamioAlertDescription>
            </AndamioAlert>
          )}
        </>
      )}

      {/* CTA and Navigation */}
      <div className="space-y-4 pt-6 border-t">
        {!isApproved && (
          <div className="flex flex-col items-center gap-3">
            <AndamioButton
              onClick={handleApprove}
              disabled={!allRequiredComplete || isApproving || isSaving}
              isLoading={isApproving || isSaving}
              size="lg"
              className="w-full sm:w-auto px-8"
            >
              <CredentialIcon className="h-5 w-5 mr-2" />
              {isSaving ? "Saving..." : isApproving ? "Approving..." : "Save & Approve Module"}
            </AndamioButton>
            <AndamioText variant="small" className="text-center">
              This marks your module as ready to mint on Cardano
            </AndamioText>
          </div>
        )}

        <div className="flex justify-center">
          <AndamioButton
            variant="ghost"
            onClick={goPrevious}
            disabled={!canGoPrevious || isApproving}
          >
            ← Back to Introduction
          </AndamioButton>
        </div>
      </div>
    </WizardStep>
  );
}
