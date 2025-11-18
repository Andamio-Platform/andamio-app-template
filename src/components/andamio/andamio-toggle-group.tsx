/**
 * Andamio wrapper for shadcn/ui ToggleGroup
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioToggleGroup } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioToggleGroup } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/toggle-group";

// This file serves as a placeholder for future Andamio-specific
// customizations to the ToggleGroup component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { ToggleGroup } from "~/components/ui/toggle-group";
// import { cn } from "~/lib/utils";
//
// export const AndamioToggleGroup = React.forwardRef<
//   React.ElementRef<typeof ToggleGroup>,
//   React.ComponentPropsWithoutRef<typeof ToggleGroup>
// >(({ className, ...props }, ref) => {
//   return (
//     <ToggleGroup
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
// AndamioToggleGroup.displayName = "AndamioToggleGroup";
