"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { env } from "~/env";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AlertCircle, ArrowLeft, CheckSquare, FolderKanban } from "lucide-react";
import { type ListPublishedTreasuriesOutput, type CreateTaskOutput } from "@andamio/db-api";
import { formatLovelace } from "~/lib/cardano-utils";

type TaskListOutput = CreateTaskOutput[];

/**
 * Project detail page displaying project info and tasks list
 *
 * API Endpoints:
 * - POST /projects/list (public) - with treasury_nft_policy_id filter
 * - POST /tasks/list (public) - tasks for this project
 */
export default function ProjectDetailPage() {
  const params = useParams();
  const treasuryNftPolicyId = params.treasurynft as string;

  const [project, setProject] = useState<ListPublishedTreasuriesOutput[0] | null>(null);
  const [tasks, setTasks] = useState<TaskListOutput>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectAndTasks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch project details (POST with body)
        const projectResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/projects/list`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ treasury_nft_policy_id: treasuryNftPolicyId }),
          }
        );

        if (!projectResponse.ok) {
          const errorText = await projectResponse.text();
          console.error("Project fetch error:", {
            status: projectResponse.status,
            statusText: projectResponse.statusText,
            body: errorText,
          });
          throw new Error(`Project not found (${projectResponse.status})`);
        }

        const projectsData = (await projectResponse.json()) as ListPublishedTreasuriesOutput;

        // Find the specific project by treasury_nft_policy_id
        const projectData = projectsData.find(
          (p) => p.treasury_nft_policy_id === treasuryNftPolicyId
        );

        if (!projectData) {
          throw new Error("Project not found");
        }

        setProject(projectData);

        // Fetch tasks for this project (POST with body)
        const tasksResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/tasks/list`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ treasury_nft_policy_id: treasuryNftPolicyId }),
          }
        );

        if (!tasksResponse.ok) {
          const errorText = await tasksResponse.text();
          console.error("Tasks fetch error:", {
            status: tasksResponse.status,
            statusText: tasksResponse.statusText,
            body: errorText,
          });
          // Don't throw - project might have no tasks yet
          console.warn("Failed to fetch tasks:", errorText);
        } else {
          const tasksData = (await tasksResponse.json()) as TaskListOutput;
          setTasks(tasksData ?? []);
        }
      } catch (err) {
        console.error("Error fetching project and tasks:", err);
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProjectAndTasks();
  }, [treasuryNftPolicyId]);

  // Helper to get status badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "ON_CHAIN":
        return "default";
      case "DRAFT":
        return "secondary";
      case "EXPIRED":
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <AndamioSkeleton className="h-9 w-64 mb-2" />
          <AndamioSkeleton className="h-5 w-96" />
        </div>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <AndamioSkeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="space-y-6">
        <Link href="/project">
          <AndamioButton variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </AndamioButton>
        </Link>

        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>
            {error ?? "Project not found"}
          </AndamioAlertDescription>
        </AndamioAlert>
      </div>
    );
  }

  // Filter tasks to show only live tasks for public view
  const liveTasks = tasks.filter((task) => task.status === "ON_CHAIN");

  // Empty tasks state
  if (liveTasks.length === 0) {
    return (
      <div className="space-y-6">
        <Link href="/project">
          <AndamioButton variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </AndamioButton>
        </Link>

        <div>
          <h1 className="text-3xl font-bold">{project.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <AndamioBadge variant="outline" className="font-mono text-xs">
              {project.treasury_nft_policy_id?.slice(0, 16)}...
            </AndamioBadge>
            <AndamioBadge variant="secondary">
              {project.total_ada?.toLocaleString() ?? 0} ADA
            </AndamioBadge>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md">
          <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            No tasks available for this project yet.
          </p>
        </div>
      </div>
    );
  }

  // Project and tasks display
  return (
    <div className="space-y-6">
      <Link href="/project">
        <AndamioButton variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Projects
        </AndamioButton>
      </Link>

      <div>
        <h1 className="text-3xl font-bold">{project.title}</h1>
        <div className="flex items-center gap-2 mt-2">
          <AndamioBadge variant="outline" className="font-mono text-xs">
            {project.treasury_nft_policy_id?.slice(0, 16)}...
          </AndamioBadge>
          <AndamioBadge variant="secondary">
            {project.total_ada?.toLocaleString() ?? 0} ADA
          </AndamioBadge>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Available Tasks</h2>
        <div className="border rounded-md">
          <AndamioTable>
            <AndamioTableHeader>
              <AndamioTableRow>
                <AndamioTableHead className="w-16">#</AndamioTableHead>
                <AndamioTableHead>Title</AndamioTableHead>
                <AndamioTableHead>Description</AndamioTableHead>
                <AndamioTableHead className="w-32 text-center">Reward</AndamioTableHead>
                <AndamioTableHead className="w-32 text-center">Status</AndamioTableHead>
              </AndamioTableRow>
            </AndamioTableHeader>
            <AndamioTableBody>
              {liveTasks.map((task) => (
                <AndamioTableRow key={task.task_hash ?? task.index}>
                  <AndamioTableCell className="font-mono text-xs">
                    {task.index}
                  </AndamioTableCell>
                  <AndamioTableCell>
                    {task.task_hash ? (
                      <Link
                        href={`/project/${treasuryNftPolicyId}/${task.task_hash}`}
                        className="font-medium hover:underline"
                      >
                        {task.title}
                      </Link>
                    ) : (
                      <span className="font-medium">{task.title}</span>
                    )}
                  </AndamioTableCell>
                  <AndamioTableCell className="max-w-xs truncate">
                    {task.description}
                  </AndamioTableCell>
                  <AndamioTableCell className="text-center">
                    <AndamioBadge variant="outline">
                      {formatLovelace(task.lovelace)}
                    </AndamioBadge>
                  </AndamioTableCell>
                  <AndamioTableCell className="text-center">
                    <AndamioBadge variant={getStatusVariant(task.status)}>
                      {task.status === "ON_CHAIN" ? "Live" : task.status}
                    </AndamioBadge>
                  </AndamioTableCell>
                </AndamioTableRow>
              ))}
            </AndamioTableBody>
          </AndamioTable>
        </div>
      </div>
    </div>
  );
}
