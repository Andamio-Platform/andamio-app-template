"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AlertCircle, BookOpen, Settings, FileText } from "lucide-react";
import { type CourseModuleOutput, type ListSLTsOutput, type ListLessonsOutput } from "andamio-db-api";

/**
 * Public page displaying module details with SLTs and lessons
 *
 * API Endpoints:
 * - GET /course-modules/{courseNftPolicyId}/{moduleCode} (public)
 * - GET /slts/{courseNftPolicyId}/{moduleCode} (public)
 * - GET /lessons/{courseNftPolicyId}/{moduleCode} (public)
 * Type Reference: See API-TYPE-REFERENCE.md in andamio-db-api
 */


// Combined SLT + Lesson type
type CombinedSLTLesson = {
  moduleIndex: number;
  sltText: string;
  sltId: string;
  lesson?: {
    title: string | null;
    description: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    live: boolean | null;
  };
};

interface SLTLessonTableProps {
  data: CombinedSLTLesson[];
  courseNftPolicyId: string;
  moduleCode: string;
}

function SLTLessonTable({ data, courseNftPolicyId, moduleCode }: SLTLessonTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          No learning targets defined for this module.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <AndamioTable>
        <AndamioTableHeader>
          <AndamioTableRow>
            <AndamioTableHead className="w-20">Index</AndamioTableHead>
            <AndamioTableHead>Learning Target</AndamioTableHead>
            <AndamioTableHead>Lesson Title</AndamioTableHead>
            <AndamioTableHead>Description</AndamioTableHead>
            <AndamioTableHead className="w-32">Media</AndamioTableHead>
            <AndamioTableHead className="w-24">Status</AndamioTableHead>
          </AndamioTableRow>
        </AndamioTableHeader>
        <AndamioTableBody>
          {data.map((item) => (
            <AndamioTableRow key={item.moduleIndex}>
              <AndamioTableCell className="font-mono text-xs">
                <AndamioBadge variant="outline">{item.moduleIndex}</AndamioBadge>
              </AndamioTableCell>
              <AndamioTableCell className="font-medium">
                {item.sltText}
              </AndamioTableCell>
              <AndamioTableCell className="font-medium">
                {item.lesson ? (
                  <Link
                    href={`/course/${courseNftPolicyId}/${moduleCode}/${item.moduleIndex}`}
                    className="hover:underline text-primary"
                  >
                    {item.lesson.title ?? `Lesson ${item.moduleIndex}`}
                  </Link>
                ) : (
                  <span className="text-muted-foreground italic">No lesson yet</span>
                )}
              </AndamioTableCell>
              <AndamioTableCell>
                {item.lesson?.description ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </AndamioTableCell>
              <AndamioTableCell>
                {item.lesson ? (
                  <div className="flex gap-1">
                    {item.lesson.imageUrl && (
                      <AndamioBadge variant="outline">Image</AndamioBadge>
                    )}
                    {item.lesson.videoUrl && (
                      <AndamioBadge variant="outline">Video</AndamioBadge>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </AndamioTableCell>
              <AndamioTableCell>
                {item.lesson ? (
                  item.lesson.live ? (
                    <AndamioBadge variant="default">Live</AndamioBadge>
                  ) : (
                    <AndamioBadge variant="secondary">Draft</AndamioBadge>
                  )
                ) : (
                  <AndamioBadge variant="outline">No Lesson</AndamioBadge>
                )}
              </AndamioTableCell>
            </AndamioTableRow>
          ))}
        </AndamioTableBody>
      </AndamioTable>
    </div>
  );
}

export default function ModuleLessonsPage() {
  const params = useParams();
  const courseNftPolicyId = params.coursenft as string;
  const moduleCode = params.modulecode as string;
  const { isAuthenticated } = useAndamioAuth();

  const [module, setModule] = useState<CourseModuleOutput | null>(null);
  const [combinedData, setCombinedData] = useState<CombinedSLTLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModuleAndLessons = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch course module details
        const moduleResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}`
        );

        if (!moduleResponse.ok) {
          throw new Error(`Failed to fetch course module: ${moduleResponse.statusText}`);
        }

        const moduleData = (await moduleResponse.json()) as CourseModuleOutput;
        setModule(moduleData);

        // Fetch SLTs for the module
        const sltsResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slts/${courseNftPolicyId}/${moduleCode}`
        );

        if (!sltsResponse.ok) {
          throw new Error(`Failed to fetch SLTs: ${sltsResponse.statusText}`);
        }

        const sltsData = (await sltsResponse.json()) as ListSLTsOutput;

        // Fetch module lessons
        const lessonsResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/${courseNftPolicyId}/modules/${moduleCode}/lessons`
        );

        if (!lessonsResponse.ok) {
          throw new Error(`Failed to fetch lessons: ${lessonsResponse.statusText}`);
        }

        const lessonsData = (await lessonsResponse.json()) as ListLessonsOutput;

        // Combine SLTs and Lessons
        const combined: CombinedSLTLesson[] = sltsData.map((slt) => {
          const lesson = lessonsData.find((l) => l.sltIndex === slt.moduleIndex);
          return {
            moduleIndex: slt.moduleIndex,
            sltText: slt.sltText,
            sltId: slt.id,
            lesson: lesson
              ? {
                  title: lesson.title,
                  description: lesson.description,
                  imageUrl: lesson.imageUrl,
                  videoUrl: lesson.videoUrl,
                  live: lesson.live,
                }
              : undefined,
          };
        });

        setCombinedData(combined);
      } catch (err) {
        console.error("Error fetching module and lessons:", err);
        setError(err instanceof Error ? err.message : "Failed to load module");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchModuleAndLessons();
  }, [courseNftPolicyId, moduleCode]);

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
  if (error || !module) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Module Not Found</h1>
        </div>

        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>
            {error ?? "Module not found"}
          </AndamioAlertDescription>
        </AndamioAlert>
      </div>
    );
  }

  // Module display (with or without SLTs/lessons)
  // TypeScript type narrowing: module is guaranteed non-null here
  const moduleData: CourseModuleOutput = module;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{moduleData.title}</h1>
          {moduleData.description && (
            <p className="text-muted-foreground">{moduleData.description}</p>
          )}
          <div className="flex gap-2 pt-2">
            <AndamioBadge variant="outline" className="font-mono text-xs">
              {moduleData.moduleCode}
            </AndamioBadge>
            <AndamioBadge variant="outline">{moduleData.status}</AndamioBadge>
          </div>
        </div>
        {isAuthenticated && (
          <Link href={`/studio/course/${courseNftPolicyId}/${moduleCode}/slts`}>
            <AndamioButton variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Manage SLTs
            </AndamioButton>
          </Link>
        )}
      </div>

      {/* Student Learning Targets & Lessons Combined */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Student Learning Targets & Lessons</h2>
        <SLTLessonTable
          data={combinedData}
          courseNftPolicyId={courseNftPolicyId}
          moduleCode={moduleCode}
        />
      </div>

      {/* Module Assignment */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Module Assignment</h2>
          <Link href={`/course/${courseNftPolicyId}/${moduleCode}/assignment`}>
            <AndamioButton>
              <FileText className="h-4 w-4 mr-2" />
              View Assignment
            </AndamioButton>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Complete the assignment to demonstrate your understanding of this module&apos;s learning targets.
        </p>
      </div>
    </div>
  );
}
