# UNS Simulator — UI Redesign Plan

## Goal

Transform the app from a developer-oriented dashboard layout into a polished, modern SaaS-style application with a unified navigation shell, consistent design language, and streamlined user flows. The core tools (Simulator, Schema Builder, MQTT Explorer) are already strong — the focus is on the **shell, navigation, configuration pages, and visual consistency**.

---

## Current State Analysis

### What works well ✅
- **Simulator page** (`/simulator/:id`) — Split-panel layout, toolbar with inline profile creation, status panel, node settings — all solid
- **Schema Builder** (`/schema-builder/:id`) — Compact toolbar + full-height editor — clean and functional
- **MQTT Explorer** (`/explorer`) — Broker selector, topic tree, message viewer — works great
- **Dark mode** — Already implemented throughout

### What needs work ❌
- **Two separate layout systems** — `DashboardLayout` (sidebar nav) vs `PrivateLayout` (top navbar) creates a jarring context switch; the user navigates between two visually different apps
- **Dashboard is a dumping ground** — Shows stat cards, brokers, schemas, simulators all on one scrolling page with duplicated CRUD logic that already exists on dedicated pages
- **Brokers page** (`/dashboard/brokers`) — Full-page form at top + list at bottom; looks like a developer admin panel
- **Schema page** (`/dashboard/schemas`) — Basic HTML table with colored stat boxes; no actions beyond viewing
- **Simulators page** (`/dashboard/simulators`) — Bare HTML table, redundant with the simulator tool
- **Navigation fragmented** — Side-nav in dashboard vs top-nav in private tools; no persistent app shell
- **Landing page** — Basic carousel + 3 info cards; the carousel images will be stale after redesign
- **Login/Register** — Functional but plain; no branding personality
- **No user menu** — No profile dropdown, no settings, just a bare logout button in the navbar
- **Inconsistent card styling** — BrokerCard, SchemaCard, SimulatorCard all have different border-radius, padding, shadow, and layout patterns

---

## Architecture: Unified App Shell

### Remove the two-layout split

Merge `DashboardLayout` and `PrivateLayout` into a single **`AppShell`** layout used for all authenticated routes. Unauthenticated routes (login, register, landing) keep a minimal `PublicLayout`.

```
AppShell
├── Sidebar (collapsible, icon-only when collapsed)
│   ├── Logo / brand
│   ├── ── Navigation ──
│   │   ├── Home (overview/dashboard)
│   │   ├── Simulator
│   │   ├── Schema Builder
│   │   ├── MQTT Explorer
│   │   └── ── Config ──
│   │       ├── Brokers
│   │       └── Settings (future)
│   └── ── Bottom ──
│       ├── Dark mode toggle
│       └── User avatar/menu
├── Top bar (breadcrumb + search + notifications placeholder)
└── <Outlet /> (page content)
```

### Route restructure

```
/                       → Landing page (PublicLayout)
/login                  → Login (PublicLayout)
/register               → Register (PublicLayout)

/app                    → Dashboard/Home overview (AppShell)
/app/simulator          → Simulator (profile selector + workspace)
/app/simulator/:id      → Simulator with profile loaded
/app/schemas            → Schema Builder (schema selector + editor)
/app/schemas/:id        → Schema Builder with schema loaded
/app/explorer           → MQTT Explorer
/app/brokers            → Broker management
/app/brokers/:id        → Edit broker (inline or modal)
```

All `/dashboard/*` and top-level `/simulator`, `/schema-builder`, `/explorer` routes redirect to `/app/*` equivalents.

---

## Task Breakdown

### Task 1: Create the Unified App Shell

**Files to create:**
- `client/src/layout/AppShell.tsx`

**Files to modify:**
- `client/src/App.tsx` — Replace DashboardLayout/PrivateLayout routes with AppShell

**Files to delete (after migration):**
- `client/src/layout/DashboardLayout.tsx`
- `client/src/layout/PrivateLayout.tsx`

**Design spec:**

