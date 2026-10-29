import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";
import {
  FEEDBACK_TITLE_MAX,
  FEEDBACK_DESCRIPTION_MAX,
  FEEDBACK_GITHUB_LABEL,
  FEEDBACK_PATH_MAX,
} from "~/lib/feedback-constants";
import type { DashboardResponseWrapper } from "~/types/generated";

// Simple in-process rate limiter: max 3 submissions per alias per 10 minutes.
// NOTE: in-process only — resets on restart and won't coordinate across
// multiple server instances. Sufficient for low-traffic internal tooling.
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;

  entry.count++;
  return true;
}

function parseUserAgent(ua: string): string {
  let os = "unknown OS";
  if (ua.includes("Windows NT")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  let browser = "unknown browser";
  const edgeMatch = /Edg\/(\d+)/.exec(ua);
  const chromeMatch = /Chrome\/(\d+)/.exec(ua);
  const firefoxMatch = /Firefox\/(\d+)/.exec(ua);
  const safariMatch = /Version\/(\d+).*Safari/.exec(ua);

  if (edgeMatch) browser = `Edge ${edgeMatch[1]}`;
  else if (firefoxMatch) browser = `Firefox ${firefoxMatch[1]}`;
  else if (chromeMatch) browser = `Chrome ${chromeMatch[1]}`;
  else if (safariMatch) browser = `Safari ${safariMatch[1]}`;

  return `${browser} on ${os}`;
}

/** Escape @ and # so user text can't ping people or reference issues on GitHub */
function escapeGitHubMentions(text: string): string {
  return text.replace(/@/g, "﹫").replace(/#/g, "﹟");
}

/**
 * GET /api/feedback
 *
 * Returns whether feedback reporting is configured.
 * Used by the sidebar to conditionally show the button.
 */
export function GET() {
  const configured = !!(env.GITHUB_TOKEN && env.GITHUB_REPO);
  return NextResponse.json({ configured });
}

/**
 * POST /api/feedback
 *
 * Authenticates the caller via their JWT (forwarded to the gateway's
 * POST /api/v2/user/dashboard), then creates a GitHub issue with the report.
 *
 * Body: { title, happened, expected, path }
 * Returns 401 if the JWT is missing or invalid.
 * Returns 503 if GITHUB_TOKEN/GITHUB_REPO are not configured.
 * Returns 429 if the alias has exceeded the rate limit.
 */
export async function POST(request: NextRequest) {
  const { GITHUB_TOKEN, GITHUB_REPO } = env;

  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return NextResponse.json(
      { error: "Feedback reporting is not configured. Contact the app administrator." },
      { status: 503 }
    );
  }

  // Authenticate via the user's JWT — verify it against the gateway and
  // retrieve the alias in one step.
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const gatewayUrl = `${env.NEXT_PUBLIC_ANDAMIO_GATEWAY_URL}/api/v2/user/dashboard`;
  const dashboardRes = await fetch(gatewayUrl, {
    method: "POST",
    headers: {
      "X-API-Key": env.ANDAMIO_API_KEY,
      Authorization: authHeader,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!dashboardRes.ok) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const dashboardData = (await dashboardRes.json()) as DashboardResponseWrapper;
  const alias = dashboardData.data.user?.alias ?? "unknown";

  if (!checkRateLimit(alias)) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a few minutes before trying again." },
      { status: 429 }
    );
  }

  let body: { title?: unknown; happened?: unknown; expected?: unknown; path?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const happened = typeof body.happened === "string" ? body.happened.trim() : "";
  const expected = typeof body.expected === "string" ? body.expected.trim() : "";
  const path =
    typeof body.path === "string"
      ? body.path.slice(0, FEEDBACK_PATH_MAX)
      : "unknown";

  if (!title || !happened) {
    return NextResponse.json(
      { error: "Title and description are required." },
      { status: 400 }
    );
  }

  if (
    title.length > FEEDBACK_TITLE_MAX ||
    happened.length > FEEDBACK_DESCRIPTION_MAX ||
    expected.length > FEEDBACK_DESCRIPTION_MAX
  ) {
    return NextResponse.json(
      { error: "Title or description exceeds maximum length." },
      { status: 400 }
    );
  }

  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const browser = parseUserAgent(userAgent);
  const reportedAt = new Date().toISOString();

  const issueBody = `## What happened?
${escapeGitHubMentions(happened)}

## What did you expect instead?
${expected ? escapeGitHubMentions(expected) : "_Not provided_"}

---
**Reported by:** ${alias}
**Page:** ${path}
**App version:** ${appVersion}
**Browser:** ${browser}
**Time:** ${reportedAt}`;

  const githubRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: escapeGitHubMentions(title),
      body: issueBody,
      labels: [FEEDBACK_GITHUB_LABEL],
    }),
  });

  if (!githubRes.ok) {
    const text = await githubRes.text();
    console.error("[feedback] GitHub API error", githubRes.status, text);
    return NextResponse.json(
      { error: "Failed to create issue. Please try again later." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
