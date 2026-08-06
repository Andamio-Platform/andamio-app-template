// Checks every URL in TRANSACTION_ENDPOINTS actually exists in the live
// gateway's OpenAPI spec. Catches the case where the gateway renames,
// removes, or moves a transaction endpoint but this repo's hardcoded path
// map (plain strings, not generated from the spec) doesn't get updated -
// TypeScript can't catch that on its own since nothing here is typed
// against the spec.
//
// Uses the FULL spec (/openapi/swagger.json), not the public one
// (/openapi/swagger.public.json) that generate-types.sh uses. The public
// spec is a curated "contract approved" subset - a real, working route can
// be absent from it just because it hasn't been allowlisted for external
// docs yet, which would show up here as a false "missing" endpoint. The
// full spec is what actually reflects whether a route exists on the
// backend, which is the thing this check cares about.
import { TRANSACTION_ENDPOINTS } from "../src/config/transaction-ui";

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_ANDAMIO_GATEWAY_URL ?? "https://preprod.api.andamio.io";
const SPEC_URL = `${GATEWAY_URL}/openapi/swagger.json`;

async function main() {
  console.log(`Fetching OpenAPI spec from ${SPEC_URL}...`);
  const res = await fetch(SPEC_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch spec: ${res.status} ${res.statusText}`);
  }
  const spec = (await res.json()) as { paths?: Record<string, unknown> };
  const specPaths = new Set(Object.keys(spec.paths ?? {}));

  const missing: Array<{ txType: string; endpoint: string }> = [];
  for (const [txType, endpoint] of Object.entries(TRANSACTION_ENDPOINTS)) {
    const specPath = endpoint.replace(/^\/api/, "");
    if (!specPaths.has(specPath)) {
      missing.push({ txType, endpoint });
    }
  }

  if (missing.length > 0) {
    console.error(
      `${missing.length} transaction endpoint(s) in TRANSACTION_ENDPOINTS (src/config/transaction-ui.ts) not found in the live spec:`,
    );
    for (const { txType, endpoint } of missing) {
      console.error(`  ${txType}: ${endpoint}`);
    }
    process.exit(1);
  }

  console.log(
    `All ${Object.keys(TRANSACTION_ENDPOINTS).length} transaction endpoints match the live spec.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
