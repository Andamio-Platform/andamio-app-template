#!/bin/bash
# Generate TypeScript types from the Andamio Gateway OpenAPI spec.
# Captures API spec metadata in src/types/generated/api-metadata.json for traceability.

set -e

GATEWAY_URL="${NEXT_PUBLIC_ANDAMIO_GATEWAY_URL:-https://preprod.api.andamio.io}"
SPEC_URL="${GATEWAY_URL}/api/v1/docs/doc.json"
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
sed -i '' 's|// @ts-nocheck|// TypeScript checking enabled - API types are compile-time safe|' "${OUTPUT_DIR}/gateway.ts"

# Save API metadata for traceability
node -e "
  fetch('${SPEC_URL}')
    .then(r => r.json())
    .then(spec => {
      const fs = require('fs');
      const apiVersion = spec.info?.version ?? 'unknown';
      const meta = {
        api_version: apiVersion,
        api_title: spec.info?.title ?? 'unknown',
        x_api_revision: spec.info?.['x-api-revision'] ?? apiVersion,
        x_build_commit: spec.info?.['x-build-commit'] ?? 'unknown',
        fetched_at: new Date().toISOString(),
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
