"use client";

import React, { useState } from "react";
import { useCopyFeedback } from "~/hooks/use-success-notification";
import { AndamioButton } from "~/components/andamio/andamio-button";
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
      <div className="text-center max-w-3xl mx-auto space-y-4 py-8">
        <h1 className="text-4xl font-bold">Component Showcase</h1>
        <p className="text-xl text-muted-foreground">
          Explore the 45+ shadcn/ui components available in this template
        </p>
      </div>

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
