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
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Plus, AlertCircle, Loader2 } from "lucide-react";
import { type CreateCourseOutput } from "andamio-db-api";

/**
 * Dialog component for creating a new course
 *
 * API Endpoints:
 * - POST /courses - Create new course
 * - POST /courses/check-code - Validate course code availability
 *
 * Type Reference: See API-TYPE-REFERENCE.md in andamio-db-api
 */
export function CreateCourseDialog() {
  const router = useRouter();
  const { authenticatedFetch } = useAndamioAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  const [formData, setFormData] = useState({
    courseCode: "",
    title: "",
    description: "",
    imageUrl: "",
    videoUrl: "",
  });

  /**
   * Check if course code is available
   */
  const checkCourseCode = async (code: string) => {
    if (!code || code.length === 0) {
      setCodeError(null);
      return;
    }

    setIsCheckingCode(true);
    setCodeError(null);

    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/check-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ courseCode: code }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to check course code");
      }

      const data = (await response.json()) as { exists: boolean };
      if (data.exists) {
        setCodeError("Course code already exists");
      }
    } catch (err) {
      console.error("Error checking course code:", err);
      setCodeError("Failed to validate course code");
    } finally {
      setIsCheckingCode(false);
    }
  };

  /**
   * Handle course code input with debounced validation
   */
  const handleCourseCodeChange = (value: string) => {
    // Convert to lowercase and remove spaces
    const sanitized = value.toLowerCase().replace(/\s+/g, "-");
    setFormData((prev) => ({ ...prev, courseCode: sanitized }));
    setCodeError(null);
  };

  /**
   * Handle course code blur to check availability
   */
  const handleCourseCodeBlur = () => {
    if (formData.courseCode) {
      void checkCourseCode(formData.courseCode);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Final check for course code
      await checkCourseCode(formData.courseCode);
      if (codeError) {
        setIsSubmitting(false);
        return;
      }

      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseCode: formData.courseCode,
            title: formData.title,
            description: formData.description || undefined,
            imageUrl: formData.imageUrl || undefined,
            videoUrl: formData.videoUrl || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message ?? "Failed to create course");
      }

      const newCourse = (await response.json()) as CreateCourseOutput;

      // Close dialog and redirect to course edit page
      setOpen(false);

      // Redirect to course studio page if we have a policy ID
      if (newCourse.courseNftPolicyId) {
        router.push(`/studio/course/${newCourse.courseNftPolicyId}`);
      } else {
        // Refresh the current page to show the new course
        router.refresh();
      }

      // Reset form
      setFormData({
        courseCode: "",
        title: "",
        description: "",
        imageUrl: "",
        videoUrl: "",
      });
    } catch (err) {
      console.error("Error creating course:", err);
      setError(err instanceof Error ? err.message : "Failed to create course");
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
        courseCode: "",
        title: "",
        description: "",
        imageUrl: "",
        videoUrl: "",
      });
      setError(null);
      setCodeError(null);
    }
  };

  const isFormValid =
    formData.courseCode.length > 0 &&
    formData.title.length > 0 &&
    !codeError &&
    !isCheckingCode;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>
              Create a new Andamio course. Fill in the required fields to get started.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Course Code */}
            <div className="space-y-2">
              <Label htmlFor="courseCode">
                Course Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="courseCode"
                placeholder="example-101"
                value={formData.courseCode}
                onChange={(e) => handleCourseCodeChange(e.target.value)}
                onBlur={handleCourseCodeBlur}
                required
                maxLength={50}
                disabled={isSubmitting}
              />
              {isCheckingCode && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Checking availability...
                </p>
              )}
              {codeError && (
                <p className="text-xs text-destructive">{codeError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Unique identifier for your course (lowercase, no spaces)
              </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Introduction to Cardano Development"
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
                placeholder="Learn the fundamentals of Cardano blockchain development..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/course-image.jpg"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
                }
                disabled={isSubmitting}
              />
            </div>

            {/* Video URL */}
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL</Label>
              <Input
                id="videoUrl"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={formData.videoUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, videoUrl: e.target.value }))
                }
                disabled={isSubmitting}
              />
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
              Create Course
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
