import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

/**
 * Andamioscan API proxy route
 *
 * Forwards requests to the Andamioscan on-chain data API.
 * Using a server-side proxy avoids CORS issues with the external API.
 *
 * Base URL: ANDAMIOSCAN_API_URL (e.g., https://preprod.andamioscan.io/api)
 *
 * Currently used endpoints:
 * - GET /v2/courses - List all courses
 * - GET /v2/courses/{id}/details - Get course with modules & students
 * - GET /v2/courses/{id}/students/{alias}/status - Get student progress
 * - GET /v2/users/{alias}/state - Get user enrollments & credentials
 * - GET /v2/users/{alias}/courses/teaching - Get courses user teaches
 *
 * @see src/lib/andamioscan.ts - Typed API client
 * @see .claude/skills/project-manager/andamioscan-api.md - Full documentation
 */

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: "GET" | "POST"
) {
  try {
    const { path } = await params;
    const andamioscanPath = path.join("/");
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const andamioscanUrl = `${env.ANDAMIOSCAN_API_URL}/${andamioscanPath}${queryString ? `?${queryString}` : ""}`;

    console.log(`[Andamioscan Proxy] Forwarding ${method} request to: ${andamioscanUrl}`);

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json;charset=utf-8",
      },
    };

    if (method === "POST") {
      fetchOptions.body = await request.text();
      console.log(`[Andamioscan Proxy] Request body:`, fetchOptions.body);
    }

    const response = await fetch(andamioscanUrl, fetchOptions);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[Andamioscan Proxy] Error response:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      return NextResponse.json(
        { error: `Andamioscan API error: ${response.status}`, details: errorBody },
        { status: response.status }
      );
    }

    const data: unknown = await response.json();
    console.log(`[Andamioscan Proxy] Success response from ${andamioscanPath}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Andamioscan Proxy] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Andamioscan", details: error instanceof Error ? error.message : "Unknown error" },
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
