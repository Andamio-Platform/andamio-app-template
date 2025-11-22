"use client";

import React from "react";
import Link from "next/link";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { CheckCircle2, Circle, Rocket } from "lucide-react";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  link?: string;
  linkText?: string;
  completed: boolean;
}

interface GettingStartedProps {
  isAuthenticated: boolean;
  hasAccessToken: boolean;
}

export function GettingStarted({ isAuthenticated, hasAccessToken }: GettingStartedProps) {
  const checklist: ChecklistItem[] = [
    {
      id: "connect",
      title: "Connect your Cardano wallet",
      description: "Connect a CIP-30 compatible wallet (Eternl, Nami, Flint, etc.)",
      completed: isAuthenticated,
    },
    {
      id: "token",
      title: "Mint an access token",
      description: "Create your on-chain access token for Andamio",
      completed: hasAccessToken,
    },
    {
      id: "explore",
      title: "Explore the components",
      description: "See all 45+ available UI components and copy code examples",
      link: "/components",
      linkText: "View Components",
      completed: false,
    },
    {
      id: "courses",
      title: "Browse published courses",
      description: "Check out the course catalog and see how courses are displayed",
      link: "/course",
      linkText: "Browse Courses",
      completed: false,
    },
    {
      id: "create",
      title: "Create your first course",
      description: "Use the Course Creator Studio to build a course",
      link: "/courses",
      linkText: "My Courses",
      completed: false,
    },
    {
      id: "sitemap",
      title: "Explore the sitemap",
      description: "See all available routes and navigate the template easily",
      link: "/sitemap",
      linkText: "View Sitemap",
      completed: false,
    },
  ];

  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <AndamioCard className="border-2">
      <AndamioCardHeader className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <AndamioCardTitle>Getting Started</AndamioCardTitle>
          </div>
          <AndamioBadge variant="secondary">
            {completedCount} / {totalCount}
          </AndamioBadge>
        </div>
        <AndamioCardDescription className="text-base">
          Complete these steps to get the most out of this template
        </AndamioCardDescription>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-6">
        {/* Progress indicator */}
        {progress > 0 && (
          <div className="space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">
              {progress}% complete
            </p>
          </div>
        )}

        {/* Checklist items */}
        <div className="space-y-3">
          {checklist.map((item) => {
            const Icon = item.completed ? CheckCircle2 : Circle;
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  item.completed ? "bg-success/5 border-success/20" : "hover:bg-accent"
                }`}
              >
                <Icon
                  className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                    item.completed ? "text-success" : "text-muted-foreground"
                  }`}
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <p
                    className={`font-medium text-sm ${
                      item.completed ? "text-success line-through" : ""
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                  {item.link && !item.completed && (
                    <Link
                      href={item.link}
                      className="inline-block text-xs text-primary hover:underline"
                    >
                      {item.linkText} →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
