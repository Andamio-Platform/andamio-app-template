"use client";

import React, { useState } from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useCourse } from "~/hooks/api";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioText } from "~/components/andamio/andamio-text";
import {
  TeacherIcon,
  OnChainIcon,
  RefreshIcon,
  SuccessIcon,
  AlertIcon,
  DatabaseIcon,
} from "~/components/icons";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

interface CourseTeachersCardProps {
  courseNftPolicyId: string;
  className?: string;
}

interface SyncTeachersResponse {
  course_nft_policy_id: string;
  teachers_synced: string[];
  success: boolean;
}

/**
 * Card showing course owner and teachers from on-chain data
 * with ability to sync to database
 */
export function CourseTeachersCard({
  courseNftPolicyId,
  className,
}: CourseTeachersCardProps) {
  const { authenticatedFetch } = useAndamioAuth();
  const {
    data: course,
    isLoading: isLoadingCourse,
    error: courseError,
    refetch: refetchCourse,
  } = useCourse(courseNftPolicyId);

  const [isSyncing, setIsSyncing] = useState(false);
  const [dbTeachers, setDbTeachers] = useState<string[] | null>(null);
  const [lastSyncSuccess, setLastSyncSuccess] = useState<boolean | null>(null);

  // Get teachers from merged course data
  const onChainTeachers = course?.teachers ?? [];

  const handleSyncTeachers = async () => {
    setIsSyncing(true);
    setLastSyncSuccess(null);

    try {
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/owner/course/sync-teachers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message ?? "Failed to sync teachers");
      }

      const result = (await response.json()) as SyncTeachersResponse;
      setDbTeachers(result.teachers_synced);
      setLastSyncSuccess(result.success);

      toast.success("Teachers Synced", {
        description: `${result.teachers_synced.length} teacher(s) synced from on-chain data`,
      });

      // Refresh course data to ensure we're showing latest
      void refetchCourse();
    } catch (err) {
      console.error("Error syncing teachers:", err);
      setLastSyncSuccess(false);
      toast.error("Sync Failed", {
        description: err instanceof Error ? err.message : "Failed to sync teachers",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Compare on-chain and DB teachers
  const teachersMatch =
    dbTeachers !== null &&
    onChainTeachers.length === dbTeachers.length &&
    onChainTeachers.every((t: string) => dbTeachers.includes(t));

  return (
    <AndamioCard className={cn("", className)}>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <AndamioCardTitle className="text-base flex items-center gap-2">
            <TeacherIcon className="h-4 w-4" />
            Course Team
          </AndamioCardTitle>
          <AndamioButton
            variant="outline"
            size="sm"
            onClick={handleSyncTeachers}
            disabled={isSyncing || isLoadingCourse}
            className="h-7 text-xs"
          >
            {isSyncing ? (
              <>
                <RefreshIcon className="h-3 w-3 mr-1 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshIcon className="h-3 w-3 mr-1" />
                Sync from Chain
              </>
            )}
          </AndamioButton>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* On-Chain Teachers */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <OnChainIcon className="h-3.5 w-3.5 text-primary" />
            <AndamioText variant="small" className="font-medium">
              On-Chain Teachers
            </AndamioText>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {isLoadingCourse ? (
              <>
                <AndamioSkeleton className="h-6 w-20" />
                <AndamioSkeleton className="h-6 w-16" />
              </>
            ) : courseError ? (
              <AndamioText variant="small" className="text-destructive">
                Failed to load on-chain data
              </AndamioText>
            ) : onChainTeachers.length === 0 ? (
              <AndamioText variant="small" className="text-muted-foreground">
                No teachers found on-chain
              </AndamioText>
            ) : (
              onChainTeachers.map((teacher: string) => (
                <AndamioBadge
                  key={teacher}
                  variant="secondary"
                  className="font-mono text-xs"
                >
                  {teacher}
                </AndamioBadge>
              ))
            )}
          </div>
        </div>

        {/* Database Teachers (only shown after sync) */}
        {dbTeachers !== null && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DatabaseIcon className="h-3.5 w-3.5 text-info" />
              <AndamioText variant="small" className="font-medium">
                Database Teachers
              </AndamioText>
              {lastSyncSuccess !== null && (
                teachersMatch ? (
                  <AndamioBadge variant="outline" className="h-5 text-[10px] bg-success/10 border-success/30 text-success">
                    <SuccessIcon className="h-2.5 w-2.5 mr-0.5" />
                    In Sync
                  </AndamioBadge>
                ) : (
                  <AndamioBadge variant="outline" className="h-5 text-[10px] bg-warning/10 border-warning/30 text-warning">
                    <AlertIcon className="h-2.5 w-2.5 mr-0.5" />
                    Mismatch
                  </AndamioBadge>
                )
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {dbTeachers.length === 0 ? (
                <AndamioText variant="small" className="text-muted-foreground">
                  No teachers in database
                </AndamioText>
              ) : (
                dbTeachers.map((teacher) => (
                  <AndamioBadge
                    key={teacher}
                    variant="outline"
                    className={cn(
                      "font-mono text-xs",
                      onChainTeachers.includes(teacher)
                        ? "bg-success/10 border-success/30"
                        : "bg-warning/10 border-warning/30"
                    )}
                  >
                    {teacher}
                  </AndamioBadge>
                ))
              )}
            </div>
          </div>
        )}

        {/* Sync hint when DB teachers not yet loaded */}
        {dbTeachers === null && !isLoadingCourse && (
          <AndamioText variant="small" className="text-muted-foreground">
            Click &quot;Sync from Chain&quot; to sync teachers to the database
          </AndamioText>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
