/**
 * MintModuleTokens Component
 *
 * UI for minting module tokens (course-creator transaction).
 * Creates on-chain credentials for course modules.
 *
 * This component demonstrates how simple transaction components become
 * when using @andamio/transactions definitions and helper functions.
 */

"use client";

import React from "react";
import {
  MINT_MODULE_TOKENS,
  formatModuleInfosForMintModuleTokens,
} from "@andamio/transactions";
import { AndamioTransaction } from "./andamio-transaction";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { buildAccessTokenUnit } from "~/lib/access-token-utils";
import { env } from "~/env";
import { Coins } from "lucide-react";
import type { ListCourseModulesOutput } from "@andamio-platform/db-api";

export interface MintModuleTokensProps {
  /**
   * Course NFT Policy ID
   */
  courseNftPolicyId: string;

  /**
   * Array of modules with SLT data from the database API
   * Should come from the `/courses/{courseNftPolicyId}/course-modules` endpoint
   * which now includes SLTs automatically
   */
  modules: ListCourseModulesOutput;

  /**
   * Callback fired when minting is successful
   */
  onSuccess?: () => void | Promise<void>;

  /**
   * Callback fired when minting fails
   */
  onError?: (error: Error) => void;
}

/**
 * MintModuleTokens - Transaction UI for minting module tokens
 *
 * @example
 * ```tsx
 * // Fetch modules with SLTs included
 * const modules: ListCourseModulesOutput = await fetch(
 *   `${API_URL}/courses/${courseNftPolicyId}/course-modules`
 * ).then(r => r.json());
 *
 * <MintModuleTokens
 *   courseNftPolicyId="abc123..."
 *   modules={modules}
 *   onSuccess={() => router.refresh()}
 * />
 * ```
 */
export function MintModuleTokens({
  courseNftPolicyId,
  modules,
  onSuccess,
  onError,
}: MintModuleTokensProps) {
  const { user } = useAndamioAuth();

  // Build inputs for the transaction
  const inputs = React.useMemo(() => {
    if (!user?.accessTokenAlias) {
      return null;
    }

    const userAccessTokenUnit = buildAccessTokenUnit(
      user.accessTokenAlias,
      env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID
    );

    // Build module data with module title as assignment content
    const moduleDataWithAssignments = modules.map((module) => ({
      moduleId: module.moduleCode,
      slts: module.slts.map((slt) => ({
        sltId: slt.moduleIndex.toString(),
        sltContent: slt.sltText,
      })),
      assignmentContent: module.title, // Use module title
    }));

    const moduleInfos = JSON.stringify(moduleDataWithAssignments);

    console.log("user_access_token", userAccessTokenUnit);
    console.log("policy", courseNftPolicyId);
    console.log("module_infos", moduleInfos);

    return {
      user_access_token: userAccessTokenUnit,
      policy: courseNftPolicyId,
      module_infos: moduleInfos,
    };
  }, [user?.accessTokenAlias, courseNftPolicyId, modules]);

  // Render with requirement check if needed
  return (
    <AndamioTransaction
      definition={MINT_MODULE_TOKENS}
      inputs={inputs ?? { user_access_token: "", policy: "", module_infos: "" }}
      icon={<Coins className="h-5 w-5" />}
      description={
        inputs
          ? [
              `Minting ${modules.length} module token${modules.length === 1 ? "" : "s"} for this course.`,
              "These tokens will be issued to students who complete module assignments.",
            ]
          : undefined
      }
      requirements={
        !inputs
          ? {
              check: false,
              failureMessage: "You need an access token to mint module tokens.",
              failureAction: (
                <div className="text-sm text-muted-foreground">
                  Please mint an access token first to continue.
                </div>
              ),
            }
          : undefined
      }
      onSuccess={onSuccess}
      onError={onError}
    />
  );
}
