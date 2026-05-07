// Productivity Dashboard app

// ─── Storage Module ──────────────────────────────────────────────────────────
// Centralises all localStorage reads and writes with safe JSON handling.
// Requirements: 8.1, 8.4

const Storage = {
  KEYS: {
    TASKS:    'pd_tasks',
    LINKS:    'pd_links',
    NAME:     'pd_name',
    THEME:    'pd_theme',
    DURATION: 'pd_duration',
  },

  /**
   * Read and JSON-parse a value from localStorage.
   * Returns null if the key is absent or the stored value is not valid JSON.
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * JSON-stringify a value and write it to localStorage.
   * Emits a console warning if the storage quota is exceeded.
   * @param {string} key
   * @param {any} value
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded — could not save key:', key);
      }
    }
  },

  /**
   * Remove a key from localStorage.
   * @param {string} key
   */
  remove(key) {
    localStorage.removeItem(key);
  },
};

// ─── ThemeManager Module ─────────────────────────────────────────────────────
// Handles light/dark theme switching, persistence, and initialisation.
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5

const ThemeManager = {
  /**
   * Read the current theme from the <html> data-theme attribute.
   * Defaults to "light" if the attribute is absent or unrecognised.
   * @returns {"light"|"dark"}
   */
  current() {
    const attr = document.documentElement.getAttribute('data-theme');
    return attr === 'dark' ? 'dark' : 'light';
  },

  /**
   * Apply a theme by setting the data-theme attribute on <html>.
   * @param {"light"|"dark"} theme
   */
  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  },

  /**
   * Toggle between "light" and "dark", persist the new value to Storage.
   */
  toggle() {
    const next = this.current() === 'light' ? 'dark' : 'light';
    this.apply(next);
    Storage.set(Storage.KEYS.THEME, next);
  },

  /**
   * Initialise the theme on page load: read from Storage, fall back to "light",
   * then apply it to the document.
   */
  init() {
    const saved = Storage.get(Storage.KEYS.THEME);
    this.apply(saved === 'dark' ? 'dark' : 'light');

    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => this.toggle());
    }
  },
};

// ─── Greeting Helpers ────────────────────────────────────────────────────────

/**
 * Map a 24-hour clock hour to a contextual greeting phrase.
 * Pure function — no side effects.
 *   5–11  → "Good morning"
 *  12–17  → "Good afternoon"
 *  18–21  → "Good evening"
 *  22–23, 0–4 → "Good night"
 * Requirements: 1.3, 1.4, 1.5, 1.6
 * @param {number} hour  Integer in the range 0–23
 * @returns {string}
 */
function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return 'Good morning';
  if (hour >= 12 && hour <= 17) return 'Good afternoon';
  if (hour >= 18 && hour <= 21) return 'Good evening';
  return 'Good night'; // 22–23 and 0–4
}

// ─── GreetingWidget Module ────────────────────────────────────────────────────
// Displays the current time, date, and a contextual greeting.
// Optionally appends the user's saved name to the greeting.
// Requirements: 1.1, 1.2, 1.7, 1.8, 2.1, 2.2, 2.3, 2.4, 2.5

const GreetingWidget = {
  /**
   * Update the greeting section of the DOM with the current time, date,
   * and greeting text (with or without the saved name suffix).
   */
  render() {
    const now = new Date();
    const hour = now.getHours();

    // ── Time: HH:MM ──────────────────────────────────────────────────────────
    const hh = String(hour).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeEl = document.getElementById('greeting-time');
    if (timeEl) timeEl.textContent = `${hh}:${mm}`;

    // ── Date: Weekday, Month Day ──────────────────────────────────────────────
    const dateStr = now.toLocaleDateString(undefined, {
      weekday: 'long',
      month:   'long',
      day:     'numeric',
    });
    const dateEl = document.getElementById('greeting-date');
    if (dateEl) dateEl.textContent = dateStr;

    // ── Greeting text ─────────────────────────────────────────────────────────
    const phrase = getGreeting(hour);
    const name   = Storage.get(Storage.KEYS.NAME);
    const textEl = document.getElementById('greeting-text');
    if (textEl) {
      textEl.textContent = name ? `${phrase}, ${name}` : phrase;
    }
  },

  /**
   * Save the user's name to Storage and re-render.
   * An empty string removes the name from Storage.
   * @param {string} name
   */
  setName(name) {
    const trimmed = name.trim();
    if (trimmed) {
      Storage.set(Storage.KEYS.NAME, trimmed);
    } else {
      Storage.remove(Storage.KEYS.NAME);
    }
    this.render();
  },

  /**
   * Initialise the widget: restore the saved name into the input field,
   * render immediately, then start a 60-second interval to keep the
   * time display current.
   * Also binds the name form submit event.
   */
  init() {
    // Restore saved name into the input field
    const savedName = Storage.get(Storage.KEYS.NAME);
    const nameInput = document.getElementById('name-input');
    if (nameInput && savedName) {
      nameInput.value = savedName;
    }

    // Bind name form submit
    const nameForm = document.getElementById('name-form');
    if (nameForm) {
      nameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('name-input');
        this.setName(input ? input.value : '');
      });
    }

    // Initial render
    this.render();

    // Update every minute
    setInterval(() => this.render(), 60_000);
  },
};

