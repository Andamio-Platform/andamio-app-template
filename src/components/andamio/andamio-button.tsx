/**
 * Andamio wrapper for shadcn/ui Button
 *
 * Enhanced button component with Andamio-specific features:
 * - Loading state support
 * - Icon support
 * - Consistent styling defaults
 *
 * Usage:
 * import { AndamioButton } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioButton } from "@andamio/ui";
 */

import * as React from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Loader2 } from "lucide-react";

// Re-export variants
export { buttonVariants } from "~/components/ui/button";

export interface AndamioButtonProps
  extends React.ComponentPropsWithoutRef<typeof Button> {
  /**
   * Show loading spinner and disable button
   */
  isLoading?: boolean;
  /**
   * Icon to display before children
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to display after children
   */
  rightIcon?: React.ReactNode;
}

export const AndamioButton = React.forwardRef<
  HTMLButtonElement,
  AndamioButtonProps
>(
  (
    {
      className,
      children,
      isLoading,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        className={cn(
          // Andamio defaults - can be overridden
          "font-semibold",
          className
        )}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </Button>
    );
  }
);

AndamioButton.displayName = "AndamioButton";
