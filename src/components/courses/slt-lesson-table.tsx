"use client";

import React from "react";
import Link from "next/link";
import { CourseIcon, SuccessIcon } from "~/components/icons";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import {
  AndamioTable,
  AndamioTableBody,
  AndamioTableCell,
  AndamioTableHead,
  AndamioTableHeader,
  AndamioTableRow,
} from "~/components/andamio/andamio-table";
import { AndamioTableContainer, AndamioEmptyState } from "~/components/andamio";
import { type MergedCourseModule } from "~/hooks/api";

/**
 * Combined SLT + Lesson data type
 */
export type CombinedSLTLesson = {
  module_index: number;
  slt_text: string;
  slt_id: string;
  lesson?: {
    title: string | null;
    description: string | null;
    image_url: string | null;
    video_url: string | null;
    live: boolean | null;
  };
};

export interface SLTLessonTableProps {
  /** Combined SLT and lesson data */
  data: CombinedSLTLesson[];
  /** Course NFT policy ID for links */
  courseNftPolicyId: string;
  /** Module code for links */
  moduleCode: string;
  /** On-chain module data for verification badges (flattened format) */
  onChainModule?: MergedCourseModule | null;
}

/**
 * SLTLessonTable - Displays learning targets with their associated lessons
 *
 * Shows a table of Student Learning Targets (SLTs) with linked lesson information,
 * including on-chain verification status when available.
 */
export function SLTLessonTable({
  data,
  courseNftPolicyId,
  moduleCode,
  onChainModule,
}: SLTLessonTableProps) {
  // Build set of on-chain SLT texts for quick lookup
  // Note: on_chain_slts contains SLT hashes/IDs from the chain
  const onChainSltTexts = new Set(onChainModule?.on_chain_slts ?? []);

  if (data.length === 0) {
    return (
      <AndamioEmptyState
        icon={CourseIcon}
        title="No learning targets defined for this module"
        className="border rounded-md"
      />
    );
  }

  return (
    <AndamioTableContainer>
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
          {data.map((item) => {
            const isOnChain = onChainSltTexts.has(item.slt_text);
            return (
              <AndamioTableRow key={item.module_index}>
                <AndamioTableCell className="font-mono text-xs">
                  <div className="flex items-center gap-1.5">
                    <AndamioBadge variant="outline">{item.module_index}</AndamioBadge>
                    {isOnChain && (
                      <span title="Verified on-chain">
                        <SuccessIcon className="h-3.5 w-3.5 text-success" />
                      </span>
                    )}
                  </div>
                </AndamioTableCell>
                <AndamioTableCell className="font-medium">
                  {item.slt_text}
                </AndamioTableCell>
                <AndamioTableCell className="font-medium">
                  {item.lesson ? (
                    <Link
                      href={`/course/${courseNftPolicyId}/${moduleCode}/${item.module_index}`}
                      className="hover:underline text-primary"
                    >
                      {item.lesson.title ?? `Lesson ${item.module_index}`}
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
                      {item.lesson.image_url && (
                        <AndamioBadge variant="outline">Image</AndamioBadge>
                      )}
                      {item.lesson.video_url && (
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
            );
          })}
        </AndamioTableBody>
      </AndamioTable>
    </AndamioTableContainer>
  );
}
