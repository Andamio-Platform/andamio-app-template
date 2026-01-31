import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

/**
 * Unified Andamio Gateway API Proxy
 *
 * Single proxy route for all Andamio API services via the unified gateway:
 * - On-chain indexed data (Andamioscan passthrough)
 * - Database API (course/project CRUD)
 * - Transaction building (Atlas TX API)
 * - Authentication
 *
 * Architecture:
 * - CORS-free access to the gateway API
 * - App-level billing (usage billed to app developer, not end users)
 * - Centralized API key management
 * - Request caching for GET requests
 *
 * Two-Layer Authentication Model:
 * 1. App Authentication (X-API-Key) - Always required for all v2 endpoints
 *    - Validates the app has gateway access
 *    - Billed to app developer
 *
 * 2. User Authentication (Authorization: Bearer) - For user-specific endpoints
 *    - Validates the end user (JWT from login/validate)
 *    - Optional for public endpoints, required for user-specific ones
 *
 * Login flow:
 *   POST /api/v2/auth/login/session  - X-API-Key only → returns nonce
 *   POST /api/v2/auth/login/validate - X-API-Key only → returns user JWT
 *   POST /api/v2/user/*              - X-API-Key + Authorization: Bearer
 *
 * Gateway Base: NEXT_PUBLIC_ANDAMIO_GATEWAY_URL
 *
 * @see .claude/skills/audit-api-coverage/unified-api-endpoints.md
 */

// =============================================================================
// Simple In-Memory Cache
// =============================================================================

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000; // 30 seconds

function getCachedResponse(key: string): unknown {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCachedResponse(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });

  // Cleanup old entries (keep cache bounded)
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
}

/**
 * Invalidate cache entries related to a mutation
 * Called after POST requests that modify data
 *
 * @param mutationPath - The API path (e.g., /course/teacher/assignment/update)
 * @param requestBody - The parsed request body containing course_id or project_id
 */
function invalidateRelatedCache(mutationPath: string, requestBody?: Record<string, unknown>): void {
  const keysToDelete: string[] = [];

  // Extract entity ID from request body (course_id or project_id)
  const courseId = requestBody?.course_id as string | undefined;
  const projectId = requestBody?.project_id as string | undefined;

  for (const [cacheKey] of cache) {
    // If mutation is a course-related update, invalidate course-related GET caches
    if (mutationPath.includes("/course/") && cacheKey.includes("/course/")) {
      if (courseId && cacheKey.includes(courseId)) {
        keysToDelete.push(cacheKey);
      }
    }

    // If mutation is a project-related update, invalidate project-related caches
    if (mutationPath.includes("/project/") && cacheKey.includes("/project/")) {
      if (projectId && cacheKey.includes(projectId)) {
        keysToDelete.push(cacheKey);
      }
    }
  }

  if (keysToDelete.length > 0) {
    console.log(`[Gateway Proxy] Invalidating ${keysToDelete.length} cache entries after mutation:`, keysToDelete);
    keysToDelete.forEach(key => cache.delete(key));
  }
}

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: "GET" | "POST"
) {
  try {
    const { path } = await params;
    const gatewayPath = path.join("/");
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const fullPath = `${gatewayPath}${queryString ? `?${queryString}` : ""}`;
    const gatewayUrl = `${env.NEXT_PUBLIC_ANDAMIO_GATEWAY_URL}/${fullPath}`;

    // For GET requests, check cache first (skip for tx/status - needs real-time updates for polling fallback)
    const isTxStatus = gatewayPath.includes("tx/status/");
    if (method === "GET" && !isTxStatus) {
      const cached = getCachedResponse(fullPath);
      if (cached) {
        console.log(`[Gateway Proxy] Cache HIT for ${gatewayPath}`);
        return NextResponse.json(cached);
      }
    }

    console.log(`[Gateway Proxy] ${method === "GET" ? "Cache MISS - " : ""}Forwarding ${method} request to: ${gatewayUrl}`);

    const headers: Record<string, string> = {
      "Content-Type": "application/json;charset=utf-8",
      "Accept": "application/json;charset=utf-8",
      // App-level authentication - always required
      "X-API-Key": env.ANDAMIO_API_KEY,
    };

    // User-level authentication - add JWT when user is logged in
    // Two-layer auth model:
    // - X-API-Key: App authentication (always required)
    // - Authorization: Bearer: User authentication (for user-specific endpoints)
    const authHeader = request.headers.get("Authorization");
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    let parsedBody: Record<string, unknown> | undefined;
    if (method === "POST") {
      const bodyText = await request.text();
      fetchOptions.body = bodyText;
      console.log(`[Gateway Proxy] Request body:`, bodyText);
      // Parse body for cache invalidation
      try {
        parsedBody = JSON.parse(bodyText) as Record<string, unknown>;
      } catch {
        // Body might not be JSON, that's okay
      }
    }

    const response = await fetch(gatewayUrl, fetchOptions);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[Gateway Proxy] Error response:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      return NextResponse.json(
        { error: `Gateway API error: ${response.status} ${response.statusText}`, details: errorBody },
        { status: response.status }
      );
    }

    const data: unknown = await response.json();
    console.log(`[Gateway Proxy] Success response from ${gatewayPath}`);

    // Cache successful GET responses (skip tx/status - needs real-time updates)
    if (method === "GET" && !isTxStatus) {
      setCachedResponse(fullPath, data);
    }

    // Invalidate related cache entries after successful POST mutations
    if (method === "POST") {
      invalidateRelatedCache(gatewayPath, parsedBody);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Gateway Proxy] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Gateway", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, "POST");
}
