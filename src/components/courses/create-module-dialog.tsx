"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Plus, AlertCircle, Loader2 } from "lucide-react";
import { type CreateCourseModuleOutput } from "andamio-db-api";

/**
 * Dialog component for creating a new course module
 *
 * API Endpoint: POST /course-modules (protected)
 * Type Reference: See API-TYPE-REFERENCE.md in andamio-db-api
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

      const newModule = (await response.json()) as CreateCourseModuleOutput;

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Module
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Module</DialogTitle>
            <DialogDescription>
              Add a new module to this course. You can add lessons and assignments later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Module Code */}
            <div className="space-y-2">
              <Label htmlFor="moduleCode">
                Module Code <span className="text-destructive">*</span>
              </Label>
              <Input
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
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
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
              <Label htmlFor="description">Description</Label>
              <Textarea
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
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value as typeof formData.status,
                  }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {moduleStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Set the initial status for this module
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Module
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
