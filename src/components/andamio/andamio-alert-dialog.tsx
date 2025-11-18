/**
 * Andamio wrapper for shadcn/ui AlertDialog
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioAlertDialog } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioAlertDialog } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/alert-dialog";

// This file serves as a placeholder for future Andamio-specific
// customizations to the AlertDialog component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { AlertDialog } from "~/components/ui/alert-dialog";
// import { cn } from "~/lib/utils";
//
// export const AndamioAlertDialog = React.forwardRef<
//   React.ElementRef<typeof AlertDialog>,
//   React.ComponentPropsWithoutRef<typeof AlertDialog>
// >(({ className, ...props }, ref) => {
//   return (
//     <AlertDialog
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
// AndamioAlertDialog.displayName = "AndamioAlertDialog";
