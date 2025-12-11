# Pending Transaction Popover

Visual component displaying all pending transactions being monitored in the bottom right corner.

## Overview

The `PendingTxPopover` component provides a floating action button (FAB) in the bottom right corner that shows:
- Number of pending transactions
- Animated pulse effect
- Detailed list of transactions when clicked
- Manual "Check Now" button
- Links to blockchain explorer
- Option to remove transactions from watch list

## Visual Design

### Closed State (FAB)

```
                                    ┌──────────┐
                                    │          │
                                    │   🕐  2  │
                                    │   ~~~    │
                                    │          │
                                    └──────────┘
                                    [Animated pulse]
```

**Features:**
- Circular button (56x56px)
- Clock icon with animated pulse when checking
- Badge showing count of pending transactions
- Animated pulse ring effect
- Shadow elevation for visibility

### Open State (Popover)

```
┌─────────────────────────────────────────────┐
│ Pending Transactions              [🔄]      │
│ Monitoring 2 transactions                   │
├─────────────────────────────────────────────┤
│                                             │
│  [Module]                          2m ago   │
│  MODULE_1                                   │
│  Course: policy123...                       │
│  ┌────────────────────────────────────┐    │
│  │ abc123...def456                    │ 🔗 │
│  └────────────────────────────────────┘    │
│  ⚫ Awaiting confirmation                   │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  [Assignment]                      5m ago   │
│  ASSIGN_1                                   │
│  Course: policy456...                       │
│  ┌────────────────────────────────────┐    │
│  │ ghi789...jkl012                    │ 🔗 │
│  └────────────────────────────────────┘    │
│  ⚫ Awaiting confirmation                   │
│                                             │
├─────────────────────────────────────────────┤
│ Transactions are checked every 30 seconds  │
└─────────────────────────────────────────────┘
```

**Features:**
- Scrollable list (max height: 384px)
- Entity type badges
- Time since submission
- Transaction hash with truncation
- Copy and explorer link buttons (on hover)
- Remove button (on hover)
- Status indicator with animation
- Footer with polling info

## Usage

### Automatic Integration

The popover is automatically included when you add `PendingTxWatcher` to your layout:

```tsx
// app/layout.tsx
import { PendingTxWatcher } from "~/components/pending-tx-watcher";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PendingTxWatcher>
          {children}
        </PendingTxWatcher>
      </body>
    </html>
  );
}
```

The popover will automatically:
- Appear when there are pending transactions
- Hide when there are no pending transactions
- Update in real-time as transactions are added/confirmed
- Persist across page navigation

### Manual Usage

If you want to use the popover separately:

```tsx
import { PendingTxPopover } from "~/components/pending-tx-popover";

function MyComponent() {
  return (
    <>
      {/* Your content */}
      <PendingTxPopover className="custom-positioning" />
    </>
  );
}
```

## Features

### 1. Transaction List

Each transaction displays:

**Entity Type Badge:**
- Module
- Assignment
- Task
- Assignment Commitment
- Task Commitment

**Time Display:**
- `30s ago` - Less than 1 minute
- `5m ago` - Minutes
- `2h ago` - Hours
- `1d ago` - Days

**Entity Info:**
- Entity ID (e.g., MODULE_1, ASSIGN_1)
- Course NFT Policy ID (truncated)

**Transaction Hash:**
- Truncated for readability: `abc123...def456`
- Full hash available on hover
- Monospace font for clarity

**Action Buttons (on hover):**
- 🔗 **Explorer Link** - Opens transaction in Cardanoscan
- ✖ **Remove** - Remove from watch list

**Status Indicator:**
- 🟡 Yellow pulse - Awaiting confirmation
- (Future: Green checkmark when confirmed but processing)

### 2. Manual Check Button

Top-right refresh button:
- Click to immediately check all pending transactions
- Animated spinner while checking
- Disabled during automatic checks

### 3. Auto-Hide

Popover automatically disappears when:
- All transactions are confirmed
- All transactions are removed
- No transactions in watch list

Returns when new transactions are added.

### 4. Persistence

