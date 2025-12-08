/**
 * Shared Extension Configuration
 *
 * This file provides a single source of truth for Tiptap extension configuration.
 * Both ContentEditor and ContentViewer use these configurations to ensure
 * consistent rendering of content across editing and viewing modes.
 */

import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { TextAlign } from "@tiptap/extension-text-align";
import { Markdown } from "tiptap-markdown";
import Link from "@tiptap/extension-link";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { common, createLowlight } from "lowlight";
import type { Extensions } from "@tiptap/core";
import { ImageBlock } from "../extensions/ImageBlock";

/**
 * Extension configuration options
 */
export interface ExtensionConfig {
  /**
   * Whether the editor is in read-only/view mode
   * Affects link behavior (clickable vs editable)
   */
  readonly?: boolean;
}

/**
 * CSS classes for consistent styling across editor and viewer
 */
export const EDITOR_STYLES = {
  link: "text-primary underline underline-offset-4 cursor-pointer",
  bulletList: "list-disc list-outside ml-6 space-y-2",
  orderedList: "list-decimal list-outside ml-6 space-y-2",
  listItem: "leading-relaxed",
  codeBlock:
    "bg-muted text-muted-foreground rounded-lg p-4 font-mono text-sm overflow-x-auto not-prose",
  image: "rounded-lg max-w-full h-auto",
  // Table styles - responsive wrapper handles overflow
  table: "border-collapse border border-border w-full my-4",
  tableRow: "",
  tableCell: "border border-border p-2 min-w-[100px] align-top",
  tableHeader:
    "border border-border p-2 min-w-[100px] align-top bg-muted font-semibold text-left",
} as const;

/**
 * Create a lowlight instance for code syntax highlighting
 */
function createLowlightInstance() {
  return createLowlight(common);
}

/**
 * Creates the shared extension kit used by both ContentEditor and ContentViewer
 *
 * This ensures content created in the editor renders identically in the viewer.
 *
 * @param config - Configuration options
 * @returns Array of Tiptap extensions
 */
export function SharedExtensionKit(config: ExtensionConfig = {}): Extensions {
  const { readonly = false } = config;
  const lowlight = createLowlightInstance();

  return [
    // Core extensions from StarterKit
    StarterKit.configure({
      // Disable extensions we configure separately
      bulletList: false,
      orderedList: false,
      listItem: false,
      codeBlock: false,
      // Configure heading to support levels 1-6
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),

    // Markdown support for paste/copy
    Markdown.configure({
      html: true,
      transformPastedText: true,
      transformCopiedText: true,
    }),

    // Text formatting
    Underline,
    TextStyle,
    Color.configure({
      types: ["textStyle"],
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
      alignments: ["left", "center", "right", "justify"],
    }),

    // Links - behavior differs between edit and view modes
    Link.configure({
      openOnClick: readonly,
      autolink: true,
      defaultProtocol: "https",
      HTMLAttributes: {
        class: EDITOR_STYLES.link,
        ...(readonly && {
          target: "_blank",
          rel: "noopener noreferrer",
        }),
      },
    }),

    // Lists
    BulletList.configure({
      HTMLAttributes: {
        class: EDITOR_STYLES.bulletList,
      },
    }),
    OrderedList.configure({
      HTMLAttributes: {
        class: EDITOR_STYLES.orderedList,
      },
    }),
    ListItem.configure({
      HTMLAttributes: {
        class: EDITOR_STYLES.listItem,
      },
    }),

    // Images - using ImageBlock for block-level images with alignment
    ImageBlock.configure({
      HTMLAttributes: {
        class: EDITOR_STYLES.image,
      },
    }),

    // Code blocks with syntax highlighting
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: {
        class: EDITOR_STYLES.codeBlock,
      },
    }),

    // Tables - conservative config (no resizing to avoid known bugs)
    Table.configure({
      resizable: false, // Disabled due to known Tiptap bugs
      HTMLAttributes: {
        class: EDITOR_STYLES.table,
      },
    }),
    TableRow.configure({
      HTMLAttributes: {
        class: EDITOR_STYLES.tableRow,
      },
    }),
    TableCell.configure({
      HTMLAttributes: {
        class: EDITOR_STYLES.tableCell,
      },
    }),
    TableHeader.configure({
      HTMLAttributes: {
        class: EDITOR_STYLES.tableHeader,
      },
    }),
  ];
}

/**
 * Editor-specific extension kit
 * Extends SharedExtensionKit with editing-focused configurations
 */
export function EditorExtensionKit(): Extensions {
  return SharedExtensionKit({ readonly: false });
}

/**
 * Viewer-specific extension kit
 * Extends SharedExtensionKit with viewing-focused configurations
 */
export function ViewerExtensionKit(): Extensions {
  return SharedExtensionKit({ readonly: true });
}
