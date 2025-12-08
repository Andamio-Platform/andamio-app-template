/**
 * API Utilities
 *
 * Standardized error handling and response parsing for Andamio API calls.
 * Eliminates inconsistent error handling patterns across the codebase.
 */

/**
 * Standardized API error response structure
 */
export interface ApiErrorResponse {
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
  statusCode?: number;
}

/**
 * Parse error response from API
 *
 * Handles various error response formats consistently.
 *
 * @example
 * ```tsx
 * if (!response.ok) {
 *   const error = await parseApiError(response);
 *   throw new Error(error.message ?? "Request failed");
 * }
 * ```
 */
export async function parseApiError(
  response: Response
): Promise<ApiErrorResponse> {
  try {
    const data = (await response.json()) as ApiErrorResponse;
    return {
      message: data.message ?? response.statusText,
      code: data.code,
      details: data.details,
      statusCode: response.status,
    };
  } catch {
    // JSON parsing failed - return generic error
    return {
      message: response.statusText || "An unexpected error occurred",
      statusCode: response.status,
    };
  }
}

/**
 * Build API URL with query parameters
 *
 * @example
 * ```tsx
 * const url = buildApiUrl("/courses/list", { limit: 10, offset: 0 });
 * // => "http://localhost:4000/api/v0/courses/list?limit=10&offset=0"
 * ```
 */
export function buildApiUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  const baseUrl = process.env.NEXT_PUBLIC_ANDAMIO_API_URL ?? "";
  const url = new URL(endpoint, baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Type guard to check if an error is an ApiErrorResponse
 */
export function isApiError(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    ("message" in error || "code" in error || "statusCode" in error)
  );
}

/**
 * Extract user-friendly error message
 *
 * Falls back to generic message if error structure is unexpected.
 */
export function getErrorMessage(error: unknown, fallback = "An error occurred"): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (isApiError(error)) {
    return error.message ?? fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
}
