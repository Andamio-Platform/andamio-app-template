/**
 * Andamio UI Components
 *
 * Wrapper components for shadcn/ui that provide Andamio-specific
 * defaults and customizations while maintaining the base component API.
 *
 * These components are designed to be extracted into @andamio/ui package.
 *
 * Usage:
 * import { AndamioButton, AndamioBadge } from "~/components/andamio";
 *
 * Future (after package extraction):
 * import { AndamioButton, AndamioBadge } from "@andamio/ui";
 */

// Enhanced components with Andamio-specific features
export * from "./andamio-button";
export * from "./andamio-badge";
export * from "./andamio-text";
export * from "./andamio-card";
export * from "./andamio-alert";
export * from "./andamio-code";
export * from "./andamio-input";
export * from "./andamio-select";
export * from "./andamio-textarea";
export * from "./andamio-dialog";
export * from "./andamio-sheet";
export * from "./andamio-dropdown-menu";
export * from "./andamio-section-description";
export * from "./andamio-states";

// Responsive layout components
export * from "./andamio-page-header";
export * from "./andamio-section-header";
export * from "./andamio-table-container";

// Composite/Pattern components (extracted from style reviews)
export * from "./andamio-not-found-card";
export * from "./andamio-empty-state";
export * from "./andamio-stat-card";
export * from "./andamio-status-icon";

// Loading components (unified loading system)
export * from "./andamio-loading";

// Simple pass-through wrappers (for consistency)
export * from "./andamio-accordion";
export * from "./andamio-alert-dialog";
export * from "./andamio-aspect-ratio";
export * from "./andamio-avatar";
export * from "./andamio-breadcrumb";
export * from "./andamio-calendar";
export * from "./andamio-carousel";
export * from "./andamio-chart";
export * from "./andamio-checkbox";
export * from "./andamio-collapsible";
export * from "./andamio-command";
export * from "./andamio-confirm-dialog";
export * from "./andamio-context-menu";
export * from "./andamio-drawer";
export * from "./andamio-form";
export * from "./andamio-hover-card";
export * from "./andamio-input-otp";
export * from "./andamio-label";
export * from "./andamio-menubar";
export * from "./andamio-navigation-menu";
export * from "./andamio-pagination";
export * from "./andamio-popover";
export * from "./andamio-progress";
export * from "./andamio-radio-group";
export * from "./andamio-resizable";
export * from "./andamio-scroll-area";
export * from "./andamio-separator";
export * from "./andamio-skeleton";
export * from "./andamio-slider";
export * from "./andamio-sonner";
export * from "./andamio-switch";
export * from "./andamio-table";
export * from "./andamio-tabs";
export * from "./andamio-toggle";
export * from "./andamio-toggle-group";
export * from "./andamio-tooltip";
