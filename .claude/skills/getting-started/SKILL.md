---
name: getting-started
description: Welcome new developers and deliver a quick win - guide them to customize the app's theme colors and see instant results via hot reload.
---

# Getting Started

Welcome the developer and give them a visible, tangible win in under 2 minutes: changing the app's brand colors.

## Instructions

### 1. Welcome and Orient

Greet the developer briefly. Mention what this template gives them:

> Next.js 15, tRPC, Tailwind CSS v4, Cardano via Mesh SDK, and shadcn/ui components — all wired together and ready to build on.

Then tell them:

> Let's make it yours. We'll change the brand colors — you'll see the whole app transform in real time.

### 2. Check the Dev Server

Check if the dev server is running on port 3000:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

If not running, start it:

```bash
npm run dev
```

Tell the developer to open http://localhost:3000 in their browser so they can watch the changes happen live.

### 3. Show the Theme File

Read `src/styles/globals.css` and point the developer to the `:root` block (light theme) and `.dark` block (dark theme). Explain:

> Every color in the app flows through these CSS custom properties. Change one variable and buttons, links, focus rings, sidebar highlights, and charts all update instantly.

Show them specifically the `--primary` and `--secondary` lines in both `:root` and `.dark`:

```css
/* In :root (light mode) */
--primary: oklch(0.669 0.199 38.581);    /* Orange/Coral */
--secondary: oklch(0.387 0.134 250.505); /* Deep Blue */

/* In .dark (dark mode) */
--primary: oklch(0.719 0.174 38.581);
--secondary: oklch(0.605 0.155 250.505);
```

### 4. Ask for Their Brand Color

Ask the developer what they'd like. Accept any of:

- A hex code (`#6366f1`)
- A color name ("ocean blue", "emerald green")
- A preset name from the table below
- "surprise me"

#### Preset Palettes

| Preset | Primary | Secondary | Vibe |
|--------|---------|-----------|------|
| **Pioneers Demo** | `oklch(0.58 0.145 192)` | `oklch(0.62 0.195 35)` | Comic book: teal + orange-red |

**Pioneers Demo dark mode variants:**
- Primary: `oklch(0.68 0.135 192)`
- Secondary: `oklch(0.72 0.175 35)`

If the developer gives a hex code, convert it to OKLCH. If they give a color name, pick appropriate OKLCH values. If "surprise me", use Pioneers Demo.

#### Dark Mode Variants

When setting dark mode values, adjust the primary for better contrast on dark backgrounds:
- Increase lightness by ~0.05-0.10 (e.g. 0.585 -> 0.650)
- Decrease chroma slightly (e.g. 0.203 -> 0.180)
- Keep the hue the same

### 5. Make the Change

Edit `src/styles/globals.css` — update `--primary` and `--secondary` in both `:root` and `.dark`. Also update `--ring`, `--sidebar-primary`, and `--sidebar-ring` to match the new primary (they should stay in sync).

Variables to update for primary color change:

**In `:root`:**
- `--primary`
- `--ring`
- `--chart-1` (optional, use a lighter variant)
- `--chart-4` (optional, match primary)
- `--sidebar-primary`
- `--sidebar-ring`

**In `.dark`:**
- `--primary`
- `--ring`
- `--chart-1` (optional)
- `--chart-4` (optional)
- `--sidebar-primary`
- `--sidebar-ring`

### 6. Celebrate the Result

After the edit, tell the developer:

> Done! Check your browser — hot reload should have already applied the changes. Your buttons, links, focus rings, sidebar, and active tabs all use your new colors now.

Show a summary of what changed:

```
Primary:   Orange/Coral -> [new color name]
Secondary: Deep Blue -> [new color name]

Affected: buttons, links, focus rings, sidebar highlights,
          active tabs, chart colors, ring outlines
```

### 7. Offer Next Steps

> Want to keep customizing? Here's what you can explore:
>
> | What | How |
> |------|-----|
> | Full color system | Change `--success`, `--warning`, `--info`, `--destructive` in globals.css |
> | Component patterns | Run `/design-system` for the full design reference |
> | Authentication | Run `/auth` to learn API keys and JWT login |
> | Cardano transactions | Run `/transactions` for the TX state machine |
> | Fix a bug | Run `/fix` with an issue number or description |
> | Ship your changes | Run `/ship` to commit, PR, and merge |
>
> Each of these is a **skill** — a set of instructions any coding agent can follow.
> Learn more at [agentskills.io](https://agentskills.io).

## Output Style

Encouraging and concise. Show, don't lecture. The dev should feel like they accomplished something real, not like they read a tutorial.

Keep the pre-change explanation short — get to the edit fast so they see the result.

## Example

**User**: `/getting-started`

**Agent**:

Welcome to the Andamio App Template! You've got a full Cardano dApp foundation — Next.js 15, tRPC, Mesh SDK, shadcn/ui — ready to build on.

Let's make it yours. We'll change the brand colors and you'll see the whole app update in real time.

Right now your primary color is **Orange/Coral** and secondary is **Deep Blue** (Andamio defaults). What would you like instead?

Pick a preset or tell me your brand color:

| Preset | Vibe |
|--------|------|
| Pioneers Demo | Comic book: teal + orange-red |

Or give me a hex code, color name, or just say "surprise me".

---

**Last Updated**: March 2026
