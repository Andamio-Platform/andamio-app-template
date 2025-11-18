/**
 * Andamio wrapper for shadcn/ui Breadcrumb
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioBreadcrumb } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioBreadcrumb } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/breadcrumb";

// This file serves as a placeholder for future Andamio-specific
// customizations to the Breadcrumb component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { Breadcrumb } from "~/components/ui/breadcrumb";
// import { cn } from "~/lib/utils";
//
// export const AndamioBreadcrumb = React.forwardRef<
//   React.ElementRef<typeof Breadcrumb>,
//   React.ComponentPropsWithoutRef<typeof Breadcrumb>
// >(({ className, ...props }, ref) => {
//   return (
//     <Breadcrumb
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
// AndamioBreadcrumb.displayName = "AndamioBreadcrumb";
