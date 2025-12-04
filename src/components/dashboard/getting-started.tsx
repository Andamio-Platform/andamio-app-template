"use client";

import React from "react";
import Link from "next/link";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { CheckCircle2, Circle, ArrowRight, Wallet, Key, BookOpen, Palette, FolderPlus, Map } from "lucide-react";
import { cn } from "~/lib/utils";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  link?: string;
  linkText?: string;
  completed: boolean;
  icon: React.ElementType;
}

interface GettingStartedProps {
  isAuthenticated: boolean;
  hasAccessToken: boolean;
}

export function GettingStarted({ isAuthenticated, hasAccessToken }: GettingStartedProps) {
  const checklist: ChecklistItem[] = [
    {
      id: "connect",
      title: "Connect your wallet",
      description: "Use a CIP-30 compatible wallet like Eternl or Nami",
      completed: isAuthenticated,
      icon: Wallet,
    },
    {
      id: "token",
      title: "Get an access token",
      description: "Mint your on-chain access token to unlock all features",
      completed: hasAccessToken,
      icon: Key,
    },
    {
      id: "explore",
      title: "Browse available courses",
      description: "Explore the course catalog and find something to learn",
      link: "/course",
      linkText: "Browse courses",
      completed: false,
      icon: BookOpen,
    },
    {
      id: "components",
      title: "View UI components",
      description: "Explore the component library and copy code examples",
      link: "/components",
      linkText: "View components",
      completed: false,
      icon: Palette,
    },
    {
      id: "create",
      title: "Create your first course",
      description: "Use the studio to build and publish educational content",
      link: "/courses",
      linkText: "Go to studio",
      completed: false,
      icon: FolderPlus,
    },
    {
      id: "sitemap",
      title: "Explore all routes",
      description: "View the complete sitemap and navigation structure",
      link: "/sitemap",
      linkText: "View sitemap",
      completed: false,
      icon: Map,
    },
  ];

  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <AndamioCardTitle>Getting Started</AndamioCardTitle>
            <AndamioCardDescription className="mt-1">
              Complete these steps to get the most out of Andamio
            </AndamioCardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{completedCount}/{totalCount}</p>
            <p className="text-xs text-muted-foreground">completed</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </AndamioCardHeader>

      <AndamioCardContent className="pt-0">
        <div className="space-y-2">
          {checklist.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-4 rounded-lg border p-4 transition-colors",
                  item.completed
                    ? "border-success/30 bg-success/5"
                    : "border-border hover:border-primary/30 hover:bg-accent/50"
                )}
              >
                {/* Status icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md",
                      item.completed ? "bg-success/10" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "h-4 w-4",
                        item.completed ? "text-success" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1">
                      <p className={cn(
                        "font-medium text-sm",
                        item.completed && "text-success"
                      )}>
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                      {item.link && !item.completed && (
                        <Link
                          href={item.link}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-2"
                        >
                          {item.linkText}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
