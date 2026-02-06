"use client";

import React from "react";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import {
  PendingIcon,
  SuccessIcon,
  AlertIcon,
  LoadingIcon,
} from "~/components/icons";

interface CommitmentStatusBadgeProps {
  /** Normalized network status from StudentCommitmentSummary */
  status: string;
}

/**
 * Small badge showing assignment commitment status.
 *
 * Maps normalized `networkStatus` values to visual indicators.
 */
export function CommitmentStatusBadge({ status }: CommitmentStatusBadgeProps) {
  switch (status) {
    case "PENDING_APPROVAL":
      return (
        <AndamioBadge variant="secondary" className="text-xs gap-1">
          <PendingIcon className="h-3 w-3" />
          Pending Review
        </AndamioBadge>
      );
    case "ASSIGNMENT_ACCEPTED":
      return (
        <AndamioBadge status="success" className="text-xs gap-1">
          <SuccessIcon className="h-3 w-3" />
          Completed
        </AndamioBadge>
      );
    case "ASSIGNMENT_REFUSED":
      return (
        <AndamioBadge variant="destructive" className="text-xs gap-1">
          <AlertIcon className="h-3 w-3" />
          Needs Revision
        </AndamioBadge>
      );
    case "PENDING_TX_COMMITMENT_MADE":
      return (
        <AndamioBadge variant="secondary" className="text-xs gap-1">
          <LoadingIcon className="h-3 w-3 animate-spin" />
          Submitting
        </AndamioBadge>
      );
    default:
      return null;
  }
}
