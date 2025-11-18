/**
 * Andamio wrapper for shadcn/ui DropdownMenu
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioDropdownMenu } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioDropdownMenu } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/dropdown-menu";

// This file serves as a placeholder for future Andamio-specific
// customizations to the DropdownMenu component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { DropdownMenu } from "~/components/ui/dropdown-menu";
// import { cn } from "~/lib/utils";
//
// export const AndamioDropdownMenu = React.forwardRef<
//   React.ElementRef<typeof DropdownMenu>,
//   React.ComponentPropsWithoutRef<typeof DropdownMenu>
// >(({ className, ...props }, ref) => {
//   return (
//     <DropdownMenu
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
// AndamioDropdownMenu.displayName = "AndamioDropdownMenu";
