import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "~/env";
import { getWeb3Sdk } from "~/lib/utxos-sdk";

const requestSchema = z.object({
  alias: z.string().min(1).max(31),
});

/**
 * POST /api/sponsor-migrate
 *
 * Builds the access-token-claim transaction via the Andamio Gateway,
 * then sponsors it through @utxos/sdk so the user pays no fee.
 *
 * Returns the dev-wallet-signed CBOR — the client still needs to
 * call wallet.signTx(cbor, true) before submitting.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const { alias } = requestSchema.parse(body);

    const sdk = getWeb3Sdk();
    const sponsorshipId = env.UTXOS_SPONSORSHIP_ID;

    if (!sdk || !sponsorshipId) {
      return NextResponse.json(
        { error: "Transaction sponsorship is not configured" },
        { status: 503 },
      );
    }

    // Build unsigned CBOR from gateway
    const gatewayUrl = env.NEXT_PUBLIC_ANDAMIO_GATEWAY_URL;
    const buildResponse = await fetch(
      `${gatewayUrl}/api/v2/tx/global/user/access-token/claim`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": env.ANDAMIO_API_KEY,
        },
        body: JSON.stringify({ alias }),
      },
    );

    if (!buildResponse.ok) {
      const errorText = await buildResponse.text();
      return NextResponse.json(
        { error: `Gateway error: ${buildResponse.status} - ${errorText}` },
        { status: buildResponse.status },
      );
    }

    const buildResult = (await buildResponse.json()) as Record<string, unknown>;
    const unsignedTx =
      (buildResult.unsigned_tx as string | undefined) ??
      (buildResult.unsignedTxCBOR as string | undefined);

    if (!unsignedTx) {
      return NextResponse.json(
        { error: "No unsigned transaction returned from gateway" },
        { status: 500 },
      );
    }

    // Sponsor: rewrite CBOR with dev-wallet fee UTXO + partial-sign
    const sponsorResult = await sdk.sponsorship.sponsorTx({
      sponsorshipId,
      tx: unsignedTx,
    });

    if (!sponsorResult.success) {
      console.error(
        "[sponsor-migrate] Sponsorship failed:",
        sponsorResult.error,
      );
      return NextResponse.json(
        { error: `Sponsorship failed: ${sponsorResult.error}` },
        { status: 502 },
      );
    }

    // Return sponsored (dev-signed) CBOR + passthrough gateway fields
    const { unsigned_tx: _u, unsignedTxCBOR: _c, ...passthroughFields } = buildResult;
    return NextResponse.json({
      unsigned_tx: sponsorResult.data,
      sponsored: true,
      ...passthroughFields,
    });
  } catch (error) {
    console.error("[sponsor-migrate] Error:", error);

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