Transaction list persists:
- ✅ Across page refreshes
- ✅ Across page navigation
- ✅ Across browser restarts (via localStorage)
- ❌ Not across different browsers/devices

### 5. Visual States

**Normal:**
```tsx
<Clock className="h-6 w-6" />
```

**Checking:**
```tsx
<Clock className="h-6 w-6 animate-pulse" />
```

**Pulse Ring (always visible):**
```tsx
<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-20" />
```

## User Interactions

### Opening Popover

**Click** the FAB button to open the popover.

**Popover displays:**
- Header with transaction count
- Refresh button
- Scrollable list of transactions
- Footer with polling info

### Checking Transactions Manually

**Click** the refresh button (🔄) in the header.

**Effect:**
- Button spins
- Immediately checks all pending transactions
- Updates statuses if any confirmed

### Viewing on Blockchain

**Hover** over a transaction to reveal action buttons.

**Click** the external link button (🔗).

**Opens:** Cardanoscan transaction page in new tab

**URL Format:**
```
https://cardanoscan.io/transaction/{txHash}
```

### Removing Transaction

**Hover** over a transaction to reveal action buttons.

**Click** the X button.

**Effect:**
- Transaction removed from watch list
- No longer polled for confirmation
- LocalStorage updated
- If last transaction, popover auto-hides

**Use Cases:**
- Transaction already confirmed elsewhere
- Wrong transaction hash
- Want to stop monitoring

### Closing Popover

**Click** outside the popover to close.

**Popover closes:**
- Does not stop monitoring
- Polling continues in background
- Can reopen at any time

## Styling

### Positioning

Default position:
```tsx
className="fixed bottom-6 right-6 z-50"
```

Custom positioning:
```tsx
<PendingTxPopover className="bottom-20 right-4" />
```

### Z-Index Layers

```
z-50  - Popover FAB (always on top)
z-50  - Popover content (via Radix Portal)
```

Ensures popover is visible above:
- Navigation bars
- Content
- Other floating elements

### Responsive Design

**Desktop (>768px):**
- Full width popover (384px)
- All features visible

**Mobile (<768px):**
- Same width popover (may extend to edges)
- Scrollable if too tall for viewport
- Touch-friendly button sizes

### Dark Mode

Automatically adapts to theme:
```tsx
className="bg-popover text-popover-foreground"
```

Uses CSS variables from theme:
- `--popover` background
- `--popover-foreground` text
- `--muted` for alternating rows
- `--primary` for pulse effect

## Accessibility

### Keyboard Navigation

**Tab:** Focus FAB button
**Enter/Space:** Open popover
**Tab:** Navigate through transactions
**Enter/Space:** Activate buttons (refresh, explorer, remove)
**Esc:** Close popover

### Screen Readers

**Button Label:**
```
"Pending Transactions (2)"
```

**Transaction Info:**
```
"Module MODULE_1, submitted 2 minutes ago, transaction abc123...def456"
```

**Action Buttons:**
```
"View on blockchain explorer"
"Remove from watch list"
```

### Focus Management

When popover opens:
- Focus moves to refresh button
- Tab cycles through transactions
- Escape returns focus to FAB

## Configuration

### Polling Interval

Set via `PendingTxWatcher`:
```tsx
<PendingTxWatcher pollInterval={30000} />
```

Displayed in footer:
```
"Transactions are checked automatically every 30 seconds"
```

### Blockchain Explorer

Currently hardcoded to Cardanoscan:
```typescript
function getExplorerUrl(txHash: string): string {
  return `https://cardanoscan.io/transaction/${txHash}`;
}
```

To customize (e.g., for preprod/preview):
```typescript
const NETWORK = "preprod"; // or "preview", "mainnet"

