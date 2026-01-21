"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { computeSltHashDefinite } from "@andamio/core/hashing";
import type { WizardStepConfig } from "../types";

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
  } = useWizard();
  const { authenticatedFetch, isAuthenticated } = useAndamioAuth();

  const [isApproving, setIsApproving] = useState(false);
  const [isUnapproving, setIsUnapproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const moduleStatus = data.courseModule?.module_status;
  const [isApproved, setIsApproved] = useState(moduleStatus === "APPROVED" || moduleStatus === "ON_CHAIN");

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
      // Compute the module hash from SLTs (sorted by index)
      const sortedSltTexts = [...slts]
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
        .map((slt) => slt.slt_text)
        .filter((text): text is string => typeof text === "string");
      const moduleHash = computeSltHashDefinite(sortedSltTexts);

      // Go API: POST /course/teacher/course-module/update-status
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/course-module/update-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            course_module_code: moduleCode,
            status: "APPROVED",
            module_hash: moduleHash,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(errorData.message ?? "Failed to approve module");
      }

      setIsApproved(true);
      await refetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve module");
    } finally {
      setIsApproving(false);
    }
  };

  const handleUnapprove = async () => {
    if (!isAuthenticated) return;

    setIsUnapproving(true);
    setError(null);

    try {
      // Go API: POST /course/teacher/course-module/update-status
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/course-module/update-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            course_module_code: moduleCode,
            status: "DRAFT",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(errorData.message ?? "Failed to unapprove module");
      }

      setIsApproved(false);
      await refetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unapprove module");
    } finally {
      setIsUnapproving(false);
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
                <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
                  <CelebrateIcon className="h-10 w-10 text-success" />
                </div>
              </motion.div>

              <div className="flex flex-col items-center">
                <h3 className="text-xl font-bold">Module Approved!</h3>
                <AndamioText variant="muted" className="mt-1 text-center">
                  &quot;{moduleTitle}&quot; is ready for the blockchain.
                </AndamioText>
              </div>

              <div className="flex flex-col items-center gap-2 text-sm">
                <AndamioBadge className="bg-success text-success-foreground">
                  APPROVED
                </AndamioBadge>
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

              <AndamioButton
                variant="ghost"
                size="sm"
                onClick={handleUnapprove}
                disabled={isUnapproving}
                isLoading={isUnapproving}
                className="text-muted-foreground"
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
                <p className="text-sm text-muted-foreground mt-1 text-center max-w-md">
                  Review your module content below. When everything looks good,
                  click <strong>Approve Module</strong> to mark it as ready for
                  on-chain minting.
                </p>
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
                            item.completed ? "text-success" : "text-muted-foreground"
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
              disabled={!allRequiredComplete || isApproving}
              isLoading={isApproving}
              size="lg"
              className="w-full sm:w-auto px-8"
            >
              <CredentialIcon className="h-5 w-5 mr-2" />
              Approve Module
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
