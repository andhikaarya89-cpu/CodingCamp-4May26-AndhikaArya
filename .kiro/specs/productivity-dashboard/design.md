# Design Document: Productivity Dashboard

## Overview

The Productivity Dashboard is a single-page web application built with plain HTML, CSS, and Vanilla JavaScript. It runs entirely in the browser with no build step, no backend, and no external dependencies. All user data is persisted via the browser's `localStorage` API.

The application is structured as three files:
- `index.html` — markup and widget scaffolding
- `css/styles.css` — all visual styling including light/dark theme variables
- `js/app.js` — all application logic

The dashboard renders four widgets on load:
1. **Greeting Widget** — current time, date, and contextual greeting
2. **Focus Timer** — Pomodoro-style countdown timer
3. **To-Do List** — task management with add/edit/delete/complete
4. **Quick Links** — user-defined URL shortcuts

Settings (custom name, timer duration, theme) are managed inline within the dashboard.

---

## Architecture

The application follows a **module pattern** using plain JavaScript. Each widget is encapsulated in its own module object (an IIFE or plain object literal) with `init()`, `render()`, and event-binding methods. A central `Storage` module wraps all `localStorage` reads and writes. A `ThemeManager` module handles theme switching.

There is no virtual DOM, no reactive framework, and no state management library. State is held in plain JavaScript objects in memory and synced to `localStorage` on every mutation.

```
index.html
  └── js/app.js
        ├── Storage          (localStorage read/write, JSON parse/stringify)
        ├── ThemeManager     (apply/persist theme)
        ├── GreetingWidget   (time/date display, name input)
        ├── FocusTimer       (countdown, controls, notification)
        ├── TodoList         (task CRUD, persistence)
        └── QuickLinks       (link CRUD, persistence)
```

### Initialization Flow

```
DOMContentLoaded
  → Storage.load()          (read all keys from localStorage)
  → ThemeManager.init()     (apply saved or default theme)
  → GreetingWidget.init()   (render time/date, start 1-min interval)
  → FocusTimer.init()       (restore duration, render MM:SS)
  → TodoList.init()         (render saved tasks)
  → QuickLinks.init()       (render saved links)
```

### Event Flow

All DOM events are delegated where practical (e.g., task list clicks delegated to the list container). Each handler mutates in-memory state, calls `Storage.save(key, value)`, then calls the relevant `render()` function to update the DOM.

---

## Components and Interfaces

### Storage Module

Responsible for all `localStorage` interactions. Centralises JSON serialisation and deserialisation, and provides safe fallback on parse errors.

```js
Storage = {
  KEYS: {
    TASKS:    'pd_tasks',
    LINKS:    'pd_links',
    NAME:     'pd_name',
    THEME:    'pd_theme',
    DURATION: 'pd_duration',
  },
  get(key)        → any | null,   // JSON.parse, returns null on error
  set(key, value) → void,         // JSON.stringify
  remove(key)     → void,
}
```

### ThemeManager Module

```js
ThemeManager = {
  init()          → void,   // reads Storage, applies theme to <html>
  apply(theme)    → void,   // sets data-theme attribute on <html>
  toggle()        → void,   // flips between 'light' and 'dark', persists
  current()       → string, // 'light' | 'dark'
}
```

Theme is applied via a `data-theme` attribute on the `<html>` element. CSS custom properties (variables) defined under `[data-theme="light"]` and `[data-theme="dark"]` selectors drive all colour changes.

### GreetingWidget Module

```js
GreetingWidget = {
  init()          → void,   // renders, starts setInterval(60 000)
  render()        → void,   // updates time, date, greeting text
  getGreeting(hour: number) → string,  // pure function: hour → greeting phrase
  setName(name: string)     → void,    // saves to Storage, re-renders
}
```

`getGreeting` is a pure function mapping hour (0–23) to a greeting string:
- 5–11 → "Good morning"
- 12–17 → "Good afternoon"
- 18–21 → "Good evening"
- 22–23, 0–4 → "Good night"

### FocusTimer Module

