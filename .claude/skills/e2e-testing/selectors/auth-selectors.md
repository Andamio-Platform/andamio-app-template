# Auth Selectors Registry

Component selectors for authentication-related UI elements.

## Source Files

| Component | File Path |
|-----------|-----------|
| Auth Button | `src/components/auth/andamio-auth-button.tsx` |
| Auth Status Bar | `src/components/layout/auth-status-bar.tsx` |
| Auth Context | `src/contexts/andamio-auth-context.tsx` |
| Login Card | `src/components/landing/login-card.tsx` |

## Landing Page

### Login Card

| Element | Selector | Notes |
|---------|----------|-------|
| Card title | `text="Connect your Cardano wallet"` | h2 heading |
| Card container | `[class*="card"]` | AndamioCard component |

### Wallet Selector

| Element | Selector | Notes |
|---------|----------|-------|
| Connect button | `button:has-text("Connect")` | May vary by Mesh SDK version |
| Wallet dropdown | `[role="menu"]` | Wallet options |
| Eternl option | `[role="menuitem"]:has-text("Eternl")` | Specific wallet |
| Nami option | `[role="menuitem"]:has-text("Nami")` | Specific wallet |

## Status Bar

### Layout

```typescript
// Status bar container
'.h-10.border-b.border-primary-foreground/10.bg-primary'
```

### Wallet Status

| Element | Selector | Notes |
|---------|----------|-------|
| Container | `.hidden.xs\\:flex` | Contains wallet icon + name |
| Wallet icon | `WalletIcon` | Lucide icon |
| Wallet name | `text=/Eternl|Lode|Vespr|Nami/` | Connected wallet |
| Not connected | `text="Not connected"` | When disconnected |

### Auth Badge

| State | Selector | Icon |
|-------|----------|------|
| Authenticated | `text="Auth"` | VerifiedIcon (green) |
| Unauthenticated | `text="Unauth"` | ShieldIcon (gray) |
| Error | `text="Error"` | SecurityAlertIcon (red) |

### JWT Timer

| Element | Selector | Notes |
|---------|----------|-------|
| Timer display | `[class*="font-mono"]` | Shows "45m", "1h 30m" |
| Expired | `text="Exp"` | When JWT expired |

### Access Token Alias

| Element | Selector | Notes |
|---------|----------|-------|
| Badge | `[class*="bg-primary-foreground/15"]` | Token alias text |
| Text | Truncated to 56 chars | Shows alias from JWT |

### Controls

| Element | Selector | Notes |
|---------|----------|-------|
| Theme toggle | `button[aria-label="Toggle theme"]` | Light/dark mode |
| Logout button | `button:has-text("Logout")` | Hidden on mobile |

## TypeScript Selectors

```typescript
// In e2e/helpers/selectors.ts

export const auth = {
  loginCard: {
    container: 'text="Connect your Cardano wallet"',
    title: 'h2:has-text("Connect your Cardano wallet")',
  },

  walletSelector: {
    button: 'button:has-text("Connect Wallet")',
    dropdown: '[role="menu"]',
    walletOption: (name: string) => `[role="menuitem"]:has-text("${name}")`,
  },

  statusBar: {
    container: '.h-10.border-b',
    walletStatus: 'text=/Eternl|Lode|Vespr|Nami|Not connected/',
    authBadge: {
      authenticated: 'text="Auth"',
      unauthenticated: 'text="Unauth"',
      error: 'text="Error"',
    },
    jwtTimer: '[class*="font-mono"]',
    accessTokenAlias: '[class*="bg-primary-foreground/15"]',
    logoutButton: 'button:has-text("Logout")',
    themeToggle: 'button[aria-label="Toggle theme"]',
  },
};
```

## Recommended data-testid Additions

To improve test reliability, add these attributes:

```tsx
// auth-status-bar.tsx
<div data-testid="auth-status-bar" className="h-10 ...">
  <div data-testid="wallet-status">...</div>
  <div data-testid="auth-badge">...</div>
  <div data-testid="jwt-timer">...</div>
  <div data-testid="token-alias">...</div>
  <button data-testid="theme-toggle">...</button>
  <button data-testid="logout-button">...</button>
</div>

// login-card.tsx
<AndamioCard data-testid="login-card">
  ...
</AndamioCard>
```

## State Classes

### Auth States

| State | Indicator |
|-------|-----------|
| Connected, Auth | Green badge, wallet name shown |
| Connected, Unauth | Gray badge, wallet name shown |
| Connected, Error | Red badge, error message |
| Disconnected | "Not connected", no auth badge |

### JWT States

| State | Display |
|-------|---------|
| Valid > 1hr | "1h 30m" |
| Valid < 1hr | "45m" |
| Valid < 5min | Warning style |
| Expired | "Exp" |
| No JWT | Not displayed |
