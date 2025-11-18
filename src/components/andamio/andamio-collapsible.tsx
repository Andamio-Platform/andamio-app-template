/**
 * Andamio wrapper for shadcn/ui Collapsible
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioCollapsible } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioCollapsible } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/collapsible";

// This file serves as a placeholder for future Andamio-specific
// customizations to the Collapsible component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { Collapsible } from "~/components/ui/collapsible";
// import { cn } from "~/lib/utils";
//
// export const AndamioCollapsible = React.forwardRef<
//   React.ElementRef<typeof Collapsible>,
//   React.ComponentPropsWithoutRef<typeof Collapsible>
// >(({ className, ...props }, ref) => {
//   return (
//     <Collapsible
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
// AndamioCollapsible.displayName = "AndamioCollapsible";
