import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

/**
 * Andamioscan API proxy route
 *
 * This proxy route forwards requests to the Andamioscan on-chain data API.
 * Using a server-side proxy avoids CORS issues with the external API.
 *
 * Examples:
 * - GET  /api/andamioscan/course-state/utxos?policy=X → ANDAMIOSCAN_API/course-state/utxos?policy=X
 * - GET  /api/andamioscan/aggregate/user-info?alias=X → ANDAMIOSCAN_API/aggregate/user-info?alias=X
 * - POST /api/andamioscan/tx/v2/general/mint-access-token → ANDAMIOSCAN_API/tx/v2/general/mint-access-token
 *
 * Available endpoints:
 * - /aggregate/user-info - User's on-chain aggregated data
 * - /course-state/utxos - Course UTXOs
 * - /course-state/info - Course on-chain info
 * - /course-state/decoded-datum - User's enrollment datum
 * - /assignment-validator/utxos - Assignment commitment UTXOs
 * - /assignment-validator/decoded-datum - Decoded assignment datum
 * - /module-ref-validator/utxos - Module ref validator UTXOs
 * - /module-ref-validator/decoded-datum - Decoded module ref datum
 * - /tx/v2/general/mint-access-token - Mint access token transaction
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
