"use client";

import React, { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useProjects } from "~/hooks/api";
import { useOwnerProjects } from "~/hooks/api/project/use-project-owner";
import { useStudentCompletionsForPrereqs } from "~/hooks/api/course/use-student-completions-for-prereqs";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioPageHeader, AndamioPageLoading, AndamioEmptyState, AndamioText } from "~/components/andamio";
import { AlertIcon, ProjectIcon, CredentialIcon, SearchIcon, SuccessIcon } from "~/components/icons";
import { checkProjectEligibility, type EligibilityResult } from "~/lib/project-eligibility";
import { ProjectCard } from "~/components/projects/project-card";
import { Button } from "~/components/ui/button";

type EligibilityFilter = "all" | "qualified" | "in-progress" | "open";
type OwnershipTab = "all" | "mine";

/**
 * Project catalog page
 *
 * Shows all published projects or just projects owned by the authenticated user.
 * Eligibility filters apply in the "All" tab only.
 *
 * API Endpoints:
 *   All projects:  GET /api/v2/project/user/projects/list
 *   My projects:   POST /api/v2/project/owner/projects/list
 */
export default function ProjectCatalogPage() {
  return (
    <Suspense fallback={<AndamioPageLoading variant="cards" />}>
      <ProjectCatalogContent />
    </Suspense>
  );
}

