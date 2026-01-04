"use client";

import * as React from "react";
import {
  AndamioAlert,
  AndamioAlertTitle,
  AndamioAlertDescription,
} from "./andamio-alert";
import { AlertIcon } from "~/components/icons";

export interface AndamioErrorAlertProps {
  /** The error message to display */
  error: string;
  /** Optional title (default: "Error") */
  title?: string;
  /** Optional className for the alert container */
  className?: string;
}

/**
 * AndamioErrorAlert - Standardized error alert
 *
 * Displays a destructive alert with AlertIcon for error messages.
 *
 * @example
 * // Basic usage
 * {error && <AndamioErrorAlert error={error} />}
 *
 * @example
 * // With custom title
 * <AndamioErrorAlert error="Failed to save" title="Save Error" />
 */
function AndamioErrorAlert({ error, title = "Error", className }: AndamioErrorAlertProps) {
  return (
    <AndamioAlert variant="destructive" className={className}>
      <AlertIcon className="h-4 w-4" />
      <AndamioAlertTitle>{title}</AndamioAlertTitle>
      <AndamioAlertDescription>{error}</AndamioAlertDescription>
    </AndamioAlert>
  );
}

export { AndamioErrorAlert };
