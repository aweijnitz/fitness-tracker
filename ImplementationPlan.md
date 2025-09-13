# Fitness Tracker PWA – Feature & Implementation Spec

Offline-first fitness tracker with a self-hosted backend. Client implemented as a progressive web application (PWA).

Target: Android smartphones • Stack: React, Vite, Tailwind CSS, VitePWA (Workbox), OpenAuth, self‑hosted backend • Mode: Offline‑first

---

## 1) System Overview

A mobile‑first, offline‑first fitness tracker PWA with five primary screens: **Dashboard, Meals, Activity Tracking, Workout, Settings**. Data persists locally, syncs to a self‑hosted backend using conflict‑aware replication. Auth via **OpenAuth**. Service worker handles caching, offline fallbacks, background sync, and push notifications.

### Key Non‑Functional Requirements

* **Offline‑first**: All reads/writes work without network; queued sync when online.
* **Performance**: <2.5s FCP on mid‑range Android; <100KB JS on first load (code‑split route bundles).
* **Security**: TLS, token storage in IndexedDB; no PII in SW logs.
* **Accessibility**: WCAG 2.1 AA, keyboard and screen reader friendly.
* **Observability**: Minimal client telemetry (web‑vitals) with offline queueing.

---

## 2) High‑Level Architecture

* **UI**: React + React Router, Tailwind for styling, Headless UI/shadcn optional.
* **State**: React Query (TanStack Query) for server cache + custom offline queue; lightweight Zustand slice for UI state.
* **Local Storage**: IndexedDB via Dexie (or idb) with versioned schema; write‑behind queue.
* **Sync**: Background Sync (service worker) for queued mutations; pull on focus/interval.
* **Auth**: OpenAuth (self‑hosted). PKCE flow. Refresh with silent token endpoint; tokens kept in memory + IndexedDB fallback encrypted.
* **PWA**: VitePWA plugin; Workbox runtime caching strategies; push notifications (optional in later work package).
* **Backend**: Node (Express/Fastify) + PostgreSQL (Prisma) with REST or tRPC; endpoints versioned `/v1`.

### Data Model (initial)

```mermaid
erDiagram
  User ||--o{ Meal : creates
  User ||--o{ Activity : logs
  User ||--o{ Workout : defines
  User ||--o{ WeightEntry : records
  Meal {
    string id PK
    string userId FK
    enum type  "breakfast|lunch|snack|dinner"
    int calories
    string name
    json items    "{ foodId, grams, calories }[]"
    datetime occurredAt
    datetime updatedAt
    string clientTag  "for conflict resolution"
  }
  Activity {
    string id PK
    string userId FK
    enum kind  "walk|nordicWalking|ride|pushUps|burpees|crunches|plank"
    float distanceKm
    int durationSec
    int steps
    json samples "{t,lat,lng,hr?}[]"
    datetime startedAt
    datetime endedAt
    datetime updatedAt
    string clientTag
  }
  Workout {
    string id PK
    string userId FK
    string name
    json blocks "[{title, sets:[{reps, weightKg?, durationSec?}]}]"
    datetime updatedAt
    string clientTag
  }
  WeightEntry {
    string id PK
    string userId FK
    float kg
    datetime occurredAt
    datetime updatedAt
    string clientTag
  }
```

### Conflict Resolution

* Every write includes `updatedAt` and `clientTag` (UUID v4). Server resolves by **last‑write‑wins** on `updatedAt` with tie‑break on `clientTag`. Server returns canonical record + `syncStamp`.

---

## 3) Navigation & Screens

### Global Navigation

* **Bottom tab bar** for the 5 screens.
* **App shell** cached via SW for instant route transitions.

### Dashboard (initially empty)

* Placeholder: weight trend area (2 months), daily calories card (remaining vs goal), **Add Meal** floating button.
* Later: configurable widgets registry.

### Meals

* Add/manage meals (type, items), calorie totals, simple food library (local JSON now; later online db).

### Activity Tracking

* Start/stop/pause an activity; request Geolocation + Permissions; collect samples (time, distance).

### Workout

* Define workouts (blocks, sets/reps); start workout session => logs as Activity.

### Settings

* Profile (name, height, baseline kcal goal), units, privacy, data export.

---

## 4) Offline & Caching Strategy (Workbox)

* **Precaching**: app shell, route skeletons, icons, manifest.
* **Runtime caching**:

  * `/api/**` GET → **StaleWhileRevalidate** with cache bust on `ETag`.
  * POST/PUT/DELETE queued via **background sync**; replay with exponential backoff.
  * Images/avatars → **CacheFirst** with max‑age + quota.
* **Fallbacks**: Offline fallback route `/offline` and generic fallback page for images.

---

## 5) Security & Auth

* OpenAuth PKCE login screen → redirect flow → receive code → token. Store **access** token in memory; **refresh** token encrypted in IndexedDB via WebCrypto.
* Attach `Authorization: Bearer` to fetch via React Query `fetcher`.
* Logout clears SW caches for user scope.

---

## 6) Testing Strategy

* **Unit**: Vitest + React Testing Library; Dexie tests with fake IndexedDB.
* **Integration**: MSW to mock backend; auth mocked provider.
* **E2E**: Playwright baseline (later).
* **SW**: Workbox test harness + unit tests for queue/serialization logic.

---

## 7) Work Packages (tickets)

Each package lists: *Business logic*, *Implementation notes*, *Unit tests & acceptance*.

### WP0 – Project Bootstrap (Scaffold & Tooling) - STATUS: DONE

**Business logic**: None (infra only).
**Implementation**:

