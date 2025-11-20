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
  courseModules: ListCourseModulesOutput;

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
 * const courseModules: ListCourseModulesOutput = await fetch(
 *   `${API_URL}/courses/${courseNftPolicyId}/course-modules`
 * ).then(r => r.json());
 *
 * <MintModuleTokens
 *   courseNftPolicyId="abc123..."
 *   courseModules={courseModules}
 *   onSuccess={() => router.refresh()}
 * />
 * ```
 */
export function MintModuleTokens({
  courseNftPolicyId,
  courseModules,
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

    const moduleInfos = formatModuleInfosForMintModuleTokens(courseModules)

    return {
      user_access_token: userAccessTokenUnit,
      policy: courseNftPolicyId,
      module_infos: moduleInfos,
    };
  }, [user?.accessTokenAlias, courseNftPolicyId, courseModules]);

  // Render with requirement check if needed
  return (
    <AndamioTransaction
      definition={MINT_MODULE_TOKENS}
      inputs={inputs ?? { user_access_token: "", policy: "", module_infos: "" }}
      icon={<Coins className="h-5 w-5" />}
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
