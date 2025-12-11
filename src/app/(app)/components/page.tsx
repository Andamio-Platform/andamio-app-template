"use client";

import React, { useState } from "react";
import { useCopyFeedback } from "~/hooks/use-success-notification";
import { AndamioPageHeader, AndamioSectionHeader, AndamioTableContainer } from "~/components/andamio";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioSwitch } from "~/components/andamio/andamio-switch";
import { AndamioCheckbox } from "~/components/andamio/andamio-checkbox";
import { RadioGroup as AndamioRadioGroup, RadioGroupItem as AndamioRadioGroupItem } from "~/components/andamio/andamio-radio-group";
import { AndamioSelect, AndamioSelectContent, AndamioSelectItem, AndamioSelectTrigger, AndamioSelectValue } from "~/components/andamio/andamio-select";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioProgress } from "~/components/andamio/andamio-progress";
import { AndamioTabs, AndamioTabsContent, AndamioTabsList, AndamioTabsTrigger } from "~/components/andamio/andamio-tabs";
import { AndamioTooltip, AndamioTooltipContent, AndamioTooltipProvider, AndamioTooltipTrigger } from "~/components/andamio/andamio-tooltip";
import { AndamioDialog, AndamioDialogContent, AndamioDialogDescription, AndamioDialogHeader, AndamioDialogTitle, AndamioDialogTrigger } from "~/components/andamio/andamio-dialog";
import {
  Palette,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  Sparkles,
  Copy,
  Check,
  Layout,
  Monitor,
  Smartphone,
  Plus,
  Blocks,
} from "lucide-react";

