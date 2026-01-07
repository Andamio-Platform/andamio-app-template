"use client";

import * as React from "react";
import { cn } from "~/lib/utils";
import { AndamioInput } from "./andamio-input";
import { SearchIcon } from "~/components/icons";

export interface AndamioSearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /**
   * Size variant for the search input
   * - "default": Standard height (h-10), normal text
   * - "sm": Compact height (h-8), smaller text
   */
  inputSize?: "default" | "sm";
}

/**
 * AndamioSearchInput - Search input with integrated search icon
 *
 * Replaces the pattern:
 * ```tsx
 * <div className="relative">
 *   <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 *   <AndamioInput className="pl-8" placeholder="Search..." />
 * </div>
 * ```
 *
 * Usage:
 * ```tsx
 * <AndamioSearchInput
 *   placeholder="Search courses..."
 *   value={searchQuery}
 *   onChange={(e) => setSearchQuery(e.target.value)}
 * />
 *
 * // Compact variant for toolbars
 * <AndamioSearchInput
 *   inputSize="sm"
 *   placeholder="Search..."
 *   value={query}
 *   onChange={handleChange}
 * />
 * ```
 */
const AndamioSearchInput = React.forwardRef<HTMLInputElement, AndamioSearchInputProps>(
  ({ className, inputSize = "default", ...props }, ref) => {
    const isSmall = inputSize === "sm";

    return (
      <div className="relative">
        <SearchIcon
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
            isSmall ? "h-3.5 w-3.5" : "h-4 w-4"
          )}
        />
        <AndamioInput
          ref={ref}
          type="text"
          className={cn(
            "pl-9",
            isSmall && "h-8 text-xs",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
AndamioSearchInput.displayName = "AndamioSearchInput";

export { AndamioSearchInput };
