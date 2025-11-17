"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { ReadOnlyExtensionKit } from "../../extension-kits";
import { cn } from "../../utils";
import type { JSONContent } from "@tiptap/core";

interface RenderEditorProps {
  /**
   * Content to display (JSON or HTML)
   */
  content: JSONContent | string | null | undefined;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Size variant
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
}

/**
 * RenderEditor - Read-only display of Tiptap content
 * Uses shadcn typography defaults for clean content rendering
 */
export function RenderEditor({
  content,
  className,
  size = "default",
}: RenderEditorProps) {
  const editor = useEditor({
    extensions: ReadOnlyExtensionKit(),
    content: content ?? undefined,
    editable: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose max-w-none focus:outline-none",
          size === "sm" && "prose-sm",
          size === "default" && "prose-base",
          size === "lg" && "prose-lg",
        ),
      },
    },
    immediatelyRender: false,
  });

  if (!editor || !content) {
    return null;
  }

  return (
    <div className={cn("rounded-lg bg-background", className)}>
      <EditorContent editor={editor} />
    </div>
  );
}

/**
 * RenderEditorSm - Small variant of RenderEditor
 */
export function RenderEditorSm({
  content,
  className,
}: Omit<RenderEditorProps, "size">) {
  return <RenderEditor content={content} className={className} size="sm" />;
}

/**
 * RenderEditorLg - Large variant of RenderEditor
 */
export function RenderEditorLg({
  content,
  className,
}: Omit<RenderEditorProps, "size">) {
  return <RenderEditor content={content} className={className} size="lg" />;
}
