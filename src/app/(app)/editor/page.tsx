"use client";

import { useState } from "react";
import { ContentEditor, ContentViewer } from "~/components/editor";
import { AndamioCard, AndamioCardContent, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioTabs, AndamioTabsContent, AndamioTabsList, AndamioTabsTrigger } from "~/components/andamio/andamio-tabs";
import type { JSONContent } from "@tiptap/core";

const sampleContent: JSONContent = {
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
          text: "Edit this content, switch to preview tab, or view the JSON structure.",
        },
      ],
    },
  ],
};

export default function EditorPage() {
  const [contentJson, setContentJson] = useState<JSONContent>(sampleContent);

  const handleContentChange = (content: JSONContent) => {
    setContentJson(content);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Tiptap Editor Demo</h1>
        <p className="text-muted-foreground">
          A rich text editor built with Tiptap and shadcn/ui
        </p>
      </div>

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
              <ContentEditor
                content={contentJson}
                onContentChange={handleContentChange}
                minHeight="400px"
                showWordCount
                placeholder="Start writing..."
              />
            </AndamioCardContent>
          </AndamioCard>
        </AndamioTabsContent>

        <AndamioTabsContent value="preview">
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle>Preview (Read-only)</AndamioCardTitle>
            </AndamioCardHeader>
            <AndamioCardContent>
              <ContentViewer content={contentJson} />
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
                  {JSON.stringify(contentJson, null, 2)}
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