// ─── Timer Helpers ───────────────────────────────────────────────────────────

/**
 * Convert a non-negative integer number of seconds to a zero-padded "MM:SS" string.
 * Pure function — no side effects.
 * Requirements: 3.1
 * @param {number} seconds  Non-negative integer
 * @returns {string}  e.g. 0 → "00:00", 90 → "01:30", 3600 → "60:00"
 */
function formatTime(seconds) {
  const totalSeconds = Math.floor(seconds);
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

// ─── FocusTimer Module ────────────────────────────────────────────────────────
// Pomodoro-style countdown timer with start/stop/reset controls and notifications.
// Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 4.2, 4.3, 4.4, 4.5

const FocusTimer = {
  /** @type {{ remaining: number, running: boolean, duration: number }} */
  state: {
    remaining: 25 * 60,
    running: false,
    duration: 25 * 60,
  },

  /** @type {number|null} Interval handle returned by setInterval */
  _intervalId: null,

  /**
   * Update the timer display and enable/disable controls based on running state.
   * Requirements: 3.1, 3.7, 3.8
   */
  render() {
    const display = document.getElementById('timer-display');
    if (display) {
      display.textContent = formatTime(this.state.remaining);
    }

    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    const resetBtn = document.getElementById('timer-reset');

    if (startBtn) startBtn.disabled = this.state.running;
    if (stopBtn)  stopBtn.disabled  = !this.state.running;
    if (resetBtn) resetBtn.disabled = false; // reset is always available
  },

  /**
   * Start the countdown. Clears any existing interval first to prevent
   * double-ticking. Decrements remaining each second; calls stop() and
   * notify() when remaining reaches 0.
   * Requirements: 3.3, 3.7
   */
  start() {
    if (this.state.running) return;

    // Clear any stale interval before starting a fresh one
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }

    this.state.running = true;
    this.render();

    this._intervalId = setInterval(() => {
      this.state.remaining -= 1;

      if (this.state.remaining <= 0) {
        this.state.remaining = 0;
        this.render();
        this.stop();
        this.notify();
      } else {
        this.render();
      }
    }, 1000);
  },

  /**
   * Pause/stop the countdown by clearing the interval.
   * Requirements: 3.4, 3.8
   */
  stop() {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    this.state.running = false;
    this.render();
  },

  /**
   * Reset the countdown to the configured duration and re-render.
   * Requirements: 3.5
   */
  reset() {
    this.state.remaining = this.state.duration;
    this.render();
  },

  /**
   * Notify the user that the session has ended.
   * Tries the Notifications API first; falls back to an AudioContext beep.
   * Requirements: 3.6
   */
  notify() {
    // Try browser Notification API
    if ('Notification' in window) {
      const fire = () => {
        new Notification('Focus session complete!', {
          body: 'Time to take a break.',
          icon: '',
        });
      };

      if (Notification.permission === 'granted') {
        fire();
        return;
      }

      if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            fire();
          } else {
            this._beep();
          }
        });
        return;
      }
    }

    // Fallback: AudioContext beep
    this._beep();
  },

  /**
   * Generate a short audible beep using the Web Audio API.
   * @private
   */
  _beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio not available — silently ignore
    }
  },

  /**
   * Validate and apply a new session duration in minutes.
   * Accepts integers in [1, 120]; displays an inline error and returns early
   * if the value is out of range or not an integer.
   * On valid input: updates state.duration, calls reset(), and persists to Storage.
   * Requirements: 4.1, 4.2, 4.3, 4.5
   * @param {number} minutes
   */
  setDuration(minutes) {
    const errorEl = document.getElementById('duration-error');

    const isValid =
      Number.isInteger(minutes) &&
      minutes >= 1 &&
      minutes <= 120;

    if (!isValid) {
      if (errorEl) {
        errorEl.textContent = 'Please enter a whole number between 1 and 120.';
      }
      return;
    }

    // Clear any previous error
    if (errorEl) errorEl.textContent = '';

    this.state.duration = minutes * 60;
    this.stop();  // stop any running interval before resetting
    this.reset();
    Storage.set(Storage.KEYS.DURATION, minutes);
  },

  /**
   * Initialise the timer: restore saved duration from Storage, render,
   * and bind all button/form events.
   * Requirements: 4.4, 3.2
   */
  init() {
    // Restore saved duration (default 25 minutes)
    const saved = Storage.get(Storage.KEYS.DURATION);
    const duration = Number.isInteger(saved) && saved >= 1 && saved <= 120 ? saved : 25;
    this.state.duration  = duration * 60;
    this.state.remaining = duration * 60;
    this.state.running   = false;

    // Initial render
    this.render();

    // Bind start button
    const startBtn = document.getElementById('timer-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.start());
    }

    // Bind stop button
    const stopBtn = document.getElementById('timer-stop');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.stop());
    }

    // Bind reset button
    const resetBtn = document.getElementById('timer-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.stop();
        this.reset();
      });
    }

    // Bind duration form submit
    const durationForm = document.getElementById('duration-form');
    if (durationForm) {
      durationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('duration-input');
        if (input) {
          const value = parseInt(input.value, 10);
          this.setDuration(value);
        }
      });
    }
  },
};

