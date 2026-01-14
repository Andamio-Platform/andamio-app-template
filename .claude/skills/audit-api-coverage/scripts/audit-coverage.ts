#!/usr/bin/env npx tsx
/**
 * Automated API Coverage Audit Script
 *
 * Scans the codebase and compares against live OpenAPI specs to generate
 * accurate coverage reports for all 3 Andamio API sub-systems.
 *
 * Usage:
 *   npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts
 *
 * Output:
 *   - Console summary with coverage percentages
 *   - JSON report at .claude/skills/audit-api-coverage/coverage-report.json
 *   - Markdown report at .claude/skills/audit-api-coverage/COVERAGE-REPORT.md
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// Types
// =============================================================================

interface OpenAPISpec {
  paths: Record<string, Record<string, unknown>>;
}

interface EndpointInfo {
  path: string;
  method: string;
  implemented: boolean;
  implementationLocation?: string;
}

interface APICoverage {
  name: string;
  baseUrl: string;
  totalEndpoints: number;
  implementedEndpoints: number;
  coveragePercent: number;
  endpoints: EndpointInfo[];
  missingEndpoints: EndpointInfo[];
}

interface CoverageReport {
  generatedAt: string;
  summary: {
    totalEndpoints: number;
    implementedEndpoints: number;
    overallCoverage: number;
  };
  apis: {
    dbApi: APICoverage;
    txApi: APICoverage;
    andamioscan: APICoverage;
  };
}

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  dbApi: {
    name: "Andamio DB API",
    specUrl: "https://andamio-db-api-343753432212.us-central1.run.app/docs/doc.json",
    baseUrl: "https://andamio-db-api-343753432212.us-central1.run.app",
  },
  txApi: {
    name: "Andamio Tx API",
    specUrl: "https://atlas-api-preprod-507341199760.us-central1.run.app/swagger.json",
    baseUrl: "https://atlas-api-preprod-507341199760.us-central1.run.app",
  },
  andamioscan: {
    name: "Andamioscan",
    // Andamioscan spec is stored locally since it requires UI download
    localSpecPath: ".claude/skills/audit-api-coverage/andamioscan-api-doc.json",
    baseUrl: "https://preprod.andamioscan.io/api",
  },
};

// T3 app template root (where src/ and packages/ live)
const PROJECT_ROOT = path.resolve(__dirname, "../../../../");
const SKILLS_DIR = path.resolve(__dirname, "..");

// =============================================================================
// Utility Functions
// =============================================================================

async function fetchSpec(url: string): Promise<OpenAPISpec | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }
    return (await response.json()) as OpenAPISpec;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

function loadLocalSpec(relativePath: string): OpenAPISpec | null {
  try {
    const fullPath = path.join(PROJECT_ROOT, relativePath);
    const content = fs.readFileSync(fullPath, "utf-8");
    return JSON.parse(content) as OpenAPISpec;
  } catch (error) {
    console.error(`Error loading local spec ${relativePath}:`, error);
    return null;
  }
}

function extractEndpoints(spec: OpenAPISpec): EndpointInfo[] {
  const endpoints: EndpointInfo[] = [];

  for (const [pathStr, methods] of Object.entries(spec.paths)) {
    for (const method of Object.keys(methods)) {
      if (["get", "post", "put", "patch", "delete"].includes(method.toLowerCase())) {
        endpoints.push({
          path: pathStr,
          method: method.toUpperCase(),
          implemented: false,
        });
      }
    }
  }

  return endpoints;
}

function scanDirectory(dir: string, extensions: string[] = [".ts", ".tsx"]): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
      files.push(...scanDirectory(fullPath, extensions));
    } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

// =============================================================================
// DB API Coverage Scanner
// =============================================================================

async function scanDbApiCoverage(): Promise<APICoverage> {
  console.log("\n📊 Scanning DB API coverage...");

  // Fetch spec
  const spec = await fetchSpec(CONFIG.dbApi.specUrl);
  if (!spec) {
    return createEmptyCoverage(CONFIG.dbApi.name, CONFIG.dbApi.baseUrl);
  }

  const endpoints = extractEndpoints(spec);
  console.log(`  Found ${endpoints.length} endpoints in OpenAPI spec`);

  // Scan implementation files
  const srcDir = path.join(PROJECT_ROOT, "src");
  const files = scanDirectory(srcDir);

  // Build pattern map for each endpoint
  const implementedPaths = new Set<string>();
  const locationMap = new Map<string, string>();

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const relativePath = path.relative(PROJECT_ROOT, file);

    // Look for API calls with ANDAMIO_API_URL
    if (content.includes("ANDAMIO_API_URL") || content.includes("andamio-api")) {
      // Extract endpoint paths from the file
      const pathMatches = content.matchAll(
        /(?:ANDAMIO_API_URL[`'"]?\s*[+}]\s*[`'"]?|fetch\([`'"].*?)(\/(auth|user|course|project)\/[^`'")\s]+)/g
      );

      for (const match of pathMatches) {
        const endpointPath = match[1];
        if (endpointPath) {
          // Normalize path (remove template variables like ${courseId})
          const normalizedPath = endpointPath
            .replace(/\$\{[^}]+\}/g, "{id}")
            .replace(/\/[a-f0-9]{56,64}/g, "/{id}");

          implementedPaths.add(normalizedPath);
          locationMap.set(normalizedPath, relativePath);
        }
      }
    }
  }

  // Match endpoints to implementations
  for (const endpoint of endpoints) {
    // Normalize the spec path for comparison
    const normalizedSpecPath = endpoint.path.replace(/\{[^}]+\}/g, "{id}");

    // Check if this endpoint is implemented
    for (const implPath of implementedPaths) {
      if (
        normalizedSpecPath === implPath ||
        normalizedSpecPath.includes(implPath) ||
        implPath.includes(normalizedSpecPath)
      ) {
        endpoint.implemented = true;
        endpoint.implementationLocation = locationMap.get(implPath);
        break;
      }
    }

    // Also check for direct path matches
    if (!endpoint.implemented) {
      const pathSegments = endpoint.path.split("/").filter(Boolean);
      const lastSegments = pathSegments.slice(-2).join("/");

      for (const implPath of implementedPaths) {
        if (implPath.includes(lastSegments)) {
          endpoint.implemented = true;
          endpoint.implementationLocation = locationMap.get(implPath);
          break;
        }
      }
    }
  }

  const implemented = endpoints.filter((e) => e.implemented);

  return {
    name: CONFIG.dbApi.name,
    baseUrl: CONFIG.dbApi.baseUrl,
    totalEndpoints: endpoints.length,
    implementedEndpoints: implemented.length,
    coveragePercent: Math.round((implemented.length / endpoints.length) * 100),
    endpoints,
    missingEndpoints: endpoints.filter((e) => !e.implemented),
  };
}

// =============================================================================
// Tx API Coverage Scanner
// =============================================================================

async function scanTxApiCoverage(): Promise<APICoverage> {
  console.log("\n📊 Scanning Tx API coverage...");

  // Fetch spec
  const spec = await fetchSpec(CONFIG.txApi.specUrl);
  if (!spec) {
    return createEmptyCoverage(CONFIG.txApi.name, CONFIG.txApi.baseUrl);
  }

  const endpoints = extractEndpoints(spec);
  console.log(`  Found ${endpoints.length} endpoints in OpenAPI spec`);

  // Scan transaction definitions (embedded in this project)
  const txDir = path.join(PROJECT_ROOT, "packages/andamio-transactions/src/definitions");

  if (!fs.existsSync(txDir)) {
    console.log("  ⚠️ Transaction definitions directory not found");
    return {
      name: CONFIG.txApi.name,
      baseUrl: CONFIG.txApi.baseUrl,
      totalEndpoints: endpoints.length,
      implementedEndpoints: 0,
      coveragePercent: 0,
      endpoints,
      missingEndpoints: endpoints,
    };
  }

  const txFiles = scanDirectory(txDir);
  const implementedEndpoints = new Set<string>();
  const locationMap = new Map<string, string>();

  for (const file of txFiles) {
    if (file.includes("index.ts")) continue;

    const content = fs.readFileSync(file, "utf-8");
    const relativePath = path.relative(PROJECT_ROOT, file);

    // Look for builder endpoint patterns in transaction definitions
    // Pattern 1: builderEndpoint: "/v2/tx/..."
    const builderEndpointMatches = content.matchAll(/builderEndpoint:\s*["'`]([^"'`]+)["'`]/g);
    for (const match of builderEndpointMatches) {
      if (match[1]) {
        implementedEndpoints.add(match[1]);
        locationMap.set(match[1], relativePath);
      }
    }

    // Pattern 2: builder: { type: "api-endpoint", endpoint: "/v2/tx/..." }
    const builderObjectMatches = content.matchAll(/endpoint:\s*["'`](\/v2\/tx\/[^"'`]+)["'`]/g);
    for (const match of builderObjectMatches) {
      if (match[1]) {
        implementedEndpoints.add(match[1]);
        locationMap.set(match[1], relativePath);
      }
    }
  }

  console.log(`  Found ${implementedEndpoints.size} transaction definitions`);

  // Match endpoints
  for (const endpoint of endpoints) {
    for (const implEndpoint of implementedEndpoints) {
      if (endpoint.path === implEndpoint || endpoint.path.endsWith(implEndpoint)) {
        endpoint.implemented = true;
        endpoint.implementationLocation = locationMap.get(implEndpoint);
        break;
      }
    }
  }

  const implemented = endpoints.filter((e) => e.implemented);

  return {
    name: CONFIG.txApi.name,
    baseUrl: CONFIG.txApi.baseUrl,
    totalEndpoints: endpoints.length,
    implementedEndpoints: implemented.length,
    coveragePercent: Math.round((implemented.length / endpoints.length) * 100),
    endpoints,
    missingEndpoints: endpoints.filter((e) => !e.implemented),
  };
}

// =============================================================================
// Andamioscan Coverage Scanner
// =============================================================================

async function scanAndamioscanCoverage(): Promise<APICoverage> {
  console.log("\n📊 Scanning Andamioscan coverage...");

  // Load local spec
  const spec = loadLocalSpec(CONFIG.andamioscan.localSpecPath);
  if (!spec) {
    console.log("  ⚠️ Local Andamioscan spec not found, using documented endpoints");
    return scanAndamioscanFromDocs();
  }

  const endpoints = extractEndpoints(spec);
  console.log(`  Found ${endpoints.length} endpoints in OpenAPI spec`);

  // Scan andamioscan.ts client
  const clientPath = path.join(PROJECT_ROOT, "src/lib/andamioscan.ts");

  if (!fs.existsSync(clientPath)) {
    console.log("  ⚠️ andamioscan.ts client not found");
    return {
      name: CONFIG.andamioscan.name,
      baseUrl: CONFIG.andamioscan.baseUrl,
      totalEndpoints: endpoints.length,
      implementedEndpoints: 0,
      coveragePercent: 0,
      endpoints,
      missingEndpoints: endpoints,
    };
  }

  const content = fs.readFileSync(clientPath, "utf-8");

  // Extract implemented endpoints from client
  const implementedPaths = new Set<string>();

  // Look for fetchAndamioscan calls
  const fetchMatches = content.matchAll(/fetchAndamioscan[^(]*\([^"'`]*["'`]([^"'`]+)["'`]/g);
  for (const match of fetchMatches) {
    if (match[1]) {
      implementedPaths.add(match[1]);
    }
  }

  // Also look for PROXY_BASE + path patterns
  const proxyMatches = content.matchAll(/`\$\{PROXY_BASE\}([^`]+)`/g);
  for (const match of proxyMatches) {
    if (match[1]) {
      implementedPaths.add(match[1].replace(/\$\{[^}]+\}/g, "{id}"));
    }
  }

  // Match endpoints
  for (const endpoint of endpoints) {
    const normalizedPath = endpoint.path.replace(/\{[^}]+\}/g, "{id}");

    for (const implPath of implementedPaths) {
      const normalizedImpl = implPath.replace(/\{[^}]+\}/g, "{id}");
      if (normalizedPath === normalizedImpl || normalizedPath.includes(normalizedImpl)) {
        endpoint.implemented = true;
        endpoint.implementationLocation = "src/lib/andamioscan.ts";
        break;
      }
    }
  }

  const implemented = endpoints.filter((e) => e.implemented);

  return {
    name: CONFIG.andamioscan.name,
    baseUrl: CONFIG.andamioscan.baseUrl,
    totalEndpoints: endpoints.length,
    implementedEndpoints: implemented.length,
    coveragePercent: Math.round((implemented.length / endpoints.length) * 100),
    endpoints,
    missingEndpoints: endpoints.filter((e) => !e.implemented),
  };
}

// Fallback scanner using documented endpoints
function scanAndamioscanFromDocs(): APICoverage {
  // Known endpoints from documentation
  const knownEndpoints: EndpointInfo[] = [
    // Health
    { path: "/health", method: "GET", implemented: false },
    // Courses (4)
    { path: "/api/v2/courses", method: "GET", implemented: true, implementationLocation: "src/lib/andamioscan.ts" },
    { path: "/api/v2/courses/{id}/details", method: "GET", implemented: true, implementationLocation: "src/lib/andamioscan.ts" },
    { path: "/api/v2/courses/{id}/students/{alias}/status", method: "GET", implemented: true, implementationLocation: "src/lib/andamioscan.ts" },
    { path: "/api/v2/courses/teachers/{alias}/assessments/pending", method: "GET", implemented: true, implementationLocation: "src/lib/andamioscan.ts" },
    // Projects (5)
    { path: "/api/v2/projects", method: "GET", implemented: true, implementationLocation: "src/lib/andamioscan.ts" },
    { path: "/api/v2/projects/{id}/details", method: "GET", implemented: true, implementationLocation: "src/lib/andamioscan.ts" },
    { path: "/api/v2/projects/{id}/contributors/{alias}/status", method: "GET", implemented: true, implementationLocation: "src/lib/andamioscan.ts" },
    { path: "/api/v2/projects/managers/{alias}/assessments/pending", method: "GET", implemented: true, implementationLocation: "src/lib/andamioscan.ts" },
    // Users (9)
    { path: "/api/v2/users/{alias}/state", method: "GET", implemented: true, implementationLocation: "src/lib/andamioscan.ts" },
    { path: "/api/v2/users/{alias}/courses/teaching", method: "GET", implemented: true, implementationLocation: "src/lib/andamioscan.ts" },
    { path: "/api/v2/users/{alias}/courses/enrolled", method: "GET", implemented: true, implementationLocation: "src/lib/andamioscan.ts" },
    { path: "/api/v2/users/{alias}/courses/completed", method: "GET", implemented: true, implementationLocation: "src/lib/andamioscan.ts" },
    { path: "/api/v2/users/{alias}/courses/owned", method: "GET", implemented: true, implementationLocation: "src/lib/andamioscan.ts" },
    { path: "/api/v2/users/{alias}/projects/contributing", method: "GET", implemented: true, implementationLocation: "src/lib/andamioscan.ts" },
    { path: "/api/v2/users/{alias}/projects/managing", method: "GET", implemented: true, implementationLocation: "src/lib/andamioscan.ts" },
    { path: "/api/v2/users/{alias}/projects/owned", method: "GET", implemented: true, implementationLocation: "src/lib/andamioscan.ts" },
    { path: "/api/v2/users/{alias}/projects/completed", method: "GET", implemented: true, implementationLocation: "src/lib/andamioscan.ts" },
    // Events (16) - NOT IMPLEMENTED
    { path: "/api/v2/events/access-tokens/mint/{tx_hash}", method: "GET", implemented: false },
    { path: "/api/v2/events/courses/create/{tx_hash}", method: "GET", implemented: false },
    { path: "/api/v2/events/teachers/update/{tx_hash}", method: "GET", implemented: false },
    { path: "/api/v2/events/modules/manage/{tx_hash}", method: "GET", implemented: false },
    { path: "/api/v2/events/enrollments/enroll/{tx_hash}", method: "GET", implemented: false },
    { path: "/api/v2/events/assignments/submit/{tx_hash}", method: "GET", implemented: false },
    { path: "/api/v2/events/assessments/assess/{tx_hash}", method: "GET", implemented: false },
    { path: "/api/v2/events/credential-claims/claim/{tx_hash}", method: "GET", implemented: false },
    { path: "/api/v2/events/projects/create/{tx_hash}", method: "GET", implemented: false },
    { path: "/api/v2/events/projects/join/{tx_hash}", method: "GET", implemented: false },
    { path: "/api/v2/events/tasks/manage/{tx_hash}", method: "GET", implemented: false },
    { path: "/api/v2/events/tasks/submit/{tx_hash}", method: "GET", implemented: false },
    { path: "/api/v2/events/tasks/assess/{tx_hash}", method: "GET", implemented: false },
    { path: "/api/v2/events/credential-claims/project/{tx_hash}", method: "GET", implemented: false },
    { path: "/api/v2/events/treasury/fund/{tx_hash}", method: "GET", implemented: false },
    // Transactions (1)
    { path: "/api/v2/transactions", method: "GET", implemented: false },
  ];

  const implemented = knownEndpoints.filter((e) => e.implemented);

  return {
    name: CONFIG.andamioscan.name,
    baseUrl: CONFIG.andamioscan.baseUrl,
    totalEndpoints: knownEndpoints.length,
    implementedEndpoints: implemented.length,
    coveragePercent: Math.round((implemented.length / knownEndpoints.length) * 100),
    endpoints: knownEndpoints,
    missingEndpoints: knownEndpoints.filter((e) => !e.implemented),
  };
}

function createEmptyCoverage(name: string, baseUrl: string): APICoverage {
  return {
    name,
    baseUrl,
    totalEndpoints: 0,
    implementedEndpoints: 0,
    coveragePercent: 0,
    endpoints: [],
    missingEndpoints: [],
  };
}

// =============================================================================
// Report Generation
// =============================================================================

function generateMarkdownReport(report: CoverageReport): string {
  const lines: string[] = [
    "# API Coverage Report",
    "",
    `> **Generated**: ${report.generatedAt}`,
    `> **Overall Coverage**: ${report.summary.overallCoverage}% (${report.summary.implementedEndpoints}/${report.summary.totalEndpoints} endpoints)`,
    "",
    "## Summary",
    "",
    "| API | Total | Implemented | Coverage |",
    "|-----|-------|-------------|----------|",
  ];

  for (const api of Object.values(report.apis)) {
    lines.push(
      `| ${api.name} | ${api.totalEndpoints} | ${api.implementedEndpoints} | **${api.coveragePercent}%** |`
    );
  }

  lines.push("");
  lines.push("---");
  lines.push("");

  // Detail section for each API
  for (const api of Object.values(report.apis)) {
    lines.push(`## ${api.name}`);
    lines.push("");
    lines.push(`**Base URL**: \`${api.baseUrl}\``);
    lines.push(`**Coverage**: ${api.implementedEndpoints}/${api.totalEndpoints} (${api.coveragePercent}%)`);
    lines.push("");

    if (api.missingEndpoints.length > 0) {
      lines.push("### Missing Endpoints");
      lines.push("");
      lines.push("| Method | Path |");
      lines.push("|--------|------|");

      for (const endpoint of api.missingEndpoints.slice(0, 20)) {
        lines.push(`| ${endpoint.method} | \`${endpoint.path}\` |`);
      }

      if (api.missingEndpoints.length > 20) {
        lines.push(`| ... | *${api.missingEndpoints.length - 20} more endpoints* |`);
      }

      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  lines.push("## How to Improve Coverage");
  lines.push("");
  lines.push("1. **DB API**: Add React Query hooks in `src/hooks/api/`");
  lines.push("2. **Andamioscan**: Add client functions in `src/lib/andamioscan.ts`");
  lines.push("3. **Tx API**: Add transaction definitions in `packages/andamio-transactions/`");
  lines.push("");
  lines.push("Run this script again after adding implementations to update coverage.");

  return lines.join("\n");
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log("🔍 Andamio API Coverage Audit");
  console.log("=".repeat(50));

  // Scan all APIs
  const dbApiCoverage = await scanDbApiCoverage();
  const txApiCoverage = await scanTxApiCoverage();
  const andamioscanCoverage = await scanAndamioscanCoverage();

  // Calculate totals
  const totalEndpoints =
    dbApiCoverage.totalEndpoints +
    txApiCoverage.totalEndpoints +
    andamioscanCoverage.totalEndpoints;

  const implementedEndpoints =
    dbApiCoverage.implementedEndpoints +
    txApiCoverage.implementedEndpoints +
    andamioscanCoverage.implementedEndpoints;

  const overallCoverage = Math.round((implementedEndpoints / totalEndpoints) * 100);

  // Build report
  const report: CoverageReport = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalEndpoints,
      implementedEndpoints,
      overallCoverage,
    },
    apis: {
      dbApi: dbApiCoverage,
      txApi: txApiCoverage,
      andamioscan: andamioscanCoverage,
    },
  };

  // Print summary
  console.log("\n" + "=".repeat(50));
  console.log("📈 COVERAGE SUMMARY");
  console.log("=".repeat(50));
  console.log("");
  console.log(`  DB API:      ${dbApiCoverage.implementedEndpoints}/${dbApiCoverage.totalEndpoints} (${dbApiCoverage.coveragePercent}%)`);
  console.log(`  Tx API:      ${txApiCoverage.implementedEndpoints}/${txApiCoverage.totalEndpoints} (${txApiCoverage.coveragePercent}%)`);
  console.log(`  Andamioscan: ${andamioscanCoverage.implementedEndpoints}/${andamioscanCoverage.totalEndpoints} (${andamioscanCoverage.coveragePercent}%)`);
  console.log("");
  console.log(`  TOTAL:       ${implementedEndpoints}/${totalEndpoints} (${overallCoverage}%)`);
  console.log("");

  // Write JSON report
  const jsonPath = path.join(SKILLS_DIR, "coverage-report.json");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`📄 JSON report written to: ${path.relative(PROJECT_ROOT, jsonPath)}`);

  // Write Markdown report
  const mdPath = path.join(SKILLS_DIR, "COVERAGE-REPORT.md");
  fs.writeFileSync(mdPath, generateMarkdownReport(report));
  console.log(`📄 Markdown report written to: ${path.relative(PROJECT_ROOT, mdPath)}`);

  // Return exit code based on coverage threshold
  if (overallCoverage < 50) {
    console.log("\n⚠️  Coverage is below 50% threshold");
    process.exit(1);
  }

  console.log("\n✅ Coverage audit complete!");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
