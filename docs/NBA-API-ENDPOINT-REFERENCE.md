# Andamio On Chain Data
## Via Node Backend API (soon to be deprecated)

This document follows the format of andamio-t3-app-template/docs/API-ENDPOINT-REFERENCE.md.

## Inbox

<!-- Add new NBA endpoints here with initial notes. Once implemented, move to Output section below. -->

## Output

# NBA API Endpoint Reference

> **Node Backend API (NBA) - Legacy On-Chain Data Aggregation**
> Last Updated: November 19, 2024
> Status: **Soon to be deprecated**
> Coverage: **8 endpoints** (1 user aggregation, 3 course state, 2 assignment validator, 2 module ref validator)

This document provides reference for the legacy Node Backend API endpoints used for on-chain data aggregation. This API will be deprecated and replaced by the new Database API.

---

## Important Guidelines

### NBA Implementation Rules

**CRITICAL**: When implementing NBA endpoints, always follow these rules:

1. **Display as Raw Data Only**: All NBA data must be displayed as raw JSON using the `AndamioCode` component with `<AndamioCode data={response} />`
2. **Use the NBA API URL**: The NBA API URL is defined in `.env` as `ANDAMIO_NBA_API_URL` (server-side only)
3. **Use the Dynamic Proxy**: Always call NBA endpoints through `/api/nba/{endpoint-path}` - the dynamic proxy route handles CORS automatically
4. **No Authentication**: NBA endpoints do not use JWT authentication (unlike the Database API)
5. **No Transformations**: Show data exactly as returned from the API - no parsing, prettifying, or transformations

### Environment Configuration

The NBA API URL is configured in `.env` as a **server-side only** variable:

```bash
ANDAMIO_NBA_API_URL="https://indexer-preprod-507341199760.us-central1.run.app"
```

This must be added to `src/env.js` schema in the **server** section:

```typescript
server: {
  NODE_ENV: z.enum(["development", "test", "production"]),
  ANDAMIO_NBA_API_URL: z.string().url(),
},
```

**Why Server-Side Only?**

The NBA API does not have CORS headers configured for browser requests. To avoid CORS errors, all NBA API requests are proxied through a Next.js dynamic API route (`/api/nba/[...path]`) that forwards any NBA endpoint server-side.

### Dynamic Proxy Pattern

All NBA endpoints are handled by a single catch-all route: `src/app/api/nba/[...path]/route.ts`

**How it works:**
- `/api/nba/aggregate/user-info?alias=X` → forwards to → `NBA_API/aggregate/user-info?alias=X`
- `/api/nba/any/other/path?params=Y` → forwards to → `NBA_API/any/other/path?params=Y`

This means you can add new NBA endpoints to the frontend without creating new API route files. Simply call `/api/nba/{NBA_ENDPOINT_PATH}` and it will be automatically proxied.

---

## Table of Contents

