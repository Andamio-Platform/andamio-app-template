/**
 * Andamio wrapper for shadcn/ui Tooltip
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioTooltip } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioTooltip } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/tooltip";

// This file serves as a placeholder for future Andamio-specific
// customizations to the Tooltip component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { Tooltip } from "~/components/ui/tooltip";
// import { cn } from "~/lib/utils";
//
// export const AndamioTooltip = React.forwardRef<
//   React.ElementRef<typeof Tooltip>,
//   React.ComponentPropsWithoutRef<typeof Tooltip>
// >(({ className, ...props }, ref) => {
//   return (
//     <Tooltip
//       ref={ref}
//       className={cn(
//         // Add Andamio-specific default classes here
//         className
//       )}
//       {...props}
//     />
//   );
// });
//
// AndamioTooltip.displayName = "AndamioTooltip";