```js
FocusTimer = {
  state: { remaining: number, running: boolean, duration: number },
  init()          → void,
  start()         → void,   // setInterval(1000), updates state.remaining
  stop()          → void,   // clearInterval
  reset()         → void,   // remaining = duration
  setDuration(minutes: number) → void,  // validates, persists, resets
  render()        → void,   // formats MM:SS, updates controls
  notify()        → void,   // Notification API or Audio beep
  formatTime(seconds: number) → string, // pure: seconds → "MM:SS"
}
```

Timer state is held in memory only (not persisted between page loads — the timer always resets on load). Duration is persisted.

### TodoList Module

```js
TodoList = {
  tasks: Task[],   // { id: string, description: string, complete: boolean }
  init()           → void,
  addTask(description: string)          → void,
  toggleTask(id: string)                → void,
  editTask(id: string, description: string) → void,
  deleteTask(id: string)                → void,
  render()         → void,
  persist()        → void,  // Storage.set(TASKS, this.tasks)
}
```

Task IDs are generated with `Date.now().toString(36) + Math.random().toString(36).slice(2)` — a simple collision-resistant string ID without external libraries.

### QuickLinks Module

```js
QuickLinks = {
  links: Link[],   // { id: string, label: string, url: string }
  init()           → void,
  addLink(label: string, url: string) → void,
  deleteLink(id: string)              → void,
  render()         → void,
  persist()        → void,
  isValidUrl(url: string) → boolean,  // pure: uses URL constructor
}
```

URL validation uses the `URL` constructor in a try/catch — if it throws, the URL is invalid. Only `http:` and `https:` protocols are accepted.

---

## Data Models

All data is stored in `localStorage` as JSON strings under namespaced keys.

### Task

```json
{
  "id": "lf3k2abc9x",
  "description": "Write design document",
  "complete": false
}
```

Stored under key `pd_tasks` as a JSON array.

### Link

```json
{
  "id": "lf3k2def7y",
  "label": "GitHub",
  "url": "https://github.com"
}
```

Stored under key `pd_links` as a JSON array.

### Settings

| Key | Type | Default | Description |
|---|---|---|---|
| `pd_name` | `string \| null` | `null` | User's display name |
| `pd_theme` | `"light" \| "dark"` | `"light"` | Active theme |
| `pd_duration` | `number` | `25` | Pomodoro duration in minutes |

### LocalStorage Schema

```
pd_tasks    → JSON array of Task objects
pd_links    → JSON array of Link objects
pd_name     → JSON string or absent
pd_theme    → JSON string "light" or "dark"
pd_duration → JSON number (1–120)
```

### Default / Fallback Values

If a key is absent or its JSON is malformed, each module falls back to its default:
- `pd_tasks` → `[]`
- `pd_links` → `[]`
- `pd_name` → `null` (no name suffix)
- `pd_theme` → `"light"`
- `pd_duration` → `25`

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Greeting phrase covers all hours exhaustively

*For any* integer hour in the range 0–23, `getGreeting(hour)` SHALL return exactly one of "Good morning", "Good afternoon", "Good evening", or "Good night". The mapping SHALL be: 5–11 → "Good morning", 12–17 → "Good afternoon", 18–21 → "Good evening", 22–23 and 0–4 → "Good night". The ranges are exhaustive and non-overlapping.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 2: Timer format is always valid MM:SS

*For any* non-negative integer number of seconds in the range 0–7200 (0 to 120 minutes), `formatTime(seconds)` SHALL return a string matching the pattern `MM:SS` where MM is zero-padded minutes and SS is zero-padded seconds, and decoding the returned string back to total seconds SHALL yield the original input.

**Validates: Requirements 3.1**

---

### Property 3: Task addition round-trip with persistence

*For any* non-empty, non-whitespace-only task description string, after calling `addTask(description)` the in-memory task list SHALL contain an entry whose `description` equals the input with `complete` set to `false`, and `Storage.get(TASKS)` SHALL include that same entry.

**Validates: Requirements 5.2, 5.10**

---

### Property 4: Empty and whitespace-only task descriptions are rejected

*For any* string composed entirely of whitespace characters (including the empty string), calling `addTask(description)` SHALL leave the task list length unchanged and SHALL not write a new entry to `Storage`.

**Validates: Requirements 5.3**

---

### Property 5: Task toggle is an involution