// ─── TodoList Module ──────────────────────────────────────────────────────────
// Task management: add, toggle, edit, delete, persist, and render.
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11

const TodoList = {
  /** @type {Array<{id: string, description: string, complete: boolean}>} */
  tasks: [],

  /**
   * Persist the current task list to localStorage.
   * Requirements: 5.10
   */
  persist() {
    Storage.set(Storage.KEYS.TASKS, this.tasks);
  },

  /**
   * Generate a collision-resistant string ID.
   * @returns {string}
   * @private
   */
  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  },

  /**
   * Add a new task. Trims the description; rejects empty/whitespace-only
   * input with an inline validation message. On success, pushes the task,
   * persists, and re-renders.
   * Requirements: 5.2, 5.3, 5.10
   * @param {string} description
   */
  addTask(description) {
    const errorEl = document.getElementById('task-error');
    const trimmed = description.trim();

    if (!trimmed) {
      if (errorEl) errorEl.textContent = 'Task description cannot be empty.';
      return;
    }

    // Clear any previous error
    if (errorEl) errorEl.textContent = '';

    this.tasks.push({
      id: this._generateId(),
      description: trimmed,
      complete: false,
    });

    this.persist();
    this.render();
  },

  /**
   * Flip the `complete` flag on the task with the given id, then persist
   * and re-render.
   * Requirements: 5.4, 5.10
   * @param {string} id
   */
  toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;
    task.complete = !task.complete;
    this.persist();
    this.render();
  },

  /**
   * Update the description of the task with the given id.
   * If the trimmed description is non-empty, update and persist; otherwise
   * silently discard the edit and restore the original.
   * Requirements: 5.7, 5.8, 5.10
   * @param {string} id
   * @param {string} description
   */
  editTask(id, description) {
    const trimmed = description.trim();
    if (!trimmed) {
      // Silently discard — render restores the original display
      this.render();
      return;
    }
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;
    task.description = trimmed;
    this.persist();
    this.render();
  },

  /**
   * Remove the task with the given id, then persist and re-render.
   * Requirements: 5.9, 5.10
   * @param {string} id
   */
  deleteTask(id) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.persist();
    this.render();
  },

  /**
   * Build the task list DOM in insertion order.
   * Complete tasks receive a "complete" class for strikethrough styling.
   * Requirements: 5.1, 5.5
   */
  render() {
    const listEl = document.getElementById('task-list');
    if (!listEl) return;

    listEl.innerHTML = '';

    this.tasks.forEach((task) => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.complete ? ' task-item--complete' : '');
      li.dataset.id = task.id;

      // ── Toggle (checkbox) ────────────────────────────────────────────────
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-toggle';
      checkbox.checked = task.complete;
      checkbox.setAttribute('aria-label', task.complete ? 'Mark incomplete' : 'Mark complete');
      checkbox.dataset.action = 'toggle';
      checkbox.dataset.id = task.id;

      // ── Description ──────────────────────────────────────────────────────
      const span = document.createElement('span');
      span.className = 'task-description' + (task.complete ? ' task-description--complete' : '');
      span.textContent = task.description;
      span.dataset.id = task.id;

      // ── Edit button ──────────────────────────────────────────────────────
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'task-edit-btn';
      editBtn.textContent = 'Edit';
      editBtn.setAttribute('aria-label', `Edit task: ${task.description}`);
      editBtn.dataset.action = 'edit';
      editBtn.dataset.id = task.id;

      // ── Delete button ────────────────────────────────────────────────────
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'task-delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', `Delete task: ${task.description}`);
      deleteBtn.dataset.action = 'delete';
      deleteBtn.dataset.id = task.id;

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      listEl.appendChild(li);
    });
  },

  /**
   * Activate inline editing for a task: replace the description span with
   * a pre-filled text input. Confirm on blur or Enter; cancel on Escape.
   * Requirements: 5.6, 5.7, 5.8
   * @param {string} id
   * @private
   */
  _activateEdit(id) {
    const listEl = document.getElementById('task-list');
    if (!listEl) return;

    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;

    // Find the description span inside the matching <li>
    const li = listEl.querySelector(`li[data-id="${id}"]`);
    if (!li) return;

    const span = li.querySelector('.task-description');
    if (!span) return;

    // Replace span with an input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = task.description;
    input.setAttribute('aria-label', 'Edit task description');
    input.maxLength = 500;

    // Disable the edit and delete buttons while editing
    const editBtn = li.querySelector('.task-edit-btn');
    const deleteBtn = li.querySelector('.task-delete-btn');
    if (editBtn) editBtn.disabled = true;
    if (deleteBtn) deleteBtn.disabled = true;

    span.replaceWith(input);
    input.focus();
    input.select();

    let committed = false;

    const commit = () => {
      if (committed) return;
      committed = true;
      this.editTask(id, input.value);
    };

    const cancel = () => {
      if (committed) return;
      committed = true;
      // Silently restore — just re-render without changing the task
      this.render();
    };

    input.addEventListener('blur', commit);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.removeEventListener('blur', commit);
        commit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        input.removeEventListener('blur', commit);
        cancel();
      }
    });
  },

  /**
   * Initialise the module: load tasks from Storage (falling back to []),
   * render, and bind the add-task form and task list event delegation.
   * Requirements: 5.11
   */
  init() {
    const saved = Storage.get(Storage.KEYS.TASKS);
    this.tasks = Array.isArray(saved) ? saved : [];

    this.render();

    // ── Add-task form ────────────────────────────────────────────────────────
    const addForm = document.getElementById('add-task-form');
    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('task-input');
        if (input) {
          this.addTask(input.value);
          input.value = '';
        }
      });
    }

    // ── Event delegation on the task list ────────────────────────────────────
    // Handles toggle (checkbox change), edit button clicks, and delete button clicks.
    const listEl = document.getElementById('task-list');
    if (listEl) {
      // Checkbox toggle
      listEl.addEventListener('change', (e) => {
        const target = /** @type {HTMLElement} */ (e.target);
        if (target.dataset.action === 'toggle' && target.dataset.id) {
          this.toggleTask(target.dataset.id);
        }
      });

      // Button clicks (edit / delete)
      listEl.addEventListener('click', (e) => {
        const target = /** @type {HTMLElement} */ (e.target);
        const action = target.dataset.action;
        const id = target.dataset.id;
        if (!action || !id) return;

        if (action === 'edit') {
          this._activateEdit(id);
        } else if (action === 'delete') {
          this.deleteTask(id);
        }
      });
    }
  },
};

