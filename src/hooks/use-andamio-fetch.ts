/**
 * useAndamioFetch - Standardized data fetching hook for Andamio API
 *
 * Eliminates repeated fetch-state-error patterns across pages.
 * Provides consistent loading, error, and success states.
 *
 * ## Basic Usage
 *
 * @example
 * ```tsx
 * // Simple GET request
 * const { data, isLoading, error } = useAndamioFetch<CourseOutput>({
 *   endpoint: `/course/get?course_nft_policy_id=${courseId}`,
 * });
 *
 * // With authentication (uses JWT from useAndamioAuth)
 * const { data } = useAndamioFetch<CourseOutput>({
 *   endpoint: `/course/list`,
 *   authenticated: true,
 * });
 *
 * // POST request with body
 * const { data } = useAndamioFetch<ListCoursesOutput>({
 *   endpoint: `/course/published`,
 *   method: "POST",
 *   body: { courseCodes: ["CS101"] },
 * });
 * ```
 *
 * ## With State Components
 *
 * @example
 * ```tsx
 * import { LoadingState, ErrorState, EmptyState } from "~/components/andamio";
 *
 * function CoursePage({ courseId }: { courseId: string }) {
 *   const { data: course, isLoading, error, refetch } = useAndamioFetch<CourseOutput>({
 *     endpoint: `/course/get?course_nft_policy_id=${courseId}`,
 *   });
 *
 *   if (isLoading) return <LoadingState />;
 *   if (error) return <ErrorState message={error} onRetry={refetch} />;
 *   if (!course) return <EmptyState title="Course not found" />;
 *
 *   return <CourseDetails course={course} />;
 * }
 * ```
 *
 * ## Conditional Fetching
 *
 * @example
 * ```tsx
 * // Skip fetch until user is authenticated
 * const { isAuthenticated } = useAndamioAuth();
 * const { data } = useAndamioFetch<UserData>({
 *   endpoint: `/user/profile`,
 *   authenticated: true,
 *   skip: !isAuthenticated,
 * });
 *
 * // Fetch when dependency changes
 * const [selectedId, setSelectedId] = useState<string | null>(null);
 * const { data } = useAndamioFetch<ItemData>({
 *   endpoint: `/items/${selectedId}`,
 *   skip: !selectedId,
 *   deps: [selectedId],
 * });
 * ```
 *
 * ## Manual Fetching
 *
 * @example
 * ```tsx
 * // Don't fetch on mount, trigger manually
 * const { data, refetch } = useAndamioFetch<SearchResults>({
 *   endpoint: `/search?q=${query}`,
 *   immediate: false,
 *   deps: [query],
 * });
 *
 * const handleSearch = () => {
 *   void refetch();
 * };
 * ```
 *
 * ## Migration from Manual Fetch
 *
 * Before (30+ lines):
 * ```tsx
 * const [data, setData] = useState<CourseOutput | null>(null);
 * const [isLoading, setIsLoading] = useState(true);
 * const [error, setError] = useState<string | null>(null);
 *
 * useEffect(() => {
 *   const fetchData = async () => {
 *     setIsLoading(true);
 *     try {
 *       const response = await fetch(`${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/get?course_nft_policy_id=${id}`);
 *       if (!response.ok) throw new Error("Failed");
 *       setData(await response.json());
 *     } catch (err) {
 *       setError(err instanceof Error ? err.message : "Error");
 *     } finally {
 *       setIsLoading(false);
 *     }
 *   };
 *   void fetchData();
 * }, [id]);
 * ```
 *
 * After (4 lines):
 * ```tsx
 * const { data, isLoading, error } = useAndamioFetch<CourseOutput>({
 *   endpoint: `/course/get?course_nft_policy_id=${id}`,
 *   deps: [id],
 * });
 * ```
 *
 * ## Behavior Notes
 *
 * - **Authentication**: When `authenticated: true`, the hook automatically:
 *   - Waits for user to be authenticated before fetching
 *   - Includes JWT token via `authenticatedFetch` from `useAndamioAuth`
 *   - Skips fetch if user logs out
 *
 * - **Unmount Safety**: The hook tracks component mount state and prevents
 *   state updates after unmount to avoid React warnings.
 *
 * - **Error Details**: Access `errorDetails` for full API error response
 *   including error codes and additional context.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { env } from "~/env";
import { useAndamioAuth } from "./use-andamio-auth";
import { parseApiError, type ApiErrorResponse } from "~/lib/api-utils";

export interface UseAndamioFetchOptions<TBody = unknown> {
  /**
   * API endpoint path (relative to NEXT_PUBLIC_ANDAMIO_API_URL)
   * @example "/courses/owned"
   */
  endpoint: string;

  /**
   * HTTP method
   * @default "GET"
   */
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

  /**
   * Request body (for POST, PATCH, PUT)
   */
  body?: TBody;

  /**
   * Whether to use authenticated fetch
   * @default false
   */
  authenticated?: boolean;

  /**
   * Whether to fetch immediately on mount
   * @default true
   */
  immediate?: boolean;

  /**
   * Dependencies that trigger a refetch when changed
   */
  deps?: unknown[];

  /**
   * Skip fetch if this condition is true
   * Useful for conditional fetching based on auth state
   */
  skip?: boolean;
}

