# Requirements Document

## Introduction

A browser-based productivity dashboard delivered as a single-page web application (or browser extension). The dashboard provides a greeting with the current time and date, a Focus Timer (Pomodoro-style), a To-Do List, and a Quick Links panel. All data is persisted client-side using the browser's LocalStorage API. The application is built with plain HTML, CSS, and Vanilla JavaScript — no frameworks, no backend, no build step required.

## Glossary

- **Dashboard**: The single-page web application that hosts all productivity widgets.
- **Focus_Timer**: The countdown timer widget, defaulting to 25 minutes, used to track focused work sessions.
- **Greeting_Widget**: The widget that displays the current time, date, and a time-of-day greeting message.
- **Todo_List**: The widget that manages a user's task items.
- **Task**: A single to-do item with a text description and a completion state.
- **Quick_Links**: The widget that displays user-defined shortcut buttons that open URLs in a new tab.
- **Link**: A single quick-link entry consisting of a label and a URL.
- **LocalStorage**: The browser's `localStorage` API used for all client-side data persistence.
- **Theme**: The visual color scheme of the Dashboard, either light or dark.
- **User_Name**: An optional custom name entered by the user, displayed in the greeting.

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a contextual greeting when I open the dashboard, so that I am immediately oriented and welcomed.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM format, updated every minute.
2. THE Greeting_Widget SHALL display the current date including the day of the week, month, and day number.
3. WHEN the current hour is between 05:00 and 11:59, THE Greeting_Widget SHALL display the greeting "Good morning".
4. WHEN the current hour is between 12:00 and 17:59, THE Greeting_Widget SHALL display the greeting "Good afternoon".
5. WHEN the current hour is between 18:00 and 21:59, THE Greeting_Widget SHALL display the greeting "Good evening".
6. WHEN the current hour is between 22:00 and 04:59, THE Greeting_Widget SHALL display the greeting "Good night".
7. WHERE a User_Name has been saved, THE Greeting_Widget SHALL append the User_Name to the greeting message (e.g., "Good morning, Alex").
8. WHERE no User_Name has been saved, THE Greeting_Widget SHALL display the greeting without a name suffix.

---

### Requirement 2: Custom Name in Greeting

**User Story:** As a user, I want to enter my name so that the greeting feels personal.

#### Acceptance Criteria

1. THE Dashboard SHALL provide an input field for the user to enter a User_Name.
2. WHEN the user submits a non-empty User_Name, THE Dashboard SHALL save the User_Name to LocalStorage.
3. WHEN the user submits a non-empty User_Name, THE Greeting_Widget SHALL immediately reflect the updated name without a page reload.
4. WHEN the Dashboard loads, THE Dashboard SHALL read the User_Name from LocalStorage and restore it to the greeting.
5. IF the user submits an empty User_Name, THEN THE Dashboard SHALL remove the User_Name from LocalStorage and display the greeting without a name suffix.

---

### Requirement 3: Focus Timer

**User Story:** As a user, I want a countdown timer so that I can track focused work sessions using the Pomodoro technique.

#### Acceptance Criteria

1. THE Focus_Timer SHALL display a countdown in MM:SS format.
2. WHEN the Dashboard loads and no custom duration has been saved, THE Focus_Timer SHALL initialise to 25 minutes (25:00).
3. WHEN the user activates the start control, THE Focus_Timer SHALL begin counting down one second at a time.
4. WHEN the user activates the stop control, THE Focus_Timer SHALL pause the countdown at the current value.
5. WHEN the user activates the reset control, THE Focus_Timer SHALL return the countdown to the configured session duration.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and notify the user with a browser notification or an audible alert.
7. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL disable the start control and enable the stop and reset controls.
8. WHILE the Focus_Timer is paused or stopped, THE Focus_Timer SHALL enable the start control and disable the stop control.

---

### Requirement 4: Configurable Pomodoro Duration

**User Story:** As a user, I want to change the default timer duration so that I can adapt the Focus Timer to my preferred session length.

#### Acceptance Criteria

1. THE Dashboard SHALL provide an input that allows the user to set the Focus_Timer session duration in whole minutes.
2. WHEN the user saves a new session duration, THE Focus_Timer SHALL reset to the new duration immediately.
3. WHEN the user saves a new session duration, THE Dashboard SHALL persist the duration value to LocalStorage.
4. WHEN the Dashboard loads, THE Dashboard SHALL read the saved session duration from LocalStorage and initialise the Focus_Timer to that value.
5. IF the user enters a session duration less than 1 minute or greater than 120 minutes, THEN THE Dashboard SHALL display a validation error and retain the previous valid duration.

