"use client";

import { useEffect, useState, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { cn } from "~/lib/utils";
import { ViewerExtensionKit } from "../../extension-kits/shared";

/**
 * ContentViewer Props
 *
 * A read-only component for displaying Tiptap content.
 * Use for viewing course content, assignments, tasks, etc.
 */
export interface ContentViewerProps {
  /**
   * Content to display.
   * Can be Tiptap JSONContent, HTML string, or stringified JSON.
   */
  content: JSONContent | string | null | undefined;

  /**
   * Size variant for typography scaling.
   * @default "default"
   */
  size?: "sm" | "default" | "lg";

  /**
   * Additional CSS classes for the wrapper.
   */
  className?: string;

  /**
   * Whether to show a subtle background.
   * @default false
   */
  withBackground?: boolean;

  /**
   * Whether to add padding.
   * @default true
   */
  withPadding?: boolean;

  /**
   * Loading placeholder content.
   * If not provided, a skeleton loader is shown.
   */
  loadingContent?: React.ReactNode;

  /**
   * Content to show when there's no content to display.
   * @default null (renders nothing)
   */
  emptyContent?: React.ReactNode;
}

/**
 * Parses content into valid Tiptap JSONContent format.
 *
 * Handles various input formats:
 * - JSONContent object (passed through)
 * - Stringified JSON (parsed)
 * - HTML string (used directly)
 * - Invalid content (returns null)
 */
function parseContent(content: JSONContent | string | null | undefined): JSONContent | string | null {
  if (!content) return null;

  // Already JSONContent object
  if (typeof content === "object") {
    // Ensure it has the doc wrapper
    if (content.type === "doc") {
      return content;
    }
    // Wrap in doc if needed
    return {
      type: "doc",
      content: Array.isArray(content) ? content : [content],
    };
  }

  // String content - could be JSON or HTML
  if (typeof content === "string") {
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(content) as JSONContent;
      if (parsed && typeof parsed === "object") {
        if (parsed.type === "doc") {
          return parsed;
        }
        return {
          type: "doc",
          content: Array.isArray(parsed) ? parsed : [parsed],
        };
      }
    } catch {
      // Not JSON, treat as HTML
      return content;
    }
  }

  return null;
}

/**
 * ContentViewer - Read-only display component for Tiptap content.
 *
 * Use this component for:
 * - Displaying course content (Lessons, Assignments, Introductions)
 * - Viewing project task descriptions
 * - Reading commitment evidence
 * - Any read-only content display
 *
 * Features:
 * - Handles multiple content formats (JSON, HTML, stringified JSON)
 * - Proper hydration handling for SSR
 * - Clickable links (open in new tab)
 * - Code syntax highlighting
 * - Image display with alignment
 * - Size variants for different contexts
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ContentViewer content={lesson.content_json} />
 *
 * // With size variant
 * <ContentViewer content={content} size="lg" />
 *
 * // With background and custom empty state
 * <ContentViewer
 *   content={content}
 *   withBackground
 *   emptyContent={<p>No content available</p>}
 * />
 * ```
 */