```
┌──────────────────────────────────────────────────────────┐
│ [≡]  UNS Simulator              Search...    🔔  [👤▾]  │  ← Top bar (h-14)
├────────┬─────────────────────────────────────────────────┤
│        │                                                 │
│  🏠    │                                                 │
│  Home  │                                                 │
│        │              <Outlet />                         │
│  ⚡    │          (page content area)                    │
│  Sim   │                                                 │
│        │                                                 │
│  📐    │                                                 │
│  Schema│                                                 │
│        │                                                 │
│  📡    │                                                 │
│  MQTT  │                                                 │
│        │                                                 │
│  ────  │                                                 │
│  🔌    │                                                 │
│  Broker│                                                 │
│        │                                                 │
│        │                                                 │
│  ────  │                                                 │
│  🌙 👤 │                                                 │
└────────┴─────────────────────────────────────────────────┘
   w-16       flex-1
  (w-56 expanded)
```

Sidebar specs:
- Collapsed: `w-16` — icons only with tooltip on hover
- Expanded: `w-56` — icons + labels
- Toggle via hamburger in top-left or keyboard shortcut
- Active route gets a left accent bar (3px blue) + subtle bg highlight
- Section dividers between "Tools" and "Config" groups
- Bottom section: dark mode toggle + user avatar with dropdown (logout, profile placeholder)
- Glass-morphism feel: `bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl`
- Smooth transitions: `transition-all duration-200`

Top bar specs:
- Left: Hamburger toggle + breadcrumb (auto-generated from route)
- Right: Search placeholder (empty input, future feature) + notification bell placeholder + user avatar dropdown
- Sticky, blur backdrop: `sticky top-0 z-30 backdrop-blur-lg`
- Height: `h-14`
- Border bottom: `border-b border-gray-200/50 dark:border-gray-800/50`

User menu dropdown:
- Avatar circle (initials or default icon)
- Username + email
- Divider
- "Settings" (disabled/placeholder)
- "Logout" button
- Built with `@headlessui/react` Menu component (already installed)

---

### Task 2: Redesign the Home/Dashboard Page

**File:** `client/src/pages/dashboard/DashboardPage.tsx` → move to `client/src/pages/app/HomePage.tsx`

**Current:** Scrolling page with stat cards + 3 sections of cards (simulators, brokers, schemas) with full CRUD

**New design:** Clean overview with quick-action cards and activity summary — NOT a place to manage resources

```
┌─────────────────────────────────────────────────────────┐
│  Good morning 👋                                        │
│  Here's your workspace at a glance                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ Brokers │ │ Schemas │ │ Profiles│ │ Running │      │
│  │    3    │ │    2    │ │    4    │ │    1    │      │
│  │ 2 online│ │ 14 nodes│ │         │ │         │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                         │
│  ┌─── Quick Actions ────────────────────────────────┐   │
│  │  [+ New Simulation]  [+ New Schema]  [+ Broker]  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─── Recent Profiles ──────────────────────────────┐   │
│  │  ▸ Line 24 Simulation    Running   2 min ago     │   │
│  │  ▸ Test Profile          Idle      1 hour ago    │   │
│  │  ▸ Dev Baseline          Stopped   3 hours ago   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─── Broker Health ────────────────────────────────┐   │
│  │  ● Production Broker    Connected                │   │
│  │  ○ Dev Broker           Disconnected             │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Key changes:
- Stat cards redesigned: use subtle gradients or accent left-border, smaller footprint
- Remove inline delete/edit — those belong on the dedicated pages
- Add "Quick Actions" row with primary action buttons that navigate to the right tool
- "Recent Profiles" list — clickable rows that navigate to `/app/simulator/:id`
- "Broker Health" mini-list — status dots + names, click to navigate to `/app/brokers`
- No more schema cards, broker cards, or simulator cards with CRUD on the dashboard
- Greeting based on time of day ("Good morning", "Good afternoon", "Good evening")

---

### Task 3: Redesign the Brokers Management Page

**File:** `client/src/pages/dashboard/BrokersPage.tsx` → `client/src/pages/app/BrokersPage.tsx`

**Current:** Full-page form always visible at top + BrokerList below. Looks like a developer admin page.

**New design:** Card grid with inline/modal creation

```
┌─────────────────────────────────────────────────────────┐
│  MQTT Brokers                              [+ Add]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 🟢 Prod      │  │ 🔴 Dev       │  │ ┌──────────┐ │  │
│  │              │  │              │  │ │  + Add   │ │  │
│  │ mqtt.io:1883 │  │ local:1883   │  │ │  Broker  │ │  │
│  │ client-abc   │  │ client-xyz   │  │ └──────────┘ │  │
│  │              │  │              │  │              │  │
│  │ [Connect]    │  │ [Connect]    │  │              │  │
│  │ [Edit] [Del] │  │ [Edit] [Del] │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Key changes:
- Remove the always-visible form; use a **slide-over panel** or **modal** for add/edit
- Broker cards: clean design with status indicator at top, connection URL, action buttons at bottom
- The last card in the grid is a dashed "Add Broker" placeholder card
- Edit opens the same modal/slide-over pre-filled
- Delete uses the existing `ConfirmDialog`
- Empty state: illustration + "Add your first broker" CTA
- Connection status prominently displayed with color-coded pill badge

