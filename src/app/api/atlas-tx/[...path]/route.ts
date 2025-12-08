import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

/**
 * Atlas Transaction API proxy route
 *
 * This proxy route forwards requests to the Atlas Transaction API for building
 * unsigned transactions. Using a server-side proxy avoids CORS issues.
 *
 * Examples:
 * - POST /api/atlas-tx/tx/v2/general/mint-access-token → ATLAS_TX_API/tx/v2/general/mint-access-token
 *
 * Available endpoints:
 * - /tx/v2/general/mint-access-token - Mint access token transaction
 * - (more endpoints to be added as they become available)
 */

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: "GET" | "POST"
) {
  try {
    const { path } = await params;
    const atlasPath = path.join("/");
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const atlasUrl = `${env.ATLAS_TX_API_URL}/${atlasPath}${queryString ? `?${queryString}` : ""}`;

    console.log(`[Atlas TX Proxy] Forwarding ${method} request to: ${atlasUrl}`);

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json;charset=utf-8",
      },
    };

    if (method === "POST") {
      fetchOptions.body = await request.text();
      console.log(`[Atlas TX Proxy] Request body:`, fetchOptions.body);
    }

    const response = await fetch(atlasUrl, fetchOptions);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[Atlas TX Proxy] Error response:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      return NextResponse.json(
        { error: `Atlas TX API error: ${response.status}`, details: errorBody },
        { status: response.status }
      );
    }

    const data: unknown = await response.json();
    console.log(`[Atlas TX Proxy] Success response from ${atlasPath}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Atlas TX Proxy] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Atlas TX API", details: error instanceof Error ? error.message : "Unknown error" },
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
