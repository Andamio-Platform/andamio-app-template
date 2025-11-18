/**
 * Andamio wrapper for shadcn/ui Popover
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioPopover } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioPopover } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/popover";

// This file serves as a placeholder for future Andamio-specific
// customizations to the Popover component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { Popover } from "~/components/ui/popover";
// import { cn } from "~/lib/utils";
//
// export const AndamioPopover = React.forwardRef<
//   React.ElementRef<typeof Popover>,
//   React.ComponentPropsWithoutRef<typeof Popover>
// >(({ className, ...props }, ref) => {
//   return (
//     <Popover
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
// AndamioPopover.displayName = "AndamioPopover";
