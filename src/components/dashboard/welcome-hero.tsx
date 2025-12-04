"use client";

import React from "react";
import Link from "next/link";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioCard, AndamioCardContent } from "~/components/andamio/andamio-card";
import { BookOpen, Palette, Code2, ArrowRight } from "lucide-react";

const quickLinks = [
  {
    icon: BookOpen,
    label: "Browse Courses",
    href: "/course",
    description: "Explore the catalog",
  },
  {
    icon: Palette,
    label: "Components",
    href: "/components",
    description: "UI showcase",
  },
  {
    icon: Code2,
    label: "Sitemap",
    href: "/sitemap",
    description: "All routes",
  },
];

export function WelcomeHero() {
  return (
    <AndamioCard className="overflow-hidden">
      <AndamioCardContent className="p-0">
        {/* Main content */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Welcome back
              </h1>
              <p className="text-muted-foreground max-w-xl">
                Track your learning progress, manage your courses, and explore new opportunities.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/course">
                <AndamioButton className="gap-2">
                  Browse Courses
                  <ArrowRight className="h-4 w-4" />
                </AndamioButton>
              </Link>
              <Link href="/courses">
                <AndamioButton variant="outline">
                  My Courses
                </AndamioButton>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick links footer */}
        <div className="border-t border-border bg-muted/30 px-6 py-4 sm:px-8">
          <div className="flex flex-wrap gap-6">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background border border-border group-hover:border-primary/50 transition-colors">
                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {link.label}
                    </span>
                    <span className="hidden sm:inline text-muted-foreground"> · {link.description}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
