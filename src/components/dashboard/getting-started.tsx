"use client";

import React from "react";
import Link from "next/link";
import { AndamioCard, AndamioCardContent } from "~/components/andamio/andamio-card";
import { CheckCircle2, Circle, ArrowRight, Wallet, Key, BookOpen, GraduationCap } from "lucide-react";
import { cn } from "~/lib/utils";
import type { StepItem } from "~/types/ui";

interface GettingStartedProps {
  isAuthenticated: boolean;
  hasAccessToken: boolean;
}

export function GettingStarted({ isAuthenticated, hasAccessToken }: GettingStartedProps) {
  // Only show the essential onboarding steps
  const steps: StepItem[] = [
    {
      id: "connect",
      title: "Connect Wallet",
      completed: isAuthenticated,
      icon: Wallet,
    },
    {
      id: "token",
      title: "Mint Access Token",
      completed: hasAccessToken,
      icon: Key,
    },
    {
      id: "explore",
      title: "Start Learning",
      completed: false,
      icon: BookOpen,
      link: "/course",
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;

  // Don't show if user has completed onboarding (has access token)
  if (hasAccessToken) {
    return null;
  }

  return (
    <AndamioCard className="border-warning/30 bg-gradient-to-r from-warning/5 to-transparent">
      <AndamioCardContent className="py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
              <GraduationCap className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-semibold">Getting Started</p>
              <p className="text-xs text-muted-foreground">
                {completedCount} of {steps.length} steps complete
              </p>
            </div>
          </div>

          {/* Steps - horizontal on desktop */}
          <div className="flex-1 flex items-center gap-2 sm:justify-end">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === steps.length - 1;

              return (
                <React.Fragment key={step.id}>
                  {step.link && !step.completed ? (
                    <Link
                      href={step.link}
                      className={cn(
                        "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors",
                        step.completed
                          ? "bg-success/10 text-success"
                          : "bg-muted hover:bg-accent"
                      )}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline font-medium">{step.title}</span>
                      {!step.completed && <ArrowRight className="h-3 w-3" />}
                    </Link>
                  ) : (
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm",
                        step.completed
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline font-medium">{step.title}</span>
                    </div>
                  )}
                  {!isLast && (
                    <div className="hidden sm:block h-px w-4 bg-border" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
