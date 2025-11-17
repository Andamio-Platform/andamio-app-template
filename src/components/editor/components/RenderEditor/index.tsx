"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { ReadOnlyExtensionKit } from "../../extension-kits";
import { cn } from "../../utils";
import type { JSONContent } from "@tiptap/core";
import { useEffect, useState } from "react";

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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: ReadOnlyExtensionKit(),
    content: content ?? undefined,
    editable: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-slate dark:prose-invert max-w-none focus:outline-none",
          size === "sm" && "prose-sm",
          size === "default" && "prose-base",
          size === "lg" && "prose-lg",
        ),
      },
    },
    immediatelyRender: false,
  });

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content && isMounted) {
      // Debug: Log what we're trying to set
      console.log("🔍 RenderEditor: Setting content", {
        content,
        contentType: typeof content,
        isObject: typeof content === "object",
        keys: typeof content === "object" && content !== null ? Object.keys(content) : [],
      });

      // Use queueMicrotask to avoid hydration issues
      queueMicrotask(() => {
        try {
          editor.commands.setContent(content);
          console.log("✅ RenderEditor: Content set successfully");
          console.log("📊 Editor state:", {
            html: editor.getHTML(),
            json: editor.getJSON(),
            text: editor.getText(),
          });
        } catch (error) {
          console.error("❌ RenderEditor: Error setting content", error);
        }
      });
    }
  }, [editor, content, isMounted]);

  // Don't render during SSR
  if (!isMounted) {
    return (
      <div className={cn("rounded-lg bg-background animate-pulse", className)}>
        <div className="h-32 bg-muted rounded" />
      </div>
    );
  }

  if (!content) {
    return null;
  }

  if (!editor) {
    return (
      <div className={cn("rounded-lg bg-background p-4 text-muted-foreground", className)}>
        Loading editor...
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg bg-background p-4", className)}>
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