*For any* task in the list with any initial `complete` state, calling `toggleTask(id)` twice SHALL return the task's `complete` field to its original value.

**Validates: Requirements 5.4**

---

### Property 6: Task edit round-trip with persistence

*For any* existing task and any non-empty replacement description string, calling `editTask(id, newDescription)` SHALL update the task's `description` to `newDescription`, and `Storage.get(TASKS)` SHALL reflect the updated description.

**Validates: Requirements 5.7, 5.10**

---

### Property 7: Task deletion removes entry and persists

*For any* task present in the list, calling `deleteTask(id)` SHALL remove exactly that task from the in-memory list, and `Storage.get(TASKS)` SHALL no longer contain an entry with that `id`.

**Validates: Requirements 5.9, 5.10**

---

### Property 8: Task insertion order is preserved

*For any* sequence of valid task descriptions added one after another, the in-memory task list and the rendered DOM order SHALL match the insertion order.

**Validates: Requirements 5.1**

---

### Property 9: Link addition round-trip with persistence

*For any* non-empty label and valid http/https URL, after calling `addLink(label, url)` the in-memory links list SHALL contain an entry with matching `label` and `url`, and `Storage.get(LINKS)` SHALL include that entry.

**Validates: Requirements 6.4, 6.7**

---

### Property 10: Invalid link inputs are rejected

*For any* combination of empty label or invalid URL (non-http/https, malformed, or empty), calling `addLink(label, url)` SHALL leave the links list unchanged and SHALL not write a new entry to `Storage`.

**Validates: Requirements 6.5**

---

### Property 11: Link deletion removes entry and persists

*For any* link present in the list, calling `deleteLink(id)` SHALL remove exactly that link from the in-memory list, and `Storage.get(LINKS)` SHALL no longer contain an entry with that `id`.

**Validates: Requirements 6.6, 6.7**

---

### Property 12: URL validation accepts only http/https

*For any* string, `isValidUrl(url)` SHALL return `true` if and only if the string is parseable by the `URL` constructor and its protocol is `http:` or `https:`. All other strings (ftp, data, empty, plain text, malformed) SHALL return `false`.

**Validates: Requirements 6.5**

---

### Property 13: Storage round-trip preserves data

*For any* serialisable JavaScript value (objects, arrays, strings, numbers, booleans, null), calling `Storage.set(key, value)` followed by `Storage.get(key)` SHALL return a value that is deeply equal to the original.

**Validates: Requirements 8.4**

---

### Property 14: Malformed localStorage data yields safe defaults without throwing

*For any* widget storage key, if `localStorage` contains a value that is not valid JSON (arbitrary non-JSON string), `Storage.get(key)` SHALL return `null` without throwing an exception, and each widget's `init()` SHALL fall back to its defined default state.

**Validates: Requirements 8.3**

---

### Property 15: Valid Pomodoro duration is accepted and persisted

*For any* integer in the range [1, 120], calling `setDuration(minutes)` SHALL update the timer's remaining time to `minutes * 60` seconds and SHALL persist the value to `Storage.get(DURATION)`.

**Validates: Requirements 4.2, 4.3**

---

### Property 16: Out-of-range Pomodoro duration is rejected

*For any* integer outside the range [1, 120] (including 0, negative values, and values greater than 120), calling `setDuration(minutes)` SHALL leave the current duration unchanged and SHALL not update `Storage`.

**Validates: Requirements 4.5**

---

## Error Handling

### LocalStorage Errors

- `Storage.get` wraps `JSON.parse` in a try/catch and returns `null` on failure.
- `Storage.set` wraps `JSON.stringify` + `localStorage.setItem` in a try/catch. If `localStorage` is full (QuotaExceededError), the error is caught and a console warning is emitted; the in-memory state is still updated.
- Each widget's `init()` checks for `null` from `Storage.get` and falls back to its default state.

### Timer Errors

- If `setInterval` is called while a timer is already running, the existing interval is cleared first to prevent double-ticking.
- The `notify()` function checks `Notification.permission` before calling `Notification.requestPermission()`. If permission is denied, it falls back to an `AudioContext`-generated beep.

### Input Validation

