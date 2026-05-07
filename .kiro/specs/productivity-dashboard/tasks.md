# Implementation Plan: Productivity Dashboard

## Overview

Implement a single-page productivity dashboard using plain HTML, CSS, and Vanilla JavaScript. The application is structured as three files (`index.html`, `css/styles.css`, `js/app.js`) with no build step or backend. All state is persisted to `localStorage`. Implementation proceeds module by module, wiring everything together in the final step.

## Tasks

- [x] 1. Create project file structure and HTML scaffold
  - Create `index.html` with semantic markup for all four widget sections: Greeting, Focus Timer, To-Do List, Quick Links
  - Include a theme toggle button, a name input field, and a duration input field in the markup
  - Add `<link>` to `css/styles.css` and `<script>` to `js/app.js` (deferred)
  - Create `css/styles.css` as an empty file and `js/app.js` as an empty file
  - _Requirements: 9.3, 9.4_

- [x] 2. Implement the Storage module
  - [x] 2.1 Write the `Storage` module in `js/app.js`
    - Implement `Storage.KEYS` with all five namespaced keys (`pd_tasks`, `pd_links`, `pd_name`, `pd_theme`, `pd_duration`)
    - Implement `Storage.get(key)` wrapping `JSON.parse` in a try/catch, returning `null` on error
    - Implement `Storage.set(key, value)` wrapping `JSON.stringify` + `localStorage.setItem` in a try/catch, emitting a console warning on `QuotaExceededError`
    - Implement `Storage.remove(key)`
    - _Requirements: 8.1, 8.4_

  - [ ]* 2.2 Write property test for Storage round-trip (Property 13)
    - **Property 13: Storage round-trip preserves data**
    - Use `fc.jsonValue()` to generate arbitrary serialisable values; assert `Storage.get(key)` deeply equals the value passed to `Storage.set(key, value)`
    - **Validates: Requirements 8.4**

  - [ ]* 2.3 Write property test for malformed localStorage fallback (Property 14)
    - **Property 14: Malformed localStorage data yields safe defaults without throwing**
    - Manually inject non-JSON strings into `localStorage` for each widget key; assert `Storage.get(key)` returns `null` without throwing
    - **Validates: Requirements 8.3**

- [x] 3. Implement the ThemeManager module
  - [x] 3.1 Write the `ThemeManager` module
    - Implement `ThemeManager.apply(theme)` setting `data-theme` attribute on `<html>`
    - Implement `ThemeManager.current()` reading the attribute, defaulting to `"light"`
    - Implement `ThemeManager.toggle()` flipping between `"light"` and `"dark"` and calling `Storage.set`
    - Implement `ThemeManager.init()` reading from `Storage`, falling back to `"light"`, then calling `apply()`
    - Bind the theme toggle button click to `ThemeManager.toggle()`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 3.2 Write unit tests for ThemeManager
    - Test that `init()` applies `"light"` when no value is stored
    - Test that `toggle()` switches from `"light"` to `"dark"` and back
    - Test that `apply()` sets the correct `data-theme` attribute
    - _Requirements: 7.2, 7.4, 7.5_

