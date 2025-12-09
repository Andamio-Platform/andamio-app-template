"use client";

import React from "react";
import Link from "next/link";
import { RequireAuth } from "~/components/auth/require-auth";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { BookOpen, FolderKanban } from "lucide-react";

export default function StudioPage() {
  return (
    <RequireAuth
      title="Studio"
      description="Connect your wallet to access the creator studio"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Studio</h1>
          <p className="text-muted-foreground">
            Create and manage your courses and projects
          </p>
        </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/studio/course">
          <AndamioCard className="hover:bg-accent transition-colors cursor-pointer h-full">
            <AndamioCardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <AndamioCardTitle>Course Studio</AndamioCardTitle>
              </div>
              <AndamioCardDescription>
                Create and manage your Andamio courses
              </AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent>
              <AndamioButton variant="outline" className="w-full">
                Manage Courses
              </AndamioButton>
            </AndamioCardContent>
          </AndamioCard>
        </Link>

        <Link href="/studio/project">
          <AndamioCard className="hover:bg-accent transition-colors cursor-pointer h-full">
            <AndamioCardHeader>
              <div className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                <AndamioCardTitle>Project Studio</AndamioCardTitle>
              </div>
              <AndamioCardDescription>
                Create and manage your Andamio projects
              </AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent>
              <AndamioButton variant="outline" className="w-full">
                Manage Projects
              </AndamioButton>
            </AndamioCardContent>
          </AndamioCard>
        </Link>
      </div>
    </div>
    </RequireAuth>
  );
}
