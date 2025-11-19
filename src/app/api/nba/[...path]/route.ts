import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

/**
 * Dynamic NBA API proxy route
 *
 * Handles any NBA endpoint by forwarding the path and query parameters
 * to the NBA API server-side, avoiding CORS issues.
 *
 * Supports both GET (data endpoints) and POST (transaction endpoints).
 *
 * Examples:
 * - GET  /api/nba/aggregate/user-info?alias=X → NBA_API/aggregate/user-info?alias=X
 * - POST /api/nba/tx/access-token/mint → NBA_API/tx/access-token/mint
 */

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: "GET" | "POST"
) {
  try {
    // Await params (Next.js 15 requirement)
    const { path } = await params;

    // Reconstruct the path from the dynamic segments
    const nbaPath = path.join("/");

    // Get all query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    // Build the full NBA API URL
    const nbaUrl = `${env.ANDAMIO_NBA_API_URL}/${nbaPath}${queryString ? `?${queryString}` : ""}`;

    console.log(`[NBA Proxy] Forwarding ${method} request to: ${nbaUrl}`);

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    // For POST requests, include the body
    if (method === "POST") {
      const body = await request.text();
      fetchOptions.body = body;
      console.log(`[NBA Proxy] Request body:`, body);
    }

    // Fetch from NBA API server-side (avoids CORS)
    const nbaResponse = await fetch(nbaUrl, fetchOptions);

    if (!nbaResponse.ok) {
      const errorBody = await nbaResponse.text();
      console.error(`[NBA Proxy] Error: ${nbaResponse.status} ${nbaResponse.statusText}`);
      console.error(`[NBA Proxy] Full URL: ${nbaUrl}`);
      console.error(`[NBA Proxy] Response body:`, errorBody);
      return NextResponse.json(
        {
          error: `NBA API error: ${nbaResponse.status} ${nbaResponse.statusText}`,
          url: nbaUrl,
          details: errorBody || "No additional details"
        },
        { status: nbaResponse.status }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = await nbaResponse.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("[NBA Proxy] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to fetch NBA data" },
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