function getExplorerUrl(txHash: string): string {
  const base = NETWORK === "mainnet"
    ? "https://cardanoscan.io"
    : `https://${NETWORK}.cardanoscan.io`;
  return `${base}/transaction/${txHash}`;
}
```

### Transaction Hash Truncation

Default truncation: 20 characters
```typescript
truncateTxHash(tx.txHash, 20) // "abc123...def456"
```

Adjust length:
```typescript
truncateTxHash(tx.txHash, 30) // Longer display
truncateTxHash(tx.txHash, 12) // Shorter display
```

## State Management

### Context Integration

Popover uses `usePendingTxContext()`:
```typescript
const {
  pendingTransactions,  // Array of pending txs
  removePendingTx,      // Remove function
  isChecking,           // Boolean state
  checkNow,             // Manual check function
} = usePendingTxContext();
```

### Local State

```typescript
const [isOpen, setIsOpen] = useState(false);
```

Tracks popover open/closed state independently of transactions.

### Auto-Show

Popover renders null when empty:
```typescript
if (pendingTransactions.length === 0) {
  return null;
}
```

Automatically appears when first transaction added.

## Testing

### Manual Testing

1. **Submit a transaction** (e.g., Mint Module Tokens)
2. **Check popover appears** in bottom right
3. **Badge shows "1"**
4. **Click to open**
5. **Verify transaction details** are correct
6. **Click refresh button**
7. **Wait for confirmation** (~1-2 minutes)
8. **Verify transaction disappears** from list
9. **Verify popover auto-hides** when empty

### Edge Cases

**Multiple Transactions:**
- Add 3+ transactions
- Verify scrolling works
- Verify each has correct details

**Long Transaction Hashes:**
- Verify truncation works
- Verify full hash in title attribute

**Hover States:**
- Hover over transaction
- Verify buttons appear
- Verify smooth transition

**Remove Transaction:**
- Click remove button
- Verify immediate removal
- Verify localStorage updated

**Page Refresh:**
- Submit transaction
- Refresh page
- Verify popover reappears
- Verify transaction still listed

## Performance

### Render Optimization

```typescript
// Only renders when transactions exist
if (pendingTransactions.length === 0) return null;
```

### Event Handling

```typescript
// Memoized handlers prevent unnecessary re-renders
const handleCheckNow = useCallback(async () => {
  await checkNow();
}, [checkNow]);
```

### Animation Performance

Uses CSS transforms for animations:
- `animate-pulse` - GPU accelerated
- `animate-ping` - GPU accelerated
- `animate-spin` - GPU accelerated

All animations run on compositor thread.

## Future Enhancements

### 1. Confirmation Progress

Show progress bar:
```
[████████████░░░░░░░░] 2/15 confirmations
```

### 2. Estimated Time

Show estimated time to confirmation:
```
⏱ Est. 45 seconds remaining
```

### 3. Transaction Details

Expandable details:
- Amount transferred
- Assets minted
- Addresses involved

### 4. Notifications

System notifications:
```javascript
if (Notification.permission === "granted") {
  new Notification("Transaction Confirmed!", {
    body: "Your module transaction has been confirmed"
  });
}
```

### 5. Sound Effects

Optional sound on confirmation:
```typescript
const audio = new Audio("/sounds/success.mp3");
audio.play();
```

### 6. Grouping

Group by entity type:
```
Modules (2)
  - MODULE_1
  - MODULE_2

Assignments (1)
  - ASSIGN_1
```

## Troubleshooting

### Popover Not Appearing

**Check:**
1. Is `PendingTxWatcher` in layout?
2. Are transactions being added to watch list?
3. Check localStorage: `andamio-pending-transactions`
4. Check console for errors

### Transactions Not Updating

**Check:**
1. Is polling enabled?
2. Check console for API errors
3. Verify Koios API is accessible
4. Check network tab for requests

### Visual Issues

**Check:**
1. Z-index conflicts with other components
2. CSS conflicts with custom styles
3. Theme colors defined correctly
4. Responsive breakpoints

## Summary

The Pending Transaction Popover provides an elegant, user-friendly interface for monitoring blockchain transactions:

- ✅ Always visible when needed
- ✅ Auto-hides when empty
- ✅ Manual refresh capability
- ✅ Direct links to explorer
- ✅ Easy removal of transactions
- ✅ Responsive and accessible
- ✅ Dark mode compatible
- ✅ Smooth animations

Integrated automatically with the `PendingTxWatcher` component for zero-configuration usage.
