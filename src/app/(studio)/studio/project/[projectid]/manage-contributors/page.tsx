"use client";

import { useParams } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useProject } from "~/hooks/api";
import {
  AndamioBadge,
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioPageHeader,
  AndamioPageLoading,
  AndamioTable,
  AndamioTableBody,
  AndamioTableCell,
  AndamioTableHead,
  AndamioTableHeader,
  AndamioTableRow,
  AndamioTableContainer,
  AndamioBackButton,
  AndamioErrorAlert,
  AndamioText,
  AndamioDashboardStat,
  AndamioScrollArea,
} from "~/components/andamio";
import { TeacherIcon, SuccessIcon, OnChainIcon } from "~/components/icons";
import { ConnectWalletGate } from "~/components/auth/connect-wallet-gate";

/**
 * Manage Contributors Page
 *
 * View on-chain contributors for a project.
 * Contributors data comes from the merged project endpoint.
 *
 * API Endpoint:
 * - GET /api/v2/project/user/project/{project_id}
 */
export default function ManageContributorsPage() {
  const params = useParams();
  const projectId = params.projectid as string;
  const { isAuthenticated } = useAndamioAuth();

  // Project data from merged API
  const { data: project, isLoading, error: projectError } = useProject(projectId);

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <ConnectWalletGate
        title="Manage Contributors"
        description="Connect your wallet to view contributors"
      />
    );
  }

  // Loading
  if (isLoading) {
    return <AndamioPageLoading variant="detail" />;
  }

  // Error state
  if (projectError || !project) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        <AndamioBackButton href={`/studio/project/${projectId}`} label="Back to Project" />
        <AndamioPageHeader title="Contributors" />
        <AndamioErrorAlert error={projectError?.message ?? "Project not found"} />
      </div>
    );
  }

  const contributors = project.contributors ?? [];

  return (
    <AndamioScrollArea className="h-full">
    <div className="min-h-full">
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <AndamioBackButton href={`/studio/project/${projectId}`} label="Back to Project" />

      <AndamioPageHeader
        title="Contributors"
        description={`On-chain contributors for ${project.title ?? "this project"}`}
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <AndamioDashboardStat
          icon={TeacherIcon}
          label="Total Contributors"
          value={contributors.length}
          valueColor={contributors.length > 0 ? "success" : undefined}
          iconColor={contributors.length > 0 ? "success" : undefined}
        />
        <AndamioDashboardStat
          icon={OnChainIcon}
          label="On-Chain Status"
          value={project.status === "active" ? "Live" : "Draft"}
          valueColor={project.status === "active" ? "success" : undefined}
          iconColor={project.status === "active" ? "success" : undefined}
        />
      </div>

      {/* Contributors Card */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle className="flex items-center gap-2">
            <TeacherIcon className="h-5 w-5" />
            On-Chain Contributors
          </AndamioCardTitle>
          <AndamioCardDescription>
            Contributors who have registered on-chain for this project
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          {/* Empty state */}
          {contributors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-3">
                <TeacherIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <AndamioText className="font-medium">No contributors yet</AndamioText>
              <AndamioText variant="muted" className="mt-1 max-w-[320px]">
                Share your project link with potential contributors. They can join by connecting their wallet and committing to tasks.
              </AndamioText>
            </div>
          )}

          {/* Contributors table */}
          {contributors.length > 0 && (
            <AndamioTableContainer>
              <AndamioTable>
                <AndamioTableHeader>
                  <AndamioTableRow>
                    <AndamioTableHead className="w-[50px]">#</AndamioTableHead>
                    <AndamioTableHead>Contributor Alias</AndamioTableHead>
                    <AndamioTableHead className="w-[120px]">Status</AndamioTableHead>
                  </AndamioTableRow>
                </AndamioTableHeader>
                <AndamioTableBody>
                  {contributors.map((contributor, index) => (
                    <AndamioTableRow key={contributor.alias}>
                      <AndamioTableCell className="text-muted-foreground">
                        {index + 1}
                      </AndamioTableCell>
                      <AndamioTableCell className="font-mono">
                        {contributor.alias}
                      </AndamioTableCell>
                      <AndamioTableCell>
                        <AndamioBadge variant="default" className="gap-1">
                          <SuccessIcon className="h-3 w-3" />
                          On-Chain
                        </AndamioBadge>
                      </AndamioTableCell>
                    </AndamioTableRow>
                  ))}
                </AndamioTableBody>
              </AndamioTable>
            </AndamioTableContainer>
          )}
        </AndamioCardContent>
      </AndamioCard>
    </div>
    </div>
    </AndamioScrollArea>
  );
}
