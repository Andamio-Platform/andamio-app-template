import Link from "@tiptap/extension-link";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Image from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import type { Extensions } from "@tiptap/core";
import { BaseExtensionKit } from "./base";

/**
 * Read-Only Extension Kit
 * For displaying content without editing
 * Includes all formatting and media display capabilities
 */
export function ReadOnlyExtensionKit(): Extensions {
  const lowlight = createLowlight(common);

  return [
    ...BaseExtensionKit(),
    Link.configure({
      openOnClick: true, // Allow clicking links in read-only mode
      HTMLAttributes: {
        class: "text-primary underline underline-offset-4 cursor-pointer",
        target: "_blank",
        rel: "noopener noreferrer",
      },
    }),
    BulletList.configure({
      HTMLAttributes: {
        class: "list-disc list-outside ml-6 space-y-2",
      },
    }),
    OrderedList.configure({
      HTMLAttributes: {
        class: "list-decimal list-outside ml-6 space-y-2",
      },
    }),
    ListItem.configure({
      HTMLAttributes: {
        class: "leading-relaxed",
      },
    }),
    Image.configure({
      HTMLAttributes: {
        class: "rounded-lg max-w-full h-auto",
      },
    }),
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: {
        class:
          "bg-muted text-muted-foreground rounded-lg p-4 font-mono text-sm overflow-x-auto",
      },
    }),
  ];
}
