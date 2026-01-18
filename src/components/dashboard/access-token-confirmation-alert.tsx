"use client";

interface AccessTokenConfirmationAlertProps {
  /** Callback when confirmation flow completes (after success delay) */
  onComplete?: () => void;
}

/**
 * AccessTokenConfirmationAlert
 *
 * Shows blockchain confirmation status for access token minting.
 *
 * TODO: Re-enable after pending tx context is restored
 */
export function AccessTokenConfirmationAlert({ onComplete: _onComplete }: AccessTokenConfirmationAlertProps) {
  // TODO: Re-enable pending tx tracking after basic API is working
  return null;
}