**Components to create:**
- `client/src/components/Brokers/BrokerModal.tsx` — Modal form for add/edit (replaces `BrokerForm` being shown full-page)

**Components to modify:**
- `client/src/components/Brokers/BrokerCard.tsx` — Polish styling to match new design system

**Components to potentially remove:**
- `client/src/components/Brokers/BrokerList.tsx` — The list view; replaced by the card grid on the new page
- `client/src/components/Brokers/BrokersCard.tsx` — Appears to be a wrapper, consolidate

---

### Task 4: Remove Redundant Pages

**Delete these pages entirely:**

1. **`/dashboard/schemas` (SchemaPage.tsx)** — Just shows an HTML table of schemas. The Schema Builder IS the schema management page. Add a "manage" mode to Schema Builder if needed.

2. **`/dashboard/simulators` (SimulatorsPage.tsx)** — Just shows an HTML table of simulation profiles. The Simulator page already handles profile selection and management.

**Reasoning:** These pages duplicate data that's already accessible and manageable from the primary tool pages. They add navigation complexity without value.

---

### Task 5: Polish Existing Tool Pages

These pages are already good — apply minor consistency fixes.

#### 5a. Simulator Page (`SimulationPage.tsx`)
- Toolbar: Match the AppShell's design tokens (border-radius, shadow, colors)
- Profile selector dropdown: Add a subtle search/filter if >5 profiles
- Orphaned resource banner: Already done — ensure it matches new design tokens
- "New Profile" inline form: Could become a small modal for cleaner UX (optional)
- No structural changes needed

#### 5b. Schema Builder Page (`SchemaBuilderPage.tsx`)
- Same toolbar polish as Simulator
- No structural changes needed

#### 5c. MQTT Explorer Page (`MqttExplorerPage.tsx`)
- Same toolbar polish
- No structural changes needed

---

### Task 6: Design System Tokens & Shared Components

Create a small set of reusable primitives to enforce consistency.

**File to create:** `client/src/components/ui/` directory

| Component | Purpose |
|-----------|---------|
| `Card.tsx` | Standard card wrapper with consistent border, shadow, radius, padding |
| `Badge.tsx` | Status pills (connected/disconnected/running/paused/etc.) |
| `PageHeader.tsx` | Page title + optional description + action buttons area |
| `EmptyState.tsx` | Icon + message + CTA button for empty lists |
| `SlideOver.tsx` | Right-side slide-over panel for forms (broker add/edit) |
| `Avatar.tsx` | User initials circle for the navbar user menu |
| `Tooltip.tsx` | Tooltip wrapper for collapsed sidebar icon labels |

Design tokens (via Tailwind classes, not CSS vars — keep it simple):

```
Surfaces:
  card:       bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm
  card-hover: hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all
  panel:      bg-gray-50 dark:bg-gray-950
  glass:      bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl

Text:
  heading:    text-gray-900 dark:text-white font-semibold
  body:       text-gray-600 dark:text-gray-400
  muted:      text-gray-400 dark:text-gray-500
  link:       text-blue-600 dark:text-blue-400 hover:underline

Status colors:
  success:    bg-emerald-500 (connected, running)
  warning:    bg-amber-500 (connecting, paused)
  error:      bg-red-500 (error, disconnected)
  neutral:    bg-gray-400 (idle, stopped)

Spacing:
  page-padding:  px-6 py-6
  card-padding:  px-5 py-4
  section-gap:   space-y-6
  card-grid-gap: gap-4

Border radius:
  cards:      rounded-xl (12px)
  buttons:    rounded-lg (8px)
  badges:     rounded-full
  inputs:     rounded-lg (8px)
```

---

### Task 7: Polish Public Pages

