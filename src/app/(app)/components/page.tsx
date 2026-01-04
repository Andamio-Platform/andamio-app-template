"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

// Layout Components
import { AndamioPageHeader, AndamioSectionHeader, AndamioTableContainer } from "~/components/andamio";
import { AndamioEmptyState } from "~/components/andamio/andamio-empty-state";
import { AndamioNotFoundCard } from "~/components/andamio/andamio-not-found-card";
import { AndamioStatCard } from "~/components/andamio/andamio-stat-card";
import { AndamioPageLoading } from "~/components/andamio/andamio-page-loading";

// Core Components
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSaveButton } from "~/components/andamio/andamio-save-button";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle, AndamioCardFooter } from "~/components/andamio/andamio-card";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioProgress } from "~/components/andamio/andamio-progress";

// Form Components
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioTextarea } from "~/components/andamio/andamio-textarea";
import { AndamioSwitch } from "~/components/andamio/andamio-switch";
import { AndamioCheckbox } from "~/components/andamio/andamio-checkbox";
import { RadioGroup as AndamioRadioGroup, RadioGroupItem as AndamioRadioGroupItem } from "~/components/andamio/andamio-radio-group";
import { AndamioSelect, AndamioSelectContent, AndamioSelectItem, AndamioSelectTrigger, AndamioSelectValue } from "~/components/andamio/andamio-select";
import { AndamioSlider } from "~/components/andamio/andamio-slider";

// Navigation & Overlay Components
import { AndamioTabs, AndamioTabsContent, AndamioTabsList, AndamioTabsTrigger } from "~/components/andamio/andamio-tabs";
import { AndamioDialog, AndamioDialogContent, AndamioDialogDescription, AndamioDialogHeader, AndamioDialogTitle, AndamioDialogTrigger, AndamioDialogFooter } from "~/components/andamio/andamio-dialog";
import { AndamioSheet, AndamioSheetContent, AndamioSheetDescription, AndamioSheetHeader, AndamioSheetTitle, AndamioSheetTrigger, AndamioSheetFooter } from "~/components/andamio/andamio-sheet";
import { AndamioDrawer, AndamioDrawerContent, AndamioDrawerDescription, AndamioDrawerHeader, AndamioDrawerTitle, AndamioDrawerTrigger, AndamioDrawerFooter } from "~/components/andamio/andamio-drawer";
import { AndamioPopover, AndamioPopoverContent, AndamioPopoverTrigger } from "~/components/andamio/andamio-popover";
import { AndamioTooltip, AndamioTooltipContent, AndamioTooltipProvider, AndamioTooltipTrigger } from "~/components/andamio/andamio-tooltip";
import { AndamioHoverCard, AndamioHoverCardContent, AndamioHoverCardTrigger } from "~/components/andamio/andamio-hover-card";
import { AndamioDropdownMenu, AndamioDropdownMenuContent, AndamioDropdownMenuItem, AndamioDropdownMenuLabel, AndamioDropdownMenuSeparator, AndamioDropdownMenuTrigger } from "~/components/andamio/andamio-dropdown-menu";
import { AndamioContextMenu, AndamioContextMenuContent, AndamioContextMenuItem, AndamioContextMenuTrigger } from "~/components/andamio/andamio-context-menu";

// Data Display Components
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AndamioAccordion, AndamioAccordionContent, AndamioAccordionItem, AndamioAccordionTrigger } from "~/components/andamio/andamio-accordion";
import { AndamioAvatar, AndamioAvatarFallback, AndamioAvatarImage } from "~/components/andamio/andamio-avatar";
import { AndamioBreadcrumb, AndamioBreadcrumbItem, AndamioBreadcrumbLink, AndamioBreadcrumbList, AndamioBreadcrumbPage, AndamioBreadcrumbSeparator } from "~/components/andamio/andamio-breadcrumb";
import { AndamioScrollArea } from "~/components/andamio/andamio-scroll-area";
import { AndamioCollapsible, AndamioCollapsibleContent, AndamioCollapsibleTrigger } from "~/components/andamio/andamio-collapsible";

// Toggle & Action Components
import { AndamioToggle } from "~/components/andamio/andamio-toggle";
import { AndamioToggleGroup, AndamioToggleGroupItem } from "~/components/andamio/andamio-toggle-group";

// Confirmation Components
import { AndamioAlertDialog, AndamioAlertDialogAction, AndamioAlertDialogCancel, AndamioAlertDialogContent, AndamioAlertDialogDescription, AndamioAlertDialogFooter, AndamioAlertDialogHeader, AndamioAlertDialogTitle, AndamioAlertDialogTrigger } from "~/components/andamio/andamio-alert-dialog";
import { AndamioConfirmDialog } from "~/components/andamio/andamio-confirm-dialog";

// Pagination
import { AndamioPagination, AndamioPaginationContent, AndamioPaginationItem, AndamioPaginationLink, AndamioPaginationNext, AndamioPaginationPrevious, AndamioPaginationEllipsis } from "~/components/andamio/andamio-pagination";

// Resizable
import { AndamioResizablePanelGroup, AndamioResizablePanel, AndamioResizableHandle } from "~/components/andamio/andamio-resizable";

// Icons - Semantic icons from centralized system
import {
  VerifiedIcon,
  AlertIcon,
  SparkleIcon,
  AddIcon,
  OnChainIcon,
  ExpandIcon,
  NextIcon,
  SettingsIcon,
  MoreIcon,
  CourseIcon,
  DeleteIcon,
  EditIcon,
  PreviewIcon,
  PendingIcon,
  TeacherIcon,
  EmptyIcon,
  // Additional semantic icons
  ThemeIcon,
  InfoIcon,
  WarningIcon,
  LayoutIcon,
  MonitorIcon,
  UserIcon,
  LogOutIcon,
  MailIcon,
  CalendarIcon,
  PaymentIcon,
  DownloadIcon,
  ShareIcon,
  StarIcon,
} from "~/components/icons";
// Editor formatting icons remain as direct imports (editor-specific, not Andamio domain)
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { AndamioText } from "~/components/andamio/andamio-text";