function ProjectCatalogContent() {
  const { data: allProjects, isLoading: allLoading, error: allError } = useProjects();
  const { data: ownedProjects, isLoading: ownedLoading, error: ownedError } = useOwnerProjects();
  const { isAuthenticated } = useAndamioAuth();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<OwnershipTab>("all");

  const projects = tab === "mine" ? ownedProjects : allProjects;
  const isLoading = tab === "mine" ? ownedLoading : allLoading;
  const error = tab === "mine" ? ownedError : allError;

  // Filter state — initialize from URL search params (e.g. ?filter=qualified)
  const initialFilter = searchParams.get("filter") as EligibilityFilter | null;
  const [searchQuery, setSearchQuery] = useState("");
  const [eligibilityFilter, setEligibilityFilter] = useState<EligibilityFilter>(
    initialFilter && ["all", "qualified", "in-progress", "open"].includes(initialFilter)
      ? initialFilter
      : "all"
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Collect all unique prerequisite course IDs across projects
  const allPrereqCourseIds = useMemo(() => {
    if (!projects?.length) return [];
    const ids = new Set<string>();
    for (const project of projects) {
      for (const prereq of project.prerequisites ?? []) {
        if (prereq.courseId) ids.add(prereq.courseId);
      }
    }
    return Array.from(ids);
  }, [projects]);

  const { completions } = useStudentCompletionsForPrereqs(allPrereqCourseIds);

  const eligibilityMap = useMemo(() => {
    const map = new Map<string, EligibilityResult>();
    if (!projects?.length) return map;
    for (const project of projects) {
      if (!project.projectId) continue;
      map.set(project.projectId, checkProjectEligibility(project.prerequisites ?? [], completions));
    }
    return map;
  }, [projects, completions]);

  const categories = useMemo(() => {
    if (!projects?.length) return [];
    const cats = new Set<string>();
    for (const project of projects) {
      if (project.category) cats.add(project.category);
    }
    return Array.from(cats).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (!projects?.length) return [];
    return projects.filter((project) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!project.title?.toLowerCase().includes(q) && !project.description?.toLowerCase().includes(q)) return false;
      }
      if (categoryFilter !== "all" && project.category !== categoryFilter) return false;
      if (isAuthenticated && tab === "all" && eligibilityFilter !== "all" && project.projectId) {
        const eligibility = eligibilityMap.get(project.projectId);
        if (!eligibility) return false;
        switch (eligibilityFilter) {
          case "qualified": if (!eligibility.eligible) return false; break;
          case "in-progress": if (eligibility.eligible || eligibility.totalCompleted === 0) return false; break;
          case "open": if (eligibility.totalRequired !== 0) return false; break;
        }
      }
      return true;
    });
  }, [projects, searchQuery, categoryFilter, eligibilityFilter, tab, isAuthenticated, eligibilityMap]);

  const qualifiedCount = isAuthenticated
    ? Array.from(eligibilityMap.values()).filter((e) => e.eligible).length
    : 0;

  const hasActiveFilters = searchQuery.trim() !== "" || eligibilityFilter !== "all" || categoryFilter !== "all";

  if (isLoading) return <AndamioPageLoading variant="cards" />;

  if (error) {
    return (
      <div className="space-y-6">
        <AndamioPageHeader title="Projects" description="Browse all published projects" />
        <AndamioAlert variant="destructive">
          <AlertIcon className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{error.message}</AndamioAlertDescription>
        </AndamioAlert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AndamioPageHeader
        title="Projects"
        description={
          tab === "mine"
            ? "Projects you own and manage."
            : isAuthenticated
            ? "Browse projects and see which ones you qualify for based on your completed courses."
            : "Browse all published projects. Connect your wallet to see eligibility."
        }
      />

      {/* Tab + stats row */}
      <div className="flex flex-wrap items-center gap-3">
        {isAuthenticated && (
          <>
            <Button
              variant={tab === "all" ? "secondary" : "outline"}
              size="sm"
              className={`h-7 text-xs ${tab === "all" ? "font-medium" : ""}`}
              onClick={() => { setTab("all"); setEligibilityFilter("all"); }}
            >
              {tab === "all" && <SuccessIcon className="h-3 w-3 mr-1" />}
              All Projects
            </Button>
            <Button
              variant={tab === "mine" ? "secondary" : "outline"}
              size="sm"
              className={`h-7 text-xs ${tab === "mine" ? "font-medium" : ""}`}
              onClick={() => { setTab("mine"); setEligibilityFilter("all"); }}
            >
              {tab === "mine" && <SuccessIcon className="h-3 w-3 mr-1" />}
              My Projects
            </Button>
            <div className="w-px bg-border mx-1 self-stretch" />
          </>
        )}

        <AndamioBadge variant="secondary" className="text-sm px-3 py-1.5">
          <ProjectIcon className="h-4 w-4 mr-1.5" />
          {projects?.length ?? 0} {(projects?.length ?? 0) === 1 ? "project" : "projects"}
        </AndamioBadge>
        {isAuthenticated && tab === "all" && qualifiedCount > 0 && (
          <AndamioBadge variant="outline" className="text-sm px-3 py-1.5 text-primary border-primary/30">
            <CredentialIcon className="h-4 w-4 mr-1.5" />
            {qualifiedCount} qualified
          </AndamioBadge>
        )}
      </div>

      {/* Empty states */}
      {(!projects || projects.length === 0) && tab === "all" && (
        <AndamioEmptyState
          icon={ProjectIcon}
          title="No Published Projects"
          description="There are currently no published projects available. Check back later."
        />
      )}
      {(!projects || projects.length === 0) && tab === "mine" && (
        <AndamioEmptyState
          icon={ProjectIcon}
          title="No Projects Yet"
          description="You haven't created any projects. Use andamio init or the Studio to create your first project."
        />
      )}

      {/* Filters — only shown when there are projects */}
      {projects && projects.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <AndamioInput
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Eligibility filters — all tab only */}
            {isAuthenticated && tab === "all" && (
              <>
                <Button variant={eligibilityFilter === "all" ? "secondary" : "outline"} size="sm" className={`h-7 text-xs ${eligibilityFilter === "all" ? "font-medium" : ""}`} onClick={() => setEligibilityFilter("all")}>
                  {eligibilityFilter === "all" && <SuccessIcon className="h-3 w-3 mr-1" />}All
                </Button>
                <Button variant={eligibilityFilter === "qualified" ? "secondary" : "outline"} size="sm" className={`h-7 text-xs ${eligibilityFilter === "qualified" ? "font-medium" : ""}`} onClick={() => setEligibilityFilter("qualified")}>
                  {eligibilityFilter === "qualified" && <SuccessIcon className="h-3 w-3 mr-1" />}Qualified
                </Button>
                <Button variant={eligibilityFilter === "in-progress" ? "secondary" : "outline"} size="sm" className={`h-7 text-xs ${eligibilityFilter === "in-progress" ? "font-medium" : ""}`} onClick={() => setEligibilityFilter("in-progress")}>
                  {eligibilityFilter === "in-progress" && <SuccessIcon className="h-3 w-3 mr-1" />}In Progress
                </Button>
                <Button variant={eligibilityFilter === "open" ? "secondary" : "outline"} size="sm" className={`h-7 text-xs ${eligibilityFilter === "open" ? "font-medium" : ""}`} onClick={() => setEligibilityFilter("open")}>
                  {eligibilityFilter === "open" && <SuccessIcon className="h-3 w-3 mr-1" />}Open to All
                </Button>
              </>
            )}

            {/* Category filter */}
            {categories.length > 0 && (
              <>
                {isAuthenticated && tab === "all" && <div className="w-px bg-border mx-1" />}
                <Button variant={categoryFilter === "all" ? "secondary" : "outline"} size="sm" className={`h-7 text-xs ${categoryFilter === "all" ? "font-medium" : ""}`} onClick={() => setCategoryFilter("all")}>
                  {categoryFilter === "all" && <SuccessIcon className="h-3 w-3 mr-1" />}All Categories
                </Button>
                {categories.map((cat) => (
                  <Button key={cat} variant={categoryFilter === cat ? "secondary" : "outline"} size="sm" className={`h-7 text-xs ${categoryFilter === cat ? "font-medium" : ""}`} onClick={() => setCategoryFilter(cat)}>
                    {categoryFilter === cat && <SuccessIcon className="h-3 w-3 mr-1" />}{cat}
                  </Button>
                ))}
              </>
            )}
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <AndamioText variant="small" className="text-muted-foreground">
                Showing {filteredProjects.length} of {projects.length} projects
              </AndamioText>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setSearchQuery(""); setEligibilityFilter("all"); setCategoryFilter("all"); }}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Project cards */}
      {filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.projectId}
              project={project}
              eligibility={project.projectId ? eligibilityMap.get(project.projectId) : undefined}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}

      {projects && projects.length > 0 && filteredProjects.length === 0 && (
        <AndamioEmptyState
          icon={ProjectIcon}
          title="No Matching Projects"
          description="Try adjusting your search or filters."
        />
      )}
    </div>
  );
}
