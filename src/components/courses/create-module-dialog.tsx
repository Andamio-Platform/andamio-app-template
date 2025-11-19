"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
import { AndamioButton } from "~/components/andamio/andamio-button";
import {
  AndamioDialog,
  AndamioDialogContent,
  AndamioDialogDescription,
  AndamioDialogFooter,
  AndamioDialogHeader,
  AndamioDialogTitle,
  AndamioDialogTrigger,
} from "~/components/andamio/andamio-dialog";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioTextarea } from "~/components/andamio/andamio-textarea";
import {
  AndamioSelect,
  AndamioSelectContent,
  AndamioSelectItem,
  AndamioSelectTrigger,
  AndamioSelectValue,
} from "~/components/andamio/andamio-select";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { Plus, AlertCircle, Loader2 } from "lucide-react";
import { type CourseModuleOutput } from "@andamio-platform/db-api";

/**
 * Dialog component for creating a new course module
 *
 * API Endpoint: POST /course-modules (protected)
 * Type Reference: See API-TYPE-REFERENCE.md in @andamio-platform/db-api
 */

interface CreateModuleDialogProps {
  courseNftPolicyId: string;
  onModuleCreated?: () => void;
}

const moduleStatuses = [
  { value: "DRAFT", label: "Draft" },
  { value: "APPROVED", label: "Approved" },
  { value: "PENDING_TX", label: "Pending TX" },
  { value: "ON_CHAIN", label: "On Chain" },
  { value: "DEPRECATED", label: "Deprecated" },
  { value: "BACKLOG", label: "Backlog" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export function CreateModuleDialog({ courseNftPolicyId, onModuleCreated }: CreateModuleDialogProps) {
  const router = useRouter();
  const { authenticatedFetch } = useAndamioAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    moduleCode: "",
    title: "",
    description: "",
    status: "DRAFT" as const,
  });

  /**
   * Handle module code input
   */
  const handleModuleCodeChange = (value: string) => {
    // Convert to lowercase and remove spaces
    const sanitized = value.toLowerCase().replace(/\s+/g, "-");
    setFormData((prev) => ({ ...prev, moduleCode: sanitized }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseNftPolicyId,
            moduleCode: formData.moduleCode,
            title: formData.title,
            description: formData.description || undefined,
            status: formData.status,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message ?? "Failed to create module");
      }

      const newModule = (await response.json()) as CourseModuleOutput;

      // Close dialog
      setOpen(false);

      // Call callback if provided
      if (onModuleCreated) {
        onModuleCreated();
      }

      // Redirect to module edit page
      router.push(`/studio/course/${courseNftPolicyId}/${newModule.moduleCode}`);

      // Reset form
      setFormData({
        moduleCode: "",
        title: "",
        description: "",
        status: "DRAFT",
      });
    } catch (err) {
      console.error("Error creating module:", err);
      setError(err instanceof Error ? err.message : "Failed to create module");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset form when dialog closes
   */
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setFormData({
        moduleCode: "",
        title: "",
        description: "",
        status: "DRAFT",
      });
      setError(null);
    }
  };

  const isFormValid =
    formData.moduleCode.length > 0 &&
    formData.title.length > 0;

  return (
    <AndamioDialog open={open} onOpenChange={handleOpenChange}>
      <AndamioDialogTrigger asChild>
        <AndamioButton size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Module
        </AndamioButton>
      </AndamioDialogTrigger>
      <AndamioDialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <AndamioDialogHeader>
            <AndamioDialogTitle>Create New Module</AndamioDialogTitle>
            <AndamioDialogDescription>
              Add a new module to this course. You can add lessons and assignments later.
            </AndamioDialogDescription>
          </AndamioDialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <AndamioAlert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AndamioAlertDescription>{error}</AndamioAlertDescription>
              </AndamioAlert>
            )}

            {/* Module Code */}
            <div className="space-y-2">
              <AndamioLabel htmlFor="moduleCode">
                Module Code <span className="text-destructive">*</span>
              </AndamioLabel>
              <AndamioInput
                id="moduleCode"
                placeholder="module-101"
                value={formData.moduleCode}
                onChange={(e) => handleModuleCodeChange(e.target.value)}
                required
                maxLength={50}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier for this module (lowercase, no spaces)
              </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <AndamioLabel htmlFor="title">
                Title <span className="text-destructive">*</span>
              </AndamioLabel>
              <AndamioInput
                id="title"
                placeholder="Introduction to Smart Contracts"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required
                maxLength={200}
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <AndamioLabel htmlFor="description">Description</AndamioLabel>
              <AndamioTextarea
                id="description"
                placeholder="Learn the basics of Cardano smart contracts..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <AndamioLabel htmlFor="status">Status</AndamioLabel>
              <AndamioSelect
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value as typeof formData.status,
                  }))
                }
                disabled={isSubmitting}
              >
                <AndamioSelectTrigger id="status">
                  <AndamioSelectValue placeholder="Select status" />
                </AndamioSelectTrigger>
                <AndamioSelectContent>
                  {moduleStatuses.map((status) => (
                    <AndamioSelectItem key={status.value} value={status.value}>
                      {status.label}
                    </AndamioSelectItem>
                  ))}
                </AndamioSelectContent>
              </AndamioSelect>
              <p className="text-xs text-muted-foreground">
                Set the initial status for this module
              </p>
            </div>
          </div>

          <AndamioDialogFooter>
            <AndamioButton
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </AndamioButton>
            <AndamioButton type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Module
            </AndamioButton>
          </AndamioDialogFooter>
        </form>
      </AndamioDialogContent>
    </AndamioDialog>
  );
}
