import { ReactNodeViewRenderer } from "@tiptap/react";
import { mergeAttributes, type Range, type ChainedCommands } from "@tiptap/core";

import { ImageBlockView } from "./components/ImageBlockView";
import { Image } from "../Image";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageBlock: {
      setImageBlock: (attributes: { src: string }) => ReturnType;
      setImageBlockAt: (attributes: {
        src: string;
        pos: number | Range;
      }) => ReturnType;
      setImageBlockAlign: (align: "left" | "center" | "right") => ReturnType;
      setImageBlockWidth: (width: number) => ReturnType;
    };
  }
}

export const ImageBlock = Image.extend({
  name: "imageBlock",

  group: "block",

  defining: true,

  isolating: true,

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element: HTMLElement) => element.getAttribute("src"),
        renderHTML: (attributes: Record<string, unknown>) => ({
          src: attributes.src,
        }),
      },
      width: {
        default: "600",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-width"),
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-width": attributes.width,
        }),
      },
      height: {
        default: "600",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-height"),
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-height": attributes.height,
        }),
      },
      align: {
        default: "center",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-align"),
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-align": attributes.align,
        }),
      },
      alt: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("alt"),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.alt) return {};
          return {
            alt: attributes.alt,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]:not([src^="data:"])',
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
    ];
  },

  addCommands() {
    return {
      setImageBlock:
        (attrs: { src: string }) =>
        ({ commands }: { commands: ChainedCommands }) => {
          return commands.insertContent({
            type: "imageBlock",
            attrs: { src: attrs.src },
          });
        },

      setImageBlockAt:
        (attrs: { src: string; pos: number | Range }) =>
        ({ commands }: { commands: ChainedCommands }) => {
          const pos =
            typeof attrs.pos === "number" ? attrs.pos : attrs.pos.from;

          return commands.insertContentAt(pos, {
            type: "imageBlock",
            attrs: { src: attrs.src },
          });
        },

      setImageBlockAlign:
        (align: "left" | "center" | "right") =>
        ({ commands }: { commands: ChainedCommands }) =>
          commands.updateAttributes("imageBlock", { align }),

      setImageBlockWidth:
        (width: number) =>
        ({ commands }: { commands: ChainedCommands }) =>
          commands.updateAttributes("imageBlock", {
            width: `${Math.max(0, width)}`,
            height: `${Math.max(0, width)}`,
          }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView);
  },
});

export default ImageBlock;