#### 7a. Landing Page
- Keep it simple but modern
- Remove the image carousel (screenshots will be outdated)
- Replace with a clean hero: tagline + "Get Started" / "Login" CTA + abstract illustration or gradient mesh background
- Feature highlights as icon + text rows (not cards)
- Add social proof area placeholder (future: "Used by X teams")

#### 7b. Login Page
- Center-aligned card with logo at top
- Subtle gradient or pattern background
- "Don't have an account? Register" link below
- Match the new design token styles for inputs and buttons

#### 7c. Register Page
- Same card style as login
- "Already have an account? Login" link below

---

### Task 8: Animations & Micro-interactions

Light touches to make the app feel alive:

- **Page transitions:** Use `framer-motion` (new dependency) for route transitions — subtle fade + slide-up on page mount
- **Sidebar:** Smooth width transition already present — add icon rotate on expand/collapse toggle
- **Cards:** `hover:shadow-md` + slight `hover:-translate-y-0.5` lift
- **Buttons:** `active:scale-[0.98]` press effect
- **Status badges:** Pulse animation on "running" / "connecting" states (already partially done)
- **Toast notifications:** Already using `react-hot-toast` — ensure position is `bottom-right` consistently
- **Loading states:** Replace "Loading..." text with subtle skeleton loaders or spinner

**New dependency:** `framer-motion` (optional — can skip if we want to keep deps minimal and use CSS transitions only)

---

## Implementation Order

| Phase | Tasks | Estimated Scope |
|-------|-------|-----------------|
| **Phase 1** | Task 1 (AppShell) + Task 6 (Design System) | Foundation — everything depends on this |
| **Phase 2** | Task 4 (Remove redundant pages) + Route restructure | Clean up before rebuilding |
| **Phase 3** | Task 2 (Home page redesign) | New dashboard |
| **Phase 4** | Task 3 (Brokers page redesign) | Last config page |
| **Phase 5** | Task 5 (Tool page polish) | Consistency pass |
| **Phase 6** | Task 7 (Public pages) | Visual polish |
| **Phase 7** | Task 8 (Animations) | Final polish |

---

## Files Summary

### New files to create
```
client/src/layout/AppShell.tsx
client/src/components/ui/Card.tsx
client/src/components/ui/Badge.tsx
client/src/components/ui/PageHeader.tsx
client/src/components/ui/EmptyState.tsx
client/src/components/ui/SlideOver.tsx
client/src/components/ui/Avatar.tsx
client/src/components/ui/Tooltip.tsx
client/src/components/Brokers/BrokerModal.tsx
client/src/pages/app/HomePage.tsx
client/src/pages/app/BrokersPage.tsx
```

### Files to heavily modify
```
client/src/App.tsx                              — Route restructure
client/src/components/global/Navbar.tsx          — Simplify (public-only) or merge into AppShell
client/src/components/Brokers/BrokerCard.tsx     — Restyle
client/src/components/dashboard/StatCard.tsx     — Restyle
client/src/components/simulator/SimulatorCard.tsx — Restyle (for home page recent list)
client/src/pages/public/LandingPage.tsx          — Full redesign
client/src/pages/public/LoginPage.tsx            — Visual polish
client/src/pages/auth/RegisterPage.tsx           — Visual polish
client/src/pages/private/SimulationPage.tsx      — Minor token alignment
client/src/pages/private/SchemaBuilderPage.tsx   — Minor token alignment
client/src/pages/private/MqttExplorerPage.tsx    — Minor token alignment
```

### Files to delete
```
client/src/layout/DashboardLayout.tsx
client/src/layout/PrivateLayout.tsx
client/src/pages/dashboard/DashboardPage.tsx      — Replaced by HomePage
client/src/pages/dashboard/BrokersPage.tsx         — Replaced by new BrokersPage
client/src/pages/dashboard/SchemaPage.tsx          — Redundant with Schema Builder
client/src/pages/dashboard/SimulatorsPage.tsx      — Redundant with Simulator
client/src/components/Brokers/BrokerList.tsx        — Replaced by card grid
client/src/components/Brokers/BrokersCard.tsx       — Consolidate into BrokerCard
```

---

## Non-Goals (Out of Scope)

- No backend changes — this is purely a frontend UI overhaul
- No new features — just reorganizing and polishing what exists
- No mobile-first responsive redesign — desktop-first, mobile should work but isn't the focus
- No i18n / accessibility audit — can be a follow-up
- No state management refactor — Redux store structure stays the same