| Input | Validation Rule | Error Response |
|---|---|---|
| Task description | Non-empty after trim | Inline message below input |
| User name | Any string (empty clears name) | No error; empty removes name |
| Timer duration | Integer 1–120 | Inline validation message |
| Link label | Non-empty after trim | Inline message on form |
| Link URL | Valid http/https URL | Inline message on form |

All validation errors are displayed as inline text adjacent to the relevant input. No modal dialogs or alerts are used for validation.

### Edit Cancellation

- If the user confirms a task edit with an empty description, the edit is silently discarded and the original description is restored (Requirement 5.8).
- Pressing Escape during an edit also cancels and restores the original description.

---

## Testing Strategy

### Unit Tests

Unit tests cover pure functions and isolated module logic. Recommended framework: **no framework required** — tests can be written as plain JS assertions run in Node.js or in-browser, or using a lightweight runner like [uvu](https://github.com/lukeed/uvu) (zero-dependency).

Key unit test targets:
- `getGreeting(hour)` — all 24 hour values, boundary conditions (5, 12, 18, 22, 0)
- `formatTime(seconds)` — 0, 59, 60, 3599, 3600, boundary values
- `isValidUrl(url)` — valid http, valid https, ftp, empty string, plain text, malformed
- `Storage.get` / `Storage.set` — round-trip, malformed JSON fallback
- Task validation — empty string, whitespace-only, valid description
- Duration validation — 0, 1, 60, 120, 121, non-integer

### Property-Based Tests

Property-based tests use **fast-check** (browser-compatible, no build step required via CDN or inline bundle). Each property test runs a minimum of **100 iterations**.

Each test is tagged with a comment in the format:
`// Feature: productivity-dashboard, Property N: <property text>`

| Property | Test Description | Generator |
|---|---|---|
| P1: Greeting coverage | `getGreeting(h)` returns correct phrase for all h in 0–23 | `fc.integer({min:0, max:23})` |
| P2: Timer format | `formatTime(s)` returns valid MM:SS for all s in 0–7200 | `fc.integer({min:0, max:7200})` |
| P3: Task add round-trip | Add task → list contains it with complete=false → localStorage contains it | `fc.string({minLength:1})` filtered non-whitespace |
| P4: Whitespace rejection | Whitespace-only strings never add a task | `fc.string()` filtered all-whitespace |
| P5: Toggle involution | Toggle twice → original complete state | `fc.boolean()` for initial state |
| P6: Task edit round-trip | Edit task → description updated → persisted | `fc.string({minLength:1})` |
| P7: Task deletion | Delete task → removed from list → removed from localStorage | `fc.array(taskArb, {minLength:1})` |
| P8: Task order | Tasks appear in insertion order | `fc.array(fc.string({minLength:1}))` |
| P9: Link add round-trip | Add link → list contains it → localStorage contains it | `fc.record({label: fc.string({minLength:1}), url: validUrlArb})` |
| P10: Invalid link rejection | Empty label or invalid URL → list unchanged | `fc.string()` for invalid URLs |
| P11: Link deletion | Delete link → removed from list → removed from localStorage | `fc.array(linkArb, {minLength:1})` |
| P12: URL validation | `isValidUrl` accepts http/https, rejects others | `fc.webUrl()` and `fc.string()` |
| P13: Storage round-trip | `set` then `get` returns deeply equal value | `fc.jsonValue()` |
| P14: Malformed data fallback | Corrupt localStorage → no throw, default state | Manually inject invalid JSON strings |
| P15: Valid duration accepted | `setDuration(n)` for n in [1,120] → remaining updated and persisted | `fc.integer({min:1, max:120})` |
| P16: Invalid duration rejected | `setDuration(n)` for n outside [1,120] → duration unchanged | `fc.integer()` filtered outside [1,120] |

### Integration / Smoke Tests

These are manual or scripted browser checks (not property-based):

- **Load test**: Open `index.html` in Chrome, Firefox, Edge, Safari — verify all widgets render.
- **Persistence test**: Add tasks and links, reload page — verify data is restored.
- **Theme persistence**: Toggle theme, reload — verify theme is preserved.
- **Timer notification**: Let timer reach 00:00 — verify notification or audio fires.
- **No-build test**: Open `index.html` directly from the filesystem (file:// protocol) — verify full functionality.