// ─── URL Validation Helper ────────────────────────────────────────────────────

/**
 * Validate that a string is a well-formed http or https URL.
 * Pure function — no side effects.
 * Uses the URL constructor in a try/catch; returns true only if parsing
 * succeeds and the protocol is "http:" or "https:".
 * Requirements: 6.5
 * @param {string} url
 * @returns {boolean}
 */
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// ─── QuickLinks Module ────────────────────────────────────────────────────────
// Link management: add, delete, persist, and render user-defined URL shortcuts.
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8

const QuickLinks = {
  /** @type {Array<{id: string, label: string, url: string}>} */
  links: [],

  /**
   * Persist the current links list to localStorage.
   * Requirements: 6.7
   */
  persist() {
    Storage.set(Storage.KEYS.LINKS, this.links);
  },

  /**
   * Generate a collision-resistant string ID.
   * @returns {string}
   * @private
   */
  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  },

  /**
   * Add a new link. Validates that label is non-empty and url is a valid
   * http/https URL. Displays an inline error and returns early if invalid.
   * On success, pushes the link, persists, and re-renders.
   * Requirements: 6.4, 6.5
   * @param {string} label
   * @param {string} url
   */
  addLink(label, url) {
    const errorEl = document.getElementById('link-error');
    const trimmedLabel = label.trim();

    if (!trimmedLabel) {
      if (errorEl) errorEl.textContent = 'Link label cannot be empty.';
      return;
    }

    if (!isValidUrl(url)) {
      if (errorEl) errorEl.textContent = 'Please enter a valid http or https URL.';
      return;
    }

    // Clear any previous error
    if (errorEl) errorEl.textContent = '';

    this.links.push({
      id: this._generateId(),
      label: trimmedLabel,
      url,
    });

    this.persist();
    this.render();
  },

  /**
   * Remove the link with the given id, then persist and re-render.
   * Requirements: 6.6, 6.7
   * @param {string} id
   */
  deleteLink(id) {
    this.links = this.links.filter((link) => link.id !== id);
    this.persist();
    this.render();
  },

  /**
   * Build the links list DOM. Each link is rendered as a container with:
   * - An anchor that opens the URL in a new tab (rel="noopener noreferrer")
   * - A delete button with data-action="delete" and data-id for event delegation
   * Requirements: 6.1, 6.2
   */
  render() {
    const listEl = document.getElementById('links-list');
    if (!listEl) return;

    listEl.innerHTML = '';

    this.links.forEach((link) => {
      const container = document.createElement('div');
      container.className = 'link-item';
      container.dataset.id = link.id;

      // ── Link anchor ──────────────────────────────────────────────────────
      const anchor = document.createElement('a');
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.className = 'link-button';
      anchor.textContent = link.label;
      anchor.setAttribute('aria-label', `Open ${link.label} in a new tab`);

      // ── Delete button ────────────────────────────────────────────────────
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'link-delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', `Delete link: ${link.label}`);
      deleteBtn.dataset.action = 'delete';
      deleteBtn.dataset.id = link.id;

      container.appendChild(anchor);
      container.appendChild(deleteBtn);
      listEl.appendChild(container);
    });
  },

  /**
   * Initialise the module: load links from Storage (falling back to []),
   * render, and bind the add-link form and links list event delegation.
   * Requirements: 6.8
   */
  init() {
    const saved = Storage.get(Storage.KEYS.LINKS);
    this.links = Array.isArray(saved) ? saved : [];

    this.render();

    // ── Add-link form ────────────────────────────────────────────────────────
    const addForm = document.getElementById('add-link-form');
    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const labelInput = document.getElementById('link-label-input');
        const urlInput   = document.getElementById('link-url-input');
        if (labelInput && urlInput) {
          this.addLink(labelInput.value, urlInput.value);
          // Clear inputs only on success (error check: links grew)
          const errorEl = document.getElementById('link-error');
          if (!errorEl || !errorEl.textContent) {
            labelInput.value = '';
            urlInput.value   = '';
          }
        }
      });
    }

    // ── Event delegation on the links list ───────────────────────────────────
    const listEl = document.getElementById('links-list');
    if (listEl) {
      listEl.addEventListener('click', (e) => {
        const target = /** @type {HTMLElement} */ (e.target);
        if (target.dataset.action === 'delete' && target.dataset.id) {
          this.deleteLink(target.dataset.id);
        }
      });
    }
  },
};

// ─── Initialisation ──────────────────────────────────────────────────────────
// Wire all modules together and boot the dashboard once the DOM is ready.
// Modules are initialised in dependency order:
//   1. ThemeManager — apply saved theme before any content renders (avoids flash)
//   2. GreetingWidget — render time/date and start the 60-second clock interval
//   3. FocusTimer — restore saved duration, render MM:SS, bind controls
//   4. TodoList — load saved tasks, render list, bind add/edit/delete events
//   5. QuickLinks — load saved links, render buttons, bind add/delete events
// Requirements: 8.2, 4.4, 2.4, 7.4, 9.1

document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  GreetingWidget.init();
  FocusTimer.init();
  TodoList.init();
  QuickLinks.init();
});
