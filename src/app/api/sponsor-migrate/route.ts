import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "~/env";

const requestSchema = z.object({
  alias: z.string().min(1).max(31),
});

/**
 * POST /api/sponsor-migrate
 *
 * Builds the access-token-claim transaction via the Andamio Gateway.
 * User pays the fee (regular transaction).
 *
 * Returns unsigned CBOR — the client signs with their wallet and submits.
 */
export async function POST(request: Request) {
  console.log("[sponsor-migrate] Starting request...");
  try {
    const body = (await request.json()) as unknown;
    console.log("[sponsor-migrate] Body:", JSON.stringify(body));
    const { alias } = requestSchema.parse(body);
    console.log("[sponsor-migrate] Parsed alias:", alias);


    // Build unsigned CBOR from gateway (regular tx - user pays fee)
    const gatewayUrl = env.NEXT_PUBLIC_ANDAMIO_GATEWAY_URL;
    const requestBody = {
      alias,
    };
    console.log("[sponsor-migrate] Gateway URL:", gatewayUrl);
    console.log("[sponsor-migrate] Gateway request body:", JSON.stringify(requestBody));

    const buildResponse = await fetch(
      `${gatewayUrl}/api/v2/tx/global/user/access-token/claim`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": env.ANDAMIO_API_KEY,
        },
        body: JSON.stringify(requestBody),
      },
    );
    console.log("[sponsor-migrate] Gateway response status:", buildResponse.status);

    if (!buildResponse.ok) {
      const errorText = await buildResponse.text();
      console.log("[sponsor-migrate] Gateway error text:", errorText);
      return NextResponse.json(
        { error: `Gateway error: ${buildResponse.status} - ${errorText}` },
        { status: buildResponse.status },
      );
    }

    const buildResult = (await buildResponse.json()) as Record<string, unknown>;
    console.log("[sponsor-migrate] Gateway build result keys:", Object.keys(buildResult));
    const unsignedTx =
      (buildResult.unsigned_tx as string | undefined) ??
      (buildResult.unsignedTxCBOR as string | undefined);
    console.log("[sponsor-migrate] Unsigned TX length:", unsignedTx?.length ?? "null");

    if (!unsignedTx) {
      return NextResponse.json(
        { error: "No unsigned transaction returned from gateway" },
        { status: 500 },
      );
    }

    // Return unsigned CBOR for user to sign and submit
    const { unsigned_tx: _u, unsignedTxCBOR: _c, ...passthroughFields } = buildResult;
    console.log("[sponsor-migrate] Returning unsigned tx for user to sign");
    return NextResponse.json({
      unsigned_tx: unsignedTx,
      sponsored: false,
      ...passthroughFields,
    });
  } catch (error) {
    console.error("[sponsor-migrate] Caught error:", error);
    console.error("[sponsor-migrate] Error stack:", error instanceof Error ? error.stack : "no stack");

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
