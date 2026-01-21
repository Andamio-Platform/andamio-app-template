#!/usr/bin/env npx tsx
/**
 * Automated API Coverage Audit Script
 *
 * Scans the codebase and compares against the live Unified API Gateway spec
 * to generate accurate coverage reports.
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
  category: EndpointCategory;
  implemented: boolean;
  implementationLocation?: string;
}

type EndpointCategory =
  | "auth"
  | "user"
  | "apikey"
  | "admin"
  | "merged-courses"
  | "merged-projects"
  | "scan-courses"
  | "scan-projects"
  | "scan-transactions"
  | "tx-courses"
  | "tx-projects"
  | "tx-instance";

interface CategoryCoverage {
  name: string;
  totalEndpoints: number;
  implementedEndpoints: number;
  coveragePercent: number;
  endpoints: EndpointInfo[];
  missingEndpoints: EndpointInfo[];
}

interface CoverageReport {
  generatedAt: string;
  gatewayUrl: string;
  summary: {
    totalEndpoints: number;
    implementedEndpoints: number;
    overallCoverage: number;
  };
  categories: Record<EndpointCategory, CategoryCoverage>;
}

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  gateway: {
    name: "Unified API Gateway",
    specUrl: "https://andamio-api-gateway-701452636305.us-central1.run.app/api/v1/docs/doc.json",
    baseUrl: "https://andamio-api-gateway-701452636305.us-central1.run.app",
  },
};

// T3 app template root (where src/ and packages/ live)
const PROJECT_ROOT = path.resolve(__dirname, "../../../../");
const SKILLS_DIR = path.resolve(__dirname, "..");

// Category display names
const CATEGORY_NAMES: Record<EndpointCategory, string> = {
  auth: "Authentication",
  user: "User Management",
  apikey: "API Key Management",
  admin: "Admin Functions",
  "merged-courses": "Merged Courses",
  "merged-projects": "Merged Projects",
  "scan-courses": "Scan: Courses",
  "scan-projects": "Scan: Projects",
  "scan-transactions": "Scan: Transactions",
  "tx-courses": "TX: Courses",
  "tx-projects": "TX: Projects",
  "tx-instance": "TX: Instance/Global",
};

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

function categorizeEndpoint(pathStr: string, method: string): EndpointCategory {
  // TX endpoints (check first - most specific)
  if (pathStr.includes("/tx/course/")) return "tx-courses";
  if (pathStr.includes("/tx/project/")) return "tx-projects";
  if (pathStr.includes("/tx/global/") || pathStr.includes("/tx/instance/")) return "tx-instance";
  // TX state machine endpoints (register, status, pending, types)
  if (pathStr.match(/\/v2\/tx\/(register|status|pending|types)/)) return "tx-instance";

  // Auth endpoints (v1 and v2)
  if (pathStr.match(/\/v[12]\/auth\//)) return "auth";

  // Admin endpoints (v1 and v2)
  if (pathStr.match(/\/v[12]\/admin\//)) return "admin";

  // API key management (v1 and v2)
  if (pathStr.match(/\/v[12]\/apikey\//)) return "apikey";

  // User management (v1 and v2)
  if (pathStr.match(/\/v[12]\/user\//)) return "user";

  // Merged course endpoints (v2)
  if (pathStr.startsWith("/v2/course/")) return "merged-courses";

  // Merged project endpoints (v2)
  if (pathStr.startsWith("/v2/project/")) return "merged-projects";

  // Scan endpoints (on-chain indexed) - these may be in a separate API
  if (pathStr.startsWith("/v2/courses")) return "scan-courses";
  if (pathStr.startsWith("/v2/projects")) return "scan-projects";
  if (pathStr.startsWith("/v2/transactions")) return "scan-transactions";

  // Default to user (catch-all for unknown v1/v2 endpoints)
  return "user";
}

function extractEndpoints(spec: OpenAPISpec): EndpointInfo[] {
  const endpoints: EndpointInfo[] = [];

  for (const [pathStr, methods] of Object.entries(spec.paths)) {
    for (const method of Object.keys(methods)) {
      if (["get", "post", "put", "patch", "delete"].includes(method.toLowerCase())) {
        endpoints.push({
          path: pathStr,
          method: method.toUpperCase(),
          category: categorizeEndpoint(pathStr, method),
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
// Coverage Scanners
// =============================================================================

function scanAuthImplementations(endpoints: EndpointInfo[]): void {
  const authFile = path.join(PROJECT_ROOT, "src/lib/andamio-auth.ts");
  const contextFile = path.join(PROJECT_ROOT, "src/contexts/andamio-auth-context.tsx");

  const filesToScan = [authFile, contextFile].filter((f) => fs.existsSync(f));

  for (const file of filesToScan) {
    const content = fs.readFileSync(file, "utf-8");
    const relativePath = path.relative(PROJECT_ROOT, file);

    for (const endpoint of endpoints) {
      if (endpoint.category === "auth") {
        // Extract the path without version prefix for matching
        // e.g., /v1/auth/login -> auth/login, /v2/auth/login/session -> auth/login/session
        const pathWithoutVersion = endpoint.path.replace(/^\/v[12]\//, "");

        // Check for various patterns in the file
        if (
          content.includes(endpoint.path) ||
          content.includes(pathWithoutVersion) ||
          content.includes(`/${pathWithoutVersion}`)
        ) {
          endpoint.implemented = true;
          endpoint.implementationLocation = relativePath;
        }
      }
    }
  }
}

function scanUserImplementations(endpoints: EndpointInfo[]): void {
  const srcDir = path.join(PROJECT_ROOT, "src");
  const files = scanDirectory(srcDir);

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const relativePath = path.relative(PROJECT_ROOT, file);

    for (const endpoint of endpoints) {
      if (["user", "apikey", "admin"].includes(endpoint.category)) {
        // Check for endpoint path in file
        const pathSegments = endpoint.path.split("/").filter(Boolean);
        const lastSegment = pathSegments[pathSegments.length - 1];

        if (content.includes(endpoint.path) || content.includes(`/${pathSegments.slice(-2).join("/")}`)) {
          endpoint.implemented = true;
          endpoint.implementationLocation = relativePath;
        }
      }
    }
  }
}

function scanMergedImplementations(endpoints: EndpointInfo[]): void {
  // Scan multiple directories for merged endpoint implementations
  const dirsToScan = [
    path.join(PROJECT_ROOT, "src/hooks/api"),
    path.join(PROJECT_ROOT, "src/lib"),
    path.join(PROJECT_ROOT, "src/app"),
    path.join(PROJECT_ROOT, "src/components"),
    path.join(PROJECT_ROOT, "src/config"),
  ];

  const allFiles: string[] = [];
  for (const dir of dirsToScan) {
    if (fs.existsSync(dir)) {
      allFiles.push(...scanDirectory(dir));
    }
  }

  for (const file of allFiles) {
    const content = fs.readFileSync(file, "utf-8");
    const relativePath = path.relative(PROJECT_ROOT, file);

    for (const endpoint of endpoints) {
      if (endpoint.category === "merged-courses" || endpoint.category === "merged-projects") {
        // Skip if already found
        if (endpoint.implemented) continue;

        // New paths are /v2/course/... and /v2/project/...
        // Also check for old /api/v2/course/... patterns for backwards compatibility
        const pathWithoutParams = endpoint.path.replace(/\{[^}]+\}/g, "");
        const oldStylePath = endpoint.path.replace("/v2/", "/api/v2/");
        const oldStylePathWithoutParams = oldStylePath.replace(/\{[^}]+\}/g, "");

        // Extract the endpoint suffix (e.g., "owner/courses/list")
        const endpointSuffix = endpoint.path.replace(/^\/v2\/(course|project)\//, "");

        if (
          content.includes(endpoint.path) ||
          content.includes(pathWithoutParams) ||
          content.includes(oldStylePath) ||
          content.includes(oldStylePathWithoutParams) ||
          content.includes(`/${endpointSuffix}`)
        ) {
          endpoint.implemented = true;
          endpoint.implementationLocation = relativePath;
        }
      }
    }
  }
}

function scanAndamioscanImplementations(endpoints: EndpointInfo[]): void {
  const clientPath = path.join(PROJECT_ROOT, "src/lib/andamioscan.ts");

  if (!fs.existsSync(clientPath)) {
    console.log("  ⚠️ andamioscan.ts client not found");
    return;
  }

  const content = fs.readFileSync(clientPath, "utf-8");
  const relativePath = path.relative(PROJECT_ROOT, clientPath);

  // Extract implemented endpoints from client
  const implementedPaths = new Set<string>();

  // Look for fetchAndamioscan calls or path patterns
  const pathMatches = content.matchAll(/["'`](\/(?:api\/)?v2\/[^"'`]+)["'`]/g);
  for (const match of pathMatches) {
    if (match[1]) {
      // Normalize to /v2/ format
      const normalized = match[1].replace("/api/v2/", "/v2/").replace(/\$\{[^}]+\}/g, "{id}");
      implementedPaths.add(normalized);
    }
  }

  // Also look for PROXY_BASE patterns
  const proxyMatches = content.matchAll(/`\$\{PROXY_BASE\}([^`]+)`/g);
  for (const match of proxyMatches) {
    if (match[1]) {
      implementedPaths.add(match[1].replace(/\$\{[^}]+\}/g, "{id}"));
    }
  }

  // Match endpoints
  for (const endpoint of endpoints) {
    if (endpoint.category.startsWith("scan-")) {
      const normalizedPath = endpoint.path.replace(/\{[^}]+\}/g, "{id}");

      for (const implPath of implementedPaths) {
        const normalizedImpl = implPath.replace(/\{[^}]+\}/g, "{id}");
        if (
          normalizedPath === normalizedImpl ||
          normalizedPath.includes(normalizedImpl) ||
          normalizedImpl.includes(normalizedPath)
        ) {
          endpoint.implemented = true;
          endpoint.implementationLocation = relativePath;
          break;
        }
      }
    }
  }
}

function scanTxImplementations(endpoints: EndpointInfo[]): void {
  const implementedEndpoints = new Set<string>();
  const locationMap = new Map<string, string>();

  // Check new V2 transaction config files and hooks
  const txConfigFiles = [
    path.join(PROJECT_ROOT, "src/config/transaction-ui.ts"),
    path.join(PROJECT_ROOT, "src/config/transaction-schemas.ts"),
    path.join(PROJECT_ROOT, "src/hooks/use-tx-watcher.ts"),
    path.join(PROJECT_ROOT, "src/hooks/use-simple-transaction.ts"),
    path.join(PROJECT_ROOT, "src/hooks/use-pending-tx-watcher.ts"),
  ];

  for (const file of txConfigFiles) {
    if (!fs.existsSync(file)) continue;

    const content = fs.readFileSync(file, "utf-8");
    const relativePath = path.relative(PROJECT_ROOT, file);

    // Look for TX_ENDPOINTS patterns like: "/api/v2/tx/course/student/assignment/commit"
    // The T3 app uses /api/v2/tx/... but gateway spec uses /v2/tx/...
    // Also match template literals with ${} interpolation
    const txEndpointMatches = content.matchAll(/["'`](\/(?:api\/gateway\/api\/|api\/)?v2\/tx\/[^"'`$]+)/g);
    for (const match of txEndpointMatches) {
      if (match[1]) {
        // Normalize to /v2/tx/ format (without /api prefix or /api/gateway/api prefix)
        let normalized = match[1]
          .replace("/api/gateway/api/v2/tx/", "/v2/tx/")
          .replace("/api/v2/tx/", "/v2/tx/");

        // Handle template literal variable interpolation (e.g., ${txHash} -> {tx_hash})
        // Extract the base path for matching
        implementedEndpoints.add(normalized);
        locationMap.set(normalized, relativePath);
      }
    }

    // Also look for template literals like `/api/gateway/api/v2/tx/status/${txHash}`
    const templateMatches = content.matchAll(/`(\/(?:api\/gateway\/api\/|api\/)?v2\/tx\/[^`]+)`/g);
    for (const match of templateMatches) {
      if (match[1]) {
        // Normalize and convert ${var} to {param} format
        let normalized = match[1]
          .replace("/api/gateway/api/v2/tx/", "/v2/tx/")
          .replace("/api/v2/tx/", "/v2/tx/")
          .replace(/\$\{[^}]+\}/g, "{id}"); // Convert ${txHash} to {id} for matching
        implementedEndpoints.add(normalized);
        locationMap.set(normalized, relativePath);
      }
    }
  }

  // Also check legacy packages/andamio-transactions if it exists
  const txDir = path.join(PROJECT_ROOT, "packages/andamio-transactions/src/definitions");
  if (fs.existsSync(txDir)) {
    const txFiles = scanDirectory(txDir);

    for (const file of txFiles) {
      if (file.includes("index.ts")) continue;

      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(PROJECT_ROOT, file);

      // Look for builder endpoint patterns
      const builderEndpointMatches = content.matchAll(/builderEndpoint:\s*["'`]([^"'`]+)["'`]/g);
      for (const match of builderEndpointMatches) {
        if (match[1]) {
          implementedEndpoints.add(match[1]);
          locationMap.set(match[1], relativePath);
        }
      }

      // Pattern: builder: { type: "api-endpoint", endpoint: "..." }
      const builderObjectMatches = content.matchAll(/endpoint:\s*["'`](\/v2\/tx\/[^"'`]+)["'`]/g);
      for (const match of builderObjectMatches) {
        if (match[1]) {
          implementedEndpoints.add(match[1]);
          locationMap.set(match[1], relativePath);
        }
      }
    }
  }

  // Match endpoints
  for (const endpoint of endpoints) {
    if (endpoint.category.startsWith("tx-")) {
      // Normalize the endpoint path for comparison (replace {param} with {id})
      const normalizedEndpoint = endpoint.path.replace(/\{[^}]+\}/g, "{id}");

      for (const implEndpoint of implementedEndpoints) {
        const normalizedImpl = implEndpoint.replace(/\{[^}]+\}/g, "{id}");
        if (
          endpoint.path === implEndpoint ||
          normalizedEndpoint === normalizedImpl ||
          endpoint.path.endsWith(implEndpoint) ||
          normalizedEndpoint.endsWith(normalizedImpl)
        ) {
          endpoint.implemented = true;
          endpoint.implementationLocation = locationMap.get(implEndpoint);
          break;
        }
      }
    }
  }
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
    "| Category | Total | Implemented | Coverage |",
    "|----------|-------|-------------|----------|",
  ];

  const categoryOrder: EndpointCategory[] = [
    "auth",
    "user",
    "apikey",
    "admin",
    "merged-courses",
    "merged-projects",
    "scan-courses",
    "scan-projects",
    "scan-transactions",
    "tx-courses",
    "tx-projects",
    "tx-instance",
  ];

  for (const cat of categoryOrder) {
    const category = report.categories[cat];
    if (category.totalEndpoints > 0) {
      lines.push(
        `| ${category.name} | ${category.totalEndpoints} | ${category.implementedEndpoints} | **${category.coveragePercent}%** |`
      );
    }
  }

  lines.push("");
  lines.push("---");
  lines.push("");

  // Gateway section
  lines.push(`## Unified API Gateway`);
  lines.push("");
  lines.push(`**Base URL**: \`${report.gatewayUrl}\``);
  lines.push(`**Coverage**: ${report.summary.implementedEndpoints}/${report.summary.totalEndpoints} (${report.summary.overallCoverage}%)`);
  lines.push("");

  // Implemented categories
  lines.push("### Implemented Categories");
  lines.push("");
  lines.push("| Category | Coverage | Notes |");
  lines.push("|----------|----------|-------|");

  for (const cat of categoryOrder) {
    const category = report.categories[cat];
    if (category.totalEndpoints > 0 && category.coveragePercent === 100) {
      const location =
        category.endpoints[0]?.implementationLocation || "Various locations";
      lines.push(
        `| ${category.name} | ${category.implementedEndpoints}/${category.totalEndpoints} (100%) | \`${location}\` |`
      );
    }
  }

  lines.push("");

  // Missing categories
  lines.push("### Missing Categories");
  lines.push("");
  lines.push("| Category | Count | Notes |");
  lines.push("|----------|-------|-------|");

  for (const cat of categoryOrder) {
    const category = report.categories[cat];
    if (category.totalEndpoints > 0 && category.coveragePercent < 100) {
      const note =
        category.implementedEndpoints === 0 ? "Not implemented" : "Partially implemented";
      lines.push(`| ${category.name} | ${category.missingEndpoints.length} | ${note} |`);
    }
  }

  lines.push("");

  // Missing endpoints
  const allMissing = categoryOrder.flatMap((cat) => report.categories[cat].missingEndpoints);
  if (allMissing.length > 0) {
    lines.push("### Missing Endpoints");
    lines.push("");
    lines.push("| Method | Path |");
    lines.push("|--------|------|");

    for (const endpoint of allMissing.slice(0, 25)) {
      lines.push(`| ${endpoint.method} | \`${endpoint.path}\` |`);
    }

    if (allMissing.length > 25) {
      lines.push(`| ... | *${allMissing.length - 25} more endpoints* |`);
    }

    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("## How to Improve Coverage");
  lines.push("");
  lines.push("1. **Authentication**: Migrate auth flow to use `/auth/login` endpoint");
  lines.push("2. **User/Admin**: Implement new user management and admin endpoints");
  lines.push("3. **Merged Data**: Replace separate DB API + Andamioscan calls with merged endpoints");
  lines.push("4. **Scan Client**: Update `src/lib/andamioscan.ts` to use gateway base URL");
  lines.push("");
  lines.push("Run `npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts` after adding implementations to update coverage.");

  return lines.join("\n");
}

function createEmptyCategory(name: string): CategoryCoverage {
  return {
    name,
    totalEndpoints: 0,
    implementedEndpoints: 0,
    coveragePercent: 0,
    endpoints: [],
    missingEndpoints: [],
  };
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log("🔍 Andamio API Coverage Audit (Unified Gateway)");
  console.log("=".repeat(50));

  // Fetch spec from unified gateway
  console.log("\n📡 Fetching API spec from gateway...");
  const spec = await fetchSpec(CONFIG.gateway.specUrl);

  if (!spec) {
    console.error("❌ Failed to fetch API spec. Using fallback endpoints.");
    // Could add fallback here if needed
    process.exit(1);
  }

  // Extract and categorize endpoints
  const endpoints = extractEndpoints(spec);
  console.log(`  Found ${endpoints.length} endpoints in OpenAPI spec`);

  // Scan implementations
  console.log("\n📊 Scanning implementations...");

  console.log("  Scanning auth...");
  scanAuthImplementations(endpoints);

  console.log("  Scanning user/admin endpoints...");
  scanUserImplementations(endpoints);

  console.log("  Scanning merged data endpoints...");
  scanMergedImplementations(endpoints);

  console.log("  Scanning scan (Andamioscan) endpoints...");
  scanAndamioscanImplementations(endpoints);

  console.log("  Scanning transaction endpoints...");
  scanTxImplementations(endpoints);

  // Build category reports
  const categories: Record<EndpointCategory, CategoryCoverage> = {
    auth: createEmptyCategory(CATEGORY_NAMES.auth),
    user: createEmptyCategory(CATEGORY_NAMES.user),
    apikey: createEmptyCategory(CATEGORY_NAMES.apikey),
    admin: createEmptyCategory(CATEGORY_NAMES.admin),
    "merged-courses": createEmptyCategory(CATEGORY_NAMES["merged-courses"]),
    "merged-projects": createEmptyCategory(CATEGORY_NAMES["merged-projects"]),
    "scan-courses": createEmptyCategory(CATEGORY_NAMES["scan-courses"]),
    "scan-projects": createEmptyCategory(CATEGORY_NAMES["scan-projects"]),
    "scan-transactions": createEmptyCategory(CATEGORY_NAMES["scan-transactions"]),
    "tx-courses": createEmptyCategory(CATEGORY_NAMES["tx-courses"]),
    "tx-projects": createEmptyCategory(CATEGORY_NAMES["tx-projects"]),
    "tx-instance": createEmptyCategory(CATEGORY_NAMES["tx-instance"]),
  };

  for (const endpoint of endpoints) {
    const category = categories[endpoint.category];
    category.endpoints.push(endpoint);
    category.totalEndpoints++;
    if (endpoint.implemented) {
      category.implementedEndpoints++;
    } else {
      category.missingEndpoints.push(endpoint);
    }
  }

  // Calculate percentages
  for (const category of Object.values(categories)) {
    if (category.totalEndpoints > 0) {
      category.coveragePercent = Math.round(
        (category.implementedEndpoints / category.totalEndpoints) * 100
      );
    }
  }

  // Calculate totals
  const totalEndpoints = endpoints.length;
  const implementedEndpoints = endpoints.filter((e) => e.implemented).length;
  const overallCoverage = Math.round((implementedEndpoints / totalEndpoints) * 100);

  // Build report
  const report: CoverageReport = {
    generatedAt: new Date().toISOString(),
    gatewayUrl: CONFIG.gateway.baseUrl,
    summary: {
      totalEndpoints,
      implementedEndpoints,
      overallCoverage,
    },
    categories,
  };

  // Print summary
  console.log("\n" + "=".repeat(50));
  console.log("📈 COVERAGE SUMMARY");
  console.log("=".repeat(50));
  console.log("");

  const categoryOrder: EndpointCategory[] = [
    "auth",
    "user",
    "apikey",
    "admin",
    "merged-courses",
    "merged-projects",
    "scan-courses",
    "scan-projects",
    "scan-transactions",
    "tx-courses",
    "tx-projects",
    "tx-instance",
  ];

  for (const cat of categoryOrder) {
    const category = categories[cat];
    if (category.totalEndpoints > 0) {
      const status = category.coveragePercent === 100 ? "✅" : category.coveragePercent > 0 ? "🔶" : "⏳";
      console.log(
        `  ${status} ${category.name.padEnd(20)} ${category.implementedEndpoints}/${category.totalEndpoints} (${category.coveragePercent}%)`
      );
    }
  }

  console.log("");
  console.log(`  TOTAL:${" ".repeat(14)} ${implementedEndpoints}/${totalEndpoints} (${overallCoverage}%)`);
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
  if (overallCoverage < 30) {
    console.log("\n⚠️  Coverage is below 30% threshold");
    process.exit(1);
  }

  console.log("\n✅ Coverage audit complete!");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
