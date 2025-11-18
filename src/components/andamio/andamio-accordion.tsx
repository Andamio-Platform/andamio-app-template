/**
 * Andamio wrapper for shadcn/ui Accordion
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioAccordion } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioAccordion } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/accordion";

// This file serves as a placeholder for future Andamio-specific
// customizations to the Accordion component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { Accordion } from "~/components/ui/accordion";
// import { cn } from "~/lib/utils";
//
// export const AndamioAccordion = React.forwardRef<
//   React.ElementRef<typeof Accordion>,
//   React.ComponentPropsWithoutRef<typeof Accordion>
// >(({ className, ...props }, ref) => {
//   return (
//     <Accordion
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
// AndamioAccordion.displayName = "AndamioAccordion";
