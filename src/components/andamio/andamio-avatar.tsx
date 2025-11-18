/**
 * Andamio wrapper for shadcn/ui Avatar
 *
 * This is a wrapper around the base shadcn component that allows
 * for Andamio-specific customizations without modifying the original.
 *
 * Usage:
 * import { AndamioAvatar } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioAvatar } from "@andamio/ui";
 */

// Re-export everything from the base component
export * from "~/components/ui/avatar";

// This file serves as a placeholder for future Andamio-specific
// customizations to the Avatar component.
//
// To customize:
// 1. Import the base component(s)
// 2. Create wrapper component(s) with Andamio defaults
// 3. Export the customized version(s)
//
// Example pattern (when customization is needed):
//
// import * as React from "react";
// import { Avatar } from "~/components/ui/avatar";
// import { cn } from "~/lib/utils";
//
// export const AndamioAvatar = React.forwardRef<
//   React.ElementRef<typeof Avatar>,
//   React.ComponentPropsWithoutRef<typeof Avatar>
// >(({ className, ...props }, ref) => {
//   return (
//     <Avatar
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
// AndamioAvatar.displayName = "AndamioAvatar";
