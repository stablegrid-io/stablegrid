# CLAUDE.md — stablegrid.io

## Stack

- **Framework:** Next.js 14.2.3 (App Router)
- **Language:** TypeScript 5.4.5
- **Auth & DB:** Supabase (SSR + service role)
- **State:** Zustand 4.5.2 (persisted stores)
- **Styling:** Tailwind CSS 3.4.1
- **Animations:** Framer Motion 11.2.0
- **Code Editor:** Monaco Editor 0.55.1
- **Python Runtime:** Pyodide 0.25.1 (WASM)
- **Payments:** Stripe
- **CAPTCHA:** Cloudflare Turnstile
- **Testing:** Vitest 1.6.1 + Playwright 1.58.2

## Commands

```bash
npm run dev              # Dev server on :3000
npm run build            # Validate content + build
npm test                 # Vitest
npm run test:e2e         # Playwright E2E
npm run validate:content # Pre-build theory content check
```

## Project Structure

```
app/                  # Routes (App Router)
├── (auth)/           # Login, signup, password reset (separate layout)
├── home/             # Dashboard
├── learn/            # Theory + Practice (unified section)
│   ├── page.tsx      # Topic selector
│   └── [topic]/theory/[category]/page.tsx  # Track map OR reading OR practice
├── operations/       # Challenges & Projects (coming soon)
│   └── practice/     # Legacy practice routes (redirect to /learn)
├── admin/            # Admin console (requires admin_membership)
├── workspace/        # Code workspace
├── api/              # API routes
│   ├── auth/         # signup, sync-progress
│   ├── learn/        # module-progress
│   ├── operations/   # datasets
│   ├── admin/        # CRUD for all admin sections
│   ├── profile/      # admin-status, avatar
│   └── gdpr/         # delete-account, export, delete-reason
├── settings/
├── profile/
└── onboarding/

components/           # UI components by feature
├── navigation/       # Navigation, Sidebar, TopBar, BottomNav
├── learn/theory/     # TheoryLayout, TheoryTrackPath, ReadingModeDropdown
├── operations/       # SplitPanelCodeTask
├── session/          # UnifiedMiniPlayer, PracticeSessionMiniPlayer
├── auth/             # AuthProvider, LoginForm, SignupForm, Captcha
├── admin/            # Admin console panels
├── home/             # Dashboard + Landing page
└── brand/            # Brand components

data/                 # Static content
├── learn/            # Topic metadata (.ts) + theory docs (JSON)
│   └── theory/published/  # 20+ topic JSON files
└── operations/practice-sets/
    ├── pyspark/      # PS1-10 (junior), PM1-10 (mid), PX1-10 (senior)
    └── fabric/       # F1 (junior)

lib/                  # Business logic
├── stores/           # Zustand stores
├── hooks/            # Custom hooks
├── supabase/         # Client configs (browser, server, admin, middleware)
├── learn/            # Theory session, progress, content utils
├── api/              # Rate limiting, idempotency, CSRF
├── admin/            # Admin services
├── cookies/          # Cookie consent system
└── validators/       # Content + answer validators

types/                # TypeScript definitions (theory.ts, learn.ts, progress.ts)
tests/                # unit/, integration/, e2e/
tools/                # Build scripts (funnel report, content pipeline, asset gen)
```

## Key Routing Patterns

### Learn Section (the main product)

The `/learn/[topic]/theory/[category]` page handles three views based on query params:

| URL | View |
|-----|------|
| `/learn/pyspark/theory/junior` | Track Map (tree of modules + practice sets) |
| `/learn/pyspark/theory/junior?chapter=module-PS1&lesson=module-PS1-lesson-01` | Reading session (TheoryLayout) |
| `/learn/pyspark/theory/junior?practice=module-F1` | Practice session (PracticeSetSession) |

### Practice Set Legacy Routes

Old `/operations/practice/...` listing pages redirect to `/learn`. The detail page at `/operations/practice/[topic]/[level]/[modulePrefix]` still works (renders PracticeSetSession directly).

### Auth & Protected Routes

- Auth pages (`/login`, `/signup`, etc.) redirect authenticated users to `/home`
- Protected routes redirect unauthenticated users to `/login`
- Admin routes require `admin_memberships` table entry

## State Management (Zustand Stores)

