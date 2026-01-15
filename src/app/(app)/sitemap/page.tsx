"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioPageHeader } from "~/components/andamio";
import {
  ExternalLinkIcon,
  LockedIcon,
  CourseIcon,
  SparkleIcon,
  DashboardIcon,
  DraftIcon,
  LearnerIcon,
  TeacherIcon,
  ProjectIcon,
  SuccessIcon,
  ErrorIcon,
  GlobalIcon,
  WarningIcon,
  ServerIcon,
} from "~/components/icons";
import { type CourseListResponse, type ProjectV2Output } from "@andamio/db-api-types";
import type { RouteCategory } from "~/types/ui";
import { AndamioText } from "~/components/andamio/andamio-text";

// API Coverage data - tracks implementation status
interface ApiCoverageCategory {
  category: string;
  available: number;
  implemented: number;
  status: "complete" | "partial" | "minimal" | "not-started";
}

const apiCoverage: ApiCoverageCategory[] = [
  { category: "Authentication", available: 2, implemented: 2, status: "complete" },
  { category: "Access Token", available: 3, implemented: 2, status: "partial" },
  { category: "Course", available: 9, implemented: 7, status: "partial" },
  { category: "Course Module", available: 11, implemented: 10, status: "complete" },
  { category: "SLT", available: 7, implemented: 6, status: "complete" },
  { category: "Introduction", available: 4, implemented: 4, status: "complete" },
  { category: "Lesson", available: 6, implemented: 6, status: "complete" },
  { category: "Assignment", available: 5, implemented: 5, status: "complete" },
  { category: "Assignment Commitment", available: 8, implemented: 5, status: "partial" },
  { category: "Projects/Treasury", available: 3, implemented: 3, status: "complete" },
  { category: "Task Management", available: 4, implemented: 4, status: "complete" },
  { category: "Task Commitments", available: 7, implemented: 1, status: "minimal" },
  { category: "Contributor", available: 1, implemented: 0, status: "not-started" },
  { category: "Prerequisites", available: 1, implemented: 0, status: "not-started" },
  { category: "Credentials", available: 1, implemented: 1, status: "complete" },
  { category: "My Learning", available: 1, implemented: 1, status: "complete" },
  { category: "Transaction", available: 1, implemented: 1, status: "complete" },
];

const totalAvailable = apiCoverage.reduce((sum, cat) => sum + cat.available, 0);
const totalImplemented = apiCoverage.reduce((sum, cat) => sum + cat.implemented, 0);
const overallCoverage = Math.round((totalImplemented / totalAvailable) * 100);

const staticRoutes: RouteCategory[] = [
  {
    category: "Main Navigation",
    icon: DashboardIcon,
    routes: [
      {
        path: "/dashboard",
        label: "Dashboard",
        description: "User dashboard with wallet info and My Learning section",
        requiresAuth: true,
      },
      {
        path: "/course",
        label: "Browse Courses",
        description: "Public catalog of all published courses (Learner view)",
        requiresAuth: false,
      },
      {
        path: "/project",
        label: "Browse Projects",
        description: "Public catalog of all published projects (Contributor view)",
        requiresAuth: false,
      },
      {
        path: "/studio",
        label: "Studio Hub",
        description: "Creator studio hub with links to Course Studio and Projects",
        requiresAuth: true,
      },
      {
        path: "/sitemap",
        label: "Sitemap (This Page)",
        description: "Development tool for navigating all routes",
        requiresAuth: false,
      },
    ],
  },
  {
    category: "Studio Pages",
    icon: SparkleIcon,
    routes: [
      {
        path: "/studio/course",
        label: "Course Studio",
        description: "Manage your owned courses",
        requiresAuth: true,
      },
      {
        path: "/studio/project",
        label: "Project Studio",
        description: "Manage your owned projects and tasks",
        requiresAuth: true,
      },
      {
        path: "/editor",
        label: "Editor",
        description: "Text editor (standalone page)",
        requiresAuth: false,
      },
    ],
  },
];

