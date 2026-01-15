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

    console.log(`\n${"=".repeat(80)}`);
    console.log(`[Atlas TX Proxy] ${new Date().toISOString()}`);
    console.log(`[Atlas TX Proxy] ${method} → ${atlasUrl}`);
    console.log(`${"=".repeat(80)}`);

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json;charset=utf-8",
      },
    };

    if (method === "POST") {
      const bodyText = await request.text();
      fetchOptions.body = bodyText;
      // Parse and log the body to see what we're actually sending
      try {
        const parsed = JSON.parse(bodyText) as Record<string, unknown>;
        console.log(`\n[Atlas TX Proxy] REQUEST BODY:`);
        console.log(JSON.stringify(parsed, null, 2));

        // Generate a curl command for easy testing
        const curlCmd = `curl -X POST '${atlasUrl}' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(parsed)}'`;
        console.log(`\n[Atlas TX Proxy] CURL COMMAND (copy-paste to test):`);
        console.log(curlCmd);
        console.log(`${"=".repeat(80)}\n`);
      } catch {
        console.log(`[Atlas TX Proxy] Request body (raw):`, bodyText);
      }
    }

    const response = await fetch(atlasUrl, fetchOptions);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`\n${"!".repeat(80)}`);
      console.error(`[Atlas TX Proxy] ❌ ERROR RESPONSE`);
      console.error(`[Atlas TX Proxy] Status: ${response.status} ${response.statusText}`);
      console.error(`[Atlas TX Proxy] Body:\n${errorBody}`);
      console.error(`${"!".repeat(80)}\n`);
      return NextResponse.json(
        { error: `Atlas TX API error: ${response.status}`, details: errorBody },
        { status: response.status }
      );
    }

    const data: unknown = await response.json();
    console.log(`\n[Atlas TX Proxy] ✅ SUCCESS - Got unsigned transaction from ${atlasPath}`);
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
