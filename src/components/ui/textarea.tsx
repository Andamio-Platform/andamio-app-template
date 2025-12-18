import * as React from "react"

import { cn } from "~/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Base styles with visible border and subtle background
        "flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors duration-150 outline-none md:text-sm",
        // Placeholder
        "placeholder:text-muted-foreground/60",
        // Focus state - clear ring
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        // Error state
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
        // Dark mode adjustments
        "dark:bg-background/50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