const dynamicRouteTemplates: RouteCategory[] = [
  {
    category: "Learner Course Pages",
    icon: LearnerIcon,
    routes: [
      {
        path: "/course/[courseNftPolicyId]",
        label: "Course Detail",
        description: "View course overview and modules (Learner view)",
        requiresAuth: false,
        dynamic: true,
        params: ["courseNftPolicyId"],
      },
      {
        path: "/course/[courseNftPolicyId]/[moduleCode]",
        label: "Module Detail",
        description: "View module content and assignments (Learner view)",
        requiresAuth: false,
        dynamic: true,
        params: ["courseNftPolicyId", "moduleCode"],
      },
      {
        path: "/course/[courseNftPolicyId]/[moduleCode]/[moduleIndex]",
        label: "Module Index",
        description: "Alternative module view with index parameter",
        requiresAuth: false,
        dynamic: true,
        params: ["courseNftPolicyId", "moduleCode", "moduleIndex"],
      },
      {
        path: "/course/[courseNftPolicyId]/[moduleCode]/assignment",
        label: "Module Assignment",
        description: "View and complete module assignment (Learner view)",
        requiresAuth: false,
        dynamic: true,
        params: ["courseNftPolicyId", "moduleCode"],
      },
    ],
  },
  {
    category: "Creator Studio Course Pages",
    icon: DraftIcon,
    routes: [
      {
        path: "/studio/course/[courseNftPolicyId]",
        label: "Edit Course",
        description: "Course editor overview (Creator view)",
        requiresAuth: true,
        dynamic: true,
        params: ["courseNftPolicyId"],
      },
      {
        path: "/studio/course/[courseNftPolicyId]/instructor",
        label: "Instructor Management",
        description: "Manage course instructors",
        requiresAuth: true,
        dynamic: true,
        params: ["courseNftPolicyId"],
      },
      {
        path: "/studio/course/[courseNftPolicyId]/[moduleCode]",
        label: "Edit Module",
        description: "Module editor (Creator view)",
        requiresAuth: true,
        dynamic: true,
        params: ["courseNftPolicyId", "moduleCode"],
      },
      {
        path: "/studio/course/[courseNftPolicyId]/[moduleCode]/[moduleIndex]",
        label: "Edit Module by Index",
        description: "Alternative module editor with index parameter",
        requiresAuth: true,
        dynamic: true,
        params: ["courseNftPolicyId", "moduleCode", "moduleIndex"],
      },
      {
        path: "/studio/course/[courseNftPolicyId]/[moduleCode]/introduction",
        label: "Edit Module Introduction",
        description: "Edit module introduction content",
        requiresAuth: true,
        dynamic: true,
        params: ["courseNftPolicyId", "moduleCode"],
      },
      {
        path: "/studio/course/[courseNftPolicyId]/[moduleCode]/slts",
        label: "Edit Module SLTs",
        description: "Edit Student Learning Targets for module",
        requiresAuth: true,
        dynamic: true,
        params: ["courseNftPolicyId", "moduleCode"],
      },
      {
        path: "/studio/course/[courseNftPolicyId]/[moduleCode]/assignment",
        label: "Edit Module Assignment",
        description: "Edit module assignment (Creator view)",
        requiresAuth: true,
        dynamic: true,
        params: ["courseNftPolicyId", "moduleCode"],
      },
    ],
  },
  {
    category: "Contributor Project Pages",
    icon: ProjectIcon,
    routes: [
      {
        path: "/project/[projectid]",
        label: "Project Detail",
        description: "View project overview and available tasks (Contributor view)",
        requiresAuth: false,
        dynamic: true,
        params: ["projectid"],
      },
      {
        path: "/project/[projectid]/[taskHash]",
        label: "Task Detail",
        description: "View task details and commit to work (Contributor view)",
        requiresAuth: false,
        dynamic: true,
        params: ["projectid", "taskHash"],
      },
    ],
  },
  {
    category: "Creator Studio Project Pages",
    icon: DraftIcon,
    routes: [
      {
        path: "/studio/project/[projectid]",
        label: "Project Dashboard",
        description: "Project management dashboard (Creator view)",
        requiresAuth: true,
        dynamic: true,
        params: ["projectid"],
      },
      {
        path: "/studio/project/[projectid]/draft-tasks",
        label: "Manage Tasks",
        description: "View and manage draft and live tasks",
        requiresAuth: true,
        dynamic: true,
        params: ["projectid"],
      },
      {
        path: "/studio/project/[projectid]/draft-tasks/new",
        label: "Create Task",
        description: "Create a new task for the project",
        requiresAuth: true,
        dynamic: true,
        params: ["projectid"],
      },
      {
        path: "/studio/project/[projectid]/draft-tasks/[taskIndex]",
        label: "Edit Task",
        description: "Edit an existing draft task",
        requiresAuth: true,
        dynamic: true,
        params: ["projectid", "taskIndex"],
      },
    ],
  },
];