- [Important Guidelines](#important-guidelines)
- [User Aggregation](#user-aggregation)
- [Course State](#course-state)
- [Assignment Validator](#assignment-validator)
- [Module Ref Validator](#module-ref-validator)

---

## User Aggregation

### GET `/aggregate/user-info`

**Purpose**: Fetch aggregated on-chain data for a user by their access token alias

**Access**: Public (no authentication required)

**Query Parameters**:
- `alias` (required): User's access token alias

**Response Type**: `AggregateUserInfoResponse` from `@andamiojs/datum-utils`

**Frontend Endpoint**: `/api/nba/aggregate/user-info`
- Uses dynamic proxy route: `src/app/api/nba/[...path]/route.ts`

**Used In**:
- `src/app/(app)/dashboard/page.tsx:27` - Dashboard NBA data card

**Role**: Provides on-chain aggregated data for a user identified by their access token alias. This includes information from the Cardano blockchain that has been indexed and aggregated by the NBA backend.

**Frontend Implementation**:
```typescript
import { type AggregateUserInfoResponse } from "@andamiojs/datum-utils";
import { AndamioCode } from "~/components/andamio/andamio-code";

const response = await fetch(
  `/api/nba/aggregate/user-info?alias=${user.accessTokenAlias}`
);
const data = (await response.json()) as AggregateUserInfoResponse;

// Display raw JSON using AndamioCode component
<AndamioCode data={data} />
```

**How Proxy Works:**

The request flows through the dynamic catch-all route:
1. Frontend calls: `/api/nba/aggregate/user-info?alias=X`
2. Dynamic route (`src/app/api/nba/[...path]/route.ts`) extracts path: `["aggregate", "user-info"]`
3. Reconstructs full URL: `NBA_API/aggregate/user-info?alias=X`
4. Makes server-side fetch (no CORS issues)
5. Returns JSON to frontend

**Display**: Raw JSON output in a card on the dashboard with loading, error, and empty states.

---

## Course State

### GET `/course-state/utxos`

**Purpose**: Get raw list of UTXOs for a specific course

**Access**: Public (no authentication required)

**Query Parameters**:
- `policy` (required): Course NFT policy ID (`courseNftPolicyId`)
- `alias` (optional): User's access token alias

**Frontend Endpoint**: `/api/nba/course-state/utxos`
- Uses dynamic proxy route: `src/app/api/nba/[...path]/route.ts`

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/page.tsx:176` - Studio course page (On-Chain Data accordion)

**Role**: Provides raw UTXO data for a course. Useful for developers to inspect on-chain state and debug course-related blockchain transactions.

**Frontend Implementation**:
```typescript
import { AndamioCode } from "~/components/andamio/andamio-code";

const response = await fetch(
  `/api/nba/course-state/utxos?policy=${courseNftPolicyId}`
);
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const data = await response.json();

// Display in accordion
<AndamioAccordionItem value="utxos">
  <AndamioAccordionTrigger>Course UTXOs</AndamioAccordionTrigger>
  <AndamioAccordionContent>
    <AndamioCode data={data} />
  </AndamioAccordionContent>
</AndamioAccordionItem>
```

**Display**: Raw JSON in an accordion at the bottom of the studio course page with loading and empty states.

---

### GET `/course-state/decoded-datum`

**Purpose**: Get decoded datum for a user's enrollment in a course

**Access**: Public (no authentication required)

**Query Parameters**:
- `policy` (required): Course NFT policy ID (`courseNftPolicyId`)
- `alias` (required): User's access token alias

**Frontend Endpoint**: `/api/nba/course-state/decoded-datum`
- Uses dynamic proxy route: `src/app/api/nba/[...path]/route.ts`

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/page.tsx:223` - Studio course page (On-Chain Data accordion)

**Role**: Provides decoded on-chain datum for a user's enrollment in a course. If no data is returned, it means the user is not enrolled in the course. Useful for developers to inspect enrollment state.

**Frontend Implementation**:
```typescript
import { AndamioCode } from "~/components/andamio/andamio-code";

const response = await fetch(
  `/api/nba/course-state/decoded-datum?policy=${courseNftPolicyId}&alias=${user.accessTokenAlias}`
);
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const data = await response.json();

// Display in accordion
<AndamioAccordionItem value="decoded-datum">
  <AndamioAccordionTrigger>Decoded Datum</AndamioAccordionTrigger>
  <AndamioAccordionContent>
    {data ? (
      <AndamioCode data={data} />
    ) : (
      <p>No decoded datum (user may not be enrolled)</p>
    )}
  </AndamioAccordionContent>
</AndamioAccordionItem>
```

**Display**: Raw JSON in an accordion at the bottom of the studio course page with message if user is not enrolled.

---

### GET `/course-state/info`

**Purpose**: Get general information about a course from on-chain data

**Access**: Public (no authentication required)

**Query Parameters**:
- `policy` (required): Course NFT policy ID (`courseNftPolicyId`)

**Frontend Endpoint**: `/api/nba/course-state/info`
- Uses dynamic proxy route: `src/app/api/nba/[...path]/route.ts`

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/page.tsx:192` - Studio course page (On-Chain Data accordion)

**Role**: Provides general on-chain information about a course. Useful for developers to inspect course metadata and state from the blockchain.

**Frontend Implementation**:
```typescript
import { AndamioCode } from "~/components/andamio/andamio-code";

const response = await fetch(
  `/api/nba/course-state/info?policy=${courseNftPolicyId}`
);
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const data = await response.json();

// Display in accordion
<AndamioAccordionItem value="course-info">
  <AndamioAccordionTrigger>Course Info</AndamioAccordionTrigger>
  <AndamioAccordionContent>
    <AndamioCode data={data} />
  </AndamioAccordionContent>
</AndamioAccordionItem>
```

**Display**: Raw JSON in an accordion at the bottom of the studio course page with loading and empty states.

---

## Assignment Validator

### GET `/assignment-validator/utxos`

**Purpose**: Get raw list of UTXOs for assignment commitments in a specific course

**Access**: Public (no authentication required)

**Query Parameters**:
- `policy` (required): Course NFT policy ID (`courseNftPolicyId`)
- `alias` (optional): User's access token alias

**Frontend Endpoint**: `/api/nba/assignment-validator/utxos`
- Uses dynamic proxy route: `src/app/api/nba/[...path]/route.ts`

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/page.tsx:221` - Studio course page (On-Chain Data accordion)

**Role**: Provides raw UTXO data for assignment commitments in a course. Shows all assignment validator UTXOs on-chain for this course. Useful for developers to inspect assignment commitment state.

**Frontend Implementation**:
```typescript
import { AndamioCode } from "~/components/andamio/andamio-code";

const response = await fetch(
  `/api/nba/assignment-validator/utxos?policy=${courseNftPolicyId}`
);
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const data = await response.json();

// Display in accordion
<AndamioAccordionItem value="assignment-utxos">
  <AndamioAccordionTrigger>Assignment Validator UTXOs</AndamioAccordionTrigger>
  <AndamioAccordionContent>
    <AndamioCode data={data} />
  </AndamioAccordionContent>
</AndamioAccordionItem>
```

**How Proxy Works:**

The request flows through the dynamic catch-all route:
1. Frontend calls: `/api/nba/assignment-validator/utxos?policy=X`
2. Dynamic route (`src/app/api/nba/[...path]/route.ts`) extracts path: `["assignment-validator", "utxos"]`
3. Reconstructs full URL: `NBA_API/assignment-validator/utxos?policy=X`
4. Makes server-side fetch (no CORS issues)
5. Returns JSON to frontend

**Display**: Raw JSON in an accordion at the bottom of the studio course page with loading and empty states.

---

### GET `/assignment-validator/decoded-datum`

**Purpose**: Get decoded datum for a user's assignment commitment in a course

**Access**: Public (no authentication required)

**Query Parameters**:
- `policy` (required): Course NFT policy ID (`courseNftPolicyId`)
- `alias` (required): User's access token alias

**Response Type**: `DecodedAssignmentDecisionDatum` from `@andamiojs/datum-utils`

**Frontend Endpoint**: `/api/nba/assignment-validator/decoded-datum`
- Uses dynamic proxy route: `src/app/api/nba/[...path]/route.ts`

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/page.tsx:288` - Studio course page (On-Chain Data accordion)

**Role**: Provides decoded on-chain datum for a user's assignment commitment in a course. If no data is returned, it means the user does not have an active assignment commitment. Useful for developers to inspect assignment commitment details.

**Frontend Implementation**:
```typescript
import { type DecodedAssignmentDecisionDatum } from "@andamiojs/datum-utils";
import { AndamioCode } from "~/components/andamio/andamio-code";

const response = await fetch(
  `/api/nba/assignment-validator/decoded-datum?policy=${courseNftPolicyId}&alias=${user.accessTokenAlias}`
);
const data = (await response.json()) as DecodedAssignmentDecisionDatum;

// Display in accordion
<AndamioAccordionItem value="assignment-datum">
  <AndamioAccordionTrigger>Assignment Validator Decoded Datum</AndamioAccordionTrigger>
  <AndamioAccordionContent>
    {data ? (
      <AndamioCode data={data} />
    ) : (
      <p>No assignment commitment available (user may not have active assignments)</p>
    )}
  </AndamioAccordionContent>
</AndamioAccordionItem>
```

**Display**: Raw JSON in an accordion at the bottom of the studio course page with message if user has no active assignments.

---

## Module Ref Validator

### GET `/module-ref-validator/utxos`

**Purpose**: Get raw list of UTXOs with Course Module Credential data

**Access**: Public (no authentication required)

**Query Parameters**:
- `policy` (required): Course NFT policy ID (`courseNftPolicyId`)

**Frontend Endpoint**: `/api/nba/module-ref-validator/utxos`
- Uses dynamic proxy route: `src/app/api/nba/[...path]/route.ts`

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/page.tsx:237` - Studio course page (On-Chain Data accordion)

**Role**: Provides raw UTXO data for course module credentials. Shows all module ref validator UTXOs containing module metadata on-chain. Useful for developers to inspect module credential state.

**Frontend Implementation**:
```typescript
import { AndamioCode } from "~/components/andamio/andamio-code";

const response = await fetch(
  `/api/nba/module-ref-validator/utxos?policy=${courseNftPolicyId}`
);
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const data = await response.json();

// Display in accordion
<AndamioAccordionItem value="module-ref-utxos">
  <AndamioAccordionTrigger>Module Ref Validator UTXOs</AndamioAccordionTrigger>
  <AndamioAccordionContent>
    <AndamioCode data={data} />
  </AndamioAccordionContent>
</AndamioAccordionItem>
```

**Display**: Raw JSON in an accordion at the bottom of the studio course page with loading and empty states.

---

### GET `/module-ref-validator/decoded-datum`

**Purpose**: Get decoded module credential data in friendly form

**Access**: Public (no authentication required)

**Query Parameters**:
- `policy` (required): Course NFT policy ID (`courseNftPolicyId`)

**Response Type**: `DecodedModuleRefDatum` from `@andamiojs/datum-utils`

**Frontend Endpoint**: `/api/nba/module-ref-validator/decoded-datum`
- Uses dynamic proxy route: `src/app/api/nba/[...path]/route.ts`

**Used In**:
- `src/app/(app)/studio/course/[coursenft]/page.tsx:304` - Studio course page (On-Chain Data accordion)

**Role**: Provides decoded on-chain module credential data in friendly format. Shows SLTs (Student Learning Targets) and assignment details for course modules. Useful for developers to inspect module structure and requirements.

**Frontend Implementation**:
```typescript
import { type DecodedModuleRefDatum } from "@andamiojs/datum-utils";
import { AndamioCode } from "~/components/andamio/andamio-code";

const response = await fetch(
  `/api/nba/module-ref-validator/decoded-datum?policy=${courseNftPolicyId}`
);
const data = (await response.json()) as DecodedModuleRefDatum;

// Display in accordion
<AndamioAccordionItem value="module-ref-datum">
  <AndamioAccordionTrigger>Module Ref Validator Decoded Datum</AndamioAccordionTrigger>
  <AndamioAccordionContent>
    {data ? (
      <AndamioCode data={data} />
    ) : (
      <p>No module credential data available</p>
    )}
  </AndamioAccordionContent>
</AndamioAccordionItem>
```

**Display**: Raw JSON in an accordion at the bottom of the studio course page with loading and empty states.

---

## Migration Notes

The NBA API is being deprecated in favor of the new Database API (`andamio-db-api`). Key differences:

| NBA (Legacy) | Database API (New) |
|--------------|-------------------|
| No authentication | JWT-based authentication |
| On-chain data only | Full course + on-chain data |
| Read-only aggregation | Full CRUD operations |
| External service | Self-hosted API |

**Timeline**: TBD for full deprecation

---

**Last Updated**: November 19, 2024
**Maintained By**: Andamio Platform Team
**Status**: Legacy - use for reference only