---

### Requirement 5: To-Do List

**User Story:** As a user, I want to manage a list of tasks so that I can track what I need to accomplish.

#### Acceptance Criteria

1. THE Todo_List SHALL display all saved Tasks in the order they were added.
2. WHEN the user submits a non-empty task description, THE Todo_List SHALL add a new Task with a completion state of incomplete.
3. IF the user submits an empty task description, THEN THE Todo_List SHALL not add a Task and SHALL display an inline validation message.
4. WHEN the user activates the complete control on a Task, THE Todo_List SHALL toggle the Task's completion state between complete and incomplete.
5. WHEN a Task is marked complete, THE Todo_List SHALL apply a visual distinction (e.g., strikethrough text) to differentiate it from incomplete Tasks.
6. WHEN the user activates the edit control on a Task, THE Todo_List SHALL replace the Task's display text with an editable input pre-filled with the current description.
7. WHEN the user confirms an edit with a non-empty description, THE Todo_List SHALL update the Task's description and return to display mode.
8. IF the user confirms an edit with an empty description, THEN THE Todo_List SHALL discard the edit and retain the original description.
9. WHEN the user activates the delete control on a Task, THE Todo_List SHALL remove the Task from the list.
10. WHEN any Task is added, updated, or deleted, THE Todo_List SHALL persist the full Task list to LocalStorage.
11. WHEN the Dashboard loads, THE Todo_List SHALL read all Tasks from LocalStorage and render them.

---

### Requirement 6: Quick Links

**User Story:** As a user, I want to save shortcut buttons to my favourite websites so that I can navigate to them quickly from the dashboard.

#### Acceptance Criteria

1. THE Quick_Links widget SHALL display all saved Links as clickable buttons.
2. WHEN the user activates a Link button, THE Dashboard SHALL open the Link's URL in a new browser tab.
3. THE Dashboard SHALL provide a form for the user to add a new Link by entering a label and a URL.
4. WHEN the user submits the add-link form with a non-empty label and a valid URL, THE Quick_Links widget SHALL add the new Link and display it immediately.
5. IF the user submits the add-link form with an empty label or an invalid URL, THEN THE Quick_Links widget SHALL display a validation error and not add the Link.
6. WHEN the user activates the delete control on a Link, THE Quick_Links widget SHALL remove the Link from the list.
7. WHEN any Link is added or deleted, THE Quick_Links widget SHALL persist the full Link list to LocalStorage.
8. WHEN the Dashboard loads, THE Quick_Links widget SHALL read all Links from LocalStorage and render them.

---

### Requirement 7: Light / Dark Mode

**User Story:** As a user, I want to switch between a light and dark colour scheme so that I can use the dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a toggle control to switch between light and dark Theme.
2. WHEN the user activates the theme toggle, THE Dashboard SHALL apply the selected Theme to all visible elements without a page reload.
3. WHEN the user activates the theme toggle, THE Dashboard SHALL persist the selected Theme to LocalStorage.
4. WHEN the Dashboard loads, THE Dashboard SHALL read the saved Theme from LocalStorage and apply it before rendering content.
5. WHERE no Theme has been saved, THE Dashboard SHALL apply the light Theme by default.

---

### Requirement 8: Data Integrity and Persistence

**User Story:** As a user, I want my data to survive page refreshes so that I never lose my tasks, links, or settings.

#### Acceptance Criteria

1. THE Dashboard SHALL use LocalStorage as the sole persistence mechanism for all user data.
2. WHEN the Dashboard loads, THE Dashboard SHALL restore all Tasks, Links, User_Name, Theme, and session duration from LocalStorage before rendering any widget.
3. IF LocalStorage data for a widget is absent or malformed, THEN THE Dashboard SHALL initialise that widget with its default empty or default state without throwing an uncaught error.
4. THE Dashboard SHALL store all LocalStorage values as valid JSON strings.

---

### Requirement 9: Performance and Compatibility

**User Story:** As a user, I want the dashboard to load quickly and work reliably across modern browsers so that it is always available when I need it.

#### Acceptance Criteria

1. THE Dashboard SHALL load and become interactive within 2 seconds on a standard broadband connection.
2. THE Dashboard SHALL function correctly in the current stable releases of Chrome, Firefox, Edge, and Safari.
3. THE Dashboard SHALL consist of exactly one HTML file, one CSS file located in a `css/` directory, and one JavaScript file located in a `js/` directory.
4. THE Dashboard SHALL require no build step, no package manager, and no backend server to run.
5. WHEN a UI interaction occurs (button click, input change), THE Dashboard SHALL reflect the updated state within 100 milliseconds.