* Vite + React + TypeScript; Tailwind; ESLint/Prettier; Husky + lint‑staged.
* VitePWA (injectManifest) with Workbox; manifest.json; icons.
* React Router v6, file‑based routes (optional vite‑plugin‑pages).
  **Tests**: Vitest setup; RTL helpers; sample test for App shell renders.
  **Acceptance**: App loads offline after 2nd visit; `npm run test` passes.

### WP1 – Auth (OpenAuth) + Protected Routes - STATUS: DONE (mock)

**Business logic**: User can log in/out; unauthenticated users see login only.
**Implementation**:

* OpenAuth PKCE flow; `/login`, `/callback` routes; token manager.
* ProtectedRoute wrapper; store tokens (mem + IndexedDB encrypted).
  **Tests**:
* Mock OpenAuth; verify redirect on protected route.
* Token storage round‑trip and refresh.
  **Acceptance**: After login, user reaches Dashboard; reload keeps session.

### WP2 – App Shell & Navigation - STATUS: DONE

**Business logic**: Bottom tabs for 5 screens; persistent layout.
**Implementation**:

* `<AppShell>` with bottom nav; route components for screens.
* Skeleton Dashboard with empty cards and Add Meal FAB.
  **Tests**:
* Route navigation tests; a11y landmarks.
  **Acceptance**: Tabs switch without full reload; works offline.

### WP3 – Local DB (IndexedDB) & Sync Queue - STATUS: DONE

**Business logic**: All create/update/delete work offline; queued for sync.
**Implementation**:

* Dexie schemas for Meal, Activity, Workout, WeightEntry, Mutations queue.
* Queue serializer; background sync registration; replay worker.
  **Tests**:
* Queue persistence across reloads; failure retry/backoff.
  **Acceptance**: Create meal offline → visible immediately → syncs when online.

### WP4 – Meals CRUD

**Business logic**: Add/edit/delete meals; total daily calories; meal types.
**Implementation**:

* Forms with Zod validation; calories auto‑sum from items.
* React Query mutations write‑through to Dexie + queue.
  **Tests**:
* Form validation; optimistic update; conflict overwrite by `updatedAt`.
  **Acceptance**: Day total updates instantly; survives offline/online flips.

### WP5 – Weight Tracking

**Business logic**: Add weight entries; show 2‑month line trend on Dashboard.
**Implementation**:

* Lightweight chart (Recharts) with offline data; selector for date range.
* Store entries locally; sync like others.
  **Tests**:
* Unit for trend selector; render snapshot for empty vs populated.
  **Acceptance**: Chart appears with mock data; accessible SVG.

### WP6 – Activity Tracking (basic)

**Business logic**: Start/pause/stop walk; duration + distance; save as Activity.
**Implementation**:

* Geolocation + watchPosition; Haversine for distance; foreground only.
* App keeps sampling even when tab hidden (Page Visibility + wake lock fallback if available).
  **Tests**:
* Distance calc unit tests; reducer for session state.
  **Acceptance**: Simulated path accumulates distance; saved offline.

### WP7 – Workouts (definitions → activity)

**Business logic**: CRUD workouts; start a workout, log sets/reps; save as Activity.
**Implementation**:

* Workout builder UI; session runner with next/set timers.
* Convert completed workout to Activity record.
  **Tests**:
* Builder validation; conversion function unit tests.
  **Acceptance**: A created workout can be run and saved offline.

### WP8 – Dashboard Widgets (calories/remaining + config store)

**Business logic**: Show calories remaining vs daily goal; allow goal setting (Settings).
**Implementation**:

* Selector `dailyCaloriesRemaining(date)`; widget registry; reorder later.
  **Tests**:
* Selector unit tests (edge cases: no meals, multiple meals).
  **Acceptance**: Card updates live as meals change.

### WP9 – Settings & Profile

**Business logic**: Update profile, units, daily calorie goal.
**Implementation**:

* Simple form; local store + sync.
  **Tests**:
* Input validation; persistence.
  **Acceptance**: Dashboard reflects updated goal.

### WP10 – Sync Engine (server integration)

**Business logic**: Reconcile changes with backend; resolve conflicts.
**Implementation**:

* `/v1/{meals,activities,workouts,weights}` GET delta via `If-None-Match`/`since`.
* Mutation replay with LWW resolution; clock skew tolerance.
  **Tests**:
* MSW server with conflict scenarios; idempotency tests.
  **Acceptance**: Two devices converge to same state.

### WP11 – PWA Polish (install, offline page, icons)

**Business logic**: Install prompt; offline friendly UX.
**Implementation**:

* Custom `beforeinstallprompt` flow; `/offline` route; icon set.
  **Tests**:
* SW precache manifest contains app shell; offline nav test (Playwright later).
  **Acceptance**: App installs on Android; 2nd load works in airplane mode.

---

## 8) API Sketch (server)

* `POST /v1/auth/token` (OpenAuth server side)
* `GET /v1/meals?since=timestamp` → `{ items, syncStamp }`
* `POST /v1/meals` `{...}`
* `PUT /v1/meals/:id` `{...}`
* Similar for activities, workouts, weights
* ETags or `syncStamp` on list endpoints; 429/503 backoff headers.

---

## 9) Coding Conventions

* TypeScript strict; Zod for runtime validation; date handling via Day.js.
* UI: Tailwind utility classes, dark mode with `class` strategy.
* Error boundaries per route; toast notifications for failures.

---

## 10) Prompts & Acceptance

* Each WP contains acceptance criteria to guide PR review; include unit tests with >80% lines for domain selectors and reducers.

---
