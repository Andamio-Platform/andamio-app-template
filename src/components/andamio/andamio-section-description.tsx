import * as React from "react";
import { cn } from "~/lib/utils";

interface AndamioSectionDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Andamio Section Description Component
 *
 * A centered, constrained-width paragraph component for section descriptions.
 * Provides consistent spacing and alignment across all landing pages.
 *
 * Usage:
 * <AndamioSectionDescription>
 *   Your description text here
 * </AndamioSectionDescription>
 */
export function AndamioSectionDescription({
  children,
  className,
}: AndamioSectionDescriptionProps) {
  return (
    <div className="w-full flex justify-center my-10">
      <p className={cn(
        "text-xl text-muted-foreground max-w-2xl text-center",
        className
      )}>
        {children}
      </p>
    </div>
  );
}