export default function ComponentsPage() {
  const [progress, setProgress] = useState(60);
  const [sliderValue, setSliderValue] = useState([50]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  // CodeBlock helper - disabled until we add code examples
  // const CodeBlock = ({ code }: { code: string }) => (
  //   <div className="relative group">
  //     <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto border">
  //       <code>{code}</code>
  //     </pre>
  //     <AndamioButton
  //       size="sm"
  //       variant="ghost"
  //       className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
  //       onClick={() => _copy(code)}
  //     >
  //       {_isCopied ? (
  //         <CompletedIcon className="h-3 w-3" />
  //       ) : (
  //         <CopyIcon className="h-3 w-3" />
  //       )}
  //     </AndamioButton>
  //   </div>
  // );

  return (
    <div className="space-y-12 pb-16">
      {/* Header */}
      <div className="py-8">
        <AndamioPageHeader
          title="Andamio Component Showcase"
          description="Complete reference for all 55+ Andamio UI components with placeholder data"
          centered
        />
      </div>

      {/* Table of Contents */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Quick Navigation</AndamioCardTitle>
          <AndamioCardDescription>Jump to any component section</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
            {[
              "Semantic Colors",
              "Layout Components",
              "Buttons",
              "Badges",
              "Cards",
              "Alerts",
              "Form Components",
              "Progress & Loading",
              "Tabs",
              "Accordions",
              "Dialogs & Sheets",
              "Dropdowns & Menus",
              "Tooltips & Popovers",
              "Tables",
              "Avatars",
              "Breadcrumbs",
              "Pagination",
              "Toggles",
              "Sliders",
              "Scroll Areas",
              "Collapsibles",
              "Resizable Panels",
              "State Components",
              "Confirmation Dialogs",
            ].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-primary hover:underline"
              >
                {item}
              </Link>
            ))}
          </div>
        </AndamioCardContent>
      </AndamioCard>

      {/* Responsive Testing Tip */}
      <AndamioAlert>
        <MonitorIcon className="h-4 w-4" />
        <AndamioAlertTitle>Responsive Testing</AndamioAlertTitle>
        <AndamioAlertDescription>
          <span className="hidden xs:inline">Resize your browser window to see responsive behavior. </span>
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

      {/* ============================================= */}
      {/* TYPOGRAPHY */}
      {/* ============================================= */}
      <div id="typography">
        <AndamioCard className="border-2">
          <AndamioCardHeader className="space-y-4">
            <div className="flex items-center gap-2">
              <OnChainIcon className="h-5 w-5 text-primary" />
              <AndamioCardTitle>Typography Scale</AndamioCardTitle>
            </div>
            <AndamioCardDescription className="text-base">
              Global heading styles defined in <code className="text-xs">src/styles/globals.css</code>.
              Never add custom size/margin/padding to headings—only color classes are allowed.
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-8">
            {/* Heading Examples */}
            <div className="space-y-6 border rounded-lg p-6 bg-background">
              <div className="border-b pb-4">
                <h1>Heading 1 — Hero Title</h1>
                <code className="text-xs text-muted-foreground">&lt;h1&gt; — Page titles, hero sections</code>
              </div>
              <div className="border-b pb-4">
                <h2>Heading 2 — Section Title</h2>
                <code className="text-xs text-muted-foreground">&lt;h2&gt; — Major sections</code>
              </div>
              <div className="border-b pb-4">
                <h3>Heading 3 — Subsection Title</h3>
                <code className="text-xs text-muted-foreground">&lt;h3&gt; — Subsections, card headers</code>
              </div>
              <div className="border-b pb-4">
                <h4>Heading 4 — Helper Label</h4>
                <code className="text-xs text-muted-foreground">&lt;h4&gt; — Labels, minor headers</code>
              </div>
              <div className="border-b pb-4">
                <h5>Heading 5 — Small Label</h5>
                <code className="text-xs text-muted-foreground">&lt;h5&gt; — Small labels</code>
              </div>
              <div>
                <h6>Heading 6 — Overline</h6>
                <code className="text-xs text-muted-foreground">&lt;h6&gt; — Overlines, categories</code>
              </div>
            </div>

            {/* Color Variants */}
            <div>
              <h4>Color Variants (allowed)</h4>
              <div className="grid sm:grid-cols-2 gap-4 mt-3">
                <div className="p-4 border rounded-lg">
                  <h3>Default Foreground</h3>
                  <code className="text-xs text-muted-foreground">&lt;h3&gt;...&lt;/h3&gt;</code>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="text-muted-foreground">Muted Foreground</h3>
                  <code className="text-xs text-muted-foreground">&lt;h3 className=&quot;text-muted-foreground&quot;&gt;</code>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="text-primary">Primary Color</h3>
                  <code className="text-xs text-muted-foreground">&lt;h3 className=&quot;text-primary&quot;&gt;</code>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="text-destructive">Destructive Color</h3>
                  <code className="text-xs text-muted-foreground">&lt;h3 className=&quot;text-destructive&quot;&gt;</code>
                </div>
              </div>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* SEMANTIC COLORS */}
      {/* ============================================= */}
      <div id="semantic-colors">
        <AndamioCard className="border-2">
          <AndamioCardHeader className="space-y-4">
            <div className="flex items-center gap-2">
              <ThemeIcon className="h-5 w-5 text-primary" />
              <AndamioCardTitle>Semantic Color System</AndamioCardTitle>
            </div>
            <AndamioCardDescription className="text-base">
              All colors defined in <code className="text-xs">src/styles/globals.css</code>. Customize these to theme your app.
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-8">
            {/* Base Colors */}
            <div>
              <h3>Base Colors</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-background border flex items-center justify-center">
                    <span className="text-foreground text-sm font-medium">Background</span>
                  </div>
                  <code className="text-xs text-muted-foreground block">bg-background / text-foreground</code>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-card border flex items-center justify-center">
                    <span className="text-card-foreground text-sm font-medium">Card</span>
                  </div>
                  <code className="text-xs text-muted-foreground block">bg-card / text-card-foreground</code>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-popover border flex items-center justify-center">
                    <span className="text-popover-foreground text-sm font-medium">Popover</span>
                  </div>
                  <code className="text-xs text-muted-foreground block">bg-popover / text-popover-foreground</code>
                </div>
              </div>
            </div>

            <AndamioSeparator />

            {/* Interactive Colors */}
            <div>
              <h3>Interactive Colors</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-medium">Primary</span>
                  </div>
                  <code className="text-xs text-muted-foreground block">bg-primary</code>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-secondary flex items-center justify-center">
                    <span className="text-secondary-foreground text-sm font-medium">Secondary</span>
                  </div>
                  <code className="text-xs text-muted-foreground block">bg-secondary</code>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground text-sm font-medium">Muted</span>
                  </div>
                  <code className="text-xs text-muted-foreground block">bg-muted</code>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-accent flex items-center justify-center">
                    <span className="text-accent-foreground text-sm font-medium">Accent</span>
                  </div>
                  <code className="text-xs text-muted-foreground block">bg-accent</code>
                </div>
              </div>
            </div>

            <AndamioSeparator />

            {/* Status Colors */}
            <div>
              <h3>Status Colors</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-success flex items-center justify-center">
                    <VerifiedIcon className="h-6 w-6 text-success-foreground" />
                  </div>
                  <AndamioText variant="small" className="font-medium text-foreground">Success</AndamioText>
                  <code className="text-xs text-muted-foreground">text-success</code>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-warning flex items-center justify-center">
                    <WarningIcon className="h-6 w-6 text-warning-foreground" />
                  </div>
                  <AndamioText variant="small" className="font-medium text-foreground">Warning</AndamioText>
                  <code className="text-xs text-muted-foreground">text-warning</code>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-destructive flex items-center justify-center">
                    <AlertIcon className="h-6 w-6 text-destructive-foreground" />
                  </div>
                  <AndamioText variant="small" className="font-medium text-foreground">Destructive</AndamioText>
                  <code className="text-xs text-muted-foreground">text-destructive</code>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-info flex items-center justify-center">
                    <InfoIcon className="h-6 w-6 text-info-foreground" />
                  </div>
                  <AndamioText variant="small" className="font-medium text-foreground">Info</AndamioText>
                  <code className="text-xs text-muted-foreground">text-info</code>
                </div>
              </div>
            </div>

            <AndamioSeparator />

            {/* Utility Colors */}
            <div>
              <h3>Utility Colors</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-16 rounded-md border-4 border-border flex items-center justify-center">
                    <span className="text-sm font-medium">Border</span>
                  </div>
                  <code className="text-xs text-muted-foreground block">border-border</code>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md ring-4 ring-ring flex items-center justify-center">
                    <span className="text-sm font-medium">Ring</span>
                  </div>
                  <code className="text-xs text-muted-foreground block">ring-ring</code>
                </div>
              </div>
            </div>

            <AndamioSeparator />

            {/* Chart Colors */}
            <div>
              <h3>Chart Colors</h3>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="space-y-2">
                    <div className={`h-12 rounded-md bg-chart-${n}`} />
                    <code className="text-xs text-muted-foreground block text-center">chart-{n}</code>
                  </div>
                ))}
              </div>
            </div>

            <AndamioSeparator />

            {/* Sidebar Colors */}
            <div>
              <h3>Sidebar Colors</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-sidebar border border-sidebar-border flex items-center justify-center">
                    <span className="text-sidebar-foreground text-sm font-medium">Sidebar</span>
                  </div>
                  <code className="text-xs text-muted-foreground block">bg-sidebar</code>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-sidebar-primary flex items-center justify-center">
                    <span className="text-sidebar-primary-foreground text-sm font-medium">Primary</span>
                  </div>
                  <code className="text-xs text-muted-foreground block">bg-sidebar-primary</code>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-sidebar-accent flex items-center justify-center">
                    <span className="text-sidebar-accent-foreground text-sm font-medium">Accent</span>
                  </div>
                  <code className="text-xs text-muted-foreground block">bg-sidebar-accent</code>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md border-4 border-sidebar-border flex items-center justify-center ring-2 ring-sidebar-ring ring-offset-2">
                    <span className="text-sm font-medium">Border/Ring</span>
                  </div>
                  <code className="text-xs text-muted-foreground block">sidebar-border</code>
                </div>
              </div>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* LAYOUT COMPONENTS */}
      {/* ============================================= */}
      <div id="layout-components">
        <AndamioCard className="border-2 border-primary/30">
          <AndamioCardHeader className="space-y-4">
            <div className="flex items-center gap-2">
              <LayoutIcon className="h-5 w-5 text-primary" />
              <AndamioCardTitle>Layout Components</AndamioCardTitle>
            </div>
            <AndamioCardDescription className="text-base">
              Responsive layout helpers for consistent page structure
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-8">
            {/* AndamioPageHeader */}
            <div className="space-y-4">
              <h3>AndamioPageHeader</h3>
              <div className="space-y-4 border-l-2 border-primary/20 pl-4">
                <div className="bg-muted/30 p-4 rounded-md">
                  <AndamioPageHeader title="Page Title" description="A description of this page" />
                </div>
                <div className="bg-muted/30 p-4 rounded-md">
                  <AndamioPageHeader
                    title="With Action"
                    description="Page with action button"
                    action={<AndamioButton><AddIcon className="h-4 w-4 mr-2" />Create</AndamioButton>}
                  />
                </div>
                <div className="bg-muted/30 p-4 rounded-md">
                  <AndamioPageHeader
                    title="With Badge"
                    badge={<AndamioBadge variant="default">Published</AndamioBadge>}
                  />
                </div>
              </div>
            </div>

            <AndamioSeparator />

            {/* AndamioSectionHeader */}
            <div className="space-y-4">
              <h3>AndamioSectionHeader</h3>
              <div className="space-y-4 border-l-2 border-primary/20 pl-4">
                <div className="bg-muted/30 p-4 rounded-md">
                  <AndamioSectionHeader title="Section Title" />
                </div>
                <div className="bg-muted/30 p-4 rounded-md">
                  <AndamioSectionHeader
                    title="With Icon"
                    icon={<OnChainIcon className="h-5 w-5 text-primary" />}
                  />
                </div>
                <div className="bg-muted/30 p-4 rounded-md">
                  <AndamioSectionHeader
                    title="With Action"
                    action={<AndamioButton size="sm" variant="outline"><AddIcon className="h-4 w-4 mr-1" />Add</AndamioButton>}
                  />
                </div>
              </div>
            </div>

            <AndamioSeparator />

            {/* State Components */}
            <div className="space-y-4">
              <h3>State Components</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <AndamioText variant="small" className="font-medium">AndamioEmptyState</AndamioText>
                  <div className="border rounded-md p-4">
                    <AndamioEmptyState
                      icon={EmptyIcon}
                      title="No items found"
                      description="Get started by creating your first item"
                      action={<AndamioButton size="sm"><AddIcon className="h-4 w-4 mr-1" />Create</AndamioButton>}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <AndamioText variant="small" className="font-medium">AndamioNotFoundCard</AndamioText>
                  <div className="border rounded-md p-4">
                    <AndamioNotFoundCard
                      title="Page Not Found"
                      message="The page you're looking for doesn't exist"
                      action={<AndamioButton variant="outline" size="sm">Go Back</AndamioButton>}
                    />
                  </div>
                </div>
              </div>
            </div>

            <AndamioSeparator />

            {/* Stat Cards */}
            <div className="space-y-4">
              <h3>AndamioStatCard</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <AndamioStatCard
                  label="Total Users"
                  value="1,234"
                  icon={TeacherIcon}
                  iconColor="info"
                />
                <AndamioStatCard
                  label="Revenue"
                  value="$45,678"
                  icon={PaymentIcon}
                  iconColor="success"
                />
                <AndamioStatCard
                  label="Courses"
                  value="89"
                  icon={CourseIcon}
                  iconColor="warning"
                />
                <AndamioStatCard
                  label="Messages"
                  value="456"
                  icon={MailIcon}
                  iconColor="destructive"
                />
              </div>
            </div>

            <AndamioSeparator />

            {/* Page Loading */}
            <div className="space-y-4">
              <h3>AndamioPageLoading</h3>
              <div className="flex gap-2 mb-4">
                <AndamioButton size="sm" onClick={() => setShowLoading(!showLoading)}>
                  {showLoading ? "Hide" : "Show"} Loading States
                </AndamioButton>
              </div>
              {showLoading && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <AndamioText variant="small" className="text-xs">variant=&quot;list&quot;</AndamioText>
                    <div className="border rounded-md p-4 h-48 overflow-hidden">
                      <AndamioPageLoading variant="list" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <AndamioText variant="small" className="text-xs">variant=&quot;detail&quot;</AndamioText>
                    <div className="border rounded-md p-4 h-48 overflow-hidden">
                      <AndamioPageLoading variant="detail" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <AndamioText variant="small" className="text-xs">variant=&quot;content&quot;</AndamioText>
                    <div className="border rounded-md p-4 h-48 overflow-hidden">
                      <AndamioPageLoading variant="content" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* BUTTONS */}
      {/* ============================================= */}
      <div id="buttons">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Buttons</AndamioCardTitle>
            <AndamioCardDescription>Different button variants and sizes</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-6">
            <div>
              <h3>Variants</h3>
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
              <h3>Sizes</h3>
              <div className="flex flex-wrap items-center gap-2">
                <AndamioButton size="sm">Small</AndamioButton>
                <AndamioButton size="default">Default</AndamioButton>
                <AndamioButton size="lg">Large</AndamioButton>
                <AndamioButton size="icon"><SparkleIcon className="h-4 w-4" /></AndamioButton>
              </div>
            </div>

            <div>
              <h3>With Icons</h3>
              <div className="flex flex-wrap gap-2">
                <AndamioButton><AddIcon className="mr-2 h-4 w-4" />Create New</AndamioButton>
                <AndamioButton variant="outline"><DownloadIcon className="mr-2 h-4 w-4" />Download</AndamioButton>
                <AndamioButton variant="secondary">Share<ShareIcon className="ml-2 h-4 w-4" /></AndamioButton>
              </div>
            </div>

            <div>
              <h3>Standardized Save Button</h3>
              <AndamioText variant="small" className="mb-2">Use AndamioSaveButton for consistent save interactions</AndamioText>
              <div className="flex flex-wrap gap-2">
                <AndamioSaveButton onClick={() => toast.info("Save clicked")} />
                <AndamioSaveButton onClick={() => toast.info("Save clicked")} compact />
                <AndamioSaveButton onClick={() => toast.info("Save clicked")} variant="outline" label="Save Draft" />
                <AndamioSaveButton isSaving={true} />
              </div>
            </div>

            <div>
              <h3>States</h3>
              <div className="flex flex-wrap gap-2">
                <AndamioButton disabled>Disabled</AndamioButton>
                <AndamioButton variant="outline" disabled>Disabled Outline</AndamioButton>
              </div>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* BADGES */}
      {/* ============================================= */}
      <div id="badges">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Badges</AndamioCardTitle>
            <AndamioCardDescription>Status indicators and labels</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <AndamioBadge variant="default">Default</AndamioBadge>
              <AndamioBadge variant="secondary">Secondary</AndamioBadge>
              <AndamioBadge variant="destructive">Destructive</AndamioBadge>
              <AndamioBadge variant="outline">Outline</AndamioBadge>
            </div>
            <div className="flex flex-wrap gap-2">
              <AndamioBadge variant="default"><VerifiedIcon className="h-3 w-3 mr-1" />Published</AndamioBadge>
              <AndamioBadge variant="secondary"><PendingIcon className="h-3 w-3 mr-1" />Pending</AndamioBadge>
              <AndamioBadge variant="outline"><StarIcon className="h-3 w-3 mr-1" />Featured</AndamioBadge>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* CARDS */}
      {/* ============================================= */}
      <div id="cards">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Cards</AndamioCardTitle>
            <AndamioCardDescription>Container components for content</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <AndamioCard>
                <AndamioCardHeader>
                  <AndamioCardTitle>Basic Card</AndamioCardTitle>
                  <AndamioCardDescription>A simple card with header</AndamioCardDescription>
                </AndamioCardHeader>
                <AndamioCardContent>
                  <AndamioText variant="small" className="text-foreground">Card content goes here. This is placeholder text.</AndamioText>
                </AndamioCardContent>
              </AndamioCard>

              <AndamioCard>
                <AndamioCardHeader>
                  <div className="flex items-center gap-2">
                    <CourseIcon className="h-5 w-5 text-primary" />
                    <AndamioCardTitle>With Icon</AndamioCardTitle>
                  </div>
                  <AndamioCardDescription>Card with icon in header</AndamioCardDescription>
                </AndamioCardHeader>
                <AndamioCardContent>
                  <AndamioText variant="small" className="text-foreground">More placeholder content for this card.</AndamioText>
                </AndamioCardContent>
                <AndamioCardFooter>
                  <AndamioButton size="sm">Action</AndamioButton>
                </AndamioCardFooter>
              </AndamioCard>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* ALERTS */}
      {/* ============================================= */}
      <div id="alerts">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Alerts</AndamioCardTitle>
            <AndamioCardDescription>Important messages and notifications</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-4">
            <AndamioAlert>
              <InfoIcon className="h-4 w-4" />
              <AndamioAlertTitle>Information</AndamioAlertTitle>
              <AndamioAlertDescription>This is an informational alert message.</AndamioAlertDescription>
            </AndamioAlert>

            <AndamioAlert variant="destructive">
              <AlertIcon className="h-4 w-4" />
              <AndamioAlertTitle>Error</AndamioAlertTitle>
              <AndamioAlertDescription>Something went wrong. Please try again.</AndamioAlertDescription>
            </AndamioAlert>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* FORM COMPONENTS */}
      {/* ============================================= */}
      <div id="form-components">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Form Components</AndamioCardTitle>
            <AndamioCardDescription>Input fields, selects, checkboxes, and more</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* Input */}
                <div className="space-y-2">
                  <AndamioLabel htmlFor="demo-input">Text Input</AndamioLabel>
                  <AndamioInput id="demo-input" placeholder="Enter text..." />
                </div>

                {/* Textarea */}
                <div className="space-y-2">
                  <AndamioLabel htmlFor="demo-textarea">Textarea</AndamioLabel>
                  <AndamioTextarea id="demo-textarea" placeholder="Enter longer text..." />
                </div>

                {/* Select */}
                <div className="space-y-2">
                  <AndamioLabel>Select</AndamioLabel>
                  <AndamioSelect>
                    <AndamioSelectTrigger>
                      <AndamioSelectValue placeholder="Choose option" />
                    </AndamioSelectTrigger>
                    <AndamioSelectContent>
                      <AndamioSelectItem value="option1">Option 1</AndamioSelectItem>
                      <AndamioSelectItem value="option2">Option 2</AndamioSelectItem>
                      <AndamioSelectItem value="option3">Option 3</AndamioSelectItem>
                    </AndamioSelectContent>
                  </AndamioSelect>
                </div>
              </div>

              <div className="space-y-6">
                {/* Checkbox */}
                <div className="flex items-center space-x-2">
                  <AndamioCheckbox id="demo-checkbox" />
                  <AndamioLabel htmlFor="demo-checkbox" className="cursor-pointer">
                    Accept terms and conditions
                  </AndamioLabel>
                </div>

                {/* Switch */}
                <div className="flex items-center justify-between">
                  <AndamioLabel htmlFor="demo-switch">Enable notifications</AndamioLabel>
                  <AndamioSwitch id="demo-switch" />
                </div>

                {/* Radio Group */}
                <div className="space-y-2">
                  <AndamioLabel>Choose Plan</AndamioLabel>
                  <AndamioRadioGroup defaultValue="free">
                    <div className="flex items-center space-x-2">
                      <AndamioRadioGroupItem value="free" id="free" />
                      <AndamioLabel htmlFor="free" className="cursor-pointer">Free</AndamioLabel>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AndamioRadioGroupItem value="pro" id="pro" />
                      <AndamioLabel htmlFor="pro" className="cursor-pointer">Pro ($10/mo)</AndamioLabel>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AndamioRadioGroupItem value="enterprise" id="enterprise" />
                      <AndamioLabel htmlFor="enterprise" className="cursor-pointer">Enterprise</AndamioLabel>
                    </div>
                  </AndamioRadioGroup>
                </div>
              </div>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* PROGRESS & LOADING */}
      {/* ============================================= */}
      <div id="progress-loading">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Progress & Loading</AndamioCardTitle>
            <AndamioCardDescription>Progress bars and skeleton loaders</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {progress}%</span>
                <AndamioButton size="sm" variant="outline" onClick={() => setProgress((p) => (p >= 100 ? 0 : p + 10))}>
                  +10%
                </AndamioButton>
              </div>
              <AndamioProgress value={progress} />
            </div>

            <AndamioSeparator />

            <div className="space-y-2">
              <h3>Skeleton Loaders</h3>
              <div className="space-y-2">
                <AndamioSkeleton className="h-4 w-full" />
                <AndamioSkeleton className="h-4 w-3/4" />
                <AndamioSkeleton className="h-4 w-1/2" />
              </div>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* TABS */}
      {/* ============================================= */}
      <div id="tabs">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Tabs</AndamioCardTitle>
            <AndamioCardDescription>Tabbed content navigation</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <AndamioTabs defaultValue="overview">
              <AndamioTabsList>
                <AndamioTabsTrigger value="overview">Overview</AndamioTabsTrigger>
                <AndamioTabsTrigger value="analytics">Analytics</AndamioTabsTrigger>
                <AndamioTabsTrigger value="settings">Settings</AndamioTabsTrigger>
              </AndamioTabsList>
              <AndamioTabsContent value="overview" className="p-4 border rounded-md mt-2">
                <AndamioText variant="small" className="text-foreground">This is the overview tab content with general information.</AndamioText>
              </AndamioTabsContent>
              <AndamioTabsContent value="analytics" className="p-4 border rounded-md mt-2">
                <AndamioText variant="small" className="text-foreground">Analytics data and charts would go here.</AndamioText>
              </AndamioTabsContent>
              <AndamioTabsContent value="settings" className="p-4 border rounded-md mt-2">
                <AndamioText variant="small" className="text-foreground">Settings and configuration options here.</AndamioText>
              </AndamioTabsContent>
            </AndamioTabs>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* ACCORDIONS */}
      {/* ============================================= */}
      <div id="accordions">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Accordions</AndamioCardTitle>
            <AndamioCardDescription>Collapsible content sections</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <AndamioAccordion type="single" collapsible className="w-full">
              <AndamioAccordionItem value="item-1">
                <AndamioAccordionTrigger>What is Andamio?</AndamioAccordionTrigger>
                <AndamioAccordionContent>
                  Andamio is a platform for contribution-centered learning on Cardano. It enables creators to build courses and projects that reward participants.
                </AndamioAccordionContent>
              </AndamioAccordionItem>
              <AndamioAccordionItem value="item-2">
                <AndamioAccordionTrigger>How do I get started?</AndamioAccordionTrigger>
                <AndamioAccordionContent>
                  Connect your Cardano wallet, browse available courses or projects, and start your learning journey. You can also create your own content in the Studio.
                </AndamioAccordionContent>
              </AndamioAccordionItem>
              <AndamioAccordionItem value="item-3">
                <AndamioAccordionTrigger>What blockchain is used?</AndamioAccordionTrigger>
                <AndamioAccordionContent>
                  Andamio runs on Cardano. This demo uses the Preprod testnet, so all transactions are free and for testing purposes only.
                </AndamioAccordionContent>
              </AndamioAccordionItem>
            </AndamioAccordion>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* DIALOGS & SHEETS */}
      {/* ============================================= */}
      <div id="dialogs-sheets">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Dialogs & Sheets</AndamioCardTitle>
            <AndamioCardDescription>Modal overlays and side panels</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="flex flex-wrap gap-4">
              {/* Dialog */}
              <AndamioDialog>
                <AndamioDialogTrigger asChild>
                  <AndamioButton>Open Dialog</AndamioButton>
                </AndamioDialogTrigger>
                <AndamioDialogContent>
                  <AndamioDialogHeader>
                    <AndamioDialogTitle>Dialog Title</AndamioDialogTitle>
                    <AndamioDialogDescription>
                      This is a modal dialog. It captures focus and blocks interaction with the page behind it.
                    </AndamioDialogDescription>
                  </AndamioDialogHeader>
                  <div className="py-4">
                    <AndamioText variant="small" className="text-foreground">Dialog content goes here. You can add forms, images, or any content.</AndamioText>
                  </div>
                  <AndamioDialogFooter>
                    <AndamioButton variant="outline">Cancel</AndamioButton>
                    <AndamioButton>Save</AndamioButton>
                  </AndamioDialogFooter>
                </AndamioDialogContent>
              </AndamioDialog>

              {/* Sheet (Right) */}
              <AndamioSheet>
                <AndamioSheetTrigger asChild>
                  <AndamioButton variant="outline">Open Sheet (Right)</AndamioButton>
                </AndamioSheetTrigger>
                <AndamioSheetContent>
                  <AndamioSheetHeader>
                    <AndamioSheetTitle>Sheet Title</AndamioSheetTitle>
                    <AndamioSheetDescription>
                      Sheets slide in from the edge of the screen.
                    </AndamioSheetDescription>
                  </AndamioSheetHeader>
                  <div className="py-4">
                    <AndamioText variant="small" className="text-foreground">Sheet content goes here. Great for forms, settings, or navigation.</AndamioText>
                  </div>
                  <AndamioSheetFooter>
                    <AndamioButton>Save Changes</AndamioButton>
                  </AndamioSheetFooter>
                </AndamioSheetContent>
              </AndamioSheet>

              {/* Drawer (Bottom) */}
              <AndamioDrawer>
                <AndamioDrawerTrigger asChild>
                  <AndamioButton variant="outline">Open Drawer (Bottom)</AndamioButton>
                </AndamioDrawerTrigger>
                <AndamioDrawerContent>
                  <AndamioDrawerHeader>
                    <AndamioDrawerTitle>Drawer Title</AndamioDrawerTitle>
                    <AndamioDrawerDescription>
                      Drawers slide up from the bottom, great for mobile.
                    </AndamioDrawerDescription>
                  </AndamioDrawerHeader>
                  <div className="p-4">
                    <AndamioText variant="small" className="text-foreground">Drawer content here. Perfect for mobile-friendly interactions.</AndamioText>
                  </div>
                  <AndamioDrawerFooter>
                    <AndamioButton>Confirm</AndamioButton>
                  </AndamioDrawerFooter>
                </AndamioDrawerContent>
              </AndamioDrawer>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* DROPDOWNS & MENUS */}
      {/* ============================================= */}
      <div id="dropdowns-menus">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Dropdowns & Menus</AndamioCardTitle>
            <AndamioCardDescription>Dropdown menus and context menus</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="flex flex-wrap gap-4">
              {/* Dropdown Menu */}
              <AndamioDropdownMenu>
                <AndamioDropdownMenuTrigger asChild>
                  <AndamioButton variant="outline">
                    <MoreIcon className="h-4 w-4 mr-2" />
                    Dropdown Menu
                  </AndamioButton>
                </AndamioDropdownMenuTrigger>
                <AndamioDropdownMenuContent>
                  <AndamioDropdownMenuLabel>My Account</AndamioDropdownMenuLabel>
                  <AndamioDropdownMenuSeparator />
                  <AndamioDropdownMenuItem>
                    <UserIcon className="h-4 w-4 mr-2" />
                    Profile
                  </AndamioDropdownMenuItem>
                  <AndamioDropdownMenuItem>
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Settings
                  </AndamioDropdownMenuItem>
                  <AndamioDropdownMenuSeparator />
                  <AndamioDropdownMenuItem className="text-destructive">
                    <LogOutIcon className="h-4 w-4 mr-2" />
                    Log out
                  </AndamioDropdownMenuItem>
                </AndamioDropdownMenuContent>
              </AndamioDropdownMenu>

              {/* Context Menu */}
              <AndamioContextMenu>
                <AndamioContextMenuTrigger className="flex h-24 w-48 items-center justify-center rounded-md border border-dashed text-sm">
                  Right click here
                </AndamioContextMenuTrigger>
                <AndamioContextMenuContent>
                  <AndamioContextMenuItem>
                    <EditIcon className="h-4 w-4 mr-2" />
                    Edit
                  </AndamioContextMenuItem>
                  <AndamioContextMenuItem>
                    <PreviewIcon className="h-4 w-4 mr-2" />
                    View
                  </AndamioContextMenuItem>
                  <AndamioContextMenuItem>
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Download
                  </AndamioContextMenuItem>
                  <AndamioContextMenuItem className="text-destructive">
                    <DeleteIcon className="h-4 w-4 mr-2" />
                    Delete
                  </AndamioContextMenuItem>
                </AndamioContextMenuContent>
              </AndamioContextMenu>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* TOOLTIPS & POPOVERS */}
      {/* ============================================= */}
      <div id="tooltips-popovers">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Tooltips & Popovers</AndamioCardTitle>
            <AndamioCardDescription>Hover and click-triggered overlays</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="flex flex-wrap gap-4">
              {/* Tooltip */}
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

              {/* Popover */}
              <AndamioPopover>
                <AndamioPopoverTrigger asChild>
                  <AndamioButton variant="outline">Click for Popover</AndamioButton>
                </AndamioPopoverTrigger>
                <AndamioPopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4>Popover Title</h4>
                    <AndamioText variant="small">
                      Popovers can contain more complex content like forms or detailed information.
                    </AndamioText>
                  </div>
                </AndamioPopoverContent>
              </AndamioPopover>

              {/* Hover Card */}
              <AndamioHoverCard>
                <AndamioHoverCardTrigger asChild>
                  <AndamioButton variant="link">@andamio</AndamioButton>
                </AndamioHoverCardTrigger>
                <AndamioHoverCardContent className="w-80">
                  <div className="flex gap-4">
                    <AndamioAvatar>
                      <AndamioAvatarImage src="https://github.com/andamio.png" />
                      <AndamioAvatarFallback>AN</AndamioAvatarFallback>
                    </AndamioAvatar>
                    <div className="space-y-1">
                      <h4>@andamio</h4>
                      <AndamioText variant="small">
                        Contribution-centered learning on Cardano
                      </AndamioText>
                      <div className="flex items-center pt-2">
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                        <span className="text-xs text-muted-foreground">Joined 2021</span>
                      </div>
                    </div>
                  </div>
                </AndamioHoverCardContent>
              </AndamioHoverCard>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* TABLES */}
      {/* ============================================= */}
      <div id="tables">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Tables</AndamioCardTitle>
            <AndamioCardDescription>Data tables with responsive container</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <AndamioTableContainer>
              <AndamioTable>
                <AndamioTableHeader>
                  <AndamioTableRow>
                    <AndamioTableHead>Name</AndamioTableHead>
                    <AndamioTableHead>Status</AndamioTableHead>
                    <AndamioTableHead className="hidden sm:table-cell">Email</AndamioTableHead>
                    <AndamioTableHead className="hidden md:table-cell">Role</AndamioTableHead>
                    <AndamioTableHead>Actions</AndamioTableHead>
                  </AndamioTableRow>
                </AndamioTableHeader>
                <AndamioTableBody>
                  {[
                    { name: "John Doe", status: "Active", email: "john@example.com", role: "Admin" },
                    { name: "Jane Smith", status: "Pending", email: "jane@example.com", role: "Editor" },
                    { name: "Bob Wilson", status: "Active", email: "bob@example.com", role: "Viewer" },
                  ].map((user) => (
                    <AndamioTableRow key={user.name}>
                      <AndamioTableCell className="font-medium">{user.name}</AndamioTableCell>
                      <AndamioTableCell>
                        <AndamioBadge variant={user.status === "Active" ? "default" : "secondary"}>
                          {user.status}
                        </AndamioBadge>
                      </AndamioTableCell>
                      <AndamioTableCell className="hidden sm:table-cell">{user.email}</AndamioTableCell>
                      <AndamioTableCell className="hidden md:table-cell">{user.role}</AndamioTableCell>
                      <AndamioTableCell>
                        <AndamioButton variant="ghost" size="sm">Edit</AndamioButton>
                      </AndamioTableCell>
                    </AndamioTableRow>
                  ))}
                </AndamioTableBody>
              </AndamioTable>
            </AndamioTableContainer>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* AVATARS */}
      {/* ============================================= */}
      <div id="avatars">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Avatars</AndamioCardTitle>
            <AndamioCardDescription>User profile images with fallbacks</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="flex flex-wrap gap-4 items-center">
              <AndamioAvatar>
                <AndamioAvatarImage src="https://github.com/shadcn.png" alt="User" />
                <AndamioAvatarFallback>CN</AndamioAvatarFallback>
              </AndamioAvatar>
              <AndamioAvatar>
                <AndamioAvatarImage src="https://github.com/andamio.png" alt="Andamio" />
                <AndamioAvatarFallback>AN</AndamioAvatarFallback>
              </AndamioAvatar>
              <AndamioAvatar>
                <AndamioAvatarFallback>JD</AndamioAvatarFallback>
              </AndamioAvatar>
              <AndamioAvatar>
                <AndamioAvatarFallback className="bg-primary text-primary-foreground">AB</AndamioAvatarFallback>
              </AndamioAvatar>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* BREADCRUMBS */}
      {/* ============================================= */}
      <div id="breadcrumbs">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Breadcrumbs</AndamioCardTitle>
            <AndamioCardDescription>Navigation path indicators</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <AndamioBreadcrumb>
              <AndamioBreadcrumbList>
                <AndamioBreadcrumbItem>
                  <AndamioBreadcrumbLink href="/">Home</AndamioBreadcrumbLink>
                </AndamioBreadcrumbItem>
                <AndamioBreadcrumbSeparator />
                <AndamioBreadcrumbItem>
                  <AndamioBreadcrumbLink href="/course">Courses</AndamioBreadcrumbLink>
                </AndamioBreadcrumbItem>
                <AndamioBreadcrumbSeparator />
                <AndamioBreadcrumbItem>
                  <AndamioBreadcrumbLink href="/course/intro">Introduction</AndamioBreadcrumbLink>
                </AndamioBreadcrumbItem>
                <AndamioBreadcrumbSeparator />
                <AndamioBreadcrumbItem>
                  <AndamioBreadcrumbPage>Module 1</AndamioBreadcrumbPage>
                </AndamioBreadcrumbItem>
              </AndamioBreadcrumbList>
            </AndamioBreadcrumb>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* PAGINATION */}
      {/* ============================================= */}
      <div id="pagination">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Pagination</AndamioCardTitle>
            <AndamioCardDescription>Page navigation controls</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <AndamioPagination>
              <AndamioPaginationContent>
                <AndamioPaginationItem>
                  <AndamioPaginationPrevious href="#" />
                </AndamioPaginationItem>
                <AndamioPaginationItem>
                  <AndamioPaginationLink href="#">1</AndamioPaginationLink>
                </AndamioPaginationItem>
                <AndamioPaginationItem>
                  <AndamioPaginationLink href="#" isActive>2</AndamioPaginationLink>
                </AndamioPaginationItem>
                <AndamioPaginationItem>
                  <AndamioPaginationLink href="#">3</AndamioPaginationLink>
                </AndamioPaginationItem>
                <AndamioPaginationItem>
                  <AndamioPaginationEllipsis />
                </AndamioPaginationItem>
                <AndamioPaginationItem>
                  <AndamioPaginationNext href="#" />
                </AndamioPaginationItem>
              </AndamioPaginationContent>
            </AndamioPagination>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* TOGGLES */}
      {/* ============================================= */}
      <div id="toggles">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Toggles</AndamioCardTitle>
            <AndamioCardDescription>Toggle buttons and groups</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-6">
            <div className="space-y-2">
              <h3>Single Toggle</h3>
              <div className="flex gap-2">
                <AndamioToggle aria-label="Toggle bold">
                  <Bold className="h-4 w-4" />
                </AndamioToggle>
                <AndamioToggle aria-label="Toggle italic">
                  <Italic className="h-4 w-4" />
                </AndamioToggle>
                <AndamioToggle aria-label="Toggle underline">
                  <Underline className="h-4 w-4" />
                </AndamioToggle>
              </div>
            </div>

            <div className="space-y-2">
              <h3>Toggle Group (Single)</h3>
              <AndamioToggleGroup type="single" defaultValue="left">
                <AndamioToggleGroupItem value="left" aria-label="Align left">
                  <AlignLeft className="h-4 w-4" />
                </AndamioToggleGroupItem>
                <AndamioToggleGroupItem value="center" aria-label="Align center">
                  <AlignCenter className="h-4 w-4" />
                </AndamioToggleGroupItem>
                <AndamioToggleGroupItem value="right" aria-label="Align right">
                  <AlignRight className="h-4 w-4" />
                </AndamioToggleGroupItem>
              </AndamioToggleGroup>
            </div>

            <div className="space-y-2">
              <h3>Toggle Group (Multiple)</h3>
              <AndamioToggleGroup type="multiple">
                <AndamioToggleGroupItem value="bold" aria-label="Toggle bold">
                  <Bold className="h-4 w-4" />
                </AndamioToggleGroupItem>
                <AndamioToggleGroupItem value="italic" aria-label="Toggle italic">
                  <Italic className="h-4 w-4" />
                </AndamioToggleGroupItem>
                <AndamioToggleGroupItem value="underline" aria-label="Toggle underline">
                  <Underline className="h-4 w-4" />
                </AndamioToggleGroupItem>
              </AndamioToggleGroup>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* SLIDERS */}
      {/* ============================================= */}
      <div id="sliders">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Sliders</AndamioCardTitle>
            <AndamioCardDescription>Range input controls</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Value</span>
                <span className="text-muted-foreground">{sliderValue[0]}</span>
              </div>
              <AndamioSlider
                value={sliderValue}
                onValueChange={setSliderValue}
                max={100}
                step={1}
              />
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* SCROLL AREAS */}
      {/* ============================================= */}
      <div id="scroll-areas">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Scroll Areas</AndamioCardTitle>
            <AndamioCardDescription>Custom scrollable containers</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <AndamioScrollArea className="h-48 w-full rounded-md border p-4">
              <div className="space-y-4">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 text-sm">
                    <span className="font-medium">Item {i + 1}</span>
                    <span className="text-muted-foreground">Description for item {i + 1}</span>
                  </div>
                ))}
              </div>
            </AndamioScrollArea>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* COLLAPSIBLES */}
      {/* ============================================= */}
      <div id="collapsibles">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Collapsibles</AndamioCardTitle>
            <AndamioCardDescription>Expand/collapse content sections</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <AndamioCollapsible open={isCollapsed} onOpenChange={setIsCollapsed}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">@johndoe starred 3 repositories</span>
                <AndamioCollapsibleTrigger asChild>
                  <AndamioButton variant="ghost" size="sm">
                    {isCollapsed ? <ExpandIcon className="h-4 w-4" /> : <NextIcon className="h-4 w-4" />}
                    <span className="sr-only">Toggle</span>
                  </AndamioButton>
                </AndamioCollapsibleTrigger>
              </div>
              <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm mt-2">
                @andamio/platform
              </div>
              <AndamioCollapsibleContent className="space-y-2 mt-2">
                <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
                  @andamio/db-api
                </div>
                <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
                  @andamio/mesh-sdk
                </div>
              </AndamioCollapsibleContent>
            </AndamioCollapsible>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* RESIZABLE PANELS */}
      {/* ============================================= */}
      <div id="resizable-panels">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Resizable Panels</AndamioCardTitle>
            <AndamioCardDescription>Drag to resize panel sections</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <AndamioResizablePanelGroup direction="horizontal" className="min-h-[200px] max-w-md rounded-lg border">
              <AndamioResizablePanel defaultSize={50}>
                <div className="flex h-full items-center justify-center p-6">
                  <span className="font-semibold">Panel One</span>
                </div>
              </AndamioResizablePanel>
              <AndamioResizableHandle withHandle />
              <AndamioResizablePanel defaultSize={50}>
                <div className="flex h-full items-center justify-center p-6">
                  <span className="font-semibold">Panel Two</span>
                </div>
              </AndamioResizablePanel>
            </AndamioResizablePanelGroup>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* CONFIRMATION DIALOGS */}
      {/* ============================================= */}
      <div id="confirmation-dialogs">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Confirmation Dialogs</AndamioCardTitle>
            <AndamioCardDescription>Alert dialogs for destructive actions</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="flex flex-wrap gap-4">
              {/* Alert Dialog */}
              <AndamioAlertDialog>
                <AndamioAlertDialogTrigger asChild>
                  <AndamioButton variant="destructive">Delete Account</AndamioButton>
                </AndamioAlertDialogTrigger>
                <AndamioAlertDialogContent>
                  <AndamioAlertDialogHeader>
                    <AndamioAlertDialogTitle>Are you absolutely sure?</AndamioAlertDialogTitle>
                    <AndamioAlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                    </AndamioAlertDialogDescription>
                  </AndamioAlertDialogHeader>
                  <AndamioAlertDialogFooter>
                    <AndamioAlertDialogCancel>Cancel</AndamioAlertDialogCancel>
                    <AndamioAlertDialogAction>Delete</AndamioAlertDialogAction>
                  </AndamioAlertDialogFooter>
                </AndamioAlertDialogContent>
              </AndamioAlertDialog>

              {/* Confirm Dialog (Custom) */}
              <AndamioConfirmDialog
                trigger={<AndamioButton variant="outline">Confirm Action</AndamioButton>}
                title="Confirm this action?"
                description="This action requires confirmation before proceeding."
                confirmText="Confirm"
                cancelText="Cancel"
                onConfirm={() => { toast.success("Action confirmed!"); }}
              />
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* TOASTS (Sonner) */}
      {/* ============================================= */}
      <div id="toasts">
        <AndamioCard className="border-2">
          <AndamioCardHeader>
            <AndamioCardTitle>Toasts (Sonner)</AndamioCardTitle>
            <AndamioCardDescription>Notification toasts</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="flex flex-wrap gap-2">
              <AndamioButton variant="outline" onClick={() => toast("Default toast message")}>
                Default Toast
              </AndamioButton>
              <AndamioButton variant="outline" onClick={() => toast.success("Operation completed!")}>
                Success Toast
              </AndamioButton>
              <AndamioButton variant="outline" onClick={() => toast.error("Something went wrong")}>
                Error Toast
              </AndamioButton>
              <AndamioButton variant="outline" onClick={() => toast.warning("Please be careful")}>
                Warning Toast
              </AndamioButton>
              <AndamioButton variant="outline" onClick={() => toast.info("Here is some info")}>
                Info Toast
              </AndamioButton>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>

      {/* ============================================= */}
      {/* ALL COMPONENTS LIST */}
      {/* ============================================= */}
      <AndamioCard className="border-2">
        <AndamioCardHeader>
          <AndamioCardTitle>All Available Components</AndamioCardTitle>
          <AndamioCardDescription>Complete list of 55+ Andamio UI components</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {[
              "Accordion", "Alert", "Alert Dialog", "Aspect Ratio", "Avatar",
              "Badge", "Breadcrumb", "Button", "Calendar", "Card",
              "Carousel", "Chart", "Checkbox", "Code", "Collapsible",
              "Command", "Confirm Dialog", "Context Menu", "Dialog", "Drawer",
              "Dropdown Menu", "Empty State", "Form", "Hover Card", "Input",
              "Input OTP", "Label", "Menubar", "Navigation Menu", "Not Found Card",
              "Page Header", "Page Loading", "Pagination", "Popover", "Progress",
              "Radio Group", "Resizable", "Scroll Area", "Section Description",
              "Section Header", "Select", "Separator", "Sheet", "Skeleton",
              "Slider", "Sonner", "Stat Card", "States", "Switch",
              "Table", "Table Container", "Tabs", "Textarea", "Toggle",
              "Toggle Group", "Tooltip",
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
