"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { env } from "~/env";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { AlertCircle, BookOpen } from "lucide-react";
import { type RouterOutputs } from "andamio-db-api";

type ModuleOutput = RouterOutputs["courseModule"]["getCourseModuleByCourseNftPolicyId"];
type LessonListOutput = RouterOutputs["lesson"]["getModuleLessons"];

export default function ModuleLessonsPage() {
  const params = useParams();
  const courseNftPolicyId = params.coursenft as string;
  const moduleCode = params.modulecode as string;

  const [module, setModule] = useState<ModuleOutput | null>(null);
  const [lessons, setLessons] = useState<LessonListOutput>([]);
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

        const moduleData = (await moduleResponse.json()) as ModuleOutput;
        setModule(moduleData);

        // Fetch module lessons
        const lessonsResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/${courseNftPolicyId}/modules/${moduleCode}/lessons`
        );

        if (!lessonsResponse.ok) {
          throw new Error(`Failed to fetch lessons: ${lessonsResponse.statusText}`);
        }

        const lessonsData = (await lessonsResponse.json()) as LessonListOutput;
        setLessons(lessonsData ?? []);
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
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
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

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error ?? "Module not found"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty lessons state
  if (lessons.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{module.title}</h1>
          {module.description && (
            <p className="text-muted-foreground">{module.description}</p>
          )}
          <div className="flex gap-2 pt-2">
            <Badge variant="outline" className="font-mono text-xs">
              {module.moduleCode}
            </Badge>
            <Badge variant="outline">{module.status}</Badge>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            No lessons found for this module.
          </p>
        </div>
      </div>
    );
  }

  // Module and lessons display
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{module.title}</h1>
        {module.description && (
          <p className="text-muted-foreground">{module.description}</p>
        )}
        <div className="flex gap-2 pt-2">
          <Badge variant="outline" className="font-mono text-xs">
            {module.moduleCode}
          </Badge>
          <Badge variant="outline">{module.status}</Badge>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Lessons</h2>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SLT</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Media</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessons.map((lesson) => (
                <TableRow key={lesson.sltIndex}>
                  <TableCell className="font-mono text-xs">
                    {lesson.sltIndex}
                  </TableCell>
                  <TableCell className="font-medium">
                    {lesson.title ?? lesson.sltText}
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {lesson.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {lesson.imageUrl && (
                        <Badge variant="outline">Image</Badge>
                      )}
                      {lesson.videoUrl && (
                        <Badge variant="outline">Video</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {lesson.live ? (
                      <Badge variant="default">Live</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
