/**
 * Andamio wrapper for shadcn/ui Drawer
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioDrawer } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioDrawer } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/drawer";

// This file serves as a placeholder for future Andamio-specific
// customizations to the Drawer component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { Drawer } from "~/components/ui/drawer";
// import { cn } from "~/lib/utils";
//
// export const AndamioDrawer = React.forwardRef<
//   React.ElementRef<typeof Drawer>,
//   React.ComponentPropsWithoutRef<typeof Drawer>
// >(({ className, ...props }, ref) => {
//   return (
//     <Drawer
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
// AndamioDrawer.displayName = "AndamioDrawer";