export function ContentViewer({
  content,
  size = "default",
  className,
  withBackground = false,
  withPadding = true,
  loadingContent,
  emptyContent = null,
}: ContentViewerProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Parse content once
  const parsedContent = useMemo(() => parseContent(content), [content]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize read-only editor with polished styling
  const editor = useEditor({
    extensions: ViewerExtensionKit(),
    content: parsedContent ?? undefined,
    editable: false,
    editorProps: {
      attributes: {
        class: cn(
          "andamio-viewer-content",
          "focus:outline-none",
          // Size variants
          size === "sm" && "prose-sm",
          size === "default" && "prose",
          size === "lg" && "prose-lg",
          "max-w-none",
          // Enhanced typography - matching editor styling
          "prose-headings:font-semibold prose-headings:tracking-tight",
          "prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl",
          "prose-p:leading-relaxed",
          "prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:transition-colors",
          "prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:pr-4 prose-blockquote:not-italic",
          "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-normal prose-code:before:content-none prose-code:after:content-none",
          "prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:shadow-sm",
          "prose-img:rounded-lg prose-img:shadow-sm",
          "prose-ul:my-4 prose-ol:my-4",
          "prose-li:my-1",
          "prose-hr:border-border",
          "prose-table:border prose-table:border-border",
          "prose-th:bg-muted/50 prose-th:px-3 prose-th:py-2",
          "prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-border",
        ),
      },
    },
    immediatelyRender: false,
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && parsedContent && isMounted) {
      // Use queueMicrotask to avoid hydration issues
      queueMicrotask(() => {
        try {
          editor.commands.setContent(parsedContent);
        } catch (error) {
          console.error("ContentViewer: Error setting content", error);
        }
      });
    }
  }, [editor, parsedContent, isMounted]);

  // SSR loading state - elegant skeleton
  if (!isMounted) {
    if (loadingContent) {
      return <>{loadingContent}</>;
    }
    return (
      <div className={cn("rounded-lg", withBackground && "bg-muted/30", className)}>
        <div className={cn("space-y-3 animate-pulse", withPadding && "p-4")}>
          <div className="h-4 bg-muted/50 rounded w-3/4" />
          <div className="h-4 bg-muted/50 rounded w-full" />
          <div className="h-4 bg-muted/50 rounded w-5/6" />
          <div className="h-4 bg-muted/50 rounded w-2/3" />
        </div>
      </div>
    );
  }

  // No content state
  if (!parsedContent) {
    return <>{emptyContent}</>;
  }

  // Editor still loading
  if (!editor) {
    if (loadingContent) {
      return <>{loadingContent}</>;
    }
    return (
      <div className={cn("rounded-lg", withBackground && "bg-muted/30", className)}>
        <div className={cn("space-y-3 animate-pulse", withPadding && "p-4")}>
          <div className="h-4 bg-muted/50 rounded w-3/4" />
          <div className="h-4 bg-muted/50 rounded w-full" />
          <div className="h-4 bg-muted/50 rounded w-5/6" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg transition-colors",
        withBackground && "bg-muted/20",
        className,
      )}
    >
      <div className={withPadding ? "px-1" : undefined}>
        <EditorContent editor={editor} />
      </div>
      {/* Table styles for responsive display */}
      <style jsx global>{`
        .andamio-viewer-content .tableWrapper {
          overflow-x: auto;
          margin: 1rem 0;
        }
        .andamio-viewer-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 0;
        }
        .andamio-viewer-content th,
        .andamio-viewer-content td {
          border: 1px solid hsl(var(--border));
          padding: 0.5rem;
          min-width: 100px;
          vertical-align: top;
        }
        .andamio-viewer-content th {
          background-color: hsl(var(--muted));
          font-weight: 600;
          text-align: left;
        }
      `}</style>
    </div>
  );
}

/**
 * ContentViewerSm - Small variant of ContentViewer
 *
 * Convenience component for smaller text contexts.
 */
export function ContentViewerSm({
  content,
  className,
  ...props
}: Omit<ContentViewerProps, "size">) {
  return <ContentViewer content={content} className={className} size="sm" {...props} />;
}

/**
 * ContentViewerLg - Large variant of ContentViewer
 *
 * Convenience component for larger text contexts.
 */
export function ContentViewerLg({
  content,
  className,
  ...props
}: Omit<ContentViewerProps, "size">) {
  return <ContentViewer content={content} className={className} size="lg" {...props} />;
}

/**
 * ContentViewerCompact - Compact variant without padding or background
 *
 * Use for inline content display.
 */
export function ContentViewerCompact({
  content,
  className,
  ...props
}: Omit<ContentViewerProps, "withBackground" | "withPadding">) {
  return (
    <ContentViewer
      content={content}
      className={className}
      withBackground={false}
      withPadding={false}
      {...props}
    />
  );
}

export default ContentViewer;
