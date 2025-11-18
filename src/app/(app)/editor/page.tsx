"use client";

import {
  useAndamioEditor,
  ContentEditor,
  AndamioFixedToolbar,
  AndamioBubbleMenus,
  RenderEditor,
  getWordCount,
  getCharacterCount,
} from "~/components/editor";
import { AndamioCard, AndamioCardContent, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioTabs, AndamioTabsContent, AndamioTabsList, AndamioTabsTrigger } from "~/components/andamio/andamio-tabs";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";

const sampleContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Welcome to the Andamio Editor" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This is a powerful rich text editor built with ",
        },
        {
          type: "text",
          marks: [{ type: "bold" }],
          text: "Tiptap",
        },
        { type: "text", text: " and styled with " },
        {
          type: "text",
          marks: [{ type: "bold" }],
          text: "shadcn/ui",
        },
        { type: "text", text: " components." },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Features" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  marks: [{ type: "bold" }],
                  text: "Rich text formatting",
                },
                {
                  type: "text",
                  text: " - Bold, italic, underline, strikethrough, and more",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Headings" },
                { type: "text", text: " - H1 through H6" },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Lists" },
                { type: "text", text: " - Bullet and ordered lists" },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Links" },
                { type: "text", text: " - Select text and use the link button" },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  marks: [{ type: "bold" }],
                  text: "Code blocks",
                },
                { type: "text", text: " - With syntax highlighting" },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Try it out!" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Select some text to see the ",
        },
        {
          type: "text",
          marks: [{ type: "italic" }],
          text: "bubble menu",
        },
        {
          type: "text",
          text: ". Use the toolbar above for more formatting options.",
        },
      ],
    },
  ],
};

export default function EditorPage() {
  const editor = useAndamioEditor({
    content: sampleContent,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Tiptap Editor Demo</h1>
        <p className="text-muted-foreground">
          A rich text editor built with Tiptap and shadcn/ui
        </p>
      </div>

      {/* Stats */}
      {editor && (
        <div className="flex items-center gap-4">
          <AndamioBadge variant="secondary">
            Words: {getWordCount(editor)}
          </AndamioBadge>
          <AndamioBadge variant="secondary">
            Characters: {getCharacterCount(editor)}
          </AndamioBadge>
        </div>
      )}

      {/* Editor Tabs */}
      <AndamioTabs defaultValue="edit" className="space-y-4">
        <AndamioTabsList>
          <AndamioTabsTrigger value="edit">Edit</AndamioTabsTrigger>
          <AndamioTabsTrigger value="preview">Preview</AndamioTabsTrigger>
          <AndamioTabsTrigger value="json">JSON</AndamioTabsTrigger>
        </AndamioTabsList>

        <AndamioTabsContent value="edit" className="space-y-4">
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle>Editor</AndamioCardTitle>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
              {editor && (
                <>
                  <AndamioFixedToolbar editor={editor} />
                  <AndamioBubbleMenus editor={editor} />
                  <AndamioSeparator />
                  <ContentEditor editor={editor} height="400px" />
                </>
              )}
            </AndamioCardContent>
          </AndamioCard>
        </AndamioTabsContent>

        <AndamioTabsContent value="preview">
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle>Preview (Read-only)</AndamioCardTitle>
            </AndamioCardHeader>
            <AndamioCardContent>
              {editor && <RenderEditor content={editor.getJSON()} />}
            </AndamioCardContent>
          </AndamioCard>
        </AndamioTabsContent>

        <AndamioTabsContent value="json">
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle>JSON Output</AndamioCardTitle>
            </AndamioCardHeader>
            <AndamioCardContent>
              <pre className="rounded-lg bg-muted p-4 text-sm overflow-x-auto">
                <code>
                  {editor ? JSON.stringify(editor.getJSON(), null, 2) : ""}
                </code>
              </pre>
            </AndamioCardContent>
          </AndamioCard>
        </AndamioTabsContent>
      </AndamioTabs>

      {/* Extension Kits Info */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Extension Kits</AndamioCardTitle>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Available Extension Kits:</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-1">BaseExtensionKit</h4>
                <p className="text-sm text-muted-foreground">
                  Core extensions for basic text editing
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-1">BasicEditorKit</h4>
                <p className="text-sm text-muted-foreground">
                  Text formatting with lists and links
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-1">ReadOnlyExtensionKit</h4>
                <p className="text-sm text-muted-foreground">
                  For displaying content without editing
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-1">FullEditorKit</h4>
                <p className="text-sm text-muted-foreground">
                  All features including images and menus
                </p>
              </div>
            </div>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    </div>
  );
}