export default function ComponentsPage() {
  const [progress, setProgress] = useState(60);
  const { isCopied, copy } = useCopyFeedback();

  const CodeBlock = ({ code }: { code: string }) => (
    <div className="relative group">
      <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto border">
        <code>{code}</code>
      </pre>
      <AndamioButton
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => copy(code)}
      >
        {isCopied ? (
          <Check className="h-3 w-3" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </AndamioButton>
    </div>
  );

  return (
    <div className="space-y-12 pb-16">
      {/* Header */}
      <div className="py-8">
        <AndamioPageHeader
          title="Component Showcase"
          description="Explore the 45+ shadcn/ui components available in this template"
          centered
        />
      </div>

      {/* Responsive Testing Tip */}
      <AndamioAlert>
        <Monitor className="h-4 w-4" />
        <AndamioAlertTitle>Responsive Testing</AndamioAlertTitle>
        <AndamioAlertDescription>
          <span className="hidden xs:inline">Resize your browser window or use DevTools to see how these components adapt. </span>
          <span className="font-medium">Current breakpoint: </span>
          <span className="xs:hidden">mobile (&lt;375px)</span>
          <span className="hidden xs:inline sm:hidden">xs (375px+)</span>
          <span className="hidden sm:inline md:hidden">sm (640px+)</span>
          <span className="hidden md:inline lg:hidden">md (768px+)</span>
          <span className="hidden lg:inline xl:hidden">lg (1024px+)</span>
          <span className="hidden xl:inline 2xl:hidden">xl (1280px+)</span>
          <span className="hidden 2xl:inline">2xl (1536px+)</span>
        </AndamioAlertDescription>
      </AndamioAlert>

      {/* Responsive Layout Components */}
      <AndamioCard className="border-2 border-primary/30">
        <AndamioCardHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-primary" />
            <AndamioCardTitle>Responsive Layout Components</AndamioCardTitle>
          </div>
          <AndamioCardDescription className="text-base">
            Andamio layout components that automatically adapt to different screen sizes. Resize your browser to see them in action.
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-10">
          {/* AndamioPageHeader Examples */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">AndamioPageHeader</h3>
            <p className="text-sm text-muted-foreground">
              Page titles with optional description, badge, and action. Actions stack below on mobile.
            </p>

            <div className="space-y-6 border-l-2 border-primary/20 pl-4">
              {/* Basic */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Basic</p>
                <div className="bg-muted/30 p-4 rounded-md">
                  <AndamioPageHeader
                    title="Page Title"
                    description="A short description of what this page does"
                  />
                </div>
              </div>

              {/* With Action */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">With Action Button</p>
                <div className="bg-muted/30 p-4 rounded-md">
                  <AndamioPageHeader
                    title="Courses"
                    description="Manage your course content"
                    action={
                      <AndamioButton>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Course
                      </AndamioButton>
                    }
                  />
                </div>
              </div>

              {/* With Badge */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">With Badge</p>
                <div className="bg-muted/30 p-4 rounded-md">
                  <AndamioPageHeader
                    title="Module Details"
                    badge={<AndamioBadge variant="default">Published</AndamioBadge>}
                  />
                </div>
              </div>

              {/* Centered */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Centered (Landing Pages)</p>
                <div className="bg-muted/30 p-4 rounded-md">
                  <AndamioPageHeader
                    title="Welcome to Andamio"
                    description="Connect your wallet to start your learning journey"
                    centered
                  />
                </div>
              </div>
            </div>

            <CodeBlock
              code={`import { AndamioPageHeader } from "~/components/andamio";

// Basic
<AndamioPageHeader
  title="Page Title"
  description="Description text"
/>

// With action (stacks on mobile)
<AndamioPageHeader
  title="Courses"
  action={<Button>Create</Button>}
/>

// Centered (for landing/auth pages)
<AndamioPageHeader
  title="Welcome"
  description="Get started"
  centered
/>`}
            />
          </div>

          <AndamioSeparator />

          {/* AndamioSectionHeader Examples */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">AndamioSectionHeader</h3>
            <p className="text-sm text-muted-foreground">
              Section headers (h2/h3) with optional icon, badge, description, and action.
            </p>

            <div className="space-y-6 border-l-2 border-primary/20 pl-4">
              {/* Basic */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Basic</p>
                <div className="bg-muted/30 p-4 rounded-md">
                  <AndamioSectionHeader title="Student Learning Targets" />
                </div>
              </div>

              {/* With Icon and Badge */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">With Icon and Badge</p>
                <div className="bg-muted/30 p-4 rounded-md">
                  <AndamioSectionHeader
                    title="On-Chain Status"
                    icon={<Blocks className="h-5 w-5 text-success" />}
                    badge={<AndamioBadge variant="outline" className="text-success border-success">Verified</AndamioBadge>}
                  />
                </div>
              </div>

              {/* With Action */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">With Action Button</p>
                <div className="bg-muted/30 p-4 rounded-md">
                  <AndamioSectionHeader
                    title="Available Tasks"
                    action={
                      <AndamioButton size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Task
                      </AndamioButton>
                    }
                  />
                </div>
              </div>

              {/* With Description */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">With Description</p>
                <div className="bg-muted/30 p-4 rounded-md">
                  <AndamioSectionHeader
                    title="Module Assignment"
                    description="Complete this assignment to demonstrate your understanding of the learning targets."
                  />
                </div>
              </div>
            </div>

            <CodeBlock
              code={`import { AndamioSectionHeader } from "~/components/andamio";

// Basic
<AndamioSectionHeader title="Section Title" />

// With icon and badge
<AndamioSectionHeader
  title="On-Chain Status"
  icon={<Blocks className="h-5 w-5" />}
  badge={<Badge>Verified</Badge>}
/>

// With action (stacks on mobile)
<AndamioSectionHeader
  title="Tasks"
  action={<Button size="sm">Add</Button>}
/>`}
            />
          </div>

          <AndamioSeparator />

          {/* AndamioTableContainer Example */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">AndamioTableContainer</h3>
            <p className="text-sm text-muted-foreground">
              Responsive table wrapper with horizontal scrolling on mobile. Try making your browser narrower to see the scroll behavior.
            </p>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                <Smartphone className="h-3 w-3 inline mr-1" />
                Scrollable Table (resize to test)
              </p>
              <AndamioTableContainer>
                <AndamioTable>
                  <AndamioTableHeader>
                    <AndamioTableRow>
                      <AndamioTableHead>Title</AndamioTableHead>
                      <AndamioTableHead>Status</AndamioTableHead>
                      <AndamioTableHead className="hidden sm:table-cell">Category</AndamioTableHead>
                      <AndamioTableHead className="hidden md:table-cell">Description</AndamioTableHead>
                      <AndamioTableHead className="hidden lg:table-cell">Created</AndamioTableHead>
                      <AndamioTableHead>Actions</AndamioTableHead>
                    </AndamioTableRow>
                  </AndamioTableHeader>
                  <AndamioTableBody>
                    {[
                      { title: "Introduction to Cardano", status: "Published", category: "Blockchain", desc: "Learn the basics of Cardano", date: "Dec 1, 2024" },
                      { title: "Smart Contracts 101", status: "Draft", category: "Development", desc: "Build your first Plutus contract", date: "Dec 5, 2024" },
                      { title: "Governance Fundamentals", status: "Published", category: "Community", desc: "Understand CIP voting process", date: "Dec 8, 2024" },
                    ].map((item, i) => (
                      <AndamioTableRow key={i}>
                        <AndamioTableCell className="font-medium">{item.title}</AndamioTableCell>
                        <AndamioTableCell>
                          <AndamioBadge variant={item.status === "Published" ? "default" : "secondary"}>
                            {item.status}
                          </AndamioBadge>
                        </AndamioTableCell>
                        <AndamioTableCell className="hidden sm:table-cell">{item.category}</AndamioTableCell>
                        <AndamioTableCell className="hidden md:table-cell max-w-xs truncate">{item.desc}</AndamioTableCell>
                        <AndamioTableCell className="hidden lg:table-cell text-muted-foreground">{item.date}</AndamioTableCell>
                        <AndamioTableCell>
                          <AndamioButton variant="ghost" size="sm">Edit</AndamioButton>
                        </AndamioTableCell>
                      </AndamioTableRow>
                    ))}
                  </AndamioTableBody>
                </AndamioTable>
              </AndamioTableContainer>
              <p className="text-xs text-muted-foreground">
                Notice: &quot;Category&quot; hidden below sm, &quot;Description&quot; hidden below md, &quot;Created&quot; hidden below lg
              </p>
            </div>

            <CodeBlock
              code={`import { AndamioTableContainer } from "~/components/andamio";
import { AndamioTable, ... } from "~/components/andamio/andamio-table";

<AndamioTableContainer>
  <AndamioTable>
    <AndamioTableHeader>
      <AndamioTableRow>
        <AndamioTableHead>Title</AndamioTableHead>
        {/* Hide on mobile */}
        <AndamioTableHead className="hidden sm:table-cell">
          Category
        </AndamioTableHead>
      </AndamioTableRow>
    </AndamioTableHeader>
    <AndamioTableBody>...</AndamioTableBody>
  </AndamioTable>
</AndamioTableContainer>`}
            />
          </div>
        </AndamioCardContent>
      </AndamioCard>

      {/* Responsive Patterns */}
      <AndamioCard className="border-2 border-primary/30">
        <AndamioCardHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <AndamioCardTitle>Responsive Patterns</AndamioCardTitle>
          </div>
          <AndamioCardDescription className="text-base">
            Common patterns for building responsive layouts. Resize to see them adapt.
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-8">
          {/* Flex Stacking */}
          <div className="space-y-4">
            <h3 className="font-semibold">Flex Stacking</h3>
            <p className="text-sm text-muted-foreground">
              Elements stack vertically on mobile, horizontal on larger screens.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-primary/10 p-4 rounded-md text-center">
                <p className="text-sm font-medium">Item 1</p>
                <p className="text-xs text-muted-foreground">Stacks on mobile</p>
              </div>
              <div className="flex-1 bg-primary/10 p-4 rounded-md text-center">
                <p className="text-sm font-medium">Item 2</p>
                <p className="text-xs text-muted-foreground">Side-by-side on sm+</p>
              </div>
              <div className="flex-1 bg-primary/10 p-4 rounded-md text-center">
                <p className="text-sm font-medium">Item 3</p>
                <p className="text-xs text-muted-foreground">Flexible layout</p>
              </div>
            </div>
            <CodeBlock code={`<div className="flex flex-col sm:flex-row gap-4">
  <div className="flex-1">Item 1</div>
  <div className="flex-1">Item 2</div>
</div>`} />
          </div>

          <AndamioSeparator />

          {/* Grid Columns */}
          <div className="space-y-4">
            <h3 className="font-semibold">Responsive Grid</h3>
            <p className="text-sm text-muted-foreground">
              Grid columns that adapt: 1 on mobile, 2 on sm, 3 on lg.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-muted p-4 rounded-md text-center">
                  <p className="font-medium">Card {n}</p>
                </div>
              ))}
            </div>
            <CodeBlock code={`<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>`} />
          </div>

          <AndamioSeparator />

          {/* Text Sizing */}
          <div className="space-y-4">
            <h3 className="font-semibold">Responsive Text Sizing</h3>
            <p className="text-sm text-muted-foreground">
              Text scales up on larger screens for better readability.
            </p>
            <div className="space-y-2">
              <p className="text-2xl sm:text-3xl font-bold">Page Title (text-2xl sm:text-3xl)</p>
              <p className="text-xl sm:text-2xl font-semibold">Section Title (text-xl sm:text-2xl)</p>
              <p className="text-sm sm:text-base">Body text (text-sm sm:text-base)</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Helper text (text-xs sm:text-sm)</p>
            </div>
            <CodeBlock code={`<h1 className="text-2xl sm:text-3xl font-bold">Title</h1>
<p className="text-sm sm:text-base">Body text</p>
<span className="text-xs sm:text-sm text-muted-foreground">Helper</span>`} />
          </div>

          <AndamioSeparator />

          {/* Hide/Show Elements */}
          <div className="space-y-4">
            <h3 className="font-semibold">Conditional Visibility</h3>
            <p className="text-sm text-muted-foreground">
              Show or hide elements at different breakpoints.
            </p>
            <div className="flex flex-wrap gap-2">
              <AndamioBadge className="sm:hidden">Mobile only</AndamioBadge>
              <AndamioBadge className="hidden sm:inline-flex md:hidden">sm only</AndamioBadge>
              <AndamioBadge className="hidden md:inline-flex lg:hidden">md only</AndamioBadge>
              <AndamioBadge className="hidden lg:inline-flex">lg+ only</AndamioBadge>
              <AndamioBadge variant="outline" className="hidden sm:inline-flex">Hidden on mobile</AndamioBadge>
            </div>
            <CodeBlock code={`{/* Only visible on mobile */}
<div className="sm:hidden">Mobile content</div>

{/* Hidden on mobile, visible on larger screens */}
<div className="hidden sm:block">Desktop content</div>

{/* Table cell hidden on mobile */}
<TableCell className="hidden md:table-cell">...</TableCell>`} />
          </div>
        </AndamioCardContent>
      </AndamioCard>

      {/* Semantic Colors Section */}
      <AndamioCard className="border-2">
        <AndamioCardHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <AndamioCardTitle>Semantic Color System</AndamioCardTitle>
          </div>
          <AndamioCardDescription className="text-base">
            Use semantic colors for consistent theming across light and dark modes
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-8">
          {/* Status Colors */}
          <div>
            <h3 className="font-semibold mb-3">Status Colors</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 rounded-md bg-success flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-success-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Success</p>
                  <code className="text-xs text-muted-foreground">text-success</code>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-md bg-warning flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-warning-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Warning</p>
                  <code className="text-xs text-muted-foreground">text-warning</code>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-md bg-destructive flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-destructive-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Destructive</p>
                  <code className="text-xs text-muted-foreground">text-destructive</code>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-md bg-info flex items-center justify-center">
                  <Info className="h-8 w-8 text-info-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Info</p>
                  <code className="text-xs text-muted-foreground">text-info</code>
                </div>
              </div>
            </div>
          </div>

          <CodeBlock
            code={`// Always use semantic colors
<CheckCircle className="text-success" />
<AlertTriangle className="text-warning" />
<AlertCircle className="text-destructive" />
<Info className="text-info" />

// Never use hardcoded colors like text-green-600`}
          />
        </AndamioCardContent>
      </AndamioCard>

      {/* Buttons */}
      <AndamioCard className="border-2">
        <AndamioCardHeader className="space-y-4">
          <AndamioCardTitle>Buttons</AndamioCardTitle>
          <AndamioCardDescription className="text-base">
            Different button variants and sizes for various use cases
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-8">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3 text-sm">Variants</h3>
              <div className="flex flex-wrap gap-2">
                <AndamioButton variant="default">Default</AndamioButton>
                <AndamioButton variant="secondary">Secondary</AndamioButton>
                <AndamioButton variant="destructive">Destructive</AndamioButton>
                <AndamioButton variant="outline">Outline</AndamioButton>
                <AndamioButton variant="ghost">Ghost</AndamioButton>
                <AndamioButton variant="link">Link</AndamioButton>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-sm">Sizes</h3>
              <div className="flex flex-wrap items-center gap-2">
                <AndamioButton size="sm">Small</AndamioButton>
                <AndamioButton size="default">Default</AndamioButton>
                <AndamioButton size="lg">Large</AndamioButton>
                <AndamioButton size="icon">
                  <Sparkles className="h-4 w-4" />
                </AndamioButton>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-sm">With Icons</h3>
              <div className="flex flex-wrap gap-2">
                <AndamioButton>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Left Icon
                </AndamioButton>
                <AndamioButton>
                  Right Icon
                  <Sparkles className="ml-2 h-4 w-4" />
                </AndamioButton>
              </div>
            </div>
          </div>

          <CodeBlock
            code={`import { AndamioButton } from "~/components/andamio/andamio-button";

<AndamioButton variant="default">Default</AndamioButton>
<AndamioButton variant="outline" size="lg">
  <Icon className="mr-2 h-4 w-4" />
  With Icon
</AndamioButton>`}
          />
        </AndamioCardContent>
      </AndamioCard>

      {/* Badges */}
      <AndamioCard className="border-2">
        <AndamioCardHeader className="space-y-4">
          <AndamioCardTitle>Badges</AndamioCardTitle>
          <AndamioCardDescription className="text-base">
            Status indicators and labels
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-8">
          <div className="flex flex-wrap gap-2">
            <AndamioBadge variant="default">Default</AndamioBadge>
            <AndamioBadge variant="secondary">Secondary</AndamioBadge>
            <AndamioBadge variant="destructive">Destructive</AndamioBadge>
            <AndamioBadge variant="outline">Outline</AndamioBadge>
          </div>

          <CodeBlock
            code={`import { AndamioBadge } from "~/components/andamio/andamio-badge";

<AndamioBadge variant="default">Published</AndamioBadge>
<AndamioBadge variant="outline">Draft</AndamioBadge>`}
          />
        </AndamioCardContent>
      </AndamioCard>

      {/* Alerts */}
      <AndamioCard className="border-2">
        <AndamioCardHeader className="space-y-4">
          <AndamioCardTitle>Alerts</AndamioCardTitle>
          <AndamioCardDescription className="text-base">
            Important messages and notifications
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-6">
          <AndamioAlert>
            <Info className="h-4 w-4" />
            <AndamioAlertTitle>Default Alert</AndamioAlertTitle>
            <AndamioAlertDescription>
              This is a default informational alert message.
            </AndamioAlertDescription>
          </AndamioAlert>

          <AndamioAlert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AndamioAlertTitle>Error Alert</AndamioAlertTitle>
            <AndamioAlertDescription>
              This is a destructive alert for errors and critical issues.
            </AndamioAlertDescription>
          </AndamioAlert>

          <CodeBlock
            code={`import { AndamioAlert, AndamioAlertTitle, AndamioAlertDescription } from "~/components/andamio/andamio-alert";

<AndamioAlert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AndamioAlertTitle>Error</AndamioAlertTitle>
  <AndamioAlertDescription>Message here</AndamioAlertDescription>
</AndamioAlert>`}
          />
        </AndamioCardContent>
      </AndamioCard>

      {/* Form Components */}
      <AndamioCard className="border-2">
        <AndamioCardHeader className="space-y-4">
          <AndamioCardTitle>Form Components</AndamioCardTitle>
          <AndamioCardDescription className="text-base">
            Input fields, selects, checkboxes, and more
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-8">
          <div className="grid gap-6 max-w-md">
            {/* Input */}
            <div className="space-y-2">
              <AndamioLabel htmlFor="email">Email</AndamioLabel>
              <AndamioInput id="email" type="email" placeholder="you@example.com" />
            </div>

            {/* Select */}
            <div className="space-y-2">
              <AndamioLabel htmlFor="select">Select Option</AndamioLabel>
              <AndamioSelect>
                <AndamioSelectTrigger id="select">
                  <AndamioSelectValue placeholder="Choose an option" />
                </AndamioSelectTrigger>
                <AndamioSelectContent>
                  <AndamioSelectItem value="option1">Option 1</AndamioSelectItem>
                  <AndamioSelectItem value="option2">Option 2</AndamioSelectItem>
                  <AndamioSelectItem value="option3">Option 3</AndamioSelectItem>
                </AndamioSelectContent>
              </AndamioSelect>
            </div>

            {/* Checkbox */}
            <div className="flex items-center space-x-2">
              <AndamioCheckbox id="terms" />
              <AndamioLabel htmlFor="terms" className="cursor-pointer">
                Accept terms and conditions
              </AndamioLabel>
            </div>

            {/* Switch */}
            <div className="flex items-center justify-between">
              <AndamioLabel htmlFor="notifications">Enable notifications</AndamioLabel>
              <AndamioSwitch id="notifications" />
            </div>

            {/* Radio Group */}
            <div className="space-y-2">
              <AndamioLabel>Choose a plan</AndamioLabel>
              <AndamioRadioGroup defaultValue="free">
                <div className="flex items-center space-x-2">
                  <AndamioRadioGroupItem value="free" id="free" />
                  <AndamioLabel htmlFor="free" className="cursor-pointer">Free</AndamioLabel>
                </div>
                <div className="flex items-center space-x-2">
                  <AndamioRadioGroupItem value="pro" id="pro" />
                  <AndamioLabel htmlFor="pro" className="cursor-pointer">Pro</AndamioLabel>
                </div>
              </AndamioRadioGroup>
            </div>
          </div>

          <CodeBlock
            code={`import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioSelect, ... } from "~/components/andamio/andamio-select";

<div className="space-y-2">
  <AndamioLabel htmlFor="email">Email</AndamioLabel>
  <AndamioInput id="email" type="email" />
</div>`}
          />
        </AndamioCardContent>
      </AndamioCard>

      {/* Progress & Loading */}
      <AndamioCard className="border-2">
        <AndamioCardHeader className="space-y-4">
          <AndamioCardTitle>Progress & Loading States</AndamioCardTitle>
          <AndamioCardDescription className="text-base">
            Show progress and loading indicators
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {progress}%</span>
                <AndamioButton
                  size="sm"
                  variant="outline"
                  onClick={() => setProgress((p) => (p >= 100 ? 0 : p + 10))}
                >
                  +10%
                </AndamioButton>
              </div>
              <AndamioProgress value={progress} />
            </div>

            <AndamioSeparator />

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Skeleton Loaders</h3>
              <div className="space-y-2">
                <AndamioSkeleton className="h-4 w-full" />
                <AndamioSkeleton className="h-4 w-3/4" />
                <AndamioSkeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>

          <CodeBlock
            code={`import { AndamioProgress } from "~/components/andamio/andamio-progress";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";

<AndamioProgress value={60} />
<AndamioSkeleton className="h-4 w-full" />`}
          />
        </AndamioCardContent>
      </AndamioCard>

      {/* Tabs */}
      <AndamioCard className="border-2">
        <AndamioCardHeader className="space-y-4">
          <AndamioCardTitle>Tabs</AndamioCardTitle>
          <AndamioCardDescription className="text-base">
            Organize content with tabbed navigation
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-8">
          <AndamioTabs defaultValue="overview">
            <AndamioTabsList>
              <AndamioTabsTrigger value="overview">Overview</AndamioTabsTrigger>
              <AndamioTabsTrigger value="details">Details</AndamioTabsTrigger>
              <AndamioTabsTrigger value="settings">Settings</AndamioTabsTrigger>
            </AndamioTabsList>
            <AndamioTabsContent value="overview" className="space-y-2">
              <p className="text-sm">This is the overview tab content.</p>
            </AndamioTabsContent>
            <AndamioTabsContent value="details" className="space-y-2">
              <p className="text-sm">This is the details tab content.</p>
            </AndamioTabsContent>
            <AndamioTabsContent value="settings" className="space-y-2">
              <p className="text-sm">This is the settings tab content.</p>
            </AndamioTabsContent>
          </AndamioTabs>

          <CodeBlock
            code={`import { AndamioTabs, AndamioTabsList, AndamioTabsTrigger, AndamioTabsContent } from "~/components/andamio/andamio-tabs";

<AndamioTabs defaultValue="overview">
  <AndamioTabsList>
    <AndamioTabsTrigger value="overview">Overview</AndamioTabsTrigger>
  </AndamioTabsList>
  <AndamioTabsContent value="overview">Content</AndamioTabsContent>
</AndamioTabs>`}
          />
        </AndamioCardContent>
      </AndamioCard>

      {/* Dialog & Tooltip */}
      <AndamioCard className="border-2">
        <AndamioCardHeader className="space-y-4">
          <AndamioCardTitle>Dialog & Tooltip</AndamioCardTitle>
          <AndamioCardDescription className="text-base">
            Modal dialogs and hover tooltips
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-8">
          <div className="flex flex-wrap gap-4">
            <AndamioDialog>
              <AndamioDialogTrigger asChild>
                <AndamioButton>Open Dialog</AndamioButton>
              </AndamioDialogTrigger>
              <AndamioDialogContent>
                <AndamioDialogHeader>
                  <AndamioDialogTitle>Dialog Title</AndamioDialogTitle>
                  <AndamioDialogDescription>
                    This is a modal dialog with customizable content.
                  </AndamioDialogDescription>
                </AndamioDialogHeader>
                <div className="py-4">
                  <p className="text-sm">Your dialog content goes here.</p>
                </div>
              </AndamioDialogContent>
            </AndamioDialog>

            <AndamioTooltipProvider>
              <AndamioTooltip>
                <AndamioTooltipTrigger asChild>
                  <AndamioButton variant="outline">Hover for Tooltip</AndamioButton>
                </AndamioTooltipTrigger>
                <AndamioTooltipContent>
                  <p>This is a helpful tooltip!</p>
                </AndamioTooltipContent>
              </AndamioTooltip>
            </AndamioTooltipProvider>
          </div>

          <CodeBlock
            code={`import { AndamioDialog, AndamioDialogContent, AndamioDialogTrigger, ... } from "~/components/andamio/andamio-dialog";
import { AndamioTooltip, AndamioTooltipProvider, ... } from "~/components/andamio/andamio-tooltip";

<AndamioDialog>
  <AndamioDialogTrigger asChild>
    <AndamioButton>Open</AndamioButton>
  </AndamioDialogTrigger>
  <AndamioDialogContent>Content here</AndamioDialogContent>
</AndamioDialog>`}
          />
        </AndamioCardContent>
      </AndamioCard>

      {/* Cards */}
      <AndamioCard className="border-2">
        <AndamioCardHeader className="space-y-4">
          <AndamioCardTitle>Cards</AndamioCardTitle>
          <AndamioCardDescription className="text-base">
            Container components for grouping content
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-8">
          <div className="grid md:grid-cols-2 gap-4">
            <AndamioCard>
              <AndamioCardHeader>
                <AndamioCardTitle>Simple Card</AndamioCardTitle>
                <AndamioCardDescription>
                  A basic card with header and content
                </AndamioCardDescription>
              </AndamioCardHeader>
              <AndamioCardContent>
                <p className="text-sm">Card content goes here.</p>
              </AndamioCardContent>
            </AndamioCard>

            <AndamioCard className="border-2 border-primary/50">
              <AndamioCardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <AndamioCardTitle>Styled Card</AndamioCardTitle>
                </div>
                <AndamioCardDescription>
                  With custom border and icon
                </AndamioCardDescription>
              </AndamioCardHeader>
              <AndamioCardContent>
                <p className="text-sm">Enhanced card styling.</p>
              </AndamioCardContent>
            </AndamioCard>
          </div>

          <CodeBlock
            code={`import { AndamioCard, AndamioCardHeader, AndamioCardTitle, AndamioCardDescription, AndamioCardContent } from "~/components/andamio/andamio-card";

<AndamioCard>
  <AndamioCardHeader>
    <AndamioCardTitle>Title</AndamioCardTitle>
    <AndamioCardDescription>Description</AndamioCardDescription>
  </AndamioCardHeader>
  <AndamioCardContent>Content here</AndamioCardContent>
</AndamioCard>`}
          />
        </AndamioCardContent>
      </AndamioCard>

      {/* Component List */}
      <AndamioCard className="border-2">
        <AndamioCardHeader className="space-y-4">
          <AndamioCardTitle>All Available Components</AndamioCardTitle>
          <AndamioCardDescription className="text-base">
            Complete list of 45+ shadcn/ui components installed in this template
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="pt-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {[
              "Accordion", "Alert", "Alert Dialog", "Aspect Ratio", "Avatar",
              "Badge", "Breadcrumb", "Button", "Calendar", "Card",
              "Carousel", "Chart", "Checkbox", "Collapsible", "Command",
              "Context Menu", "Dialog", "Drawer", "Dropdown Menu", "Form",
              "Hover Card", "Input", "Input OTP", "Label", "Menubar",
              "Navigation Menu", "Pagination", "Popover", "Progress", "Radio Group",
              "Resizable", "Scroll Area", "Select", "Separator", "Sheet",
              "Skeleton", "Slider", "Sonner", "Switch", "Table",
              "Tabs", "Textarea", "Toggle", "Toggle Group", "Tooltip",
            ].map((component) => (
              <AndamioBadge key={component} variant="outline" className="justify-center">
                {component}
              </AndamioBadge>
            ))}
          </div>
        </AndamioCardContent>
      </AndamioCard>
    </div>
  );
}
