/**
 * Andamio wrapper for shadcn/ui ContextMenu
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioContextMenu } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioContextMenu } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/context-menu";

// This file serves as a placeholder for future Andamio-specific
// customizations to the ContextMenu component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { ContextMenu } from "~/components/ui/context-menu";
// import { cn } from "~/lib/utils";
//
// export const AndamioContextMenu = React.forwardRef<
//   React.ElementRef<typeof ContextMenu>,
//   React.ComponentPropsWithoutRef<typeof ContextMenu>
// >(({ className, ...props }, ref) => {
//   return (
//     <ContextMenu
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
// AndamioContextMenu.displayName = "AndamioContextMenu";