export interface UseAndamioFetchResult<TData> {
  /**
   * Fetched data (null until loaded)
   */
  data: TData | null;

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error message (null if no error)
   */
  error: string | null;

  /**
   * Full error response from API
   */
  errorDetails: ApiErrorResponse | null;

  /**
   * Manually trigger a refetch
   */
  refetch: () => Promise<void>;

  /**
   * Reset state to initial values
   */
  reset: () => void;
}

export function useAndamioFetch<TData, TBody = unknown>(
  options: UseAndamioFetchOptions<TBody>
): UseAndamioFetchResult<TData> {
  const {
    endpoint,
    method = "GET",
    body,
    authenticated = false,
    immediate = true,
    deps = [],
    skip = false,
  } = options;

  const { authenticatedFetch, isAuthenticated } = useAndamioAuth();

  const [data, setData] = useState<TData | null>(null);
  const [isLoading, setIsLoading] = useState(immediate && !skip);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ApiErrorResponse | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    // Skip if authenticated is required but user isn't authenticated
    if (authenticated && !isAuthenticated) {
      return;
    }

    if (!isMounted.current) return;

    setIsLoading(true);
    setError(null);
    setErrorDetails(null);

    try {
      const url = `${env.NEXT_PUBLIC_ANDAMIO_API_URL}${endpoint}`;
      const fetchOptions: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (body && method !== "GET") {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = authenticated
        ? await authenticatedFetch(url, fetchOptions)
        : await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorData = await parseApiError(response);
        if (!isMounted.current) return;

        setErrorDetails(errorData);
        throw new Error(
          errorData.message ?? `Request failed: ${response.statusText}`
        );
      }

      const result = (await response.json()) as TData;

      if (!isMounted.current) return;
      setData(result);
    } catch (err) {
      if (!isMounted.current) return;

      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [endpoint, method, body, authenticated, isAuthenticated, authenticatedFetch]);

  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    setError(null);
    setErrorDetails(null);
  }, []);

  // Effect for initial fetch and dependency changes
  useEffect(() => {
    isMounted.current = true;

    if (immediate && !skip) {
      void fetchData();
    }

    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, skip, ...deps]);

  return {
    data,
    isLoading,
    error,
    errorDetails,
    refetch: fetchData,
    reset,
  };
}

/**
 * useAuthenticatedFetch - Convenience wrapper for authenticated API calls
 *
 * Equivalent to `useAndamioFetch` with `authenticated: true`.
 * Use this for endpoints that require JWT authentication.
 *
 * @example
 * ```tsx
 * // Instead of:
 * const { data } = useAndamioFetch<UserProfile>({
 *   endpoint: `/user/profile`,
 *   authenticated: true,
 * });
 *
 * // Use:
 * const { data } = useAuthenticatedFetch<UserProfile>({
 *   endpoint: `/user/profile`,
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Fetching owned courses (protected endpoint)
 * const { data: courses, isLoading } = useAuthenticatedFetch<ListOwnedCoursesOutput>({
 *   endpoint: `/course/list`,
 * });
 * ```
 */
export function useAuthenticatedFetch<TData, TBody = unknown>(
  options: Omit<UseAndamioFetchOptions<TBody>, "authenticated">
): UseAndamioFetchResult<TData> {
  return useAndamioFetch<TData, TBody>({
    ...options,
    authenticated: true,
  });
}