| Store | Key | Persists | Purpose |
|-------|-----|----------|---------|
| `useAuthStore` | `stablegrid-auth` | Yes | User session |
| `useProgressStore` | `stablegrid-progress` | Partial | XP, streak, completed questions, topic progress |
| `useReadingModeStore` | `stablegrid-reading-mode` | Mode only | Reading theme (6 modes) + focus mode (not persisted) |
| `useTheorySessionPreferencesStore` | `stablegrid-theory-session-defaults` | Yes | Session method configs (pomodoro, sprint, etc.) |
| `useUserStore` | `stablegrid-storage` | Yes | Balance, reputation |

## Reading Modes

Six themes applied via `data-reading-mode` attribute + CSS custom properties:

- **Dark / Light** — standard modes
- **Book / Kindle** — reading-optimized
- **Night Owl / Pitch Black** — immersive

Focus Mode triggers browser fullscreen. Never persisted — always starts off.

## Session Timer System

Shared by both reading and practice sessions via `useTheorySessionTimer(scope)`:

| Method | Focus | Break | Rounds |
|--------|-------|-------|--------|
| Sprint | 15 min | — | 1 |
| Pomodoro | 25 min | 5 min | 4 |
| Deep Focus | 50 min | 10 min | 2 |
| Free Read/Practice | — | — | — |

- Reading sessions use scope `'global'`
- Practice sessions use scope `'practice-global'`
- Persisted to `sessionStorage` (survives refresh, clears on tab close)

## Practice Sets Data Format

```typescript
interface PracticeSet {
  topic: string;              // 'pyspark' | 'fabric'
  title: string;
  description: string;
  metadata: {
    moduleId: string;         // 'module-PS1', 'module-F1'
    trackLevel: string;       // 'junior' | 'mid' | 'senior'
  };
  datasets?: { id: string; file: string }[];
  tasks: PracticeTask[];
}

interface PracticeTask {
  id: string;
  title: string;
  description: { context: string; task: string };
  evidence: Record<string, any>;
  template?: { fields: TemplateField[] };
  starterScaffold?: { content: string };  // Code tasks
}
```

Field types: `single_select`, `short_text`, `multi_select`, `numeric`

## Theory Content Format

```typescript
interface TheoryDoc {
  topic: string;
  title: string;
  chapters: TheoryChapter[];  // = modules
}

interface TheoryChapter {
  id: string;                 // 'module-PS1'
  number: number;
  title: string;
  sections: TheorySection[];  // = lessons
}

interface TheorySection {
  id: string;
  title: string;
  estimatedMinutes: number;
  blocks: ContentBlock[];     // paragraph, heading, code, diagram, callout, etc.
}
```

## Navigation System

- `Navigation.tsx` — orchestrator, wraps all pages
- `Sidebar.tsx` — fixed left (desktop, z-40), compact on lesson/practice pages
- `TopBar.tsx` — fixed top (z-50)
- `BottomNav.tsx` — mobile only
- Content wrapper uses **margin** (not padding) to avoid pointer-event overlap with sidebar

### Compact Nav Detection

`isCompactDesktopNavPath()` returns true for `/admin/*` and `/learn/[topic]/theory/[level]` paths. Sidebar shrinks from 192px to 64px.

### Practice/Reading Session Detection

`isPracticeSessionPath(pathname, search)` checks both legacy `/operations/practice/...` paths and `?practice=` query param on learn pages.

## API Protection

- Rate limiting per scope/user/IP (`lib/api/protection.ts`)
- Idempotency keys for POST requests
- CSRF token validation
- All admin endpoints check `admin_memberships` table

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
```

## Testing

- **Unit tests:** 15+ in `tests/unit/` (Vitest, jsdom)
- **Integration tests:** `tests/integration/`
- **E2E tests:** `tests/e2e/` (Playwright — login, functions, persistence, theory completion)
- **Coverage thresholds:** 85% statements, 75% branches, 80% functions, 85% lines
- **Content validation:** Runs before every build (`npm run validate:content`)

## Common Gotchas

1. **Inline callbacks in JSX cause infinite re-renders** when passed to components that use them in `useEffect` deps. Always wrap with `useCallback`.
2. **Focus mode** is never persisted. If it were, it would hide the sidebar/topbar on next page load with no way to toggle it back.
3. **Middleware** uses a catch-all matcher. CSP requires `unsafe-eval` for Supabase client auth to work.
4. **Practice session storage** uses `sessionStorage` (not `localStorage`) — clears when tab closes, which is intentional.
5. **The content wrapper** in Navigation uses `lg:ml-16` / `lg:ml-48` (margin, not padding) so the sidebar's click area isn't blocked by an overlapping content box.