export default function SitemapPage() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();
  const [ownedCourses, setOwnedCourses] = useState<CourseListResponse>([]);
  const [publishedCourses, setPublishedCourses] = useState<CourseListResponse>([]);
  const [publishedProjects, setPublishedProjects] = useState<ProjectV2Output[]>([]);
  const [ownedProjects, setOwnedProjects] = useState<ProjectV2Output[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch courses and projects for dynamic route examples
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Go API: GET /course/user/courses/list
        const pubCourseResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/user/courses/list`
        );
        if (pubCourseResponse.ok) {
          const pubData = (await pubCourseResponse.json()) as CourseListResponse;
          setPublishedCourses(pubData ?? []);
        }

        // V2 API: GET /project-v2/user/projects/list
        const pubProjectResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/user/projects/list`
        );
        if (pubProjectResponse.ok) {
          const pubData = (await pubProjectResponse.json()) as ProjectV2Output[];
          setPublishedProjects(pubData ?? []);
        }

        // Fetch owned data if authenticated
        if (isAuthenticated) {
          // Go API: POST /course/owner/courses/list
          const ownedCourseResponse = await authenticatedFetch(
            `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/owner/courses/list`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            }
          );
          if (ownedCourseResponse.ok) {
            const ownedData = (await ownedCourseResponse.json()) as CourseListResponse;
            setOwnedCourses(ownedData ?? []);
          }

          // V2 API: POST /project-v2/admin/projects/list
          const ownedProjectResponse = await authenticatedFetch(
            `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/admin/projects/list`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            }
          );
          if (ownedProjectResponse.ok) {
            const ownedData = (await ownedProjectResponse.json()) as ProjectV2Output[];
            setOwnedProjects(ownedData ?? []);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [isAuthenticated, authenticatedFetch]);

  // Get first items for examples
  const examplePublishedCourse = publishedCourses[0];
  const exampleOwnedCourse = ownedCourses[0];
  const examplePublishedProject = publishedProjects[0];
  const exampleOwnedProject = ownedProjects[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <AndamioPageHeader
        title="Sitemap"
        description="Development tool for navigating all routes in the application"
        centered
      />

      {/* Auth Status */}
      <AndamioCard>
        <AndamioCardContent className="p-8">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <AndamioText variant="small" className="font-medium">Authentication Status</AndamioText>
              <AndamioText variant="small" className="text-xs">
                {isAuthenticated
                  ? "You can access all routes"
                  : "Connect wallet to access protected routes"}
              </AndamioText>
            </div>
            <AndamioBadge variant={isAuthenticated ? "default" : "secondary"}>
              {isAuthenticated ? "Authenticated" : "Not Authenticated"}
            </AndamioBadge>
          </div>
        </AndamioCardContent>
      </AndamioCard>

      {/* Legend */}
      <AndamioCard>
        <AndamioCardHeader className="space-y-4">
          <AndamioCardTitle>Legend</AndamioCardTitle>
        </AndamioCardHeader>
        <AndamioCardContent className="pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <GlobalIcon className="h-4 w-4 text-success" />
              <span>Public route</span>
            </div>
            <div className="flex items-center gap-2">
              <LockedIcon className="h-4 w-4 text-warning" />
              <span>Requires authentication</span>
            </div>
            <div className="flex items-center gap-2">
              <ExternalLinkIcon className="h-4 w-4 text-info" />
              <span>Dynamic route (requires params)</span>
            </div>
          </div>
        </AndamioCardContent>
      </AndamioCard>

      {/* Static Routes */}
      {staticRoutes.map((category) => {
        const Icon = category.icon;
        return (
          <AndamioCard key={category.category}>
            <AndamioCardHeader className="space-y-4">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                <AndamioCardTitle>{category.category}</AndamioCardTitle>
              </div>
              <AndamioCardDescription className="text-base">Direct navigation links</AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="pt-4">
              <div className="space-y-3">
                {category.routes.map((route) => (
                  <div
                    key={route.path}
                    className="flex items-start justify-between gap-4 rounded-md border p-3"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Link href={route.path} className="font-medium hover:underline">
                          {route.label}
                        </Link>
                        {route.requiresAuth ? (
                          <LockedIcon className="h-3 w-3 text-warning" />
                        ) : (
                          <GlobalIcon className="h-3 w-3 text-success" />
                        )}
                      </div>
                      <AndamioText variant="small" className="text-xs">{route.description}</AndamioText>
                      <code className="text-xs font-mono text-muted-foreground">
                        {route.path}
                      </code>
                    </div>
                    <Link href={route.path}>
                      <AndamioButton size="sm" variant="outline">
                        Visit
                      </AndamioButton>
                    </Link>
                  </div>
                ))}
              </div>
            </AndamioCardContent>
          </AndamioCard>
        );
      })}

      {/* Dynamic Routes */}
      {dynamicRouteTemplates.map((category) => {
        const Icon = category.icon;
        return (
          <AndamioCard key={category.category}>
            <AndamioCardHeader className="space-y-4">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                <AndamioCardTitle>{category.category}</AndamioCardTitle>
              </div>
              <AndamioCardDescription className="text-base">
                Routes that require parameters - examples shown below when data is available
              </AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="pt-4">
              <div className="space-y-3">
                {category.routes.map((route) => {
                  // Generate example URL if we have data
                  let exampleUrl: string | null = null;
                  let canNavigate = false;

                  if (category.category === "Learner Course Pages" && examplePublishedCourse) {
                    const courseNftPolicyId = examplePublishedCourse.course_nft_policy_id;
                    if (courseNftPolicyId) {
                      if (route.path === "/course/[courseNftPolicyId]") {
                        exampleUrl = `/course/${courseNftPolicyId}`;
                        canNavigate = true;
                      } else if (route.path.includes("[moduleCode]")) {
                        exampleUrl = route.path
                          .replace("[courseNftPolicyId]", courseNftPolicyId)
                          .replace("[moduleCode]", "example-module")
                          .replace("[moduleIndex]", "0");
                        canNavigate = false; // Module might not exist
                      }
                    }
                  } else if (
                    category.category === "Creator Studio Course Pages" &&
                    exampleOwnedCourse
                  ) {
                    const courseNftPolicyId =
                      exampleOwnedCourse.course_nft_policy_id ?? exampleOwnedCourse.course_code;
                    if (route.path === "/studio/course/[courseNftPolicyId]") {
                      exampleUrl = `/studio/course/${courseNftPolicyId}`;
                      canNavigate = true;
                    } else if (route.path.includes("[moduleCode]")) {
                      exampleUrl = route.path
                        .replace("[courseNftPolicyId]", courseNftPolicyId)
                        .replace("[moduleCode]", "example-module")
                        .replace("[moduleIndex]", "0");
                      canNavigate = false; // Module might not exist
                    }
                  } else if (
                    category.category === "Contributor Project Pages" &&
                    examplePublishedProject
                  ) {
                    const projectid = examplePublishedProject.project_id;
                    if (projectid) {
                      if (route.path === "/project/[projectid]") {
                        exampleUrl = `/project/${projectid}`;
                        canNavigate = true;
                      } else if (route.path.includes("[taskHash]")) {
                        exampleUrl = route.path
                          .replace("[projectid]", projectid)
                          .replace("[taskHash]", "example-task-hash");
                        canNavigate = false; // Task might not exist
                      }
                    }
                  } else if (
                    category.category === "Creator Studio Project Pages" &&
                    exampleOwnedProject
                  ) {
                    const projectid = exampleOwnedProject.project_id;
                    if (projectid) {
                      if (route.path === "/studio/project/[projectid]") {
                        exampleUrl = `/studio/project/${projectid}`;
                        canNavigate = true;
                      } else if (route.path === "/studio/project/[projectid]/draft-tasks") {
                        exampleUrl = `/studio/project/${projectid}/draft-tasks`;
                        canNavigate = true;
                      } else if (route.path === "/studio/project/[projectid]/draft-tasks/new") {
                        exampleUrl = `/studio/project/${projectid}/draft-tasks/new`;
                        canNavigate = true;
                      } else if (route.path.includes("[taskIndex]")) {
                        exampleUrl = route.path
                          .replace("[projectid]", projectid)
                          .replace("[taskIndex]", "1");
                        canNavigate = false; // Task might not exist
                      }
                    }
                  }

                  return (
                    <div
                      key={route.path}
                      className="flex items-start justify-between gap-4 rounded-md border p-3"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{route.label}</span>
                          {route.requiresAuth ? (
                            <LockedIcon className="h-3 w-3 text-warning" />
                          ) : (
                            <GlobalIcon className="h-3 w-3 text-success" />
                          )}
                          <ExternalLinkIcon className="h-3 w-3 text-info" />
                        </div>
                        <AndamioText variant="small" className="text-xs">{route.description}</AndamioText>
                        <code className="text-xs font-mono text-muted-foreground">
                          {route.path}
                        </code>
                        {route.params && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {route.params.map((param) => (
                              <AndamioBadge key={param} variant="outline" className="text-xs">
                                {param}
                              </AndamioBadge>
                            ))}
                          </div>
                        )}
                        {exampleUrl && (
                          <div className="pt-2">
                            <AndamioText variant="small" className="text-xs font-medium mb-1">
                              Example:
                            </AndamioText>
                            <code className="text-xs font-mono text-primary">{exampleUrl}</code>
                          </div>
                        )}
                      </div>
                      {exampleUrl && canNavigate && (
                        <Link href={exampleUrl}>
                          <AndamioButton size="sm" variant="outline">
                            Visit
                          </AndamioButton>
                        </Link>
                      )}
                      {!exampleUrl && (
                        <AndamioButton size="sm" variant="ghost" disabled>
                          No Data
                        </AndamioButton>
                      )}
                    </div>
                  );
                })}
              </div>
            </AndamioCardContent>
          </AndamioCard>
        );
      })}

      {/* Data Summary */}
      <AndamioCard>
        <AndamioCardHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <CourseIcon className="h-5 w-5" />
            <AndamioCardTitle>Available Data</AndamioCardTitle>
          </div>
          <AndamioCardDescription className="text-base">
            Course and project data available for generating example dynamic routes
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="pt-4">
          {isLoading ? (
            <AndamioText variant="small">Loading data...</AndamioText>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <AndamioText variant="small" className="font-medium">Published Courses</AndamioText>
                  <AndamioText variant="small" className="text-xs">
                    Available for learner route examples
                  </AndamioText>
                </div>
                <AndamioBadge variant="outline">{publishedCourses.length} courses</AndamioBadge>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <AndamioText variant="small" className="font-medium">Owned Courses</AndamioText>
                  <AndamioText variant="small" className="text-xs">
                    Available for creator route examples
                  </AndamioText>
                </div>
                <AndamioBadge variant="outline">{ownedCourses.length} courses</AndamioBadge>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <AndamioText variant="small" className="font-medium">Published Projects</AndamioText>
                  <AndamioText variant="small" className="text-xs">
                    Available for contributor route examples
                  </AndamioText>
                </div>
                <AndamioBadge variant="outline">{publishedProjects.length} projects</AndamioBadge>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <AndamioText variant="small" className="font-medium">Owned Projects</AndamioText>
                  <AndamioText variant="small" className="text-xs">
                    Available for project studio route examples
                  </AndamioText>
                </div>
                <AndamioBadge variant="outline">{ownedProjects.length} projects</AndamioBadge>
              </div>
            </div>
          )}
        </AndamioCardContent>
      </AndamioCard>

      {/* API Endpoints Reference */}
      <AndamioCard>
        <AndamioCardHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <TeacherIcon className="h-5 w-5" />
            <AndamioCardTitle>API Reference</AndamioCardTitle>
          </div>
          <AndamioCardDescription className="text-base">
            Database API endpoints used by this application
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="pt-4">
          <div className="space-y-2">
            <div className="rounded-md border p-3">
              <AndamioText variant="small" className="font-medium mb-1">API Base URL</AndamioText>
              <code className="text-xs font-mono text-primary">
                {env.NEXT_PUBLIC_ANDAMIO_API_URL}
              </code>
            </div>
            <div className="rounded-md border p-3">
              <AndamioText variant="small" className="font-medium mb-1">OpenAPI Documentation</AndamioText>
              <code className="text-xs font-mono text-primary">
                {env.NEXT_PUBLIC_ANDAMIO_API_URL.replace("/api/v0", "/openapi/v0.json")}
              </code>
            </div>
            <div className="rounded-md border p-3">
              <AndamioText variant="small" className="font-medium mb-1">Swagger UI</AndamioText>
              <code className="text-xs font-mono text-primary">
                {env.NEXT_PUBLIC_ANDAMIO_API_URL.replace("/api/v0", "/swagger/index.html")}
              </code>
            </div>
          </div>
        </AndamioCardContent>
      </AndamioCard>

      {/* API Coverage Status */}
      <AndamioCard>
        <AndamioCardHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <ServerIcon className="h-5 w-5" />
            <AndamioCardTitle>API Coverage Status</AndamioCardTitle>
          </div>
          <AndamioCardDescription className="text-base">
            Implementation status of Database API endpoints in this application
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="pt-4">
          {/* Overall Progress */}
          <div className="mb-6 p-4 rounded-lg bg-muted">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Coverage</span>
              <AndamioBadge variant={overallCoverage >= 80 ? "default" : overallCoverage >= 50 ? "secondary" : "outline"}>
                {totalImplemented}/{totalAvailable} endpoints ({overallCoverage}%)
              </AndamioBadge>
            </div>
            <div className="w-full bg-background rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${overallCoverage}%` }}
              />
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm mb-4">
            <div className="flex items-center gap-2">
              <SuccessIcon className="h-4 w-4 text-success" />
              <span>Complete (90%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <WarningIcon className="h-4 w-4 text-warning" />
              <span>Partial (50-89%)</span>
            </div>
            <div className="flex items-center gap-2">
              <ErrorIcon className="h-4 w-4 text-destructive" />
              <span>Minimal/Not Started</span>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-2">
            {apiCoverage.map((cat) => {
              const coverage = Math.round((cat.implemented / cat.available) * 100);
              return (
                <div
                  key={cat.category}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-2">
                    {cat.status === "complete" && (
                      <SuccessIcon className="h-4 w-4 text-success" />
                    )}
                    {cat.status === "partial" && (
                      <WarningIcon className="h-4 w-4 text-warning" />
                    )}
                    {(cat.status === "minimal" || cat.status === "not-started") && (
                      <ErrorIcon className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-sm font-medium">{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {cat.implemented}/{cat.available}
                    </span>
                    <AndamioBadge
                      variant={
                        coverage >= 90 ? "default" : coverage >= 50 ? "secondary" : "outline"
                      }
                      className="text-xs"
                    >
                      {coverage}%
                    </AndamioBadge>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Documentation Links */}
          <div className="mt-6 pt-4 border-t">
            <AndamioText variant="small" className="font-medium mb-2">Documentation</AndamioText>
            <div className="flex flex-wrap gap-2">
              <AndamioButton variant="outline" size="sm" asChild>
                <a href="/docs/api/API-COVERAGE.md" target="_blank" rel="noopener noreferrer">
                  API Coverage Details
                </a>
              </AndamioButton>
              <AndamioButton variant="outline" size="sm" asChild>
                <a href="/docs/SITEMAP.md" target="_blank" rel="noopener noreferrer">
                  Route Documentation
                </a>
              </AndamioButton>
            </div>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    </div>
  );
}
