/**
 * ContentDisplay Component
 *
 * A reusable component for displaying read-only content in various formats.
 * Handles Tiptap JSON, HTML strings, and stringified JSON automatically.
 *
 * @example
 * ```tsx
 * // Display Tiptap JSON content
 * <ContentDisplay content={jsonContent} />
 *
 * // Display HTML string
 * <ContentDisplay content="<p>Hello world</p>" />
 *
 * // Display with custom className
 * <ContentDisplay content={content} className="bg-muted/30" />
 * ```
 */

import React from "react";
import { RenderEditor } from "~/components/editor";
import type { JSONContent } from "@tiptap/core";

export interface ContentDisplayProps {
  /**
   * Content to display - can be:
   * - Tiptap JSONContent object
   * - HTML string
   * - Stringified JSON
   */
  content: string | JSONContent | Record<string, unknown>;

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Whether to show a border around the content
   * @default true
   */
  showBorder?: boolean;

  /**
   * Background variant
   * @default "muted"
   */
  variant?: "muted" | "default" | "accent";
}

export function ContentDisplay({
  content,
  className = "",
  showBorder = true,
  variant = "muted",
}: ContentDisplayProps) {
  // Determine background based on variant
  const bgClass = {
    muted: "bg-muted/20",
    default: "bg-background",
    accent: "bg-accent/10",
  }[variant];

  // Build container classes
  const containerClasses = [
    showBorder && "border rounded-lg",
    "p-4",
    bgClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Render content based on type
  const renderContent = () => {
    // If it's a string, try to parse it as JSON first
    if (typeof content === "string") {
      try {
        const parsed = JSON.parse(content) as JSONContent;
        // If successfully parsed and has type property, it's likely Tiptap JSON
        if (parsed && typeof parsed === "object" && "type" in parsed) {
          return <RenderEditor content={parsed} />;
        }
      } catch {
        // Not JSON, treat as HTML string
      }
      // Render as HTML with Tailwind typography
      return (
        <div
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }

    // If it's already an object, assume it's Tiptap JSON
    return <RenderEditor content={content as JSONContent} />;
  };

  return <div className={containerClasses}>{renderContent()}</div>;
}

/**
 * Lightweight wrapper for displaying content without any container styling
 */
export function ContentDisplayInline({
  content,
}: Pick<ContentDisplayProps, "content">) {
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content) as JSONContent;
      if (parsed && typeof parsed === "object" && "type" in parsed) {
        return <RenderEditor content={parsed} />;
      }
    } catch {
      // Not JSON, treat as HTML
    }
    return (
      <div
        className="prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return <RenderEditor content={content as JSONContent} />;
}
