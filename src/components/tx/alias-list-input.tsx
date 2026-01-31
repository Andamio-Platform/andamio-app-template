/**
 * AliasListInput - Validated alias list input with on-chain verification
 *
 * Reusable component for adding aliases one at a time, with existence
 * checks via GET /api/v2/user/exists/{alias}. Used by create-project,
 * create-course, managers-manage, and teachers-update forms.
 */

"use client";

import { useState, useCallback } from "react";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AddIcon, CloseIcon, LoadingIcon, ErrorIcon } from "~/components/icons";

export interface AliasListInputProps {
  /** Current list of validated aliases */
  value: string[];
  /** Callback when the alias list changes */
  onChange: (aliases: string[]) => void;
  /** Label text for the input */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Aliases to exclude (e.g. current user, already in list from another source) */
  excludeAliases?: string[];
  /** Helper text shown below the input */
  helperText?: string;
}

/**
 * AliasListInput - Add aliases one at a time with on-chain validation
 *
 * @example
 * ```tsx
 * <AliasListInput
 *   value={managers}
 *   onChange={setManagers}
 *   label="Additional Managers"
 *   placeholder="Enter alias"
 *   excludeAliases={[currentUserAlias]}
 *   helperText="Each alias is verified on-chain before being added."
 * />
 * ```
 */
export function AliasListInput({
  value,
  onChange,
  label,
  placeholder = "Enter alias",
  disabled = false,
  excludeAliases = [],
  helperText,
}: AliasListInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const addAlias = useCallback(async () => {
    const alias = inputValue.trim();
    setValidationError(null);

    // Format check: 1-31 chars
    if (alias.length === 0) return;
    if (alias.length > 31) {
      setValidationError("Alias must be 31 characters or fewer");
      return;
    }

    // Duplicate check
    if (value.includes(alias)) {
      setValidationError("Alias already in list");
      return;
    }

    // Excluded alias check
    if (excludeAliases.includes(alias)) {
      setValidationError("This alias is already included automatically");
      return;
    }

    // Existence check via gateway
    setIsValidating(true);
    try {
      const response = await fetch(`/api/gateway/api/v2/user/exists/${encodeURIComponent(alias)}`);
      if (response.ok) {
        // 200 = alias exists
        onChange([...value, alias]);
        setInputValue("");
      } else if (response.status === 404) {
        setValidationError("Alias not found on-chain");
      } else {
        setValidationError("Failed to verify alias");
      }
    } catch {
      setValidationError("Failed to verify alias");
    } finally {
      setIsValidating(false);
    }
  }, [inputValue, value, excludeAliases, onChange]);

  const removeAlias = useCallback(
    (alias: string) => {
      onChange(value.filter((a) => a !== alias));
    },
    [value, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void addAlias();
    }
  };

  return (
    <div className="space-y-2">
      <AndamioLabel>{label}</AndamioLabel>

      {/* Badge list of validated aliases */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((alias) => (
            <AndamioBadge key={alias} variant="secondary" className="gap-1 pr-1 font-mono text-xs">
              {alias}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeAlias(alias)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  aria-label={`Remove ${alias}`}
                >
                  <CloseIcon className="h-3 w-3" />
                </button>
              )}
            </AndamioBadge>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2">
        <AndamioInput
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setValidationError(null);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled || isValidating}
          maxLength={31}
          className="flex-1"
        />
        <AndamioButton
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void addAlias()}
          disabled={disabled || isValidating || inputValue.trim().length === 0}
        >
          {isValidating ? (
            <LoadingIcon className="h-4 w-4 animate-spin" />
          ) : (
            <AddIcon className="h-4 w-4" />
          )}
          <span className="ml-1">Add</span>
        </AndamioButton>
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="flex items-center gap-1.5 text-destructive">
          <ErrorIcon className="h-3.5 w-3.5 shrink-0" />
          <AndamioText variant="small" className="text-xs text-destructive">
            {validationError}
          </AndamioText>
        </div>
      )}

      {/* Helper text */}
      {helperText && !validationError && (
        <AndamioText variant="small" className="text-xs">
          {helperText}
        </AndamioText>
      )}
    </div>
  );
}
