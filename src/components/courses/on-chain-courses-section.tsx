"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useCoursesOwnedByAlias } from "~/hooks/use-andamioscan";
import { env } from "~/env";
import { getTokenExplorerUrl, type CardanoNetwork } from "~/lib/constants";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioBadge,
  AndamioButton,
  AndamioSkeleton,
  AndamioAlert,
  AndamioAlertDescription,
  AndamioInput,
  AndamioLabel,
  AndamioDrawer,
  AndamioDrawerClose,
  AndamioDrawerContent,
  AndamioDrawerDescription,
  AndamioDrawerFooter,
  AndamioDrawerHeader,
  AndamioDrawerTitle,
  AndamioDrawerTrigger,
  AndamioTooltip,
  AndamioTooltipContent,
  AndamioTooltipTrigger,
} from "~/components/andamio";
import {
  CheckCircle,
  AlertCircle,
  Plus,
  Settings,
  Blocks,
  Loader2,
  ExternalLink,
  Clock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { type ListOwnedCoursesOutput } from "@andamio/db-api";

/**
 * Represents a course with hybrid on-chain + DB status
 */
interface HybridCourseStatus {
  courseId: string;
  title: string | null;
  /** Course exists in our database */
  inDb: boolean;
  /** Course found on-chain via Andamioscan */
  onChain: boolean;
  /** On-chain module count (0 if not on-chain yet) */
  onChainModuleCount: number;
  /** Teachers from on-chain data */
  teachers: string[];
  /** Full DB course data if available */
  dbCourse?: ListOwnedCoursesOutput[number];
}

/**
 * OnChainCoursesSection - Hybrid view of Course NFTs
 *
 * Shows courses from BOTH sources:
 * - Database (immediate after minting)
 * - Andamioscan (on-chain truth, may be delayed)
 *
 * Dedupes by courseId and shows status indicators for each source.
 */
export function OnChainCoursesSection() {
  const { user, isAuthenticated, authenticatedFetch } = useAndamioAuth();
  const alias = user?.accessTokenAlias ?? undefined;

  // Fetch on-chain courses owned by user (may be delayed)
  const {
    data: onChainCourses,
    isLoading: isLoadingOnChain,
    error: onChainError,
    refetch: refetchOnChain,
  } = useCoursesOwnedByAlias(alias);

  // Fetch DB courses (immediate)
  const [dbCourses, setDbCourses] = useState<ListOwnedCoursesOutput>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  const fetchDbCourses = useCallback(async () => {
    if (!isAuthenticated) {
      setDbCourses([]);
      return;
    }

    setIsLoadingDb(true);
    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/owned`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      if (response.ok) {
        const data = (await response.json()) as ListOwnedCoursesOutput;
        setDbCourses(data ?? []);
      }
    } catch (err) {
      console.error("Error fetching DB courses:", err);
    } finally {
      setIsLoadingDb(false);
    }
  }, [isAuthenticated, authenticatedFetch]);

  useEffect(() => {
    void fetchDbCourses();
  }, [fetchDbCourses]);

  // Merge and dedupe courses from both sources
  const hybridCourses = useMemo<HybridCourseStatus[]>(() => {
    const courseMap = new Map<string, HybridCourseStatus>();

    // First, add all DB courses (these show up immediately after mint)
    for (const dbCourse of dbCourses) {
      if (dbCourse.course_nft_policy_id) {
        courseMap.set(dbCourse.course_nft_policy_id, {
          courseId: dbCourse.course_nft_policy_id,
          title: dbCourse.title,
          inDb: true,
          onChain: false, // Will be updated if found on-chain
          onChainModuleCount: 0,
          teachers: [],
          dbCourse,
        });
      }
    }

    // Then, merge in on-chain courses (updates existing or adds new)
    if (onChainCourses) {
      for (const onChainCourse of onChainCourses) {
        const existing = courseMap.get(onChainCourse.course_id);
        if (existing) {
          // Update existing DB entry with on-chain data
          existing.onChain = true;
          existing.onChainModuleCount = onChainCourse.modules.length;
          existing.teachers = onChainCourse.teachers;
        } else {
          // On-chain course not in DB (shouldn't happen often, but possible)
          courseMap.set(onChainCourse.course_id, {
            courseId: onChainCourse.course_id,
            title: null,
            inDb: false,
            onChain: true,
            onChainModuleCount: onChainCourse.modules.length,
            teachers: onChainCourse.teachers,
          });
        }
      }
    }

    // Sort: DB courses first (most recent), then by courseId
    return Array.from(courseMap.values()).sort((a, b) => {
      // Prioritize courses in DB (they're actionable)
      if (a.inDb && !b.inDb) return -1;
      if (!a.inDb && b.inDb) return 1;
      return a.courseId.localeCompare(b.courseId);
    });
  }, [dbCourses, onChainCourses]);

  // Stats
  const totalCount = hybridCourses.length;
  const onChainCount = hybridCourses.filter((c) => c.onChain).length;
  const pendingCount = hybridCourses.filter((c) => c.inDb && !c.onChain).length;

  const handleRefresh = () => {
    void fetchDbCourses();
    refetchOnChain();
  };

  const handleImportSuccess = () => {
    handleRefresh();
  };

  if (!isAuthenticated || !alias) {
    return null;
  }

  const isLoading = isLoadingOnChain || isLoadingDb;

  return (
    <AndamioCard>
      <AndamioCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Blocks className="h-5 w-5 text-primary" />
            </div>
            <div>
              <AndamioCardTitle>Your Courses</AndamioCardTitle>
              <AndamioCardDescription>
                Courses you own as a teacher
              </AndamioCardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isLoading && totalCount > 0 && (
              <div className="flex gap-2">
                <AndamioBadge variant="secondary">
                  {onChainCount} on-chain
                </AndamioBadge>
                {pendingCount > 0 && (
                  <AndamioTooltip>
                    <AndamioTooltipTrigger asChild>
                      <AndamioBadge variant="outline" className="text-info border-info">
                        <Clock className="h-3 w-3 mr-1" />
                        {pendingCount} syncing
                      </AndamioBadge>
                    </AndamioTooltipTrigger>
                    <AndamioTooltipContent>
                      <p>Waiting for blockchain indexer to confirm</p>
                    </AndamioTooltipContent>
                  </AndamioTooltip>
                )}
              </div>
            )}
            <AndamioButton
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </AndamioButton>
          </div>
        </div>
      </AndamioCardHeader>

      <AndamioCardContent>
        {/* Loading state */}
        {isLoading && hybridCourses.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <AndamioSkeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {/* Error state - only show if no data at all */}
        {onChainError && hybridCourses.length === 0 && (
          <AndamioAlert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AndamioAlertDescription>
              Failed to fetch on-chain data: {onChainError.message}
            </AndamioAlertDescription>
          </AndamioAlert>
        )}

        {/* Empty state */}
        {!isLoading && hybridCourses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Blocks className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              No courses found.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Mint a Course NFT to get started!
            </p>
          </div>
        )}

        {/* Course list */}
        {hybridCourses.length > 0 && (
          <div className="space-y-3">
            {hybridCourses.map((course) => (
              <HybridCourseRow
                key={course.courseId}
                course={course}
                onImportSuccess={handleImportSuccess}
              />
            ))}
          </div>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}

/**
 * Individual course row with hybrid status
 */
function HybridCourseRow({
  course,
  onImportSuccess,
}: {
  course: HybridCourseStatus;
  onImportSuccess: () => void;
}) {
  const truncatedId = `${course.courseId.slice(0, 8)}...${course.courseId.slice(-8)}`;

  // Determine status icon
  const getStatusIcon = () => {
    if (course.inDb && course.onChain) {
      // Fully synced
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-4 w-4 text-success" />
        </div>
      );
    } else if (course.inDb && !course.onChain) {
      // In DB but not yet on-chain (syncing)
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-info/10">
          <Clock className="h-4 w-4 text-info animate-pulse" />
        </div>
      );
    } else {
      // On-chain but not in DB (needs import)
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
        </div>
      );
    }
  };

  // Determine status text
  const getStatusText = () => {
    if (course.inDb && course.onChain) {
      return (
        <span className="text-xs text-success">Confirmed on-chain</span>
      );
    } else if (course.inDb && !course.onChain) {
      return (
        <span className="text-xs text-info">Syncing with blockchain...</span>
      );
    } else {
      return (
        <span className="text-xs text-warning">Not in database</span>
      );
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-4 min-w-0">
        {/* Status indicator */}
        {getStatusIcon()}

        {/* Course info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {course.title ? (
              <p className="font-medium truncate">{course.title}</p>
            ) : (
              <p className="font-medium text-muted-foreground italic">
                Untitled Course
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <code className="font-mono">{truncatedId}</code>
            {course.onChain && (
              <>
                <span className="text-muted-foreground/50">|</span>
                <span>{course.onChainModuleCount} modules on-chain</span>
              </>
            )}
          </div>
          {/* Status line */}
          <div className="mt-1">
            {getStatusText()}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {course.inDb ? (
          <Link href={`/studio/course/${course.courseId}`}>
            <AndamioButton variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Manage
            </AndamioButton>
          </Link>
        ) : (
          <ImportCourseDrawer
            courseId={course.courseId}
            onSuccess={onImportSuccess}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Drawer for importing an unregistered Course NFT
 */
function ImportCourseDrawer({
  courseId,
  onSuccess,
}: {
  courseId: string;
  onSuccess: () => void;
}) {
  const { authenticatedFetch } = useAndamioAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImport = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/create-on-submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            course_nft_policy_id: courseId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message ?? "Failed to import course");
      }

      toast.success("Course Imported!", {
        description: `"${title.trim()}" is now registered in your studio.`,
      });

      setOpen(false);
      setTitle("");
      onSuccess();
    } catch (err) {
      console.error("Error importing course:", err);
      toast.error("Import Failed", {
        description: err instanceof Error ? err.message : "Failed to import course",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const truncatedId = `${courseId.slice(0, 12)}...${courseId.slice(-12)}`;

  return (
    <AndamioDrawer open={open} onOpenChange={setOpen}>
      <AndamioDrawerTrigger asChild>
        <AndamioButton variant="default" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Import
        </AndamioButton>
      </AndamioDrawerTrigger>
      <AndamioDrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <AndamioDrawerHeader className="text-left">
            <AndamioDrawerTitle>Import Course NFT</AndamioDrawerTitle>
            <AndamioDrawerDescription>
              This Course NFT exists on-chain but isn&apos;t registered in your
              studio yet. Give it a title to start building your course.
            </AndamioDrawerDescription>
          </AndamioDrawerHeader>

          <div className="space-y-4 px-4">
            {/* Course ID display */}
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Course NFT Policy ID</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono flex-1 truncate">
                  {truncatedId}
                </code>
                <a
                  href={getTokenExplorerUrl(courseId, (env.NEXT_PUBLIC_CARDANO_NETWORK ?? "preprod") as CardanoNetwork)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Title input */}
            <div className="space-y-2">
              <AndamioLabel htmlFor="import-title">Course Title</AndamioLabel>
              <AndamioInput
                id="import-title"
                placeholder="Enter a title for your course"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                You can change this later. This just gets your course registered.
              </p>
            </div>
          </div>

          <AndamioDrawerFooter className="flex-row gap-3 pt-6">
            <AndamioDrawerClose asChild>
              <AndamioButton variant="outline" className="flex-1" disabled={isSubmitting}>
                Cancel
              </AndamioButton>
            </AndamioDrawerClose>
            <AndamioButton
              className="flex-1"
              onClick={handleImport}
              disabled={!title.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Import Course
                </>
              )}
            </AndamioButton>
          </AndamioDrawerFooter>
        </div>
      </AndamioDrawerContent>
    </AndamioDrawer>
  );
}
