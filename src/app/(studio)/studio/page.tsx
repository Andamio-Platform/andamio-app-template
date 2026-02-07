"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@meshsdk/react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import { AndamioScrollArea } from "~/components/andamio/andamio-scroll-area";
import {
  useTeacherCourses,
  useInvalidateTeacherCourses,
  useRegisterCourse,
  useUpdateCourse,
} from "~/hooks/api";
import {
  useOwnerProjects,
  useManagerProjects,
} from "~/hooks/api";
import {
  AndamioButton,
  AndamioInput,
  AndamioLabel,
} from "~/components/andamio";
import { toast } from "sonner";
import { CreateProject } from "~/components/tx";
import {
  CourseIcon,
  ProjectIcon,
  AddIcon,
  AlertIcon,
  LoadingIcon,
} from "~/components/icons";
import { AndamioText } from "~/components/andamio/andamio-text";
import { useStudioContext } from "./studio-context";

// =============================================================================
// Main Page Component
// =============================================================================

/**
 * Studio Home Page
 * Shows welcome panel with create options, or create forms via shared context.
 */
export default function StudioHomePage() {
  const router = useRouter();
  const { createMode, showCreateCourse, showCreateProject, cancelCreate } = useStudioContext();

  // Data for counts
  const { data: courses = [] } = useTeacherCourses();
  const { data: ownedProjects = [] } = useOwnerProjects();
  const { data: managedProjects = [] } = useManagerProjects();

  const ownedIds = new Set(ownedProjects.map((p) => p.projectId));
  const managedOnly = managedProjects.filter((p) => !ownedIds.has(p.projectId));
  const projectCount = ownedProjects.length + managedOnly.length;

  if (createMode === "course") {
    return <CreateCoursePanel onCancel={cancelCreate} />;
  }

  if (createMode === "project") {
    return (
      <CreateProjectPanel
        onCancel={cancelCreate}
        onSuccess={(projectId) => {
          router.push(`/studio/project/${projectId}`);
        }}
      />
    );
  }

  return (
    <WelcomePanel
      courseCount={courses.length}
      projectCount={projectCount}
      onCreateCourse={showCreateCourse}
      onCreateProject={showCreateProject}
    />
  );
}

// =============================================================================
// Welcome Panel
// =============================================================================

interface WelcomePanelProps {
  courseCount: number;
  projectCount: number;
  onCreateCourse: () => void;
  onCreateProject: () => void;
}

