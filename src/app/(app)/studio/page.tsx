"use client";

import React from "react";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAuthButton } from "~/components/auth/andamio-auth-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { BookOpen, FolderKanban } from "lucide-react";

export default function StudioPage() {
  const { isAuthenticated } = useAndamioAuth();

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Studio</h1>
          <p className="text-muted-foreground">
            Connect your wallet to access the creator studio
          </p>
        </div>

        <div className="max-w-md">
          <AndamioAuthButton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Studio</h1>
        <p className="text-muted-foreground">
          Create and manage your courses and projects
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/studio/course">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <CardTitle>Course Studio</CardTitle>
              </div>
              <CardDescription>
                Create and manage your Andamio courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Manage Courses
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Card className="opacity-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              <CardTitle>Project Studio</CardTitle>
            </div>
            <CardDescription>
              Create and manage your Andamio projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
