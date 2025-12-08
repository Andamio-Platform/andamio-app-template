import { type NextRequest, NextResponse } from "next/server";
// import { env } from "~/env";

/**
 * Andamioscan API proxy route (placeholder)
 *
 * This proxy route will handle requests to the Andamioscan on-chain data API.
 * Currently returns "coming soon" responses while the API is being developed.
 *
 * When Andamioscan is ready, this will forward requests similar to:
 * - GET  /api/andamioscan/course-state/utxos?policy=X → ANDAMIOSCAN_API/course-state/utxos?policy=X
 * - GET  /api/andamioscan/aggregate/user-info?alias=X → ANDAMIOSCAN_API/aggregate/user-info?alias=X
 * - POST /api/andamioscan/tx/build → ANDAMIOSCAN_API/tx/build
 *
 * Expected endpoints (to be implemented):
 * - /aggregate/user-info - User's on-chain aggregated data
 * - /course-state/utxos - Course UTXOs
 * - /course-state/info - Course on-chain info
 * - /course-state/decoded-datum - User's enrollment datum
 * - /assignment-validator/utxos - Assignment commitment UTXOs
 * - /assignment-validator/decoded-datum - Decoded assignment datum
 * - /module-ref-validator/utxos - Module ref validator UTXOs
 * - /module-ref-validator/decoded-datum - Decoded module ref datum
 * - /tx/* - Transaction building endpoints
 */

// TODO: Uncomment when Andamioscan API is ready
// async function proxyRequest(
//   request: NextRequest,
//   params: Promise<{ path: string[] }>,
//   method: "GET" | "POST"
// ) {
//   try {
//     const { path } = await params;
//     const andamioscanPath = path.join("/");
//     const searchParams = request.nextUrl.searchParams;
//     const queryString = searchParams.toString();
//     const andamioscanUrl = `${env.ANDAMIOSCAN_API_URL}/${andamioscanPath}${queryString ? `?${queryString}` : ""}`;
//
//     console.log(`[Andamioscan Proxy] Forwarding ${method} request to: ${andamioscanUrl}`);
//
//     const fetchOptions: RequestInit = {
//       method,
//       headers: { "Content-Type": "application/json" },
//     };
//
//     if (method === "POST") {
//       fetchOptions.body = await request.text();
//     }
//
//     const response = await fetch(andamioscanUrl, fetchOptions);
//
//     if (!response.ok) {
//       const errorBody = await response.text();
//       return NextResponse.json(
//         { error: `Andamioscan API error: ${response.status}`, details: errorBody },
//         { status: response.status }
//       );
//     }
//
//     const data = await response.json();
//     return NextResponse.json(data);
//   } catch (error) {
//     console.error("[Andamioscan Proxy] Error:", error);
//     return NextResponse.json({ error: "Failed to fetch from Andamioscan" }, { status: 500 });
//   }
// }

/**
 * Placeholder response while Andamioscan API is being developed
 */
function comingSoonResponse(path: string[], method: string) {
  const endpoint = path.join("/");
  console.log(`[Andamioscan Proxy] ${method} /${endpoint} - API not yet connected`);

  return NextResponse.json(
    {
      status: "coming_soon",
      message: "Andamioscan API integration coming soon",
      endpoint: `/${endpoint}`,
      method,
      timestamp: new Date().toISOString(),
    },
    { status: 503 }
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return comingSoonResponse(path, "GET");
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return comingSoonResponse(path, "POST");
}