- [x] 4. Implement the GreetingWidget module
  - [x] 4.1 Write the `getGreeting(hour)` pure function
    - Map hour 5–11 → `"Good morning"`, 12–17 → `"Good afternoon"`, 18–21 → `"Good evening"`, 22–23 and 0–4 → `"Good night"`
    - _Requirements: 1.3, 1.4, 1.5, 1.6_

  - [ ]* 4.2 Write property test for greeting coverage (Property 1)
    - **Property 1: Greeting phrase covers all hours exhaustively**
    - Use `fc.integer({min: 0, max: 23})` to assert `getGreeting(h)` returns the correct phrase for every hour in 0–23
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

  - [x] 4.3 Write the `GreetingWidget` module
    - Implement `GreetingWidget.render()` updating the DOM with current time (HH:MM), date (weekday, month, day), and greeting text (with or without name suffix)
    - Implement `GreetingWidget.setName(name)` saving to `Storage` and calling `render()`
    - Implement `GreetingWidget.init()` reading name from `Storage`, calling `render()`, and starting a `setInterval` of 60 000 ms
    - Bind the name input submit event to `GreetingWidget.setName()`; empty submission removes the name
    - _Requirements: 1.1, 1.2, 1.7, 1.8, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 4.4 Write unit tests for GreetingWidget
    - Test all 24 boundary hours for `getGreeting`
    - Test that `render()` appends name when set and omits it when absent
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement the FocusTimer module
  - [x] 6.1 Write the `formatTime(seconds)` pure function
    - Convert a non-negative integer number of seconds to a zero-padded `"MM:SS"` string
    - _Requirements: 3.1_

  - [ ]* 6.2 Write property test for timer format (Property 2)
    - **Property 2: Timer format is always valid MM:SS**
    - Use `fc.integer({min: 0, max: 7200})` to assert `formatTime(s)` matches `/^\d{2}:\d{2}$/` and that decoding the result back to seconds equals the input
    - **Validates: Requirements 3.1**

  - [x] 6.3 Write the `FocusTimer` module
    - Implement `FocusTimer.state` holding `{ remaining, running, duration }`
    - Implement `FocusTimer.render()` calling `formatTime` and updating the display; enable/disable start, stop, reset controls based on `running` state
    - Implement `FocusTimer.start()` using `setInterval(1000)`, clearing any existing interval first; decrement `remaining` each tick; call `stop()` and `notify()` when `remaining` reaches 0
    - Implement `FocusTimer.stop()` calling `clearInterval`
    - Implement `FocusTimer.reset()` setting `remaining = duration` and calling `render()`
    - Implement `FocusTimer.notify()` using the Notifications API with fallback to `AudioContext` beep
    - Bind start, stop, and reset button clicks
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 6.4 Write the `setDuration(minutes)` method
    - Validate that `minutes` is an integer in [1, 120]; display an inline error and return early if invalid
    - On valid input: update `state.duration`, call `reset()`, and call `Storage.set(DURATION, minutes)`
    - Bind the duration input submit event to `setDuration()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 6.5 Write property test for valid duration acceptance (Property 15)
    - **Property 15: Valid Pomodoro duration is accepted and persisted**
    - Use `fc.integer({min: 1, max: 120})` to assert `setDuration(n)` sets `state.remaining` to `n * 60` and `Storage.get(DURATION)` equals `n`
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 6.6 Write property test for invalid duration rejection (Property 16)
    - **Property 16: Out-of-range Pomodoro duration is rejected**
    - Use `fc.integer()` filtered to values outside [1, 120] to assert `setDuration(n)` leaves `state.duration` unchanged and does not update `Storage`
    - **Validates: Requirements 4.5**

  - [ ]* 6.7 Write unit tests for FocusTimer
    - Test `formatTime` boundary values: 0, 59, 60, 3599, 3600
    - Test that `start()` clears any existing interval before starting a new one
    - Test that `reset()` restores `remaining` to `duration`
    - _Requirements: 3.1, 3.2, 3.5_

- [x] 7. Implement the TodoList module
  - [x] 7.1 Write the `TodoList` module core (add and render)
    - Implement `TodoList.tasks` array and `TodoList.persist()` calling `Storage.set(TASKS, this.tasks)`
    - Implement `TodoList.addTask(description)`: trim input, reject empty/whitespace-only with an inline validation message, otherwise push `{ id, description, complete: false }` and call `persist()` then `render()`
    - Implement `TodoList.render()` building the task list DOM in insertion order, with complete/incomplete visual distinction (strikethrough)
    - Implement `TodoList.init()` reading from `Storage`, falling back to `[]`, then calling `render()`
    - Bind the add-task form submit event
    - _Requirements: 5.1, 5.2, 5.3, 5.10, 5.11_

  - [ ]* 7.2 Write property test for task addition round-trip (Property 3)
    - **Property 3: Task addition round-trip with persistence**
    - Use `fc.string({minLength: 1})` filtered to non-whitespace-only strings; assert the task appears in `TodoList.tasks` with `complete: false` and in `Storage.get(TASKS)`
    - **Validates: Requirements 5.2, 5.10**

  - [ ]* 7.3 Write property test for whitespace rejection (Property 4)
    - **Property 4: Empty and whitespace-only task descriptions are rejected**
    - Use `fc.string()` filtered to whitespace-only strings; assert `TodoList.tasks.length` is unchanged after calling `addTask`
    - **Validates: Requirements 5.3**

  - [ ]* 7.4 Write property test for task insertion order (Property 8)
    - **Property 8: Task insertion order is preserved**
    - Use `fc.array(fc.string({minLength: 1}))` filtered to non-whitespace-only elements; assert the order of descriptions in `TodoList.tasks` matches insertion order
    - **Validates: Requirements 5.1**

  - [x] 7.5 Write the `toggleTask`, `editTask`, and `deleteTask` methods
    - Implement `TodoList.toggleTask(id)`: flip `complete` on the matching task, call `persist()` then `render()`
    - Implement `TodoList.editTask(id, description)`: if description is non-empty after trim, update the task and call `persist()` then `render()`; if empty, silently discard and restore original
    - Implement `TodoList.deleteTask(id)`: remove the task by id, call `persist()` then `render()`
    - Use event delegation on the task list container for complete, edit, and delete controls
    - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

  - [ ]* 7.6 Write property test for task toggle involution (Property 5)
    - **Property 5: Task toggle is an involution**
    - Use `fc.boolean()` for initial `complete` state; assert that calling `toggleTask(id)` twice returns `complete` to its original value
    - **Validates: Requirements 5.4**

  - [ ]* 7.7 Write property test for task edit round-trip (Property 6)
    - **Property 6: Task edit round-trip with persistence**
    - Use `fc.string({minLength: 1})` for replacement description; assert `task.description` is updated and `Storage.get(TASKS)` reflects the change
    - **Validates: Requirements 5.7, 5.10**

  - [ ]* 7.8 Write property test for task deletion (Property 7)
    - **Property 7: Task deletion removes entry and persists**
    - Use `fc.array(taskArb, {minLength: 1})` to populate the list; assert the deleted task's `id` is absent from both `TodoList.tasks` and `Storage.get(TASKS)`
    - **Validates: Requirements 5.9, 5.10**

- [x] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement the QuickLinks module
  - [x] 9.1 Write the `isValidUrl(url)` pure function
    - Use the `URL` constructor in a try/catch; return `true` only if parsing succeeds and `protocol` is `"http:"` or `"https:"`
    - _Requirements: 6.5_

  - [ ]* 9.2 Write property test for URL validation (Property 12)
    - **Property 12: URL validation accepts only http/https**
    - Use `fc.webUrl()` to assert `isValidUrl` returns `true`; use `fc.string()` filtered to non-http/https strings to assert it returns `false`
    - **Validates: Requirements 6.5**

  - [x] 9.3 Write the `QuickLinks` module
    - Implement `QuickLinks.links` array and `QuickLinks.persist()` calling `Storage.set(LINKS, this.links)`
    - Implement `QuickLinks.addLink(label, url)`: validate non-empty label and `isValidUrl(url)`; display inline error and return early if invalid; otherwise push `{ id, label, url }` and call `persist()` then `render()`
    - Implement `QuickLinks.deleteLink(id)`: remove by id, call `persist()` then `render()`
    - Implement `QuickLinks.render()` building link buttons that open URLs in a new tab, with delete controls
    - Implement `QuickLinks.init()` reading from `Storage`, falling back to `[]`, then calling `render()`
    - Bind the add-link form submit and use event delegation for delete controls
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [ ]* 9.4 Write property test for link addition round-trip (Property 9)
    - **Property 9: Link addition round-trip with persistence**
    - Use `fc.record({ label: fc.string({minLength: 1}), url: validUrlArb })` to assert the link appears in `QuickLinks.links` and `Storage.get(LINKS)`
    - **Validates: Requirements 6.4, 6.7**

  - [ ]* 9.5 Write property test for invalid link rejection (Property 10)
    - **Property 10: Invalid link inputs are rejected**
    - Use combinations of empty label or invalid URL strings; assert `QuickLinks.links.length` is unchanged
    - **Validates: Requirements 6.5**

  - [ ]* 9.6 Write property test for link deletion (Property 11)
    - **Property 11: Link deletion removes entry and persists**
    - Use `fc.array(linkArb, {minLength: 1})` to populate the list; assert the deleted link's `id` is absent from both `QuickLinks.links` and `Storage.get(LINKS)`
    - **Validates: Requirements 6.6, 6.7**

  - [ ]* 9.7 Write unit tests for QuickLinks
    - Test `isValidUrl` with valid http, valid https, ftp, empty string, plain text, and malformed URLs
    - Test that `addLink` with valid inputs adds to the list and persists
    - _Requirements: 6.4, 6.5_

- [x] 10. Write CSS styling
  - Implement CSS custom properties for light and dark themes under `[data-theme="light"]` and `[data-theme="dark"]` selectors
  - Style all four widget sections, the theme toggle, name input, duration input, task list items (including strikethrough for complete tasks), and quick link buttons
  - Ensure the layout is readable and functional in Chrome, Firefox, Edge, and Safari
  - _Requirements: 5.5, 7.1, 7.2, 9.2_

- [x] 11. Wire all modules together and initialise on DOMContentLoaded
  - Add the `DOMContentLoaded` listener in `js/app.js` that calls `Storage.load()` (if applicable), then `ThemeManager.init()`, `GreetingWidget.init()`, `FocusTimer.init()`, `TodoList.init()`, `QuickLinks.init()` in order
  - Verify that `FocusTimer.init()` reads the saved duration from `Storage` and initialises `state.duration` and `state.remaining` accordingly
  - Verify that all event bindings are in place and no module is left unwired
  - _Requirements: 8.2, 4.4, 2.4, 7.4 (theme), 9.1 (performance)_

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use **fast-check** (loadable via CDN or inline bundle — no build step required)
- Each property test file should tag tests with `// Feature: productivity-dashboard, Property N: <property text>`
- Unit tests can be written as plain JS assertions run in Node.js or with a lightweight runner like [uvu](https://github.com/lukeed/uvu)
- All 16 correctness properties from the design document are covered by property test sub-tasks
- Checkpoints ensure incremental validation at logical boundaries
