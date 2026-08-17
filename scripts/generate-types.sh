#!/bin/bash
# Generate TypeScript types from the Andamio Gateway OpenAPI spec.
# Captures API spec metadata in src/types/generated/api-metadata.json for traceability.

set -e

GATEWAY_URL="${NEXT_PUBLIC_ANDAMIO_GATEWAY_URL:-https://preprod.api.andamio.io}"
# /api/v1/docs/doc.json is the interactive Swagger UI's route (main_router.go)
# and has been unreachable on preprod since some point after 2026-05-10 (last
# successful run of this script) - looks like the live "try it out" UI was
# deliberately taken off preprod while the raw spec stayed public. Confirmed
# by diffing the UI route's 404 against a deliberately-fake path (same
# generic 404 handler) while a different Swagger UI instance (/issuer/v1/docs/)
# still redirects fine.
SPEC_URL="${GATEWAY_URL}/openapi/swagger.public.json"
# swagger.public.json never populates info.version, so api-metadata.json's
# version fields are pulled from the full spec instead - types themselves
# still generate from SPEC_URL above.
METADATA_SPEC_URL="${GATEWAY_URL}/openapi/swagger.json"
OUTPUT_DIR="src/types/generated"
METADATA_FILE="${OUTPUT_DIR}/api-metadata.json"

echo "Fetching OpenAPI spec from ${SPEC_URL}..."

# Generate TypeScript types
npx swagger-typescript-api generate \
  -p "${SPEC_URL}" \
  -o "${OUTPUT_DIR}" \
  -n gateway.ts \
  --no-client

# Remove @ts-nocheck - types compile cleanly without it (verified 2026-03-13)
# This enables TypeScript compile-time checking on generated API types
# -i.bak (not -i '') because that's the one form GNU sed (Linux/CI) and BSD
# sed (macOS) both accept - `-i ''` only works on BSD sed; on GNU sed it's
# consumed as the sed script itself, and the real script errors as a
# missing file.
sed -i.bak 's|// @ts-nocheck|// TypeScript checking enabled - API types are compile-time safe|' "${OUTPUT_DIR}/gateway.ts"
rm -f "${OUTPUT_DIR}/gateway.ts.bak"

# Save API metadata for traceability. No fetched_at timestamp here on
# purpose - it would change on every run and make this file un-diffable in
# CI's drift check. When this metadata was last generated is already
# answered by `git log` on this file.
node -e "
  fetch('${METADATA_SPEC_URL}')
    .then(r => r.json())
    .then(spec => {
      const fs = require('fs');
      const apiVersion = spec.info?.version ?? 'unknown';
      const meta = {
        api_version: apiVersion,
        api_title: spec.info?.title ?? 'unknown',
        x_api_revision: spec.info?.['x-api-revision'] ?? apiVersion,
        x_build_commit: spec.info?.['x-build-commit'] ?? 'unknown',
        spec_url: '${SPEC_URL}',
      };
      fs.writeFileSync('${METADATA_FILE}', JSON.stringify(meta, null, 2) + '\n');
      console.log('API metadata:', JSON.stringify(meta, null, 2));
    })
    .catch(err => {
      console.error('ERROR: Could not fetch API metadata:', err.message);
      process.exit(1);
    });
"

echo ""
echo "Types generated in ${OUTPUT_DIR}/gateway.ts"
