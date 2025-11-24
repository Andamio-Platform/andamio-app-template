"use client";

import { EditorContent, type Editor } from "@tiptap/react";
import { cn } from "../../utils";

interface ContentEditorProps {
  editor: Editor | null;
  className?: string;
  /**
   * Height of the editor content area
   * @default "auto"
   */
  height?: string;
  /**
   * Additional content to render below the editor
   * Useful for word count, save status, etc.
   */
  children?: React.ReactNode;
  /**
   * Whether full-screen mode is active
   */
  isFullscreen?: boolean;
}

/**
 * ContentEditor - Main editable Tiptap editor component
 * Provides a clean, minimal editor using shadcn styling defaults
 */
export function ContentEditor({
  editor,
  className,
  height = "auto",
  children,
  isFullscreen = false,
}: ContentEditorProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <EditorContent
        editor={editor}
        className={cn(
          "editor-content",
          "rounded-lg border border-border bg-background p-4",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          isFullscreen && "min-h-[calc(100vh-16rem)]",
        )}
        style={isFullscreen ? undefined : { minHeight: height }}
      />
      {children && <div className="flex items-center justify-between gap-4">{children}</div>}
    </div>
  );
}
