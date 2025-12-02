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
import {
  ExternalLink,
  Lock,
  Globe,
  BookOpen,
  Sparkles,
  LayoutDashboard,
  FileEdit,
  GraduationCap,
  Users,
} from "lucide-react";
import { type ListOwnedCoursesOutput, type ListPublishedCoursesOutput } from "@andamio/db-api";

interface RouteInfo {
  path: string;
  label: string;
  description: string;
  requiresAuth: boolean;
  dynamic?: boolean;
  params?: string[];
}

interface RouteCategory {
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  routes: RouteInfo[];
}

const staticRoutes: RouteCategory[] = [
  {
    category: "Main Navigation",
    icon: LayoutDashboard,
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
        path: "/courses",
        label: "My Courses (Course Creator Studio)",
        description: "Advanced course management with filtering, sorting, and multiple views",
        requiresAuth: true,
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
    icon: Sparkles,
    routes: [
      {
        path: "/studio/course",
        label: "Course Studio (Legacy)",
        description: "Simple course list with Create Course button",
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
    icon: GraduationCap,
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
    icon: FileEdit,
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
];

export default function SitemapPage() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();
  const [ownedCourses, setOwnedCourses] = useState<ListOwnedCoursesOutput>([]);
  const [publishedCourses, setPublishedCourses] = useState<ListPublishedCoursesOutput>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch courses for dynamic route examples
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        // Fetch published courses (public) - POST /courses/published
        const pubResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/published`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          }
        );
        if (pubResponse.ok) {
          const pubData = (await pubResponse.json()) as ListPublishedCoursesOutput;
          setPublishedCourses(pubData ?? []);
        }

        // Fetch owned courses if authenticated - POST /courses/owned
        if (isAuthenticated) {
          const ownedResponse = await authenticatedFetch(
            `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/owned`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            }
          );
          if (ownedResponse.ok) {
            const ownedData = (await ownedResponse.json()) as ListOwnedCoursesOutput;
            setOwnedCourses(ownedData ?? []);
          }
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCourses();
  }, [isAuthenticated, authenticatedFetch]);

  // Get first published course for examples
  const examplePublishedCourse = publishedCourses[0];
  const exampleOwnedCourse = ownedCourses[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 py-8">
        <h1 className="text-4xl font-bold">Sitemap</h1>
        <p className="text-xl text-muted-foreground">
          Development tool for navigating all routes in the application
        </p>
      </div>

      {/* Auth Status */}
      <AndamioCard>
        <AndamioCardContent className="p-8">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Authentication Status</p>
              <p className="text-xs text-muted-foreground">
                {isAuthenticated
                  ? "You can access all routes"
                  : "Connect wallet to access protected routes"}
              </p>
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
              <Globe className="h-4 w-4 text-success" />
              <span>Public route</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-warning" />
              <span>Requires authentication</span>
            </div>
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-info" />
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
                          <Lock className="h-3 w-3 text-warning" />
                        ) : (
                          <Globe className="h-3 w-3 text-success" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{route.description}</p>
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
                            <Lock className="h-3 w-3 text-warning" />
                          ) : (
                            <Globe className="h-3 w-3 text-success" />
                          )}
                          <ExternalLink className="h-3 w-3 text-info" />
                        </div>
                        <p className="text-xs text-muted-foreground">{route.description}</p>
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
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Example:
                            </p>
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

      {/* Course Data Summary */}
      <AndamioCard>
        <AndamioCardHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <AndamioCardTitle>Available Course Data</AndamioCardTitle>
          </div>
          <AndamioCardDescription className="text-base">
            Course data available for generating example dynamic routes
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="pt-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading course data...</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Published Courses</p>
                  <p className="text-xs text-muted-foreground">
                    Available for learner route examples
                  </p>
                </div>
                <AndamioBadge variant="outline">{publishedCourses.length} courses</AndamioBadge>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Owned Courses</p>
                  <p className="text-xs text-muted-foreground">
                    Available for creator route examples
                  </p>
                </div>
                <AndamioBadge variant="outline">{ownedCourses.length} courses</AndamioBadge>
              </div>
            </div>
          )}
        </AndamioCardContent>
      </AndamioCard>

      {/* API Endpoints Reference */}
      <AndamioCard>
        <AndamioCardHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <AndamioCardTitle>API Reference</AndamioCardTitle>
          </div>
          <AndamioCardDescription className="text-base">
            Database API endpoints used by this application
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="pt-4">
          <div className="space-y-2">
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium mb-1">API Base URL</p>
              <code className="text-xs font-mono text-primary">
                {env.NEXT_PUBLIC_ANDAMIO_API_URL}
              </code>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium mb-1">OpenAPI Documentation</p>
              <code className="text-xs font-mono text-primary">
                {env.NEXT_PUBLIC_ANDAMIO_API_URL.replace("/api/v0", "/openapi/v0.json")}
              </code>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium mb-1">Swagger UI</p>
              <code className="text-xs font-mono text-primary">
                {env.NEXT_PUBLIC_ANDAMIO_API_URL.replace("/api/v0", "/swagger/index.html")}
              </code>
            </div>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    </div>
  );
}
