"use client";

import { type Editor } from "@tiptap/core";
import { AndamioToggle } from "~/components/andamio/andamio-toggle";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  UnderlineIcon,
} from "lucide-react";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { cn } from "../../../utils";

interface AndamioFixedToolbarProps {
  editor: Editor;
  className?: string;
}

/**
 * AndamioFixedToolbar - Fixed toolbar for editor formatting
 * Uses shadcn Toggle components for a clean, consistent UI
 */
export function AndamioFixedToolbar({
  editor,
  className,
}: AndamioFixedToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-2",
        className,
      )}
    >
      {/* History */}
      <AndamioToggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        aria-label="Undo"
      >
        <Undo className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        aria-label="Redo"
      >
        <Redo className="h-4 w-4" />
      </AndamioToggle>

      <AndamioSeparator orientation="vertical" className="mx-1 h-6" />

      {/* Headings */}
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("heading", { level: 1 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        aria-label="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("heading", { level: 2 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        aria-label="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("heading", { level: 3 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        aria-label="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </AndamioToggle>

      <AndamioSeparator orientation="vertical" className="mx-1 h-6" />

      {/* Text formatting */}
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
      >
        <Bold className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
      >
        <Italic className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("underline")}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        aria-label="Underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        aria-label="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("code")}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
        aria-label="Inline Code"
      >
        <Code className="h-4 w-4" />
      </AndamioToggle>

      <AndamioSeparator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Bullet List"
      >
        <List className="h-4 w-4" />
      </AndamioToggle>
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </AndamioToggle>

      <AndamioSeparator orientation="vertical" className="mx-1 h-6" />

      {/* Block elements */}
      <AndamioToggle
        size="sm"
        pressed={editor.isActive("blockquote")}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label="Blockquote"
      >
        <Quote className="h-4 w-4" />
      </AndamioToggle>
    </div>
  );
}
