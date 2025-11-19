import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

/**
 * Dynamic NBA API proxy route
 *
 * Handles any NBA endpoint by forwarding the path and query parameters
 * to the NBA API server-side, avoiding CORS issues.
 *
 * Examples:
 * - /api/nba/aggregate/user-info?alias=X → NBA_API/aggregate/user-info?alias=X
 * - /api/nba/some/other/endpoint?param=Y → NBA_API/some/other/endpoint?param=Y
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the path from the dynamic segments
    const nbaPath = params.path.join("/");

    // Get all query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    // Build the full NBA API URL
    const nbaUrl = `${env.ANDAMIO_NBA_API_URL}/${nbaPath}${queryString ? `?${queryString}` : ""}`;

    console.log(`[NBA Proxy] Forwarding request to: ${nbaUrl}`);

    // Fetch from NBA API server-side (avoids CORS)
    const nbaResponse = await fetch(nbaUrl);

    if (!nbaResponse.ok) {
      console.error(`[NBA Proxy] Error: ${nbaResponse.status} ${nbaResponse.statusText}`);
      return NextResponse.json(
        { error: `NBA API error: ${nbaResponse.status} ${nbaResponse.statusText}` },
        { status: nbaResponse.status }
      );
    }

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