function WelcomePanel({ courseCount, projectCount, onCreateCourse, onCreateProject }: WelcomePanelProps) {
  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-lg text-center">
          {/* Icon */}
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent ring-1 ring-primary/20 mx-auto mb-6 shadow-lg shadow-primary/10">
            <CourseIcon className="h-10 w-10 text-primary" />
          </div>

          {/* Title */}
          <h1>Studio</h1>
          <AndamioText variant="muted" className="text-base mb-8">
            Create, manage, and publish courses and projects on Cardano
          </AndamioText>

          {/* Quick Actions - Stacked */}
          <div className="flex flex-col gap-6 mb-8 max-w-xs mx-auto">
            <div className="space-y-2 text-center">
              <AndamioButton size="lg" className="w-full" onClick={onCreateCourse}>
                <CourseIcon className="mr-2 h-5 w-5" />
                Create a Course
              </AndamioButton>
              <AndamioText variant="small" className="text-muted-foreground">
                Build learning content with modules and SLTs
              </AndamioText>
            </div>

            <div className="space-y-2 text-center">
              <AndamioButton size="lg" variant="outline" className="w-full" onClick={onCreateProject}>
                <ProjectIcon className="mr-2 h-5 w-5" />
                Create a Project
              </AndamioButton>
              <AndamioText variant="small" className="text-muted-foreground">
                Manage contributors and issue credentials
              </AndamioText>
            </div>
          </div>

          {/* Stats */}
          {(courseCount > 0 || projectCount > 0) && (
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{courseCount}</div>
                <AndamioText variant="small" className="text-muted-foreground">
                  Course{courseCount !== 1 ? "s" : ""}
                </AndamioText>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">{projectCount}</div>
                <AndamioText variant="small" className="text-muted-foreground">
                  Project{projectCount !== 1 ? "s" : ""}
                </AndamioText>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Create Course Panel (Inline Form)
// =============================================================================

interface CreateCoursePanelProps {
  onCancel: () => void;
}

function CreateCoursePanel({ onCancel }: CreateCoursePanelProps) {
  const router = useRouter();
  const { user } = useAndamioAuth();
  const { wallet, connected } = useWallet();
  const { state, result, error, execute, reset } = useTransaction();
  const invalidateTeacherCourses = useInvalidateTeacherCourses();
  const registerCourse = useRegisterCourse();
  const updateCourse = useUpdateCourse();

  const [title, setTitle] = useState("");
  const [initiatorData, setInitiatorData] = useState<{
    used_addresses: string[];
    change_address: string;
  } | null>(null);

  const [courseMetadata, setCourseMetadata] = useState<{
    policyId: string;
    title: string;
  } | null>(null);
  const courseMetadataRef = React.useRef<typeof courseMetadata>(null);

  useEffect(() => {
    courseMetadataRef.current = courseMetadata;
  }, [courseMetadata]);

  const hasRegisteredRef = React.useRef(false);
  const onCancelRef = React.useRef(onCancel);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  const { status: txStatus, isSuccess: txConfirmed } = useTxStream(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        void (async () => {
          const metadata = courseMetadataRef.current;

          if (
            (status.state === "confirmed" || status.state === "updated") &&
            !hasRegisteredRef.current &&
            metadata
          ) {
            hasRegisteredRef.current = true;

            let registrationSucceeded = false;
            try {
              await registerCourse.mutateAsync({
                courseId: metadata.policyId,
                title: metadata.title,
              });
              registrationSucceeded = true;
            } catch (err) {
              const error = err as Error & { status?: number };
              if (error.status === 409) {
                try {
                  await updateCourse.mutateAsync({
                    courseId: metadata.policyId,
                    data: { title: metadata.title },
                  });
                  registrationSucceeded = true;
                } catch (updateErr) {
                  console.error("[CreateCourse] Update failed:", updateErr);
                }
              } else {
                console.error("[CreateCourse] Registration failed:", err);
              }
            }

            await invalidateTeacherCourses();

            if (registrationSucceeded) {
              toast.success("Course Created!", {
                description: `"${metadata.title}" is now live`,
                action: {
                  label: "Open Course",
                  onClick: () => router.push(`/studio/course/${metadata.policyId}`),
                },
              });
            } else {
              toast.warning("Course Created (Registration Pending)", {
                description: "Course is on-chain. It may take a moment to appear.",
              });
            }

            setTitle("");
            setCourseMetadata(null);
            hasRegisteredRef.current = false;
            reset();

            // Return to welcome state
            onCancelRef.current();
          } else if (status.state === "failed" || status.state === "expired") {
            toast.error("Course Creation Failed", {
              description: status.last_error ?? "Please try again or contact support.",
            });
          }
        })();
      },
    }
  );

  useEffect(() => {
    const fetchWalletData = async () => {
      if (!wallet || !connected) {
        setInitiatorData(null);
        return;
      }

      try {
        const usedAddresses = await wallet.getUsedAddresses();
        const changeAddress = await wallet.getChangeAddress();
        setInitiatorData({
          used_addresses: usedAddresses,
          change_address: changeAddress,
        });
      } catch (err) {
        console.error("Failed to fetch wallet data:", err);
        setInitiatorData(null);
      }
    };

    void fetchWalletData();
  }, [wallet, connected]);

  const handleCreateCourse = async () => {
    if (!user?.accessTokenAlias || !initiatorData || !title.trim()) {
      return;
    }

    hasRegisteredRef.current = false;

    await execute({
      txType: "INSTANCE_COURSE_CREATE",
      params: {
        alias: user.accessTokenAlias,
        teachers: [user.accessTokenAlias],
        initiator_data: initiatorData,
      },
      metadata: {
        title: title.trim(),
      },
      onSuccess: async (txResult) => {
        const courseId = txResult.apiResponse?.course_id as string | undefined;
        if (courseId) {
          setCourseMetadata({
            policyId: courseId,
            title: title.trim(),
          });
        }
      },
      onError: (txError) => {
        console.error("[CreateCourse] Error:", txError);
        toast.error("Minting Failed", {
          description: txError.message || "Failed to create course NFT",
        });
      },
    });
  };

  const hasAccessToken = !!user?.accessTokenAlias;
  const hasInitiatorData = !!initiatorData;
  const hasTitle = title.trim().length > 0;
  const canCreate = hasAccessToken && hasInitiatorData && hasTitle;
  const isWaitingForConfirmation = state === "success" && result?.requiresDBUpdate && !txConfirmed;

  return (
    <div className="h-full overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      <AndamioScrollArea className="h-full">
        <div className="p-8 pb-16">
          <div className="max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-5xl w-full mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <CourseIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Create Course</h2>
                  <AndamioText variant="small" className="text-muted-foreground">
                    Mint a Course NFT on Cardano
                  </AndamioText>
                </div>
              </div>
              <AndamioButton variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </AndamioButton>
            </div>

            {/* Requirements Alert */}
            {!hasAccessToken && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-6">
                <div className="flex items-center gap-2">
                  <AlertIcon className="h-4 w-4 text-destructive" />
                  <AndamioText className="text-sm text-destructive">
                    You need an Access Token to create a course. Mint one first!
                  </AndamioText>
                </div>
              </div>
            )}

            {hasAccessToken && !hasInitiatorData && (
              <div className="rounded-lg border border-border bg-muted/50 p-4 mb-6">
                <div className="flex items-center gap-2">
                  <LoadingIcon className="h-4 w-4 animate-spin text-muted-foreground" />
                  <AndamioText className="text-sm text-muted-foreground">
                    Loading wallet data...
                  </AndamioText>
                </div>
              </div>
            )}

            {/* Form */}
            {hasAccessToken && hasInitiatorData && !isWaitingForConfirmation && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <AndamioLabel htmlFor="course-title" className="text-base">
                    Course Title <span className="text-destructive">*</span>
                  </AndamioLabel>
                  <AndamioInput
                    id="course-title"
                    placeholder="Introduction to Cardano Development"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={state !== "idle" && state !== "error"}
                    className="h-12 text-base"
                    maxLength={200}
                  />
                  <AndamioText variant="small" className="text-muted-foreground">
                    The display name shown to learners. You can change this later.
                  </AndamioText>
                </div>

                {/* Transaction Status */}
                {state !== "idle" && (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                      {state === "error" ? (
                        <AlertIcon className="h-5 w-5 text-destructive" />
                      ) : (
                        <LoadingIcon className="h-5 w-5 animate-spin text-primary" />
                      )}
                      <div className="flex-1">
                        <AndamioText className="font-medium">
                          {state === "fetching" && "Preparing transaction..."}
                          {state === "signing" && "Please sign in your wallet"}
                          {state === "submitting" && "Submitting to blockchain..."}
                          {state === "error" && "Transaction failed"}
                        </AndamioText>
                        {error && (
                          <AndamioText variant="small" className="text-destructive">
                            {error.message}
                          </AndamioText>
                        )}
                      </div>
                    </div>
                    {state === "error" && (
                      <AndamioButton
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => reset()}
                      >
                        Try Again
                      </AndamioButton>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <AndamioButton
                    variant="outline"
                    className="flex-1"
                    onClick={onCancel}
                    disabled={state !== "idle" && state !== "error"}
                  >
                    Cancel
                  </AndamioButton>
                  <AndamioButton
                    className="flex-1"
                    onClick={handleCreateCourse}
                    disabled={!canCreate || (state !== "idle" && state !== "error")}
                  >
                    {state === "idle" || state === "error" ? (
                      <>
                        <AddIcon className="h-4 w-4 mr-2" />
                        Mint Course NFT
                      </>
                    ) : (
                      <>
                        <LoadingIcon className="h-4 w-4 mr-2 animate-spin" />
                        {state === "fetching" && "Preparing..."}
                        {state === "signing" && "Sign in Wallet"}
                        {state === "submitting" && "Minting..."}
                      </>
                    )}
                  </AndamioButton>
                </div>
              </div>
            )}

            {/* Waiting for Confirmation */}
            {isWaitingForConfirmation && (
              <div className="rounded-lg border bg-muted/30 p-6 text-center">
                <LoadingIcon className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                <AndamioText className="font-medium mb-1">
                  Confirming on blockchain...
                </AndamioText>
                <AndamioText variant="small" className="text-muted-foreground">
                  {txStatus?.state === "pending" && "Waiting for block confirmation"}
                  {txStatus?.state === "confirmed" && "Registering course..."}
                  {!txStatus && "Registering transaction..."}
                </AndamioText>
                {courseMetadata && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <AndamioText variant="small" className="text-muted-foreground">
                      Creating &quot;{courseMetadata.title}&quot;
                    </AndamioText>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AndamioScrollArea>
    </div>
  );
}

// =============================================================================
// Create Project Panel (Inline)
// =============================================================================

interface CreateProjectPanelProps {
  onCancel: () => void;
  onSuccess: (projectId: string) => void;
}

function CreateProjectPanel({ onCancel, onSuccess }: CreateProjectPanelProps) {
  return (
    <div className="h-full overflow-hidden bg-gradient-to-br from-background via-background to-secondary/5">
      <AndamioScrollArea className="h-full">
        <div className="p-8 pb-16">
          <div className="max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-5xl w-full mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
                  <ProjectIcon className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Create Project</h2>
                  <AndamioText variant="small" className="text-muted-foreground">
                    Mint a Project NFT on Cardano
                  </AndamioText>
                </div>
              </div>
              <AndamioButton variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </AndamioButton>
            </div>

            {/* Create Project Component */}
            <CreateProject onSuccess={onSuccess} />
          </div>
        </div>
      </AndamioScrollArea>
    </div>
  );
}
