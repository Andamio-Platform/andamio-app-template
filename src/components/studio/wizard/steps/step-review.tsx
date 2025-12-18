"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Award,
  Target,
  FileText,
  BookOpen,
  FileEdit,
  Rocket,
  PartyPopper,
} from "lucide-react";
import { useWizard } from "../module-wizard";
import { WizardStep, WizardStepHighlight } from "../wizard-step";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioCard, AndamioCardContent, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
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
  const [error, setError] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(data.courseModule?.status === "APPROVED");

  const slts = data.slts;
  const lessons = data.lessons;
  const moduleTitle = data.courseModule?.title ?? "Untitled Module";

  const reviewItems = [
    {
      id: "blueprint",
      icon: Award,
      label: "Module Title",
      value: moduleTitle,
      completed: completion.blueprint,
      step: "blueprint" as const,
    },
    {
      id: "slts",
      icon: Target,
      label: "Learning Targets",
      value: `${slts.length} SLT${slts.length !== 1 ? "s" : ""} defined`,
      completed: completion.slts,
      step: "slts" as const,
    },
    {
      id: "assignment",
      icon: FileText,
      label: "Assignment",
      value: data.assignment?.title ?? "Not created",
      completed: completion.assignment,
      step: "assignment" as const,
    },
    {
      id: "lessons",
      icon: BookOpen,
      label: "Lessons",
      value: `${lessons.length} of ${slts.length} lessons`,
      completed: lessons.length > 0,
      optional: true,
      step: "lessons" as const,
    },
    {
      id: "introduction",
      icon: FileEdit,
      label: "Introduction",
      value: data.introduction?.title ?? "Not created",
      completed: completion.introduction,
      step: "introduction" as const,
    },
  ];

  const allRequiredComplete = completion.blueprint && completion.slts && completion.assignment && completion.introduction;

  const handleApprove = async () => {
    if (!isAuthenticated || !allRequiredComplete) return;

    setIsApproving(true);
    setError(null);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-module/update-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            status: "APPROVED",
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
            <div className="text-center space-y-4 py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center">
                  <PartyPopper className="h-10 w-10 text-success" />
                </div>
              </motion.div>

              <div>
                <h3 className="text-xl font-bold">Module Approved!</h3>
                <p className="text-muted-foreground mt-1">
                  &quot;{moduleTitle}&quot; is ready for the blockchain.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm">
                <AndamioBadge className="bg-success text-success-foreground">
                  APPROVED
                </AndamioBadge>
                <span className="text-muted-foreground">→</span>
                <AndamioBadge variant="outline">Ready to Mint</AndamioBadge>
              </div>

              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Head to the <strong>On-Chain</strong> tab in Advanced Mode to mint
                your module tokens on Cardano.
              </p>
            </div>
          </WizardStepHighlight>
        </motion.div>
      ) : (
        // Review checklist
        <>
          <WizardStepHighlight>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Almost There!</h3>
                <p className="text-sm text-muted-foreground">
                  Review your module and approve it for blockchain minting.
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
                  const StatusIcon = item.completed ? CheckCircle2 : Circle;

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
              <AlertCircle className="h-4 w-4" />
              <AndamioAlertDescription>
                Complete all required items before approving. Click &quot;Fix&quot; next to any
                incomplete item.
              </AndamioAlertDescription>
            </AndamioAlert>
          )}

          {error && (
            <AndamioAlert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AndamioAlertDescription>{error}</AndamioAlertDescription>
            </AndamioAlert>
          )}
        </>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t">
        <AndamioButton
          variant="ghost"
          onClick={goPrevious}
          disabled={!canGoPrevious || isApproving}
        >
          ← Back to Introduction
        </AndamioButton>

        {!isApproved && (
          <AndamioButton
            onClick={handleApprove}
            disabled={!allRequiredComplete || isApproving}
            isLoading={isApproving}
            className="w-full sm:w-auto"
          >
            <Award className="h-4 w-4 mr-2" />
            Approve Module
          </AndamioButton>
        )}
      </div>
    </WizardStep>
  );
}
