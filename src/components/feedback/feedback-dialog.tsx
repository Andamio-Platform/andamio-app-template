"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  AndamioDialog,
  AndamioDialogContent,
  AndamioDialogHeader,
  AndamioDialogTitle,
  AndamioDialogDescription,
  AndamioDialogFooter,
  AndamioDialogTrigger,
} from "~/components/andamio";
import { AndamioButton } from "~/components/andamio";
import { AndamioInput } from "~/components/andamio";
import { AndamioTextarea } from "~/components/andamio";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio";
import { FeedbackIcon } from "~/components/icons";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { cn } from "~/lib/utils";
import { FEEDBACK_TITLE_MAX, FEEDBACK_DESCRIPTION_MAX } from "~/lib/feedback-constants";

interface FeedbackDialogProps {
  isExpanded?: boolean;
}

export function FeedbackDialog({ isExpanded = false }: FeedbackDialogProps) {
  const { jwt } = useAndamioAuth();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [happened, setHappened] = useState("");
  const [expected, setExpected] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/feedback")
      .then((res) => res.json())
      .then((data: unknown) => {
        if (data && typeof data === "object" && "configured" in data) {
          setConfigured((data as { configured: boolean }).configured);
        }
      })
      .catch(() => setConfigured(false));
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setTitle("");
      setHappened("");
      setExpected("");
      setError(null);
    }
    setOpen(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!jwt) {
      setError("You must be signed in to submit a report.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          happened: happened.trim(),
          expected: expected.trim(),
          path: window.location.pathname,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null) as { error?: string } | null;
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      toast.success("Thanks, we've got your report.");
      handleOpenChange(false);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render until we know if feedback is configured
  if (configured === null || configured === false) return null;

  return (
    <AndamioDialog open={open} onOpenChange={handleOpenChange}>
      <AndamioDialogTrigger asChild>
        <AndamioButton
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-primary hover:bg-primary/10",
            isExpanded ? "text-sm h-9 px-3" : "text-[11px] h-7 px-2"
          )}
        >
          <FeedbackIcon
            className={cn(
              "flex-shrink-0",
              isExpanded ? "mr-2 h-4 w-4" : "mr-1.5 h-3 w-3"
            )}
          />
          Report an Issue
        </AndamioButton>
      </AndamioDialogTrigger>

      <AndamioDialogContent>
        <AndamioDialogHeader>
          <AndamioDialogTitle>Report an Issue</AndamioDialogTitle>
          <AndamioDialogDescription>
            Tell us what went wrong. The team reads every report.
          </AndamioDialogDescription>
        </AndamioDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="feedback-title" className="text-sm font-medium">
                Title
              </label>
              {title.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {title.length}/{FEEDBACK_TITLE_MAX}
                </span>
              )}
            </div>
            <AndamioInput
              id="feedback-title"
              placeholder="Brief summary of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, FEEDBACK_TITLE_MAX))}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="feedback-happened" className="text-sm font-medium">
                What happened?
              </label>
              {happened.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {happened.length}/{FEEDBACK_DESCRIPTION_MAX}
                </span>
              )}
            </div>
            <AndamioTextarea
              id="feedback-happened"
              placeholder="Describe what went wrong"
              value={happened}
              onChange={(e) => setHappened(e.target.value.slice(0, FEEDBACK_DESCRIPTION_MAX))}
              rows={3}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="feedback-expected" className="text-sm font-medium">
                What did you expect instead?
              </label>
              {expected.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {expected.length}/{FEEDBACK_DESCRIPTION_MAX}
                </span>
              )}
            </div>
            <AndamioTextarea
              id="feedback-expected"
              placeholder="What should have happened?"
              value={expected}
              onChange={(e) => setExpected(e.target.value.slice(0, FEEDBACK_DESCRIPTION_MAX))}
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <AndamioAlert variant="destructive">
              <AndamioAlertDescription>{error}</AndamioAlertDescription>
            </AndamioAlert>
          )}

          <AndamioDialogFooter>
            <AndamioButton
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </AndamioButton>
            <AndamioButton
              type="submit"
              disabled={isSubmitting || !title.trim() || !happened.trim()}
            >
              {isSubmitting ? "Submitting…" : "Submit"}
            </AndamioButton>
          </AndamioDialogFooter>
        </form>
      </AndamioDialogContent>
    </AndamioDialog>
  );
}
