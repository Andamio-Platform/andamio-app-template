# Getting Started with Andamio T3 App Template

> A step-by-step guide to running the template and understanding its architecture.

---

## For Andamio Pioneers

If you're joining the Andamio Pioneers program:

1. **Join Discord** - [Andamio Network Discord](https://discord.gg/abBbsGZpZ5) for daily communication
2. **Get GitHub Access** - Share your GitHub handle in Discord to join the Andamio Pioneers team
3. **Live Coding Sessions** - Join our Google Meet sessions (link shared on Discord)
4. **Documentation** - See [docs.andamio.io/docs/pioneers](https://docs.andamio.io/docs/pioneers) for program details

### Pioneer Environment Setup

For pioneers, use these production API URLs in your `.env`:

```bash
NEXT_PUBLIC_ANDAMIO_API_URL="https://andamio-db-api-343753432212.europe-west1.run.app/api/v0"
ANDAMIOSCAN_API_URL="https://preprod.andamioscan.andamio.space"
ATLAS_TX_API_URL="https://atlas-api-preprod-507341199760.us-central1.run.app"
NEXT_PUBLIC_CARDANO_NETWORK="preprod"
NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID="39b2876b2458b8cd869eb665b24740df6890684a3e6cd7ff6c28b84b"
```

### API Documentation

- [Andamioscan (Indexer)](https://preprod.andamioscan.andamio.space/swagger/index.html)
- [Transaction API](https://atlas-api-preprod-507341199760.us-central1.run.app/docs)
- [Database API](https://andamio-db-api-343753432212.europe-west1.run.app/swagger/)

---

## Prerequisites

Before starting, ensure you have:

- **Node.js 20+** - [Download](https://nodejs.org/)
- **npm 10+** - Comes with Node.js
- **Cardano Wallet Extension** - Install one of:
  - [Eternl](https://eternl.io/) (recommended)
  - [Nami](https://namiwallet.io/)
  - [Flint](https://flint-wallet.com/)
- **Git** - [Download](https://git-scm.com/)

### Optional but Recommended

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense

---

## Quick Start

### 1. Clone and Install

```bash
# If using the monorepo (recommended)
git clone https://github.com/Andamio-Platform/andamio-platform-monorepo.git
cd andamio-platform-monorepo
./scripts/setup.sh

# Or standalone
git clone https://github.com/Andamio-Platform/andamio-t3-app-template.git
cd andamio-t3-app-template
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

The default `.env` is configured for local development with preprod network.

### 3. Start the Database API (if using monorepo)

```bash
cd ../andamio-db-api
npm run dev
# API runs at http://localhost:4000
```

### 4. Start the Template

```bash
cd ../andamio-t3-app-template
npm run dev
# App runs at http://localhost:3000
```

### 5. Connect Your Wallet

1. Open http://localhost:3000
2. Click "Connect Wallet" in the sidebar
3. Select your wallet (Eternl, Nami, etc.)
4. Authorize the connection
5. Sign the authentication message

You're now authenticated!

---

## Understanding the Architecture

### Data Flow

```
Browser (This App)
     │
     ├─── Andamio DB API (localhost:4000)
     │    └── Off-chain data (courses, users, progress)
     │
     ├─── Andamioscan API (via proxy)
     │    └── On-chain data + transaction building
     │
     └─── Koios API (via proxy)
          └── Transaction confirmations
```

### Key Directories

```
src/
├── app/              # Next.js pages (App Router)
│   └── (app)/        # Pages with sidebar layout
├── components/
│   ├── andamio/      # Enhanced shadcn components
│   ├── ui/           # Base shadcn components
│   └── editor/       # Tiptap rich text editor
├── hooks/            # Custom React hooks
└── lib/              # Utilities and helpers
```

### Authentication Flow

1. **Connect Wallet** - User connects Cardano wallet via Mesh SDK
2. **Get Nonce** - App requests nonce from Database API
3. **Sign Message** - User signs nonce with wallet
4. **Validate** - API validates signature, returns JWT
5. **Store JWT** - Token stored in localStorage
6. **Authenticated Requests** - JWT included in API calls

---

## Common Tasks

### Creating a Protected Page

```typescript
// src/app/(app)/my-page/page.tsx
"use client";

import { RequireAuth } from "~/components/auth/require-auth";

export default function MyPage() {
  return (
    <RequireAuth title="My Page" description="Connect to access">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Page</h1>
        {/* Your content */}
      </div>
    </RequireAuth>
  );
}
```

Add to sidebar in `src/components/layout/app-sidebar.tsx`.

### Making Authenticated API Calls

```typescript
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
import { type YourType } from "@andamio/db-api-types";

export function MyComponent() {
  const { authenticatedFetch, isAuthenticated } = useAndamioAuth();
  const [data, setData] = useState<YourType | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchData() {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/your-endpoint`
      );
      const result = await response.json() as YourType;
      setData(result);
    }

    void fetchData();
  }, [isAuthenticated, authenticatedFetch]);

  // ...
}
```

### Using the Rich Text Editor

```typescript
import { ContentEditor, ContentViewer } from "~/components/editor";
import type { JSONContent } from "@tiptap/core";

// Editing
const [content, setContent] = useState<JSONContent | null>(null);
<ContentEditor content={content} onContentChange={setContent} showWordCount />

// Viewing
<ContentViewer content={content} />
```

### Working with Semantic Colors

```typescript
// Always use semantic colors
<span className="text-success">Completed</span>
<span className="text-warning">Pending</span>
<span className="text-destructive">Error</span>
<span className="text-info">Info</span>
<span className="text-muted-foreground">Helper text</span>

// Never use hardcoded colors
// Bad: <span className="text-green-500">
```

---

## Development Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm run start` | Run production build locally |
| `npm run check` | Run lint + type check (use before committing) |
| `npm run lint` | Run ESLint only |
| `npm run typecheck` | Run TypeScript check only |
| `npm run format:write` | Auto-format code with Prettier |
| `npm run format:check` | Check formatting without changing files |

---

## Testing with Preprod

### Get Test ADA

1. Visit [Cardano Testnet Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet/)
2. Enter your preprod wallet address
3. Request test ADA

### Mint an Access Token

1. Connect wallet with test ADA
2. Navigate to Dashboard
3. Click "Mint Access Token"
4. Enter desired alias
5. Sign transaction
6. Wait for confirmation

### Test Course Enrollment

1. Browse to Courses page
2. Select a course
3. Click "Enroll"
4. Sign transaction
5. View your enrollment progress

---

## Troubleshooting

### Wallet Connection Issues

- **"No wallet detected"**: Install a CIP-30 compatible wallet extension
- **"Connection rejected"**: Try refreshing the page and reconnecting
- **"Wrong network"**: Ensure wallet is set to preprod network

### API Errors

- **401 Unauthorized**: JWT expired, try logging out and reconnecting
- **CORS errors**: Ensure API URL matches your environment
- **Network errors**: Check that Database API is running

### Build Errors

- **Type errors**: Run `npm run typecheck` to see details
- **Module not found**: Try `rm -rf node_modules && npm install`

---

## Next Steps

- Read the [Architecture Documentation](../architecture/DATA-SOURCES.md)
- Explore [API Endpoints](../api/API-ENDPOINT-REFERENCE.md)
- Learn about [Semantic Colors](../styling/SEMANTIC-COLORS.md)
- Check the [Editor Documentation](../../src/components/editor/README.md)

---

*Last Updated: December 11, 2025*
