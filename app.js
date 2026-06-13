const STORAGE_KEY = "taskflow.tasks.v1";
const NOTES_TABLE = "notes";
const THEME_KEY = "taskflow.theme.v1";
const DENSITY_KEY = "taskflow.density.v1";
const SESSION_KEY = "taskflow.supabase.session.v1";
const OAUTH_MIGRATE_KEY = "taskflow.oauth.migrate.v1";
const PENDING_DELETE_KEY = "taskflow.pending.deletes.v1";
const PENDING_MEETING_DELETE_KEY = "taskflow.pending.meeting.deletes.v1";
const MEETING_TIMEZONE_KEY = "taskflow.meeting.timezone.v1";
const SUPABASE_TABLE = "tasks";
const MEETINGS_TABLE = "meetings";
const ONBOARDING_SEEN_KEY = "taskflow.onboarding.seen.v1";
const MEETING_HORIZON_MONTHS = 6;
const timezoneChoices = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Adelaide",
  "Australia/Perth",
  "Pacific/Auckland",
  "UTC",
  "America/Los_Angeles",
  "America/New_York",
  "Europe/London",
  "Asia/Tokyo",
];
const quickPlaceholders = [
  "Submit timesheet @admin !medium tomorrow 10m",
  "Write blog post #writing !high next Friday. Research, outline, draft, edit",
  "Fix login bug urgent @backend 90m",
  "Project, @tags, !priority, !date time",
];

const statuses = [
  { id: "backlog", label: "Backlog", icon: "inbox", color: "#8b949e" },
  { id: "planned", label: "Planned", icon: "calendar-check", color: "#2f6fd6" },
  { id: "progress", label: "In progress", icon: "loader", color: "#137a63" },
  { id: "waiting", label: "Waiting", icon: "pause-circle", color: "#ba7900" },
  { id: "done", label: "Done", icon: "check-circle-2", color: "#7357d9" },
];

const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
const priorityLabels = { urgent: "Urgent", high: "High", medium: "Medium", low: "Low" };
const smartViews = [
  { id: "all", label: "All tasks", icon: "layout-dashboard" },
  { id: "today", label: "Today", icon: "sun" },
  { id: "upcoming", label: "Upcoming", icon: "calendar-clock" },
  { id: "overdue", label: "Overdue", icon: "alert-triangle" },
  { id: "waiting", label: "Waiting", icon: "pause-circle" },
  { id: "completed", label: "Completed", icon: "badge-check" },
];
const onboardingSteps = [
  {
    title: "Welcome to TaskFlow",
    body: "Start with Smart add, then organise tasks on the board, events on the calendar, and anything loose in General notes.",
    hideBack: true
  },
  {
    title: "Smart add",
    body: "Just type a messy thought – TaskFlow automatically finds due dates, times, projects, tags, priorities, and subtasks.",
    example: "“Finish report @marketing !high tomorrow 2h. Draft, review, submit”"
  },
  {
    title: "Views for different moods",
    body: "Board is for moving work, List is for scanning, Calendar is for deadlines, Events is for classes or meetings, and Focus is for getting one thing done."
  },
  {
    title: "Your account keeps everything together",
    body: "Settings lets you change timezone, theme, density, import/export backups, and clear workspace data when needed.",
    isLast: true
  }
];
const els = {};
const selectedTasks = new Set();
let state = {
  tasks: [],
  meetings: [],
  notes: [],
  pendingNoteSyncIds: new Set(),
  pendingNoteDeleteIds: new Set(),
  user: null,
  session: null,
  isOnline: navigator.onLine,
  pendingSyncIds: new Set(),
  pendingDeleteIds: new Set(),
  pendingMeetingSyncIds: new Set(),
  pendingMeetingDeleteIds: new Set(),
  filters: {
    search: "",
    project: "all",
    tag: "all",
    priority: "all",
    due: "all",
    sort: "due",
  },
  smartView: "all",
  view: "board",
  focusTaskId: null,
  activeMeetingId: null,
  meetingTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Australia/Sydney",
  density: "comfortable",
};

let calendarCursor = startOfMonth(new Date());
let timer = {
  remaining: 25 * 60,
  running: false,
  intervalId: null,
};

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  loadTheme();
  loadDensity();
  loadMeetingTimezone();
  bindEvents();
  rotateQuickPlaceholder();
  initAuth();
});

function bindElements() {
  [
    //account and settings start//
    "accountDropdown",
    "dropdownMenu",
    "settingsDialog",
    "settingsThemeSelect",
    "settingsDensitySelect",
    "settingsExportBtn",
    "settingsImportBtn",
    "settingsClearDataBtn",
    "closeSettingsBtn",
    "settingsForm",
    //account and settings end//
    "welcomeDialog",
    "welcomeNextBtn",
    "welcomeBackBtn",
    "skipWelcomeBtn",
    "welcomeEyebrow",
    "welcomeTitle",
    "welcomeBody",
    "welcomeSteps",
    "authGate",
    "authEmailInput",
    "authPasswordForm",
    "authGoogleBtn",
    "authPasswordInput",
    "migrateLocalInput",
    "signInBtn",
    "createAccountBtn",
    "forgotPasswordBtn",
    "authMessage",
    "smartViews",
    "projectNav",
    "tagNav",
    "completionRing",
    "completionLabel",
    "metrics",
    "quickForm",
    "quickInput",
    "saveStatus",
    "accountChip",
    "signOutBtn",
    "densityToggle",
    "importBtn",
    "importFile",
    "exportBtn",
    "newTaskBtn",
    "searchInput",
    "projectFilter",
    "tagFilter",
    "priorityFilter",
    "dueFilter",
    "sortSelect",
    "clearFiltersBtn",
    "viewTitle",
    "viewSubtitle",
    "nudgePanel",
    "viewTabs",
    "boardView",
    "listView",
    "calendarView",
    "meetingsView",
    "analyticsView",
    "focusView",
    "taskDialog",
    "taskForm",
    "taskId",
    "dialogTitle",
    "closeDialogBtn",
    "titleInput",
    "projectInput",
    "projectSuggestions",
    "statusInput",
    "priorityInput",
    "dueInput",
    "dueTimeInput",
    "estimateInput",
    "energyInput",
    "recurrenceInput",
    "tagsInput",
    "notesInput",
    "subtaskList",
    "addSubtaskBtn",
    "deleteTaskBtn",
    "duplicateTaskBtn",
    "meetingDialog",
    "meetingForm",
    "meetingId",
    "meetingDialogTitle",
    "closeMeetingDialogBtn",
    "meetingTitleInput",
    "meetingSubjectInput",
    "meetingStatusInput",
    "meetingDateInput",
    "meetingStartInput",
    "meetingEndInput",
    "meetingRecurrenceInput",
    "meetingRepeatUntilInput",
    "meetingTeacherInput",
    "meetingLocationInput",
    "meetingTopicInput",
    "meetingNotesInput",
    "meetingCreateTaskBtn",
    "deleteMeetingBtn",
    "deleteMeetingsDialog",
    "deleteMeetingsForm",
    "deleteMeetingsScope",
    "cancelDeleteMeetingsBtn",
    "confirmDialog",
    "confirmTitle",
    "confirmMessage",
    "confirmActionBtn",
    "toastContainer",
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindEvents() {
  // Settings dialog
  if (els.settingsForm) {
    els.settingsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const theme = els.settingsThemeSelect.value;
      const density = els.settingsDensitySelect.value;

      // Apply theme
      document.documentElement.dataset.theme = theme;
      localStorage.setItem(THEME_KEY, theme);
      setThemeIcon(theme);

      // Apply density
      state.density = density;
      document.documentElement.dataset.density = density;
      localStorage.setItem(DENSITY_KEY, density);
      setDensityButton();

      els.settingsDialog.close();
      toast("Settings saved");
    });
  }

  if (els.closeSettingsBtn) {
    els.closeSettingsBtn.addEventListener("click", () => els.settingsDialog.close());
  }

  if (els.settingsExportBtn) {
    els.settingsExportBtn.addEventListener("click", () => exportTasks());
  }

  if (els.settingsImportBtn) {
    els.settingsImportBtn.addEventListener("click", () => els.importFile.click());
  }

  if (els.settingsClearDataBtn) {
    els.settingsClearDataBtn.addEventListener("click", () => {
      confirmAction("Clear workspace data?", "This will remove all local tasks and meetings. Cloud sync will restore your data on next sync.", () => {
        state.tasks = [];
        state.meetings = [];
        persist();
        renderAll();
        toast("Local workspace cleared. Sync will restore cloud data.");
      });
    });
  }
  if (els.importFile) {
    els.importFile.addEventListener("change", importTasks);
  } else {
    console.warn("importFile element not found");
  }

  // Dropdown settings action
  document.querySelectorAll("[data-action='settings']").forEach(btn => {
    btn.addEventListener("click", () => {
      const currentTheme = document.documentElement.dataset.theme || "light";
      els.settingsThemeSelect.value = currentTheme;
      els.settingsDensitySelect.value = state.density;
      els.settingsDialog.showModal();
    });
  });

  document.querySelectorAll("[data-action='signout']").forEach(btn => {
    btn.addEventListener("click", () => handleSignOut());
  });

  // Welcome dialog onboarding
  if (els.welcomeNextBtn) els.welcomeNextBtn.addEventListener("click", nextOnboardingStep);
  if (els.welcomeBackBtn) els.welcomeBackBtn.addEventListener("click", prevOnboardingStep);
  if (els.skipWelcomeBtn) els.skipWelcomeBtn.addEventListener("click", finishOnboarding);

  // Other listeners
  els.authPasswordForm.addEventListener("submit", handleSignIn);
  els.authGoogleBtn.addEventListener("click", handleGoogleSignIn);
  els.createAccountBtn.addEventListener("click", handleCreateAccount);
  els.forgotPasswordBtn.addEventListener("click", handlePasswordReset);
if (els.signOutBtn) els.signOutBtn.addEventListener("click", handleSignOut);
  els.quickForm.addEventListener("submit", handleQuickAdd);
  els.quickInput.addEventListener("input", autosizeQuickInput);
  els.quickInput.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      els.quickForm.requestSubmit();
    }
  });

  els.newTaskBtn.addEventListener("click", () => openTaskDialog());
  els.clearFiltersBtn.addEventListener("click", clearFilters);

  els.searchInput.addEventListener("input", (event) => {
    state.filters.search = event.target.value.trim().toLowerCase();
    renderAll();
  });

  [
    ["projectFilter", "project"],
    ["tagFilter", "tag"],
    ["priorityFilter", "priority"],
    ["dueFilter", "due"],
    ["sortSelect", "sort"],
  ].forEach(([elementId, key]) => {
    els[elementId].addEventListener("change", (event) => {
      state.filters[key] = event.target.value;
      renderAll();
    });
  });

  els.viewTabs.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-view]");
    if (!tab) return;
    state.view = tab.dataset.view;
    renderWorkspaceTitle();
    renderNudgePanel();
    updateViewVisibility();
    renderActiveView();
    refreshIcons();
  });

  els.taskForm.addEventListener("submit", saveTaskFromDialog);
  els.closeDialogBtn.addEventListener("click", () => els.taskDialog.close());
  els.addSubtaskBtn.addEventListener("click", () => addSubtaskRow());
  els.deleteTaskBtn.addEventListener("click", handleDeleteFromDialog);
  els.duplicateTaskBtn.addEventListener("click", handleDuplicateFromDialog);
  els.meetingForm.addEventListener("submit", saveMeetingFromDialog);
  els.closeMeetingDialogBtn.addEventListener("click", () => els.meetingDialog.close());
  els.deleteMeetingBtn.addEventListener("click", handleDeleteMeetingFromDialog);
  els.meetingCreateTaskBtn.addEventListener("click", createTaskFromMeetingDialog);
  els.deleteMeetingsForm.addEventListener("submit", handleDeleteMeetingsScope);
  els.cancelDeleteMeetingsBtn.addEventListener("click", () => els.deleteMeetingsDialog.close());

  document.addEventListener("keydown", (event) => {
    const isModifier = event.ctrlKey || event.metaKey;
    if (isModifier && event.key.toLowerCase() === "k") {
      event.preventDefault();
      els.quickInput.focus();
    }
    if (isModifier && event.key.toLowerCase() === "n") {
      event.preventDefault();
      openTaskDialog();
    }
  });

  window.addEventListener("online", () => {
    state.isOnline = true;
    updateSaveStatus();
    syncPendingTasks();
  });

  window.addEventListener("offline", () => {
    state.isOnline = false;
    updateSaveStatus();
  });
}

function loadDensity() {
  const stored = localStorage.getItem(DENSITY_KEY);
  state.density = stored === "compact" ? "compact" : "comfortable";
  document.documentElement.dataset.density = state.density;
  setDensityButton();
}

function toggleDensity() {
  state.density = state.density === "compact" ? "comfortable" : "compact";
  document.documentElement.dataset.density = state.density;
  localStorage.setItem(DENSITY_KEY, state.density);
  setDensityButton();
  toast(`${state.density === "compact" ? "Compact" : "Comfortable"} density`);
}
let currentOnboardingStep = 0;

let onboardingShown = false;

function showOnboarding() {
  // If already shown in this session, or key exists, do nothing
  if (onboardingShown) return;
  if (localStorage.getItem(ONBOARDING_SEEN_KEY) === "true") return;

  const dialog = document.getElementById("welcomeDialog");
  if (!dialog) return;

  // Force close any existing instance (should not be open, but just in case)
  if (dialog.open) dialog.close();

  onboardingShown = true;
  currentOnboardingStep = 0;
  updateOnboardingStep();
  dialog.showModal();
}

function updateOnboardingStep() {
  const step = onboardingSteps[currentOnboardingStep];
  if (!step) return;

  const eyebrowEl = document.getElementById("welcomeEyebrow");
  const titleEl = document.getElementById("welcomeTitle");
  const bodyEl = document.getElementById("welcomeBody");
  const stepsContainer = document.getElementById("welcomeSteps");
  const backBtn = document.getElementById("welcomeBackBtn");
  const nextBtn = document.getElementById("welcomeNextBtn");

  if (eyebrowEl) eyebrowEl.textContent = `Step ${currentOnboardingStep + 1} of ${onboardingSteps.length}`;
  if (titleEl) titleEl.textContent = step.title;
  
  let bodyHtml = `<p>${escapeHtml(step.body)}</p>`;
  if (step.example) {
    bodyHtml += `<div class="welcome-example"><code>${escapeHtml(step.example)}</code></div>`;
  }
  if (bodyEl) bodyEl.innerHTML = bodyHtml;

  if (backBtn) backBtn.style.visibility = step.hideBack ? "hidden" : "visible";
  if (nextBtn) {
    nextBtn.innerHTML = step.isLast ? 'Continue →' : 'Next →';
  }

  if (stepsContainer) {
    stepsContainer.innerHTML = onboardingSteps.map((_, idx) => 
      `<span class="welcome-dot ${idx === currentOnboardingStep ? 'active' : ''}"></span>`
    ).join("");
  }

  if (window.lucide) window.lucide.createIcons();
}

function nextOnboardingStep() {
  if (currentOnboardingStep + 1 < onboardingSteps.length) {
    currentOnboardingStep++;
    updateOnboardingStep();
  } else {
    // Last step: close the dialog right away
    const dialog = document.getElementById("welcomeDialog");
    if (dialog) {
      dialog.close();
      dialog.style.display = "none";
    }
    finishOnboarding();
  }
}

function prevOnboardingStep() {
  if (currentOnboardingStep > 0) {
    currentOnboardingStep--;
    updateOnboardingStep();
  }
}

function finishOnboarding() {
  localStorage.setItem(ONBOARDING_SEEN_KEY, "true");
  onboardingShown = false;

  const dialog = document.getElementById("welcomeDialog");
  if (dialog) {
    dialog.close();
    dialog.removeAttribute("open");
    dialog.style.display = "none";
    // Remove backdrop if any
    document.querySelectorAll("dialog::backdrop").forEach(b => b.remove());
  }

  toast("Ready to go! Start adding your first task.");
}
function setDensityButton() {
  if (!els.densityToggle) return;  // ← add this guard
  const compact = state.density === "compact";
  els.densityToggle.innerHTML = `<i data-lucide="${compact ? "panel-top-open" : "rows-3"}"></i>${compact ? "Comfort" : "Compact"}`;
  refreshIcons();
}

function loadMeetingTimezone() {
  const stored = localStorage.getItem(MEETING_TIMEZONE_KEY);
  if (stored) state.meetingTimezone = stored;
}

function setMeetingTimezone(timezone) {
  state.meetingTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Australia/Sydney";
  localStorage.setItem(MEETING_TIMEZONE_KEY, state.meetingTimezone);
  toast(`Event time zone set to ${formatTimezoneOffsetLabel(state.meetingTimezone)}`);
}

function loadTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const theme = stored || (prefersDark ? "dark" : "light");
  document.documentElement.dataset.theme = theme;
  setThemeIcon(theme);
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
  setThemeIcon(next);
}

function setThemeIcon(theme) {
  if (els.themeToggle) {
    els.themeToggle.innerHTML = `<i data-lucide="${theme === "dark" ? "sun" : "moon"}"></i>`;
    refreshIcons();
  }
}

async function initAuth() {
  document.body.classList.add("auth-loading");
  document.body.classList.remove("auth-required", "auth-ready");
  loadTasks({ allowSeed: false });

  if (!getSupabaseConfig()) {
    setAuthMessage("Supabase is not configured yet. Add your project URL and publishable key in config.js.", "error");
    showAuthGate();
    return;
  }

  const oauthResult = readOAuthSessionFromUrl();
  if (oauthResult.error) {
    showAuthGate();
    setAuthMessage(oauthResult.error, "error");
    return;
  }
  if (oauthResult.session?.access_token) {
    try {
      const migrateLocalTasks = sessionStorage.getItem(OAUTH_MIGRATE_KEY) !== "0";
      sessionStorage.removeItem(OAUTH_MIGRATE_KEY);
      await completeAuth(oauthResult.session, "Signed in with Google", { migrateLocalTasks });
      return;
    } catch (error) {
      clearStoredSession();
      state.session = null;
      state.user = null;
      showAuthGate();
      setAuthMessage(readableError(error), "error");
      return;
    }
  }

  const stored = loadStoredSession();
  if (!stored?.access_token) {
    showAuthGate();
    return;
  }

  try {
    state.session = stored;
    try {
      state.user = await getCurrentUser();
    } catch {
      state.session = await refreshSession(stored.refresh_token);
      storeSession(state.session);
      state.user = state.session.user || (await getCurrentUser());
    }
    loadPendingDeletes();
    await loadCloudTasks();
    await syncPendingDeletes();
    showApp();
  } catch {
    clearStoredSession();
    state.session = null;
    state.user = null;
    setAuthMessage("Please sign in to sync your TaskFlow workspace.", "");
    showAuthGate();
  }
}

function getSupabaseConfig() {
  const config = window.TASKFLOW_SUPABASE || {};
  const url = String(config.url || "").replace(/\/$/, "");
  const key = String(config.key || "");
  if (!url || !key) return null;
  return { url, key };
}

function showAuthGate() {
  document.body.classList.remove("auth-loading", "auth-ready");
  document.body.classList.add("auth-required");
  showAuthForm();
  setAuthMessage("Sign in or create an account to continue.", "");
  refreshIcons();
}

function showApp() {
  document.body.classList.remove("auth-loading", "auth-required");
  document.body.classList.add("auth-ready");
  updateAccountChip();
  updateSaveStatus();
  renderAll();
}

function showAuthForm() {
  els.authPasswordForm.hidden = false;
  const migrateRow = els.migrateLocalInput?.closest(".auth-check");
  if (migrateRow) migrateRow.hidden = readLocalTasks().length === 0;
  els.authEmailInput.focus();
}

function setAuthMessage(message, type = "") {
  els.authMessage.textContent = message;
  els.authMessage.className = `auth-message ${type}`.trim();
}

async function handleSignIn(event) {
  event.preventDefault();
  const email = els.authEmailInput.value.trim().toLowerCase();
  const password = els.authPasswordInput.value;
  if (!email || !password) return;
  await withAuthBusy("Signing in...", async () => {
    const session = await signInWithPassword(email, password);
    await completeAuth(session, "Signed in and synced");
  });
}

async function handleCreateAccount() {
  const email = els.authEmailInput.value.trim().toLowerCase();
  const password = els.authPasswordInput.value;
  if (!email || !password) {
    setAuthMessage("Enter an email and a password with at least 6 characters.", "error");
    return;
  }
  await withAuthBusy("Creating your account...", async () => {
    const session = await signUpWithPassword(email, password);
    if (!session?.access_token) {
      setAuthMessage("Account created. Check your email to confirm it, then sign in here.", "success");
      return;
    }
    await completeAuth(session, "Account created and synced");
  });
}

async function handleGoogleSignIn() {
  const config = getSupabaseConfig();
  if (!config) {
    setAuthMessage("Supabase is not configured yet. Add your project URL and publishable key in config.js.", "error");
    return;
  }
  sessionStorage.setItem(OAUTH_MIGRATE_KEY, els.migrateLocalInput.checked ? "1" : "0");
  setAuthMessage("Redirecting to Google...", "");
  setAuthButtonsDisabled(true);
  const redirectTo = getAuthRedirectUrl();
  const url = new URL(`${config.url}/auth/v1/authorize`);
  url.searchParams.set("provider", "google");
  url.searchParams.set("redirect_to", redirectTo);
  window.location.assign(url.toString());
}

async function handlePasswordReset() {
  const email = els.authEmailInput.value.trim().toLowerCase();
  if (!email) {
    setAuthMessage("Enter your email first, then request a reset link.", "error");
    return;
  }
  await withAuthBusy("Sending reset email...", async () => {
    await resetPasswordForEmail(email);
    setAuthMessage("Password reset email sent. Check your inbox.", "success");
  });
}

async function handleSignOut() {
  try {
    if (state.session?.access_token) await authRequest("/logout", { method: "POST" });
  } catch {
    // Local sign out still clears this browser if the network request fails.
  }
  state.session = null;
  state.user = null;
  state.tasks = [];
  state.meetings = [];
  selectedTasks.clear();
  clearStoredSession();
  localStorage.removeItem(STORAGE_KEY);
  setAuthMessage("Signed out. Sign in again to access your synced tasks.", "success");
  showAuthGate();
}

async function withAuthBusy(message, callback) {
  setAuthMessage(message, "");
  setAuthButtonsDisabled(true);
  try {
    await callback();
  } catch (error) {
    setAuthMessage(readableError(error), "error");
  } finally {
    setAuthButtonsDisabled(false);
    refreshIcons();
  }
}

function setAuthButtonsDisabled(disabled) {
  [els.signInBtn, els.createAccountBtn, els.forgotPasswordBtn, els.authGoogleBtn].forEach((button) => {
    if (button) button.disabled = disabled;
  });
}

async function completeAuth(session, message, options = {}) {
  const { migrateLocalTasks = els.migrateLocalInput.checked } = options;
  const localBeforeCloudLoad = readLocalWorkspace();
  state.session = session;
  state.user = session.user || (await getCurrentUser());
  storeSession(session);
  loadPendingDeletes();
  await loadCloudTasks();
  if (migrateLocalTasks) await migrateLocalTasksToCloud(localBeforeCloudLoad);
  showApp();
  toast(message);

  // Show onboarding for first-time users only
  if (!localStorage.getItem(ONBOARDING_SEEN_KEY)) {
    setTimeout(() => showOnboarding(), 500);
  }
}
function loadTasks(options = {}) {
  const { allowSeed = true } = options;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    state.tasks = allowSeed ? seedTasks() : [];
    state.meetings = [];
    state.notes = [];                     // <-- initialize empty notes
    if (allowSeed) persist();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    state.tasks = Array.isArray(parsed.tasks) ? parsed.tasks.map(normalizeTask) : [];
    state.meetings = Array.isArray(parsed.meetings) ? parsed.meetings.map(normalizeMeeting) : [];
    state.notes = Array.isArray(parsed.notes) ? parsed.notes.map(normalizeNote) : [];  // <-- load notes
    topUpRecurringMeetings();
  } catch {
    state.tasks = allowSeed ? seedTasks() : [];
    state.meetings = [];
    state.notes = [];
    if (allowSeed) persist();
  }
}
function persist() {
  const savedAt = new Date();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      exportedAt: savedAt.toISOString(),
      tasks: state.tasks,
      meetings: state.meetings,
      notes: state.notes,            // <-- added notes
    })
  );
  updateSaveStatus(savedAt);
  if (state.session?.access_token) {
    syncAllWorkspace().catch((error) => {
      console.warn("TaskFlow sync failed", error);
      state.tasks.forEach((task) => state.pendingSyncIds.add(task.id));
      state.meetings.forEach((meeting) => state.pendingMeetingSyncIds.add(meeting.id));
      state.notes.forEach((note) => state.pendingNoteSyncIds.add(note.id));   // <-- track pending note syncs
      updateSaveStatus();
    });
  }
}
function loadStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearStoredSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(PENDING_DELETE_KEY);
  localStorage.removeItem(PENDING_MEETING_DELETE_KEY);
}

function getAuthRedirectUrl() {
  const configured = String(window.TASKFLOW_SUPABASE?.redirectUrl || "").trim();
  if (configured) return configured;
  if (window.location.origin === "null") return window.location.href.split("#")[0];
  return `${window.location.origin}${window.location.pathname}`;
}

function readOAuthSessionFromUrl() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const error = params.get("error_description") || params.get("error") || query.get("error_description") || query.get("error");
  const accessToken = params.get("access_token");
  if (window.location.hash || error) {
    window.history.replaceState(null, document.title, getAuthRedirectUrl());
  }
  if (error) return { error };
  if (!accessToken) return {};
  return {
    session: normalizeSession({
      access_token: accessToken,
      refresh_token: params.get("refresh_token"),
      expires_in: Number(params.get("expires_in") || 0),
      expires_at: Number(params.get("expires_at") || 0) || null,
      token_type: params.get("token_type") || "bearer",
    }),
  };
}

async function signInWithPassword(email, password) {
  const data = await authRequest("/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return normalizeSession(data);
}

async function signUpWithPassword(email, password) {
  const data = await authRequest("/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return normalizeSession(data);
}

async function resetPasswordForEmail(email) {
  const redirectTo = window.location.origin === "null" ? window.location.href : window.location.origin;
  await authRequest("/recover", {
    method: "POST",
    body: JSON.stringify({ email, redirect_to: redirectTo }),
  });
}

async function refreshSession(refreshToken) {
  if (!refreshToken) throw new Error("Session expired. Please sign in again.");
  const data = await authRequest("/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  return normalizeSession(data);
}

async function getCurrentUser() {
  const data = await authRequest("/user", { method: "GET" });
  return data.user || data;
}

async function authRequest(path, options = {}) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");
  const headers = {
    apikey: config.key,
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (state.session?.access_token) headers.Authorization = `Bearer ${state.session.access_token}`;
  const response = await fetch(`${config.url}/auth/v1${path}`, {
    ...options,
    headers,
  });
  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(data?.msg || data?.message || data?.error_description || "Authentication failed.");
  return data;
}

async function restRequest(path, options = {}) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");
  if (!state.session?.access_token) throw new Error("Please sign in first.");
  const headers = {
    apikey: config.key,
    Authorization: `Bearer ${state.session.access_token}`,
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const response = await fetch(`${config.url}/rest/v1${path}`, {
    ...options,
    headers,
  });
  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(data?.message || data?.hint || "Sync failed.");
  return data;
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function normalizeSession(data) {
  if (!data) return null;
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at || (data.expires_in ? Math.floor(Date.now() / 1000) + data.expires_in : null),
    token_type: data.token_type || "bearer",
    user: data.user || null,
  };
}

async function loadCloudTasks() {
  const rows = await restRequest(`/${SUPABASE_TABLE}?select=*&order=updated_at.desc`, { method: "GET" });
  state.tasks = Array.isArray(rows)
    ? rows.map(rowToTask).filter((task) => !state.pendingDeleteIds.has(task.id))
    : [];
  try {
    const meetingRows = await restRequest(`/${MEETINGS_TABLE}?select=*&order=meeting_date.asc,start_time.asc`, { method: "GET" });
    state.meetings = Array.isArray(meetingRows)
      ? meetingRows.map(rowToMeeting).filter((meeting) => !state.pendingMeetingDeleteIds.has(meeting.id))
      : [];
    topUpRecurringMeetings();
  } catch (error) {
    console.warn("Meetings sync unavailable", error);
    state.meetings = readLocalWorkspace().meetings;
  }
  selectedTasks.clear();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      exportedAt: new Date().toISOString(),
      tasks: state.tasks,
      meetings: state.meetings,
    })
  );
  updateSaveStatus();
}

async function migrateLocalTasksToCloud(localWorkspaceToMigrate = readLocalWorkspace()) {
  // Migrate tasks
  const localTasks = localWorkspaceToMigrate.tasks.filter(
    (task) => !state.tasks.some((cloudTask) => cloudTask.id === task.id)
  );
  // Migrate meetings
  const localMeetings = localWorkspaceToMigrate.meetings.filter(
    (meeting) => !state.meetings.some((cloudMeeting) => cloudMeeting.id === meeting.id)
  );
  // Migrate notes
  const localNotes = (localWorkspaceToMigrate.notes || []).filter(
    (note) => !state.notes.some((cloudNote) => cloudNote.id === note.id)
  );

  if (!localTasks.length && !localMeetings.length && !localNotes.length) return;

  // Merge tasks, meetings, notes
  state.tasks = sortTasks([...localTasks, ...state.tasks].map(normalizeTask), "created");
  state.meetings = sortMeetings([...localMeetings, ...state.meetings].map(normalizeMeeting));
  state.notes = [...localNotes, ...state.notes].map(normalizeNote);

  // Sync everything to cloud
  await syncAllWorkspace();

  // Persist merged data to local storage
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      exportedAt: new Date().toISOString(),
      tasks: state.tasks,
      meetings: state.meetings,
      notes: state.notes,
    })
  );
}
function readLocalTasks() {
  return readLocalWorkspace().tasks;
}

function readLocalWorkspace() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return {
      tasks: Array.isArray(parsed?.tasks) ? parsed.tasks.map(normalizeTask) : [],
      meetings: Array.isArray(parsed?.meetings) ? parsed.meetings.map(normalizeMeeting) : [],
    };
  } catch {
    return { tasks: [], meetings: [] };
  }
}

async function syncAllWorkspace() {
  // Sync tasks
  if (!state.isOnline || !state.session?.access_token || !state.user?.id || !state.tasks.length) {
    updateSaveStatus();
  } else {
    const rows = state.tasks.map(taskToRow);
    await restRequest(`/${SUPABASE_TABLE}?on_conflict=id`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(rows),
    });
    state.pendingSyncIds.clear();
  }

  // Sync meetings
  if (state.isOnline && state.session?.access_token && state.user?.id && state.meetings.length) {
    const meetingRows = state.meetings.map(meetingToRow);
    await restRequest(`/${MEETINGS_TABLE}?on_conflict=id`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(meetingRows),
    });
    state.pendingMeetingSyncIds.clear();
  }

  // Sync notes
  if (state.isOnline && state.session?.access_token && state.user?.id && state.notes.length) {
    const noteRows = state.notes.map(noteToRow);
    await restRequest(`/${NOTES_TABLE}?on_conflict=id`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(noteRows),
    });
    state.pendingNoteSyncIds.clear();
  }

  updateSaveStatus();
}

async function syncPendingTasks() {
  if (!state.session?.access_token) return;
  try {
    await syncPendingDeletes();
    await syncAllWorkspace();
    toast("Cloud sync restored");
  } catch (error) {
    console.warn("Pending sync failed", error);
  }
}

async function deleteCloudTasks(ids) {
  const cleanIds = ids.filter(Boolean);
  if (!cleanIds.length) return;
  if (!state.session?.access_token || !state.isOnline) {
    queueDeletedTasks(cleanIds);
    return;
  }
  try {
    await Promise.all(
      cleanIds.map((id) =>
        restRequest(`/${SUPABASE_TABLE}?id=eq.${encodeURIComponent(id)}`, {
          method: "DELETE",
        })
      )
    );
    cleanIds.forEach((id) => state.pendingDeleteIds.delete(id));
    savePendingDeletes();
    updateSaveStatus();
  } catch (error) {
    queueDeletedTasks(cleanIds);
    throw error;
  }
}

async function deleteCloudMeetings(ids) {
  const cleanIds = ids.filter(Boolean);
  if (!cleanIds.length) return;
  if (!state.session?.access_token || !state.isOnline) {
    queueDeletedMeetings(cleanIds);
    return;
  }
  try {
    await Promise.all(
      cleanIds.map((id) =>
        restRequest(`/${MEETINGS_TABLE}?id=eq.${encodeURIComponent(id)}`, {
          method: "DELETE",
        })
      )
    );
    cleanIds.forEach((id) => state.pendingMeetingDeleteIds.delete(id));
    savePendingDeletes();
    updateSaveStatus();
  } catch (error) {
    queueDeletedMeetings(cleanIds);
    throw error;
  }
}

function queueDeletedTasks(ids) {
  ids.forEach((id) => state.pendingDeleteIds.add(id));
  savePendingDeletes();
  updateSaveStatus();
}

function queueDeletedMeetings(ids) {
  ids.forEach((id) => state.pendingMeetingDeleteIds.add(id));
  savePendingDeletes();
  updateSaveStatus();
}

function loadPendingDeletes() {
  try {
    const ids = JSON.parse(localStorage.getItem(PENDING_DELETE_KEY) || "[]");
    state.pendingDeleteIds = new Set(Array.isArray(ids) ? ids : []);
  } catch {
    state.pendingDeleteIds = new Set();
  }
  try {
    const ids = JSON.parse(localStorage.getItem(PENDING_MEETING_DELETE_KEY) || "[]");
    state.pendingMeetingDeleteIds = new Set(Array.isArray(ids) ? ids : []);
  } catch {
    state.pendingMeetingDeleteIds = new Set();
  }
}

function savePendingDeletes() {
  localStorage.setItem(PENDING_DELETE_KEY, JSON.stringify([...state.pendingDeleteIds]));
  localStorage.setItem(PENDING_MEETING_DELETE_KEY, JSON.stringify([...state.pendingMeetingDeleteIds]));
}

async function syncPendingDeletes() {
  if (!state.session?.access_token || !state.isOnline) return;
  const ids = [...state.pendingDeleteIds];
  const meetingIds = [...state.pendingMeetingDeleteIds];
  if (ids.length) {
    await Promise.all(
      ids.map((id) =>
        restRequest(`/${SUPABASE_TABLE}?id=eq.${encodeURIComponent(id)}`, {
          method: "DELETE",
        })
      )
    );
  }
  if (meetingIds.length) {
    await Promise.all(
      meetingIds.map((id) =>
        restRequest(`/${MEETINGS_TABLE}?id=eq.${encodeURIComponent(id)}`, {
          method: "DELETE",
        })
      )
    );
  }
  state.pendingDeleteIds.clear();
  state.pendingMeetingDeleteIds.clear();
  savePendingDeletes();
  updateSaveStatus();
}

function taskToRow(task) {
  return {
    id: task.id,
    user_id: state.user.id,
    title: task.title,
    project: task.project || "Inbox",
    status: task.status,
    priority: task.priority,
    due_date: task.dueDate || null,
    estimate: Number(task.estimate || 0),
    energy: task.energy,
    recurrence: task.recurrence,
    tags: task.tags || [],
    notes: withDueTimeNote(task.notes || "", task.dueTime || ""),
    subtasks: task.subtasks || [],
    created_at: task.createdAt || new Date().toISOString(),
    completed_at: task.completedAt || null,
    updated_at: new Date().toISOString(),
  };
}

function rowToTask(row) {
  return normalizeTask({
    id: row.id,
    title: row.title,
    project: row.project,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date || "",
    dueTime: dueTimeFromNotes(row.notes || ""),
    estimate: row.estimate,
    energy: row.energy,
    recurrence: row.recurrence,
    tags: row.tags || [],
    notes: row.notes,
    subtasks: row.subtasks || [],
    createdAt: row.created_at,
    completedAt: row.completed_at,
  });
}

function meetingToRow(meeting) {
  return {
    id: meeting.id,
    user_id: state.user.id,
    series_id: meeting.seriesId || meeting.id,
    title: meeting.title,
    subject: meeting.subject || "Events",
    topic: meeting.topic || "",
    teacher: meeting.teacher || "",
    location: meeting.location || "",
    meeting_date: meeting.date,
    start_time: meeting.startTime,
    end_time: meeting.endTime || null,
    recurrence: meeting.recurrence || "none",
    recurrence_end_date: meeting.recurrenceEndDate || null,
    notes: meeting.notes || "",
    status: meeting.status || "scheduled",
    linked_task_ids: meeting.linkedTaskIds || [],
    imported_uid: meeting.importedUid || "",
    created_at: meeting.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function rowToMeeting(row) {
  return normalizeMeeting({
    id: row.id,
    seriesId: row.series_id,
    title: row.title,
    subject: row.subject,
    topic: row.topic,
    teacher: row.teacher,
    location: row.location,
    date: row.meeting_date,
    startTime: normalizeClockValue(row.start_time),
    endTime: normalizeClockValue(row.end_time),
    recurrence: row.recurrence,
    recurrenceEndDate: row.recurrence_end_date || "",
    notes: row.notes,
    status: row.status,
    linkedTaskIds: row.linked_task_ids || [],
    importedUid: row.imported_uid || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function updateAccountChip() {
  if (!els.accountChip) return;
  const email = state.user?.email || "Signed in";
  els.accountChip.innerHTML = `<i data-lucide="user-circle"></i><span>${escapeHtml(email)}</span>`;
}

function readableError(error) {
  const message = String(error?.message || error || "Something went wrong.");
  if (message.toLowerCase().includes("invalid login")) return "That email and password did not match. Try again or create an account.";
  if (message.toLowerCase().includes("already registered")) return "That account already exists. Sign in instead.";
  if (message.toLowerCase().includes("failed to fetch")) return "Could not reach Supabase. Check your connection and project settings.";
  if (message.toLowerCase().includes("row-level security")) return "Supabase blocked the request. Check the tasks/meetings table RLS policies.";
  return message;
}

function renderAll() {
  selectedTasks.forEach((id) => {
    if (!state.tasks.some((task) => task.id === id)) selectedTasks.delete(id);
  });
  hydrateFilterOptions();
  renderSidebar();
  renderMetrics();
  renderWorkspaceTitle();
  renderNudgePanel();
  updateViewVisibility();
  renderActiveView();
  refreshIcons();
}

function renderActiveView() {
  if (state.view === "board") renderBoard();
  if (state.view === "list") renderList();
  if (state.view === "calendar") renderCalendar();
  if (state.view === "meetings") renderMeetings();
  if (state.view === "analytics") renderAnalytics();
  if (state.view === "focus") renderFocus();
}

function updateSaveStatus(date = new Date()) {
  if (!els.saveStatus) return;
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (!state.session?.access_token) {
    els.saveStatus.innerHTML = `<i data-lucide="lock"></i>Sign in required`;
  } else if (!state.isOnline) {
    els.saveStatus.innerHTML = `<i data-lucide="cloud-off"></i>Offline cache`;
  } else if (state.pendingSyncIds.size || state.pendingDeleteIds.size || state.pendingMeetingSyncIds.size || state.pendingMeetingDeleteIds.size) {
    els.saveStatus.innerHTML = `<i data-lucide="refresh-cw"></i>Sync pending`;
  } else {
    els.saveStatus.innerHTML = `<i data-lucide="cloud-check"></i>Synced ${time.replace(/^0/, "")}`;
  }
  refreshIcons();
}

function rotateQuickPlaceholder() {
  let index = 0;
  els.quickInput.placeholder = quickPlaceholders[index];
  window.setInterval(() => {
    if (document.activeElement === els.quickInput || els.quickInput.value) return;
    index = (index + 1) % quickPlaceholders.length;
    els.quickInput.placeholder = quickPlaceholders[index];
  }, 4200);
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderSidebar() {
  const counts = {
    all: state.tasks.length,
    today: state.tasks.filter((task) => isToday(task.dueDate) && task.status !== "done").length,
    upcoming: state.tasks.filter((task) => isUpcoming(task.dueDate) && task.status !== "done").length,
    overdue: state.tasks.filter((task) => isOverdue(task)).length,
    waiting: state.tasks.filter((task) => task.status === "waiting").length,
    completed: state.tasks.filter((task) => task.status === "done").length,
  };

  els.smartViews.innerHTML = smartViews
    .map(
      (view) => `
        <button class="nav-item ${state.smartView === view.id ? "active" : ""}" type="button" data-smart="${view.id}">
          <i data-lucide="${view.icon}"></i>
          <span>${escapeHtml(view.label)}</span>
          <span class="count">${counts[view.id] || 0}</span>
        </button>
      `
    )
    .join("");

  els.smartViews.querySelectorAll("[data-smart]").forEach((button) => {
    button.addEventListener("click", () => {
      state.smartView = button.dataset.smart;
      renderAll();
    });
  });

  const projects = getProjects();
  els.projectNav.innerHTML = projects
    .map((project) => {
      const count =
        state.tasks.filter((task) => task.project === project).length +
        state.meetings.filter((meeting) => meeting.subject === project).length;
      return `
        <button class="nav-item ${state.filters.project === project ? "active" : ""}" type="button" data-project="${escapeAttr(project)}">
          <i data-lucide="folder"></i>
          <span>${escapeHtml(project)}</span>
          <span class="count">${count}</span>
        </button>
      `;
    })
    .join("");

  els.projectNav.querySelectorAll("[data-project]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.project = state.filters.project === button.dataset.project ? "all" : button.dataset.project;
      renderAll();
    });
  });

  const tags = getTags();
  els.tagNav.innerHTML = tags.length
    ? tags
        .slice(0, 18)
        .map(
          (tag) =>
            `<button class="tag-pill ${state.filters.tag === tag ? "active" : ""}" type="button" data-tag="${escapeAttr(tag)}">#${escapeHtml(tag)}</button>`
        )
        .join("")
    : `<span class="tag-pill">No tags yet</span>`;

  els.tagNav.querySelectorAll("[data-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.tag = state.filters.tag === button.dataset.tag ? "all" : button.dataset.tag;
      renderAll();
    });
  });

  const completed = state.tasks.filter((task) => task.status === "done").length;
  const percent = state.tasks.length ? Math.round((completed / state.tasks.length) * 100) : 0;
  els.completionRing.style.setProperty("--ring-value", `${percent}%`);
  els.completionLabel.textContent = `${percent}%`;
}

function hydrateFilterOptions() {
  const projectValue = state.filters.project;
  const tagValue = state.filters.tag;
  els.searchInput.value = state.filters.search;
  els.projectFilter.innerHTML = `<option value="all">All projects</option>${getProjects()
    .map((project) => `<option value="${escapeAttr(project)}">${escapeHtml(project)}</option>`)
    .join("")}`;
  els.tagFilter.innerHTML = `<option value="all">All tags</option>${getTags()
    .map((tag) => `<option value="${escapeAttr(tag)}">#${escapeHtml(tag)}</option>`)
    .join("")}`;
  els.projectFilter.value = getProjects().includes(projectValue) ? projectValue : "all";
  els.tagFilter.value = getTags().includes(tagValue) ? tagValue : "all";
  state.filters.project = els.projectFilter.value;
  state.filters.tag = els.tagFilter.value;
  els.priorityFilter.value = state.filters.priority;
  els.dueFilter.value = state.filters.due;
  els.sortSelect.value = state.filters.sort;
}

function renderMetrics() {
  const active = state.tasks.filter((task) => task.status !== "done");
  const done = state.tasks.filter((task) => task.status === "done");
  const today = active.filter((task) => isToday(task.dueDate));
  const overdue = active.filter((task) => isOverdue(task));
  const estimate = active.reduce((sum, task) => sum + Number(task.estimate || 0), 0);
  const completedThisWeek = done.filter((task) => isWithinDays(task.completedAt, 7)).length;
  const metrics = [
    {
      label: "Active tasks",
      value: active.length,
      detail: `${state.tasks.length} total in workspace`,
      icon: "circle-dot",
    },
    {
      label: "Due today",
      value: today.length,
      detail: today.length ? "Ready for attention" : "No deadline pressure",
      icon: "sun",
    },
    {
      label: "Overdue",
      value: overdue.length,
      detail: overdue.length ? "Needs a decision" : "Nothing slipping",
      icon: "alert-triangle",
    },
    {
      label: "Workload",
      value: `${Math.round(estimate / 60)}h`,
      detail: `${completedThisWeek} completed this week`,
      icon: "activity",
    },
  ];

  els.metrics.innerHTML = metrics
    .map(
      (metric) => `
        <article class="metric">
          <div class="label">
            <span>${escapeHtml(metric.label)}</span>
            <i data-lucide="${metric.icon}"></i>
          </div>
          <strong>${escapeHtml(String(metric.value))}</strong>
          <small>${escapeHtml(metric.detail)}</small>
        </article>
      `
    )
    .join("");
}

function renderWorkspaceTitle() {
  if (state.view === "meetings") {
    const upcoming = state.meetings.filter((meeting) => meeting.status === "scheduled" && meeting.date >= todayISO()).length;
    els.viewTitle.textContent = "Events";
    els.viewSubtitle.textContent = `${upcoming} upcoming ${upcoming === 1 ? "event" : "events"} · notes and follow-up tasks`;
    return;
  }
  const view = smartViews.find((item) => item.id === state.smartView);
  const count = filteredTasks().length;
  els.viewTitle.textContent = view?.label || "All tasks";
  const active = filteredTasks().filter((task) => task.status !== "done");
  const estimate = active.reduce((sum, task) => sum + Number(task.estimate || 0), 0);
  els.viewSubtitle.textContent = `${count} ${count === 1 ? "task" : "tasks"} in view · ${Math.round(estimate / 60)}h active estimate`;
}

function renderNudgePanel() {
  const active = state.tasks.filter((task) => task.status !== "done");
  const nextTask = sortTasks([...active], "priority")[0];
  const overdue = active.filter((task) => isOverdue(task)).length;
  const waiting = active.filter((task) => task.status === "waiting").length;

  if (!nextTask) {
    els.nudgePanel.innerHTML = `
      <div class="nudge-message">
        <i data-lucide="sparkles"></i>
        <span>Your active queue is clear. Capture the next thing only when it earns a place.</span>
      </div>
    `;
    return;
  }

  const reason = overdue
    ? `${overdue} overdue ${overdue === 1 ? "task" : "tasks"} need a decision`
    : waiting
      ? `${waiting} waiting ${waiting === 1 ? "handoff" : "handoffs"} to unblock`
      : `${priorityLabels[nextTask.priority]} priority · ${nextTask.dueDate ? formatDueLabel(nextTask) : "unscheduled"}`;

  els.nudgePanel.innerHTML = `
    <div class="nudge-message">
      <i data-lucide="target"></i>
      <span><strong>Next best move:</strong> ${escapeHtml(nextTask.title)}</span>
      <small>${escapeHtml(reason)}</small>
    </div>
    <div class="nudge-actions">
      <button class="button ghost" type="button" data-nudge-action="edit" data-task-id="${nextTask.id}">
        <i data-lucide="pencil"></i>
        Edit
      </button>
      <button class="button primary" type="button" data-nudge-action="focus" data-task-id="${nextTask.id}">
        <i data-lucide="timer"></i>
        Focus
      </button>
    </div>
  `;

  els.nudgePanel.querySelectorAll("[data-nudge-action]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.nudgeAction === "edit") openTaskDialog(button.dataset.taskId);
      if (button.dataset.nudgeAction === "focus") {
        state.focusTaskId = button.dataset.taskId;
        state.view = "focus";
        renderAll();
      }
    });
  });
}

function updateViewVisibility() {
  els.viewTabs.querySelectorAll("[data-view]").forEach((button) => {
    const active = button.dataset.view === state.view;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  ["board", "list", "calendar", "meetings", "analytics", "focus"].forEach((view) => {
    els[`${view}View`].classList.toggle("active", state.view === view);
  });
}

function renderBoard() {
  const tasks = filteredTasks();
  const selectedProject = state.filters.project !== "all" ? state.filters.project : null;
  const projectNotes = selectedProject
    ? state.notes.filter(n => n.project === selectedProject)
    : [];   // Only show notes when a specific project is selected

  // Build notes section HTML (if project is selected)
  let notesHtml = '';
  if (selectedProject) {
    notesHtml = `
      <div class="board-notes-section">
        <div class="board-notes-header">
          <h3>📝 Notes for ${escapeHtml(selectedProject)}</h3>
          <button class="button ghost" id="boardAddNoteBtn"><i data-lucide="plus"></i> Add note</button>
        </div>
        <div class="board-notes-horizontal">
          ${projectNotes.length ? projectNotes.map(note => `
            <div class="board-note-card" data-note-id="${note.id}">
              <div class="board-note-title">${escapeHtml(note.title)}</div>
              <div class="board-note-content">${escapeHtml(note.content || '')}</div>
              <div class="board-note-actions">
                <button class="chip-button note-edit" data-id="${note.id}"><i data-lucide="pencil"></i></button>
                <button class="chip-button note-delete" data-id="${note.id}"><i data-lucide="trash-2"></i></button>
              </div>
            </div>
          `).join('') : '<div class="empty-notes-horizontal">No notes. Click "Add note" to create one.</div>'}
        </div>
      </div>
    `;
  }

  // Kanban board HTML
  const kanbanHtml = `
    <div class="kanban">
      ${statuses
        .map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status.id);
          return `
            <section class="kanban-column" data-status="${status.id}">
              <div class="column-head">
                <span class="status-dot" style="background:${status.color}"></span>
                <h2>${escapeHtml(status.label)}</h2>
                <span>${columnTasks.length}</span>
              </div>
              <div class="column-body">
                ${columnTasks.length ? columnTasks.map(renderTaskCard).join("") : renderColumnEmpty(status.id)}
              </div>
            </section>
          `;
        })
        .join("")}
    </div>
  `;

  els.boardView.innerHTML = notesHtml + kanbanHtml;

// Attach event listeners for notes section (if it exists)
if (selectedProject) {
  const addBtn = document.getElementById("boardAddNoteBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      if (typeof openNoteDialog === 'function') {
        openNoteDialog(null, selectedProject);
      } else {
        console.warn("openNoteDialog is not defined");
      }
    });
  }
  document.querySelectorAll(".board-note-card .note-edit").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = btn.dataset.id;
      const note = state.notes.find(n => n.id === id);
      if (note && typeof openNoteDialog === 'function') {
        openNoteDialog(note, note.project);
      }
    });
  });
  document.querySelectorAll(".board-note-card .note-delete").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = btn.dataset.id;
      if (confirm("Delete this note?")) {
        if (typeof deleteNote === 'function') {
          await deleteNote(id);
          renderBoard(); // re-render board after deletion
        } else {
          console.warn("deleteNote is not defined");
        }
      }
    });
  });
}

  // Existing drag & drop listeners
  els.boardView.querySelectorAll(".task-card").forEach((card) => {
    card.addEventListener("dragstart", () => card.classList.add("dragging"));
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
  });

  els.boardView.querySelectorAll(".kanban-column").forEach((column) => {
    column.addEventListener("dragover", (event) => {
      event.preventDefault();
      column.classList.add("drag-over");
    });
    column.addEventListener("dragleave", () => column.classList.remove("drag-over"));
    column.addEventListener("drop", (event) => {
      event.preventDefault();
      column.classList.remove("drag-over");
      const taskId = event.dataTransfer.getData("text/plain");
      updateTaskStatus(taskId, column.dataset.status);
    });
  });

  bindTaskCardActions(els.boardView);
  refreshIcons();
}

function renderNotesStrip(notes, projectName) {
  if (!notes.length) {
    return `
      <div class="board-notes-strip">
        <div class="board-notes-header">
          <span>📝 Notes for ${escapeHtml(projectName)}</span>
          <button class="button ghost" id="addNoteBtnBoard"><i data-lucide="plus"></i> Add note</button>
        </div>
        <div class="board-notes-empty">No notes yet. Click + to add a note.</div>
      </div>
    `;
  }
  return `
    <div class="board-notes-strip">
      <div class="board-notes-header">
        <span>📝 Notes for ${escapeHtml(projectName)}</span>
        <button class="button ghost" id="addNoteBtnBoard"><i data-lucide="plus"></i> Add note</button>
      </div>
      <div class="board-notes-horizontal">
        ${notes.map(note => `
          <div class="board-note-card">
            <div class="board-note-title">${escapeHtml(note.title)}</div>
            <div class="board-note-content">${escapeHtml(note.content || '')}</div>
            <div class="board-note-actions">
              <button class="chip-button note-edit-board" data-id="${note.id}" title="Edit"><i data-lucide="pencil"></i></button>
              <button class="chip-button note-delete-board" data-id="${note.id}" title="Delete"><i data-lucide="trash-2"></i></button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderColumnEmpty(statusId) {
  const messages = {
    backlog: "No loose ideas",
    planned: "Nothing scheduled",
    progress: "No active work",
    waiting: "No handoffs",
    done: "No wins here yet",
  };
  return `<div class="empty-state"><div><div class="empty-art"><span></span><span></span><span></span></div><strong>${messages[statusId]}</strong></div></div>`;
}

function renderTaskCard(task) {
  const subtaskTotal = task.subtasks.length;
  const subtaskDone = task.subtasks.filter((item) => item.done).length;
  const progress = subtaskTotal ? Math.round((subtaskDone / subtaskTotal) * 100) : task.status === "done" ? 100 : 0;
  const done = task.status === "done";
  const dueClass = getDueClass(task);
  return `
    <article class="task-card ${done ? "done" : ""}" draggable="true" data-task-id="${task.id}">
      <div class="task-card-top">
        <span class="chip project-chip">${escapeHtml(task.project || "Inbox")}</span>
        <span class="priority-chip priority-${task.priority}">${escapeHtml(priorityLabels[task.priority] || task.priority)}</span>
      </div>
      <div class="task-title-row">
        <button class="task-check ${done ? "done" : ""}" type="button" data-action="toggle" title="${done ? "Reopen task" : "Complete task"}" aria-label="${done ? "Reopen task" : "Complete task"}">
          <i data-lucide="${done ? "check" : "circle"}"></i>
        </button>
        <button class="plain-task" type="button" data-action="edit">
          <span class="task-title">${escapeHtml(task.title)}</span>
        </button>
      </div>
      ${task.tags.length ? `<div class="task-tags">${task.tags.map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
      ${subtaskTotal ? `<div class="progress" title="${subtaskDone} of ${subtaskTotal} subtasks"><span style="--progress:${progress}%"></span></div>` : ""}
      <div class="task-card-footer">
        <div class="task-meta">
          ${task.dueDate ? `<span class="due-chip ${dueClass}"><i data-lucide="calendar"></i>${formatDueLabel(task)}</span>` : `<span class="due-chip"><i data-lucide="calendar-x"></i>No date</span>`}
          ${task.estimate ? `<span class="energy-chip"><i data-lucide="clock"></i>${task.estimate}m</span>` : ""}
          ${task.recurrence !== "none" ? `<span class="energy-chip"><i data-lucide="repeat"></i>${escapeHtml(task.recurrence)}</span>` : ""}
        </div>
        <div class="card-actions">
          <button class="chip-button" type="button" data-action="focus" title="Focus" aria-label="Focus task"><i data-lucide="timer"></i></button>
          <button class="chip-button" type="button" data-action="edit" title="Edit" aria-label="Edit task"><i data-lucide="pencil"></i></button>
        </div>
      </div>
    </article>
  `;
}

function bindTaskCardActions(root) {
  root.querySelectorAll(".task-card").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", card.dataset.taskId);
    });
  });

  root.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const card = event.target.closest("[data-task-id]");
      const taskId = card?.dataset.taskId || button.dataset.taskId;
      if (!taskId) return;
      const action = button.dataset.action;
      if (action === "toggle") toggleComplete(taskId);
      if (action === "edit") openTaskDialog(taskId);
      if (action === "focus") {
        state.focusTaskId = taskId;
        state.view = "focus";
        renderAll();
      }
    });
  });
}

function renderList() {
  const tasks = filteredTasks();
  if (!tasks.length) {
    els.listView.innerHTML = renderEmptyWorkspace("No tasks match these filters", "Try clearing a filter or capturing a new task.");
    return;
  }

  els.listView.innerHTML = `
    <div class="list-panel">
      <div class="list-toolbar">
        <strong>${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}</strong>
        <div class="bulk-actions">
          <button class="button ghost" id="bulkDoneBtn" type="button" ${selectedTasks.size ? "" : "disabled"}><i data-lucide="check"></i>Done</button>
          <button class="button ghost" id="bulkProgressBtn" type="button" ${selectedTasks.size ? "" : "disabled"}><i data-lucide="loader"></i>Progress</button>
          <button class="button danger" id="bulkDeleteBtn" type="button" ${selectedTasks.size ? "" : "disabled"}><i data-lucide="trash-2"></i>Delete</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Select</th>
              <th>Task</th>
              <th>Project</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Due</th>
              <th>Tags</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(renderTaskRow).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  els.listView.querySelectorAll("[data-select-task]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selectedTasks.add(checkbox.dataset.selectTask);
      else selectedTasks.delete(checkbox.dataset.selectTask);
      renderList();
      refreshIcons();
    });
  });

  els.listView.querySelectorAll("[data-row-action='edit']").forEach((button) => {
    button.addEventListener("click", () => openTaskDialog(button.dataset.taskId));
  });

  bindTaskCardActions(els.listView);
  document.getElementById("bulkDoneBtn")?.addEventListener("click", () => bulkStatus("done"));
  document.getElementById("bulkProgressBtn")?.addEventListener("click", () => bulkStatus("progress"));
  document.getElementById("bulkDeleteBtn")?.addEventListener("click", bulkDelete);
}

function renderTaskRow(task) {
  const status = statuses.find((item) => item.id === task.status);
  const done = task.status === "done";
  return `
    <tr>
      <td>
        <input type="checkbox" data-select-task="${task.id}" ${selectedTasks.has(task.id) ? "checked" : ""} aria-label="Select ${escapeAttr(task.title)}" />
      </td>
      <td>
        <div class="row-title">
          <button class="row-check ${done ? "task-check done" : ""}" type="button" data-task-id="${task.id}" data-action="toggle" aria-label="${done ? "Reopen task" : "Complete task"}">
            <i data-lucide="${done ? "check" : "circle"}"></i>
          </button>
          <div>
            <strong>${escapeHtml(task.title)}</strong>
            <small>${escapeHtml(displayNotes(task) || "No notes")}</small>
          </div>
        </div>
      </td>
      <td>${escapeHtml(task.project || "Inbox")}</td>
      <td><span class="chip"><i data-lucide="${status?.icon || "circle"}"></i>${escapeHtml(status?.label || task.status)}</span></td>
      <td><span class="priority-chip priority-${task.priority}">${escapeHtml(priorityLabels[task.priority] || task.priority)}</span></td>
      <td>${task.dueDate ? `<span class="due-chip ${getDueClass(task)}">${formatDueLabel(task)}</span>` : `<span class="due-chip">No date</span>`}</td>
      <td>${task.tags.map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`).join(" ") || `<span class="chip">None</span>`}</td>
      <td><button class="chip-button" type="button" data-row-action="edit" data-task-id="${task.id}" aria-label="Edit ${escapeAttr(task.title)}"><i data-lucide="pencil"></i></button></td>
    </tr>
  `;
}

function renderCalendar() {
  const monthStart = startOfMonth(calendarCursor);
  const start = startOfWeek(monthStart);
  const days = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  const tasksByDate = groupTasksByDueDate(filteredTasks());
  const meetingsByDate = groupMeetingsByDate(filteredMeetingsForCalendar());

  els.calendarView.innerHTML = `
    <div class="calendar-panel">
      <div class="calendar-head">
        <h2>${monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2>
        <div class="calendar-controls">
          <button class="icon-button" id="prevMonthBtn" type="button" aria-label="Previous month"><i data-lucide="chevron-left"></i></button>
          <button class="button ghost" id="todayMonthBtn" type="button">Today</button>
          <button class="icon-button" id="nextMonthBtn" type="button" aria-label="Next month"><i data-lucide="chevron-right"></i></button>
        </div>
      </div>
      <div class="calendar-grid">
        ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<div class="weekday">${day}</div>`).join("")}
        ${days.map((day) => renderCalendarDay(day, monthStart, tasksByDate, meetingsByDate)).join("")}
      </div>
    </div>
  `;

  document.getElementById("prevMonthBtn").addEventListener("click", () => {
    calendarCursor = addMonths(calendarCursor, -1);
    renderCalendar();
    refreshIcons();
  });
  document.getElementById("nextMonthBtn").addEventListener("click", () => {
    calendarCursor = addMonths(calendarCursor, 1);
    renderCalendar();
    refreshIcons();
  });
  document.getElementById("todayMonthBtn").addEventListener("click", () => {
    calendarCursor = startOfMonth(new Date());
    renderCalendar();
    refreshIcons();
  });
  els.calendarView.querySelectorAll("[data-calendar-task]").forEach((button) => {
    button.addEventListener("click", () => openTaskDialog(button.dataset.calendarTask));
  });
  els.calendarView.querySelectorAll("[data-calendar-meeting]").forEach((button) => {
    button.addEventListener("click", () => openMeetingDialog(button.dataset.calendarMeeting));
  });
}

function renderCalendarDay(day, monthStart, tasksByDate, meetingsByDate) {
  const iso = toISODate(day);
  const tasks = tasksByDate.get(iso) || [];
  const meetings = meetingsByDate.get(iso) || [];
  const itemsShown = meetings.length + tasks.length;
  const outside = day.getMonth() !== monthStart.getMonth();
  const today = iso === todayISO();
  return `
    <div class="calendar-day ${outside ? "outside" : ""} ${today ? "today" : ""}">
      <span class="day-number">${day.getDate()}</span>
      ${meetings
        .slice(0, 3)
        .map(
          (meeting) =>
            `<button class="calendar-task meeting-calendar-chip meeting-${meeting.status}" type="button" data-calendar-meeting="${meeting.id}" title="${escapeAttr(meeting.title)}">${escapeHtml(formatMeetingTime(meeting))} ${escapeHtml(meeting.title)}</button>`
        )
        .join("")}
      ${tasks
        .slice(0, Math.max(0, 4 - meetings.length))
        .map(
          (task) =>
            `<button class="calendar-task priority-${task.priority}" type="button" data-calendar-task="${task.id}" title="${escapeAttr(task.title)}">${escapeHtml(task.title)}</button>`
        )
        .join("")}
      ${itemsShown > 4 ? `<span class="chip">+${itemsShown - 4} more</span>` : ""}
    </div>
  `;
}

async function loadCloudNotes() {
  try {
    const rows = await restRequest(`/${NOTES_TABLE}?select=*&order=created_at.desc`, { method: "GET" });
    state.notes = Array.isArray(rows) ? rows.map(rowToNote).filter(n => !state.pendingNoteDeleteIds.has(n.id)) : [];
  } catch (error) {
    console.warn("Notes sync unavailable", error);
    state.notes = readLocalWorkspace().notes || [];
  }
}

function noteToRow(note) {
  return {
    id: note.id,
    user_id: state.user.id,
    project: note.project,
    title: note.title,
    content: note.content || "",
    created_at: note.createdAt,
    updated_at: new Date().toISOString(),
  };
}

function rowToNote(row) {
  return {
    id: row.id,
    project: row.project,
    title: row.title,
    content: row.content || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeNote(note) {
  return {
    id: note.id || uid(),
    project: note.project || "Inbox",
    title: cleanTitle(note.title || "Untitled note"),
    content: note.content || "",
    createdAt: note.createdAt || new Date().toISOString(),
    updatedAt: note.updatedAt || new Date().toISOString(),
  };
}

async function saveNote(note) {
  const existing = state.notes.find(n => n.id === note.id);
  if (existing) {
    state.notes = state.notes.map(n => n.id === note.id ? note : n);
  } else {
    state.notes = [note, ...state.notes];
  }
  persist();
  await syncNotesToCloud();
}

async function deleteNote(id) {
  state.notes = state.notes.filter(n => n.id !== id);
  persist();
  await deleteCloudNotes([id]);
}

async function syncNotesToCloud() {
  if (!state.isOnline || !state.session?.access_token || !state.user?.id || !state.notes.length) return;
  const rows = state.notes.map(noteToRow);
  await restRequest(`/${NOTES_TABLE}?on_conflict=id`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(rows),
  });
  state.pendingNoteSyncIds.clear();
}

async function deleteCloudNotes(ids) {
  if (!state.session?.access_token || !state.isOnline) {
    ids.forEach(id => state.pendingNoteDeleteIds.add(id));
    savePendingDeletes();
    return;
  }
  await Promise.all(ids.map(id => restRequest(`/${NOTES_TABLE}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" })));
  ids.forEach(id => state.pendingNoteDeleteIds.delete(id));
  savePendingDeletes();
}


function renderMeetings() {
  const meetings = sortMeetings([...state.meetings]);
  const upcoming = meetings.filter((meeting) => meeting.status === "scheduled" && meeting.date >= todayISO());
  const done = meetings.filter((meeting) => meeting.status === "done").slice(-8).reverse();
  els.meetingsView.innerHTML = `
    <div class="meetings-toolbar">
      <div>
        <h2>Events</h2>
      </div>
      <div class="meeting-actions">
        <button class="button ghost" id="importIcsBtn" type="button"><i data-lucide="calendar-plus"></i>Import .ics</button>
        <input id="icsImportFile" type="file" accept=".ics,text/calendar" multiple hidden />
        <button class="button ghost danger" id="bulkDeleteMeetingsBtn" type="button"><i data-lucide="trash-2"></i>Delete events</button>
        <label class="timezone-control" title="Event time zone">
          <select id="meetingTimezoneSelect" aria-label="Event time zone">
            ${renderTimezoneOptions()}
          </select>
        </label>
        <button class="button primary" id="newMeetingBtn" type="button"><i data-lucide="plus"></i>New event</button>
      </div>
    </div>
    <div class="meetings-grid">
      <section class="meetings-panel">
        <h2>Upcoming</h2>
        ${renderMeetingGroup("Today", upcoming.filter((meeting) => meeting.date === todayISO()))}
        ${renderMeetingGroup("This week", upcoming.filter((meeting) => meeting.date > todayISO() && meeting.date <= addDaysISO(7)))}
        ${renderMeetingGroup("Later", upcoming.filter((meeting) => meeting.date > addDaysISO(7)).slice(0, 24))}
      </section>
      <section class="meetings-panel">
        <h2>Finished notes</h2>
        ${done.length ? done.map(renderMeetingCard).join("") : renderEmptyWorkspace("No event notes yet", "Mark an event done to capture what happened.")}
      </section>
    </div>
  `;

  document.getElementById("newMeetingBtn")?.addEventListener("click", () => openMeetingDialog());
  document.getElementById("importIcsBtn")?.addEventListener("click", () => document.getElementById("icsImportFile")?.click());
  document.getElementById("bulkDeleteMeetingsBtn")?.addEventListener("click", () => els.deleteMeetingsDialog.showModal());
  document.getElementById("meetingTimezoneSelect")?.addEventListener("change", (event) => setMeetingTimezone(event.target.value));
  document.getElementById("icsImportFile")?.addEventListener("change", importIcsMeetings);
  els.meetingsView.querySelectorAll("[data-meeting-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const meetingId = button.dataset.meetingId;
      const action = button.dataset.meetingAction;
      if (action === "open") openMeetingDialog(meetingId);
      if (action === "done") updateMeetingStatus(meetingId, "done");
      if (action === "task") createTaskFromMeeting(meetingId);
    });
  });
}

function renderMeetingGroup(label, meetings) {
  if (!meetings.length) return "";
  return `
    <div class="meeting-group">
      <h3>${escapeHtml(label)}</h3>
      ${meetings.map(renderMeetingCard).join("")}
    </div>
  `;
}

function renderTimezoneOptions() {
  const options = unique([state.meetingTimezone, ...timezoneChoices]);
  return options
    .map(
      (timezone) =>
        `<option value="${escapeAttr(timezone)}" ${timezone === state.meetingTimezone ? "selected" : ""}>${escapeHtml(formatTimezoneOptionLabel(timezone))}</option>`
    )
    .join("");
}

function formatTimezoneOptionLabel(timezone) {
  const city = timezone.split("/").pop()?.replace(/_/g, " ") || timezone;
  return `${formatTimezoneOffsetLabel(timezone)} - ${city}`;
}

function formatTimezoneOffsetLabel(timezone) {
  try {
    const label = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value;
    return label || "GMT";
  } catch (error) {
    return "GMT";
  }
}

function renderMeetingCard(meeting) {
  const linked = meeting.linkedTaskIds.length;
  const notes = meeting.notes.trim();
  return `
    <article class="meeting-card meeting-${meeting.status}">
      <div class="meeting-card-body">
        <div class="meeting-content">
          <div class="meeting-card-top">
            <span class="chip project-chip"><i data-lucide="book-open"></i>${escapeHtml(meeting.subject)}</span>
            <span class="due-chip"><i data-lucide="calendar"></i>${escapeHtml(formatMeetingDateTime(meeting))}</span>
          </div>
          <button class="plain-task meeting-title-button" type="button" data-meeting-action="open" data-meeting-id="${meeting.id}">
            <span class="task-title">${escapeHtml(meeting.title)}</span>
            ${notes ? `<span class="meeting-inline-notes">${escapeHtml(notes)}</span>` : ""}
          </button>
          ${meeting.topic ? `<p>${escapeHtml(meeting.topic)}</p>` : ""}
          <div class="task-tags">
            ${meeting.location ? `<span class="tag"><i data-lucide="map-pin"></i>${escapeHtml(meeting.location)}</span>` : ""}
            ${meeting.recurrence !== "none" ? `<span class="tag"><i data-lucide="repeat"></i>${escapeHtml(meeting.recurrence)}</span>` : ""}
            ${linked ? `<span class="tag"><i data-lucide="list-checks"></i>${linked} tasks</span>` : ""}
          </div>
        </div>
        <div class="meeting-card-actions">
          <button class="chip-button" type="button" data-meeting-action="task" data-meeting-id="${meeting.id}" title="Create task" aria-label="Create task from event"><i data-lucide="list-plus"></i></button>
          <button class="chip-button" type="button" data-meeting-action="open" data-meeting-id="${meeting.id}" title="Edit event" aria-label="Edit event"><i data-lucide="pencil"></i></button>
        </div>
      </div>
    </article>
  `;
}

function renderAnalytics() {
  const tasks = filteredTasks();
  if (!tasks.length) {
    els.analyticsView.innerHTML = renderEmptyWorkspace("No analytics yet", "Tasks in the current view will create charts here.");
    return;
  }

  const completed = tasks.filter((task) => task.status === "done").length;
  const active = tasks.filter((task) => task.status !== "done").length;
  const overdue = tasks.filter((task) => isOverdue(task)).length;
  const estimate = tasks.reduce((sum, task) => sum + Number(task.estimate || 0), 0);
  const projectCounts = countBy(tasks, "project");
  const priorityCounts = countBy(tasks, "priority");
  const statusCounts = countBy(tasks, "status");
  const waiting = tasks.filter((task) => task.status === "waiting").length;
  const overdueUrgent = tasks.filter((task) => isOverdue(task) && ["urgent", "high"].includes(task.priority)).length;

  els.analyticsView.innerHTML = `
    <div class="analytics-grid">
      <section class="analytics-panel">
        <h2>Project load</h2>
        ${renderBars(projectCounts, tasks.length, "project")}
      </section>
      <section class="analytics-panel">
        <h2>Signals</h2>
        <div class="insight-grid">
          <div class="insight"><strong>${Math.round((completed / tasks.length) * 100)}%</strong><span>completion rate</span></div>
          <div class="insight"><strong>${active}</strong><span>active tasks</span></div>
          <div class="insight"><strong>${overdueUrgent}</strong><span>high-risk overdue</span></div>
          <div class="insight"><strong>${waiting}</strong><span>waiting handoffs</span></div>
          <div class="insight"><strong>${overdue}</strong><span>overdue tasks</span></div>
          <div class="insight"><strong>${Math.round(estimate / 60)}h</strong><span>estimated work</span></div>
        </div>
      </section>
      <section class="analytics-panel">
        <h2>Priority mix</h2>
        ${renderBars(priorityCounts, tasks.length, "priority")}
      </section>
      <section class="analytics-panel">
        <h2>Status distribution</h2>
        ${renderBars(statusCounts, tasks.length, "status")}
      </section>
    </div>
  `;
}

function renderBars(counts, total, type) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return `
    <div class="bar-list">
      ${entries
        .map(([key, value]) => {
          const label =
            type === "priority"
              ? priorityLabels[key] || key
              : type === "status"
                ? statuses.find((status) => status.id === key)?.label || key
                : key;
          const percent = total ? Math.max(4, Math.round((value / total) * 100)) : 0;
          return `
            <div class="bar-row">
              <span>${escapeHtml(label)}</span>
              <div class="bar-track"><div class="bar-fill" style="--bar:${percent}%"></div></div>
              <strong>${value}</strong>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderFocus() {
  const tasks = state.tasks
    .filter((task) => task.status !== "done")
    .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority] || compareDue(a, b))
    .slice(0, 24);

  if (!state.focusTaskId || !state.tasks.some((task) => task.id === state.focusTaskId && task.status !== "done")) {
    state.focusTaskId = tasks[0]?.id || null;
  }

  const focusTask = state.tasks.find((task) => task.id === state.focusTaskId);
  els.focusView.innerHTML = `
    <div class="focus-grid">
      <section class="focus-panel">
        <h2>Focus queue</h2>
        <div class="focus-task-list">
          ${
            tasks.length
              ? tasks
                  .map(
                    (task) => `
                      <button class="focus-task ${task.id === state.focusTaskId ? "active" : ""}" type="button" data-focus-task="${task.id}">
                        <span>
                          <strong>${escapeHtml(task.title)}</strong>
                          <span>${escapeHtml(task.project || "Inbox")} · ${task.dueDate ? formatDueLabel(task) : "No date"}</span>
                        </span>
                        <span class="priority-chip priority-${task.priority}">${escapeHtml(priorityLabels[task.priority])}</span>
                      </button>
                    `
                  )
                  .join("")
              : renderEmptyWorkspace("No active tasks", "Create or reopen a task to start a focus session.")
          }
        </div>
      </section>
      <section class="focus-panel">
        <h2>${focusTask ? escapeHtml(focusTask.title) : "Focus session"}</h2>
        <div class="timer-display">
          <div>
            <strong id="timerText">${formatTimer(timer.remaining)}</strong>
            <span>${focusTask ? escapeHtml(focusTask.project || "Inbox") : "Select a task to begin"}</span>
          </div>
        </div>
        <div class="focus-actions">
          <button class="button primary" id="timerStartBtn" type="button" ${focusTask ? "" : "disabled"}><i data-lucide="${timer.running ? "pause" : "play"}"></i>${timer.running ? "Pause" : "Start"}</button>
          <button class="button ghost" id="timerResetBtn" type="button"><i data-lucide="rotate-ccw"></i>Reset</button>
          <button class="button ghost" id="timerShortBtn" type="button"><i data-lucide="coffee"></i>5 min</button>
          <button class="button ghost" id="timerLongBtn" type="button"><i data-lucide="timer"></i>25 min</button>
          <button class="button primary" id="focusDoneBtn" type="button" ${focusTask ? "" : "disabled"}><i data-lucide="check"></i>Done</button>
        </div>
      </section>
    </div>
  `;

  els.focusView.querySelectorAll("[data-focus-task]").forEach((button) => {
    button.addEventListener("click", () => {
      state.focusTaskId = button.dataset.focusTask;
      timer.remaining = getFocusMinutes() * 60;
      stopTimer();
      renderFocus();
      refreshIcons();
    });
  });
  document.getElementById("timerStartBtn")?.addEventListener("click", toggleTimer);
  document.getElementById("timerResetBtn")?.addEventListener("click", () => resetTimer(getFocusMinutes() * 60));
  document.getElementById("timerShortBtn")?.addEventListener("click", () => resetTimer(5 * 60));
  document.getElementById("timerLongBtn")?.addEventListener("click", () => resetTimer(25 * 60));
  document.getElementById("focusDoneBtn")?.addEventListener("click", () => toggleComplete(state.focusTaskId));
}

function renderEmptyWorkspace(title, body) {
  return `
    <div class="empty-state">
      <div>
        <div class="empty-art"><span></span><span></span><span></span></div>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(body)}</p>
      </div>
    </div>
  `;
}

function filteredTasks() {
  let tasks = [...state.tasks];
  const { search, project, tag, priority, due, sort } = state.filters;

  tasks = tasks.filter((task) => {
    if (state.smartView === "today" && (!isToday(task.dueDate) || task.status === "done")) return false;
    if (state.smartView === "upcoming" && (!isUpcoming(task.dueDate) || task.status === "done")) return false;
    if (state.smartView === "overdue" && !isOverdue(task)) return false;
    if (state.smartView === "waiting" && task.status !== "waiting") return false;
    if (state.smartView === "completed" && task.status !== "done") return false;
    if (project !== "all" && task.project !== project) return false;
    if (tag !== "all" && !task.tags.includes(tag)) return false;
    if (priority !== "all" && task.priority !== priority) return false;
    if (due === "overdue" && !isOverdue(task)) return false;
    if (due === "today" && !isToday(task.dueDate)) return false;
    if (due === "upcoming" && !isUpcoming(task.dueDate)) return false;
    if (due === "unscheduled" && task.dueDate) return false;
    if (search) {
      const haystack = [task.title, task.notes, task.project, task.status, task.priority, ...task.tags]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  return sortTasks(tasks, sort);
}

function sortTasks(tasks, sort) {
  return tasks.sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "created") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === "priority") return priorityOrder[b.priority] - priorityOrder[a.priority] || compareDue(a, b);
    if (sort === "estimate") return Number(b.estimate || 0) - Number(a.estimate || 0);
    return compareDue(a, b) || priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

function compareDue(a, b) {
  const aTime = dueSortValue(a);
  const bTime = dueSortValue(b);
  return aTime - bTime;
}

function dueSortValue(task) {
  if (!task.dueDate) return Number.MAX_SAFE_INTEGER;
  const [hours, minutes] = isValidTime(task.dueTime) ? task.dueTime.split(":").map(Number) : [23, 59];
  const date = parseISODate(task.dueDate);
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
}

async function handleQuickAdd(event) {
  event.preventDefault();
  const text = els.quickInput.value.trim();
  if (!text) return;

  const submitButton = els.quickForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.innerHTML = `<i data-lucide="loader"></i>Parsing`;
  refreshIcons();

  try {
    const parsed = parseQuickTask(text);
    const task = buildTaskFromParsedCapture(parsed, text);
    state.tasks.unshift(task);
    els.quickInput.value = "";
    autosizeQuickInput();
    persist();
    renderAll();
    toast("Smart add planned the task");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = `<i data-lucide="wand-sparkles"></i>Smart add`;
    refreshIcons();
  }
}

function buildTaskFromParsedCapture(parsed, originalText) {
  const dueDate = parsed.dueDate || parsed.due_date || "";
  const dueTime = isValidTime(parsed.dueTime) ? parsed.dueTime : "";
  return normalizeTask({
    id: uid(),
    title: parsed.title || originalText,
    project: parsed.project || defaultProject(),
    priority: parsed.priority || "medium",
    status: parsed.status || (dueDate ? "planned" : "backlog"),
    dueDate,
    dueTime,
    tags: parsed.tags || [],
    estimate: parsed.estimate || 0,
    energy: parsed.energy || "medium",
    recurrence: parsed.recurrence || "none",
    notes: withDueTimeNote(parsed.notes || "", dueTime),
    subtasks: (parsed.subtasks || []).map((item) => ({
      id: uid(),
      text: typeof item === "string" ? item : item.text,
      done: Boolean(typeof item === "object" && item.done),
    })),
    createdAt: new Date().toISOString(),
    completedAt: null,
  });
}

function autosizeQuickInput() {
  els.quickInput.style.height = "auto";
  if (!els.quickInput.value.trim()) {
    els.quickInput.style.height = "70px";
    return;
  }
  els.quickInput.style.height = `${Math.min(116, els.quickInput.scrollHeight)}px`;
}

function parseQuickTask(text) {
  const lines = text
    .split(/\r?\n/)
    .map(cleanTitle)
    .filter(Boolean);
  const originalText = text;
  const subtaskLines = lines.slice(1);
  text = lines[0] || text;
  const tags = [];
  let project = "";
  let priority = "";
  let dueDate = "";
  let dueTime = "";
  let estimate = 0;
  let energy = "medium";
  let recurrence = "none";
  let title = text;
  let subtasks = [...subtaskLines];

  title = title.replace(/#([\w-]+)/g, (_, tag) => {
    tags.push(cleanToken(tag));
    return "";
  });

  title = title.replace(/@([\w-]+)/g, (_, projectName) => {
    project = cleanTitle(projectName.replace(/-/g, " "));
    return "";
  });

  title = title.replace(/!(urgent|high|medium|low)/gi, (_, value) => {
    priority = value.toLowerCase();
    return "";
  });

  title = title.replace(/\b(urgent|high|medium|low)\s+priority\b/gi, (_, value) => {
    priority = value.toLowerCase();
    return "";
  });

  title = title.replace(/\b(urgent|important|asap)\b/gi, (match) => {
    if (!priority) priority = match.toLowerCase() === "urgent" ? "urgent" : "high";
    return "";
  });

  title = title.replace(/(?:^|\s)(\d+)\s?(m|min|mins|h|hr|hrs)(?=\s|$)/i, (match, amount, unit) => {
    const value = Number(amount);
    estimate = unit.toLowerCase().startsWith("h") ? value * 60 : value;
    return " ";
  });

  title = title.replace(/\b(low|medium|high)\s+energy\b/i, (_, value) => {
    energy = value.toLowerCase();
    return "";
  });

  title = title.replace(/\b(every day|daily)\b/i, () => {
    recurrence = "daily";
    return "";
  });

  title = title.replace(/\b(every week|weekly)\b/i, () => {
    recurrence = "weekly";
    return "";
  });

  title = title.replace(/\b(every month|monthly)\b/i, () => {
    recurrence = "monthly";
    return "";
  });

  const timeResult = extractDueTime(title);
  if (timeResult) {
    dueTime = timeResult.dueTime;
    title = timeResult.text;
  }

  const isoMatch = title.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (isoMatch) {
    dueDate = isoMatch[0];
    title = title.replace(isoMatch[0], "");
  }

  const relativeDateResult = extractRelativeDueDate(title);
  if (!dueDate && relativeDateResult) dueDate = relativeDateResult.dueDate;
  if (relativeDateResult) title = relativeDateResult.text;

  const weekdayMatch = title.match(/\b(?:(next|this)\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
  if (!dueDate && weekdayMatch) {
    dueDate = nextWeekdayISO(weekdayMatch[2], weekdayMatch[1]?.toLowerCase() === "next");
    title = title.replace(weekdayMatch[0], "");
  }

  title = title.replace(/\b(?:by|due|on|for|before|at|around|about|remind me to|i need to|need to|i have to|have to|got to|gotta|please|maybe)\b/gi, " ");

  const stepMatch = title.match(/\b(?:make|add|with|include)?\s*(?:steps|subtasks|sub steps|breakdown)\s+(?:for|to|of|:)?\s*(.+)$/i);
  if (stepMatch) {
    subtasks.push(...splitSubtasks(stepMatch[1]));
    title = title.replace(stepMatch[0], "");
  }

  const sentenceParts = title.split(/\.\s+/).map(cleanTitle).filter(Boolean);
  if (sentenceParts.length > 1) {
    title = sentenceParts.shift();
    subtasks.push(...sentenceParts.flatMap(splitSubtasks));
  }

  subtasks = unique(
    subtasks
      .flatMap(splitSubtasks)
      .map((item) => item.replace(/^(and|then|also)\s+/i, ""))
      .map(cleanTitle)
      .filter(Boolean)
      .filter((item) => item.length > 2)
  ).slice(0, 12);

  return {
    title: cleanTitle(title),
    tags: unique(tags),
    project,
    priority,
    dueDate,
    dueTime,
    estimate,
    energy,
    recurrence,
    notes: [
      subtasks.length || originalText.length > text.length + 20 ? `Captured from: ${originalText}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    subtasks,
  };
}

function extractDueTime(text) {
  const patterns = [
    /\b(?:at|by|before|around|about)?\s*(noon|midday|midnight)\b/i,
    /\b(?:at|by|before|around|about)?\s*(\d{1,2})(?::([0-5]\d))?\s*(a\.?m\.?|p\.?m\.?)\b/i,
    /\b(?:at|by|before|around|about)?\s*([01]?\d|2[0-3]):([0-5]\d)\b/i,
    /\b(?:at|by|before|around|about)?\s*(\d{1,2})\s*o'?clock\b/i,
  ];

  for (const regex of patterns) {
    const match = text.match(regex);
    if (!match) continue;
    const dueTime = normalizeTimeMatch(match, /\b(tonight|evening|night|tonite)\b/i.test(text));
    if (!dueTime) continue;
    return {
      dueTime,
      text: text.replace(match[0], " "),
    };
  }

  return null;
}

function normalizeTimeMatch(match, preferPm = false) {
  const phrase = match[1]?.toLowerCase();
  if (phrase === "noon" || phrase === "midday") return "12:00";
  if (phrase === "midnight") return "00:00";

  if (match[3] && /a|p/i.test(match[3])) {
    let hours = Number(match[1]);
    const minutes = Number(match[2] || 0);
    const meridiem = match[3].toLowerCase().replace(/\./g, "");
    if (hours < 1 || hours > 12) return "";
    if (meridiem === "pm" && hours !== 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  if (match[2] && !match[3]) {
    return `${String(Number(match[1])).padStart(2, "0")}:${String(Number(match[2])).padStart(2, "0")}`;
  }

  const hour = Number(match[1]);
  if (hour < 1 || hour > 12) return "";
  const adjusted = preferPm && hour < 12 ? hour + 12 : hour;
  return `${String(adjusted).padStart(2, "0")}:00`;
}

function extractRelativeDueDate(text) {
  const phraseOffsets = [
    [/\b(later today|this morning|this afternoon|this arvo|this avo|this evening|this night|end of day|tonight|tonite|today|eod)\b/i, 0],
    [/\b(day after tomorrow)\b/i, 2],
    [/\b(tomorrow morning|tomorrow afternoon|tomorrow evening|tomorrow night|tomorrow|tmrw)\b/i, 1],
    [/\b(next week|in a week)\b/i, 7],
  ];

  for (const [regex, offset] of phraseOffsets) {
    const match = text.match(regex);
    if (match) {
      return {
        dueDate: addDaysISO(offset),
        text: text.replace(match[0], " "),
      };
    }
  }

  const inDays = text.match(/\bin\s+(\d+)\s+(day|days|week|weeks)\b/i);
  if (inDays) {
    const amount = Number(inDays[1]);
    const multiplier = inDays[2].toLowerCase().startsWith("week") ? 7 : 1;
    return {
      dueDate: addDaysISO(amount * multiplier),
      text: text.replace(inDays[0], " "),
    };
  }

  const weekend = text.match(/\b(this weekend|weekend|next weekend)\b/i);
  if (weekend) {
    return {
      dueDate: nextWeekdayISO("saturday", weekend[1].toLowerCase().startsWith("next")),
      text: text.replace(weekend[0], " "),
    };
  }

  return null;
}

function splitSubtasks(value) {
  return String(value || "")
    .split(/,|;|\s+-\s+|\s+and\s+|\s+then\s+/i)
    .map(cleanTitle)
    .filter(Boolean);
}

function nextWeekdayISO(dayName, forceNext = false) {
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const target = weekdays.indexOf(dayName.toLowerCase());
  const today = new Date();
  let diff = target - today.getDay();
  if (diff < 0 || forceNext || diff === 0) diff += 7;
  return toISODate(addDays(today, diff));
}

function openTaskDialog(taskId = null) {
  hydrateDialogOptions();
  const task = state.tasks.find((item) => item.id === taskId);
  els.taskId.value = task?.id || "";
  els.dialogTitle.textContent = task ? "Edit task" : "New task";
  els.titleInput.value = task?.title || "";
  els.projectInput.value = task?.project || defaultProject();
  els.statusInput.value = task?.status || "backlog";
  els.priorityInput.value = task?.priority || "medium";
  els.dueInput.value = task?.dueDate || "";
  els.dueTimeInput.value = task?.dueTime || "";
  els.estimateInput.value = task?.estimate || "";
  els.energyInput.value = task?.energy || "medium";
  els.recurrenceInput.value = task?.recurrence || "none";
  els.tagsInput.value = task?.tags.join(", ") || "";
  els.notesInput.value = stripDueTimeNote(task?.notes || "");
  els.deleteTaskBtn.style.visibility = task ? "visible" : "hidden";
  els.duplicateTaskBtn.disabled = !task;
  els.subtaskList.innerHTML = "";
  (task?.subtasks || []).forEach((subtask) => addSubtaskRow(subtask));
  if (!(task?.subtasks || []).length) addSubtaskRow();
  els.taskDialog.showModal();
  els.titleInput.focus();
  refreshIcons();
}

function hydrateDialogOptions() {
  els.statusInput.innerHTML = statuses.map((status) => `<option value="${status.id}">${status.label}</option>`).join("");
  els.projectSuggestions.innerHTML = getProjects()
    .map((project) => `<option value="${escapeAttr(project)}"></option>`)
    .join("");
}

function addSubtaskRow(subtask = null) {
  const row = document.createElement("div");
  row.className = "subtask-row";
  row.dataset.subtaskId = subtask?.id || uid();
  row.innerHTML = `
    <input type="checkbox" ${subtask?.done ? "checked" : ""} aria-label="Complete subtask" />
    <input type="text" value="${escapeAttr(subtask?.text || "")}" placeholder="Add a step" maxlength="120" />
    <button class="chip-button" type="button" aria-label="Remove subtask"><i data-lucide="x"></i></button>
  `;
  row.querySelector("button").addEventListener("click", () => row.remove());
  els.subtaskList.appendChild(row);
  refreshIcons();
}

function saveTaskFromDialog(event) {
  event.preventDefault();
  const id = els.taskId.value || uid();
  const existing = state.tasks.find((task) => task.id === id);
  const status = els.statusInput.value;
  const task = normalizeTask({
    id,
    title: cleanTitle(els.titleInput.value),
    project: cleanTitle(els.projectInput.value) || defaultProject(),
    status,
    priority: els.priorityInput.value,
    dueDate: els.dueInput.value,
    dueTime: els.dueTimeInput.value,
    estimate: Number(els.estimateInput.value || 0),
    energy: els.energyInput.value,
    recurrence: els.recurrenceInput.value,
    tags: parseTags(els.tagsInput.value),
    notes: withDueTimeNote(els.notesInput.value.trim(), els.dueTimeInput.value),
    subtasks: collectSubtasks(),
    createdAt: existing?.createdAt || new Date().toISOString(),
    completedAt: status === "done" ? existing?.completedAt || new Date().toISOString() : null,
  });

  if (existing) {
    state.tasks = state.tasks.map((item) => (item.id === id ? task : item));
  } else {
    state.tasks.unshift(task);
  }

  persist();
  els.taskDialog.close();
  renderAll();
  toast(existing ? "Task updated" : "Task created");
}

function collectSubtasks() {
  return [...els.subtaskList.querySelectorAll(".subtask-row")]
    .map((row) => ({
      id: row.dataset.subtaskId || uid(),
      text: cleanTitle(row.querySelector("input[type='text']").value),
      done: row.querySelector("input[type='checkbox']").checked,
    }))
    .filter((subtask) => subtask.text);
}

function handleDeleteFromDialog() {
  const id = els.taskId.value;
  if (!id) return;
  confirmAction("Delete task?", "This removes the task and all subtasks from your synced account.", () => {
    state.tasks = state.tasks.filter((task) => task.id !== id);
    selectedTasks.delete(id);
    persist();
    deleteCloudTasks([id]).catch((error) => console.warn("Cloud delete failed", error));
    els.taskDialog.close();
    renderAll();
    toast("Task deleted");
  });
}

function handleDuplicateFromDialog() {
  const id = els.taskId.value;
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;
  const copy = normalizeTask({
    ...task,
    id: uid(),
    title: `${task.title} copy`,
    status: task.status === "done" ? "backlog" : task.status,
    createdAt: new Date().toISOString(),
    completedAt: null,
    subtasks: task.subtasks.map((subtask) => ({ ...subtask, id: uid() })),
  });
  state.tasks.unshift(copy);
  persist();
  els.taskDialog.close();
  renderAll();
  toast("Task duplicated");
}

function openMeetingDialog(meetingId = null) {
  const meeting = state.meetings.find((item) => item.id === meetingId);
  state.activeMeetingId = meeting?.id || null;
  els.meetingId.value = meeting?.id || "";
  els.meetingDialogTitle.textContent = meeting ? "Edit event" : "New event";
  els.meetingTitleInput.value = meeting?.title || "";
  els.meetingSubjectInput.value = meeting?.subject || "";
  els.meetingStatusInput.value = meeting?.status || "scheduled";
  els.meetingDateInput.value = meeting?.date || todayISO();
  els.meetingStartInput.value = meeting?.startTime || "09:00";
  els.meetingEndInput.value = meeting?.endTime || "";
  els.meetingRecurrenceInput.value = meeting?.recurrence || "fortnightly";
  els.meetingRepeatUntilInput.value = meeting?.recurrenceEndDate || "";
  els.meetingTeacherInput.value = meeting?.teacher || "";
  els.meetingLocationInput.value = meeting?.location || "";
  els.meetingTopicInput.value = meeting?.topic || "";
  els.meetingNotesInput.value = meeting?.notes || "";
  els.deleteMeetingBtn.style.visibility = meeting ? "visible" : "hidden";
  els.meetingCreateTaskBtn.disabled = !meeting;
  els.meetingDialog.showModal();
  els.meetingTitleInput.focus();
  refreshIcons();
}

function saveMeetingFromDialog(event) {
  event.preventDefault();
  const existing = state.meetings.find((meeting) => meeting.id === els.meetingId.value);
  const base = normalizeMeeting({
    id: existing?.id || uid(),
    seriesId: existing?.seriesId || uid(),
    title: els.meetingTitleInput.value,
    subject: els.meetingSubjectInput.value || inferSubject(els.meetingTitleInput.value),
    status: els.meetingStatusInput.value,
    date: els.meetingDateInput.value,
    startTime: els.meetingStartInput.value,
    endTime: els.meetingEndInput.value,
    recurrence: els.meetingRecurrenceInput.value,
    recurrenceEndDate: els.meetingRepeatUntilInput.value,
    teacher: els.meetingTeacherInput.value,
    location: els.meetingLocationInput.value,
    topic: els.meetingTopicInput.value,
    notes: els.meetingNotesInput.value.trim(),
    linkedTaskIds: existing?.linkedTaskIds || [],
    importedUid: existing?.importedUid || "",
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (existing) {
    state.meetings = state.meetings.map((meeting) => (meeting.id === existing.id ? base : meeting));
  } else {
    const occurrences = generateMeetingOccurrences(base);
    const existingKeys = new Set(state.meetings.map(meetingOccurrenceKey));
    state.meetings.push(...occurrences.filter((meeting) => !existingKeys.has(meetingOccurrenceKey(meeting))));
  }

  state.meetings = sortMeetings(state.meetings.map(normalizeMeeting));
  persist();
  els.meetingDialog.close();
  renderAll();
  toast(existing ? "Event updated" : "Events scheduled");
}

function handleDeleteMeetingFromDialog() {
  const id = els.meetingId.value;
  if (!id) return;
  confirmAction("Delete event?", "This removes this event occurrence and its notes from your synced account.", () => {
    state.meetings = state.meetings.filter((meeting) => meeting.id !== id);
    persist();
    deleteCloudMeetings([id]).catch((error) => console.warn("Cloud meeting delete failed", error));
    els.meetingDialog.close();
    renderAll();
    toast("Event deleted");
  });
}

function handleDeleteMeetingsScope(event) {
  event.preventDefault();
  const scope = els.deleteMeetingsScope.value;
  const targets = meetingsInDeleteScope(scope);
  els.deleteMeetingsDialog.close();
  if (!targets.length) {
    toast(`No events found for ${deleteScopeLabel(scope).toLowerCase()}`);
    return;
  }
  confirmAction(
    `Delete ${deleteScopeLabel(scope)} events?`,
    `${targets.length} ${targets.length === 1 ? "event" : "events"} will be removed from your synced account.`,
    () => {
      const ids = targets.map((meeting) => meeting.id);
      state.meetings = state.meetings.filter((meeting) => !ids.includes(meeting.id));
      persist();
      deleteCloudMeetings(ids).catch((error) => console.warn("Cloud meeting delete failed", error));
      renderAll();
      toast(`${targets.length} ${targets.length === 1 ? "event" : "events"} deleted`);
    }
  );
}

function meetingsInDeleteScope(scope) {
  const today = todayISO();
  const tomorrow = addDaysISO(1);
  const now = parseISODate(today);
  const weekEnd = addDaysISO(6 - now.getDay(), today);
  const monthPrefix = today.slice(0, 7);
  const yearPrefix = today.slice(0, 4);
  return state.meetings.filter((meeting) => {
    if (scope === "today") return meeting.date === today;
    if (scope === "tomorrow") return meeting.date === tomorrow;
    if (scope === "week") return meeting.date >= today && meeting.date <= weekEnd;
    if (scope === "month") return meeting.date.startsWith(monthPrefix);
    if (scope === "year") return meeting.date.startsWith(yearPrefix);
    return true;
  });
}

function deleteScopeLabel(scope) {
  return {
    today: "Today",
    tomorrow: "Tomorrow",
    week: "This week",
    month: "This month",
    year: "This year",
    all: "All",
  }[scope] || "Selected";
}

function updateMeetingStatus(meetingId, status) {
  state.meetings = state.meetings.map((meeting) =>
    meeting.id === meetingId ? normalizeMeeting({ ...meeting, status, updatedAt: new Date().toISOString() }) : meeting
  );
  persist();
  renderAll();
  toast(status === "done" ? "Event marked done" : "Event updated");
}

function createTaskFromMeetingDialog() {
  const meeting = state.meetings.find((item) => item.id === els.meetingId.value);
  if (!meeting) return;
  createTaskFromMeeting(meeting.id);
}

function createTaskFromMeeting(meetingId) {
  const meeting = state.meetings.find((item) => item.id === meetingId);
  if (!meeting) return;
  const task = normalizeTask({
    id: uid(),
    title: `${meeting.subject}: follow up from ${meeting.title}`,
    project: meeting.subject || "Events",
    status: "backlog",
    priority: "medium",
    dueDate: nextMeetingDate(meeting.date, meeting.recurrence === "none" ? "weekly" : meeting.recurrence),
    dueTime: meeting.startTime,
    estimate: 30,
    energy: "medium",
    recurrence: "none",
    tags: ["event", cleanToken(meeting.subject)].filter(Boolean),
    notes: `From event: ${meeting.title} on ${formatMeetingDateTime(meeting)}${meeting.notes ? `\n\nEvent notes:\n${meeting.notes}` : ""}`,
    subtasks: [],
    createdAt: new Date().toISOString(),
    completedAt: null,
  });
  state.tasks.unshift(task);
  state.meetings = state.meetings.map((item) =>
    item.id === meeting.id ? normalizeMeeting({ ...item, linkedTaskIds: unique([...item.linkedTaskIds, task.id]) }) : item
  );
  persist();
  renderAll();
  openTaskDialog(task.id);
  toast("Follow-up task created");
}

function updateTaskStatus(taskId, status) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task || task.status === status) return;
  task.status = status;
  task.completedAt = status === "done" ? new Date().toISOString() : null;
  persist();
  renderAll();
}

function toggleComplete(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  if (task.status === "done") {
    task.status = "progress";
    task.completedAt = null;
    toast("Task reopened");
  } else {
    task.status = "done";
    task.completedAt = new Date().toISOString();
    task.subtasks = task.subtasks.map((subtask) => ({ ...subtask, done: true }));
    if (task.recurrence !== "none") {
      state.tasks.unshift(createRecurringCopy(task));
      toast("Task completed and next recurrence scheduled");
    } else {
      toast("Task completed");
    }
  }

  persist();
  renderAll();
}

function createRecurringCopy(task) {
  const baseDate = task.dueDate || todayISO();
  const dueDate =
    task.recurrence === "daily"
      ? addDaysISO(1, baseDate)
      : task.recurrence === "weekly"
        ? addDaysISO(7, baseDate)
        : toISODate(addMonths(parseISODate(baseDate), 1));
  return normalizeTask({
    ...task,
    id: uid(),
    status: "planned",
    dueDate,
    createdAt: new Date().toISOString(),
    completedAt: null,
    subtasks: task.subtasks.map((subtask) => ({ ...subtask, id: uid(), done: false })),
  });
}

function bulkStatus(status) {
  state.tasks = state.tasks.map((task) =>
    selectedTasks.has(task.id)
      ? {
          ...task,
          status,
          completedAt: status === "done" ? new Date().toISOString() : null,
        }
      : task
  );
  selectedTasks.clear();
  persist();
  renderAll();
  toast("Bulk action applied");
}

function bulkDelete() {
  if (!selectedTasks.size) return;
  confirmAction("Delete selected tasks?", `${selectedTasks.size} selected tasks will be removed from your synced account.`, () => {
    const ids = [...selectedTasks];
    state.tasks = state.tasks.filter((task) => !selectedTasks.has(task.id));
    selectedTasks.clear();
    persist();
    deleteCloudTasks(ids).catch((error) => console.warn("Cloud delete failed", error));
    renderAll();
    toast("Selected tasks deleted");
  });
}

function confirmAction(title, message, callback) {
  els.confirmTitle.textContent = title;
  els.confirmMessage.textContent = message;
  const controller = new AbortController();
  els.confirmDialog.addEventListener(
    "close",
    () => {
      if (els.confirmDialog.returnValue === "confirm") callback();
      controller.abort();
    },
    { signal: controller.signal }
  );
  els.confirmDialog.showModal();
}

function clearFilters() {
  state.filters = {
    search: "",
    project: "all",
    tag: "all",
    priority: "all",
    due: "all",
    sort: "due",
  };
  renderAll();
}

function exportTasks() {
  const payload = {
    app: "TaskFlow",
    version: 2,
    account: state.user?.email || null,
    exportedAt: new Date().toISOString(),
    tasks: state.tasks,
    meetings: state.meetings,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `taskflow-backup-${todayISO()}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  toast("Backup exported");
}

function importTasks(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const tasks = Array.isArray(parsed) ? parsed : parsed.tasks;
      const meetings = Array.isArray(parsed?.meetings) ? parsed.meetings : [];
      if (!Array.isArray(tasks)) throw new Error("Missing tasks array");
      const previousIds = state.tasks.map((task) => task.id);
      const previousMeetingIds = state.meetings.map((meeting) => meeting.id);
      state.tasks = tasks.map(normalizeTask);
      state.meetings = meetings.map(normalizeMeeting);
      topUpRecurringMeetings();
      selectedTasks.clear();
      persist();
      const importedIds = new Set(state.tasks.map((task) => task.id));
      const removedIds = previousIds.filter((id) => !importedIds.has(id));
      const importedMeetingIds = new Set(state.meetings.map((meeting) => meeting.id));
      const removedMeetingIds = previousMeetingIds.filter((id) => !importedMeetingIds.has(id));
      deleteCloudTasks(removedIds).catch((error) => console.warn("Cloud delete failed", error));
      deleteCloudMeetings(removedMeetingIds).catch((error) => console.warn("Cloud meeting delete failed", error));
      renderAll();
      toast("Workspace imported and syncing");
    } catch {
      toast("Import failed: choose a TaskFlow JSON backup");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

async function importIcsMeetings(event) {
  const files = [...(event.target.files || [])];
  if (!files.length) return;
  let imported = 0;
  let skipped = 0;
  let unsupported = 0;
  const existingKeys = new Set(state.meetings.map(meetingOccurrenceKey));

  for (const file of files) {
    try {
      const text = await file.text();
      const meetings = parseIcsMeetings(text);
      if (!meetings.length) unsupported += 1;
      meetings.forEach((meeting) => {
        const key = meetingOccurrenceKey(meeting);
        if (existingKeys.has(key)) {
          skipped += 1;
          return;
        }
        existingKeys.add(key);
        state.meetings.push(meeting);
        imported += 1;
      });
    } catch (error) {
      console.warn("ICS import failed", error);
      unsupported += 1;
    }
  }

  state.meetings = sortMeetings(state.meetings.map(normalizeMeeting));
  persist();
  renderAll();
  toast(`ICS import: ${imported} added, ${skipped} skipped, ${unsupported} unsupported`);
  event.target.value = "";
}

function parseIcsMeetings(text) {
  const events = parseIcsEvents(text);
  return events.flatMap(eventToMeetings);
}

function parseIcsEvents(text) {
  const unfolded = String(text || "").replace(/\r?\n[ \t]/g, "");
  const blocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
  return blocks.map((block) => {
    const event = {};
    block.split(/\r?\n/).forEach((line) => {
      const index = line.indexOf(":");
      if (index === -1) return;
      const rawKey = line.slice(0, index);
      const value = decodeIcsText(line.slice(index + 1));
      const key = rawKey.split(";")[0].toUpperCase();
      const params = rawKey
        .split(";")
        .slice(1)
        .reduce((map, part) => {
          const [paramKey, paramValue] = part.split("=");
          map[paramKey?.toUpperCase()] = paramValue;
          return map;
        }, {});
      event[key] = { value, params };
    });
    return event;
  });
}

function eventToMeetings(event) {
  const start = parseIcsDate(event.DTSTART, state.meetingTimezone);
  if (!start) return [];
  const end = parseIcsDate(event.DTEND, state.meetingTimezone);
  const title = cleanTitle(event.SUMMARY?.value || "Imported event");
  const subject = inferSubject(title);
  const seriesId = uuidFromString(event.UID?.value || `${title}-${start.date}-${start.time}`);
  const recurrence = recurrenceFromRRule(event.RRULE?.value || "");
  const recurrenceEndDate = recurrence.until || "";
  const base = normalizeMeeting({
    id: stableMeetingId(seriesId, start.date, start.time),
    seriesId,
    title,
    subject,
    date: start.date,
    startTime: start.time,
    endTime: end?.time || "",
    recurrence: recurrence.type,
    recurrenceEndDate,
    notes: event.DESCRIPTION?.value || "",
    location: event.LOCATION?.value || "",
    importedUid: event.UID?.value || seriesId,
  });
  const meetings = recurrence.type === "none" ? [base] : generateMeetingOccurrences(base);
  return recurrence.count ? meetings.slice(0, recurrence.count) : meetings;
}

function parseIcsDate(field) {
  const value = field?.value;
  if (!value) return null;
  if (/^\d{8}$/.test(value)) {
    return { date: `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`, time: "09:00" };
  }
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  if (value.endsWith("Z")) {
    return datePartsInTimezone(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))), state.meetingTimezone);
  }
  if (field?.params?.TZID && field.params.TZID !== state.meetingTimezone) {
    const sourceInstant = zonedTimeToDate({ year, month, day, hour, minute }, field.params.TZID);
    return datePartsInTimezone(sourceInstant, state.meetingTimezone);
  }
  return { date: `${year}-${month}-${day}`, time: `${hour}:${minute}` };
}

function datePartsInTimezone(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(date)
    .reduce((map, part) => {
      if (part.type !== "literal") map[part.type] = part.value;
      return map;
    }, {});
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour === "24" ? "00" : parts.hour}:${parts.minute}`,
  };
}

function zonedTimeToDate(parts, timezone) {
  const desired = {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
  let instant = new Date(Date.UTC(desired.year, desired.month - 1, desired.day, desired.hour, desired.minute));
  for (let index = 0; index < 2; index += 1) {
    const actual = datePartsInTimezone(instant, timezone);
    const actualUtc = Date.UTC(
      Number(actual.date.slice(0, 4)),
      Number(actual.date.slice(5, 7)) - 1,
      Number(actual.date.slice(8, 10)),
      Number(actual.time.slice(0, 2)),
      Number(actual.time.slice(3, 5))
    );
    const desiredUtc = Date.UTC(desired.year, desired.month - 1, desired.day, desired.hour, desired.minute);
    instant = new Date(instant.getTime() + (desiredUtc - actualUtc));
  }
  return instant;
}

function recurrenceFromRRule(rrule) {
  if (!rrule) return { type: "none", count: 0, until: "" };
  const parts = Object.fromEntries(
    rrule.split(";").map((part) => {
      const [key, value] = part.split("=");
      return [key?.toUpperCase(), value];
    })
  );
  let type = "none";
  if (parts.FREQ === "WEEKLY") type = Number(parts.INTERVAL || 1) === 2 ? "fortnightly" : "weekly";
  if (parts.FREQ === "MONTHLY") type = "monthly";
  return {
    type,
    count: Number(parts.COUNT || 0),
    until: parts.UNTIL ? parseIcsDate({ value: parts.UNTIL }, state.meetingTimezone)?.date || "" : "",
  };
}

function decodeIcsText(value) {
  return String(value || "")
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function toggleTimer() {
  if (timer.running) {
    stopTimer();
    renderFocus();
    refreshIcons();
    return;
  }
  timer.running = true;
  timer.intervalId = window.setInterval(() => {
    timer.remaining = Math.max(0, timer.remaining - 1);
    const text = document.getElementById("timerText");
    if (text) text.textContent = formatTimer(timer.remaining);
    if (timer.remaining === 0) {
      stopTimer();
      toast("Focus session complete");
      renderFocus();
      refreshIcons();
    }
  }, 1000);
  renderFocus();
  refreshIcons();
}

function stopTimer() {
  timer.running = false;
  if (timer.intervalId) {
    window.clearInterval(timer.intervalId);
    timer.intervalId = null;
  }
}

function resetTimer(seconds) {
  stopTimer();
  timer.remaining = seconds;
  renderFocus();
  refreshIcons();
}

function getFocusMinutes() {
  const task = state.tasks.find((item) => item.id === state.focusTaskId);
  if (!task?.estimate) return 25;
  return Math.min(90, Math.max(5, task.estimate));
}

function normalizeTask(task) {
  const notes = String(task.notes || "");
  const dueTime = isValidTime(task.dueTime) ? task.dueTime : dueTimeFromNotes(notes);
  return {
    id: task.id || uid(),
    title: cleanTitle(task.title || "Untitled task"),
    project: cleanTitle(task.project || "Inbox"),
    status: statuses.some((status) => status.id === task.status) ? task.status : "backlog",
    priority: priorityOrder[task.priority] ? task.priority : "medium",
    dueDate: task.dueDate || "",
    dueTime,
    estimate: Number(task.estimate || 0),
    energy: ["low", "medium", "high"].includes(task.energy) ? task.energy : "medium",
    recurrence: ["none", "daily", "weekly", "monthly"].includes(task.recurrence) ? task.recurrence : "none",
    tags: unique((task.tags || []).map(cleanToken).filter(Boolean)),
    notes,
    subtasks: Array.isArray(task.subtasks)
      ? task.subtasks
          .map((subtask) => ({
            id: subtask.id || uid(),
            text: cleanTitle(subtask.text || ""),
            done: Boolean(subtask.done),
          }))
          .filter((subtask) => subtask.text)
      : [],
    createdAt: task.createdAt || new Date().toISOString(),
    completedAt: task.completedAt || null,
  };
}

function normalizeMeeting(meeting) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(meeting?.date || "") ? meeting.date : todayISO();
  const startTime = normalizeClockValue(meeting?.startTime) || "09:00";
  return {
    id: meeting?.id || uid(),
    seriesId: meeting?.seriesId || meeting?.id || uid(),
    title: cleanTitle(meeting?.title || "Event"),
    subject: cleanTitle(meeting?.subject || inferSubject(meeting?.title || "") || "Events"),
    topic: cleanTitle(meeting?.topic || ""),
    teacher: cleanTitle(meeting?.teacher || ""),
    location: cleanTitle(meeting?.location || ""),
    date,
    startTime,
    endTime: normalizeClockValue(meeting?.endTime),
    recurrence: ["none", "weekly", "fortnightly", "monthly"].includes(meeting?.recurrence) ? meeting.recurrence : "none",
    recurrenceEndDate: /^\d{4}-\d{2}-\d{2}$/.test(meeting?.recurrenceEndDate || "") ? meeting.recurrenceEndDate : "",
    notes: String(meeting?.notes || ""),
    status: ["scheduled", "done", "cancelled"].includes(meeting?.status) ? meeting.status : "scheduled",
    linkedTaskIds: Array.isArray(meeting?.linkedTaskIds) ? meeting.linkedTaskIds.filter(Boolean) : [],
    importedUid: cleanTitle(meeting?.importedUid || ""),
    createdAt: meeting?.createdAt || new Date().toISOString(),
    updatedAt: meeting?.updatedAt || new Date().toISOString(),
  };
}

function sortMeetings(meetings) {
  return meetings.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });
}

function topUpRecurringMeetings() {
  const recurringSeeds = new Map();
  state.meetings.forEach((meeting) => {
    if (meeting.recurrence === "none") return;
    const key = meeting.seriesId || meeting.id;
    const current = recurringSeeds.get(key);
    if (!current || meeting.date < current.date) recurringSeeds.set(key, meeting);
  });

  const existingKeys = new Set(state.meetings.map(meetingOccurrenceKey));
  const additions = [];
  recurringSeeds.forEach((seed) => {
    generateMeetingOccurrences(seed).forEach((meeting) => {
      const key = meetingOccurrenceKey(meeting);
      if (!existingKeys.has(key)) {
        existingKeys.add(key);
        additions.push(meeting);
      }
    });
  });

  if (additions.length) state.meetings = sortMeetings([...state.meetings, ...additions].map(normalizeMeeting));
}

function generateMeetingOccurrences(seedMeeting) {
  const seed = normalizeMeeting(seedMeeting);
  if (seed.recurrence === "none") return [seed];
  const horizon = toISODate(addMonths(new Date(), MEETING_HORIZON_MONTHS));
  const end = seed.recurrenceEndDate && seed.recurrenceEndDate < horizon ? seed.recurrenceEndDate : horizon;
  const occurrences = [];
  let date = seed.date;
  let index = 0;
  while (date <= end && index < 80) {
    occurrences.push(
      normalizeMeeting({
        ...seed,
        id: index === 0 ? seed.id : stableMeetingId(seed.seriesId, date, seed.startTime),
        date,
        notes: index === 0 ? seed.notes : "",
        status: index === 0 ? seed.status : "scheduled",
        linkedTaskIds: index === 0 ? seed.linkedTaskIds : [],
        createdAt: seed.createdAt,
        updatedAt: new Date().toISOString(),
      })
    );
    date = nextMeetingDate(date, seed.recurrence);
    index += 1;
  }
  return occurrences;
}

function nextMeetingDate(date, recurrence) {
  if (recurrence === "weekly") return addDaysISO(7, date);
  if (recurrence === "fortnightly") return addDaysISO(14, date);
  if (recurrence === "monthly") return toISODate(addMonths(parseISODate(date), 1));
  return date;
}

function meetingOccurrenceKey(meeting) {
  return `${meeting.importedUid || meeting.seriesId || meeting.id}|${meeting.date}|${meeting.startTime}`;
}

function stableMeetingId(seriesId, date, startTime) {
  return uuidFromString(`${seriesId}-${date}-${startTime}`);
}

function uuidFromString(value) {
  let hash = 0;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  const hex = `${hash.toString(16).padStart(8, "0")}${Math.abs(text.length * 2654435761).toString(16).padStart(8, "0")}`.slice(0, 16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(3, 6)}-${hex}${hex}`.slice(0, 36);
}

function inferSubject(title) {
  const clean = cleanTitle(title);
  if (!clean) return "";
  return clean.split(/[-:|]/)[0].replace(/\b(class|meeting|lesson|event)\b/gi, "").trim() || clean.split(" ")[0];
}

function seedTasks() {
  const now = new Date().toISOString();
  return [
    {
      title: "Ship the task tracker homepage",
      project: "Launch",
      status: "progress",
      priority: "urgent",
      dueDate: todayISO(),
      estimate: 90,
      energy: "high",
      recurrence: "none",
      tags: ["github", "ui"],
      notes: "Polish first screen, verify responsive layout, and make deployment straightforward.",
      subtasks: [
        { text: "Create static files", done: true },
        { text: "Verify in browser", done: false },
        { text: "Write deployment notes", done: false },
      ],
      createdAt: now,
      completedAt: null,
    },
    {
      title: "Prepare weekly planning ritual",
      project: "Operations",
      status: "planned",
      priority: "high",
      dueDate: addDaysISO(2),
      estimate: 45,
      energy: "medium",
      recurrence: "weekly",
      tags: ["planning"],
      notes: "Review overdue work, pull in commitments, and choose three outcomes for the week.",
      subtasks: [
        { text: "Archive stale tasks", done: false },
        { text: "Choose weekly outcomes", done: false },
      ],
      createdAt: now,
      completedAt: null,
    },
    {
      title: "Collect receipts for finance review",
      project: "Admin",
      status: "waiting",
      priority: "medium",
      dueDate: addDaysISO(5),
      estimate: 30,
      energy: "low",
      recurrence: "monthly",
      tags: ["finance"],
      notes: "Waiting on invoices before closing the month.",
      subtasks: [],
      createdAt: now,
      completedAt: null,
    },
    {
      title: "Draft product notes for stakeholder review",
      project: "Launch",
      status: "backlog",
      priority: "medium",
      dueDate: addDaysISO(8),
      estimate: 60,
      energy: "high",
      recurrence: "none",
      tags: ["writing", "product"],
      notes: "Summarize decisions, open questions, and rollout risks.",
      subtasks: [],
      createdAt: now,
      completedAt: null,
    },
    {
      title: "Clean up completed demo data",
      project: "Admin",
      status: "done",
      priority: "low",
      dueDate: addDaysISO(-1),
      estimate: 15,
      energy: "low",
      recurrence: "none",
      tags: ["maintenance"],
      notes: "Keep the workspace readable.",
      subtasks: [{ text: "Remove old labels", done: true }],
      createdAt: now,
      completedAt: now,
    },
  ].map((task) => normalizeTask({ ...task, id: uid() }));
}

function getProjects() {
  return unique([
    ...state.tasks.map((task) => task.project || "Inbox"),
    ...state.meetings.map((meeting) => meeting.subject || "Events"),
  ]).sort((a, b) => a.localeCompare(b));
}

function getTags() {
  return unique(state.tasks.flatMap((task) => task.tags)).sort((a, b) => a.localeCompare(b));
}

function defaultProject() {
  return getProjects()[0] || "Inbox";
}

function countBy(tasks, key) {
  return tasks.reduce((counts, task) => {
    const value = task[key] || "None";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function groupTasksByDueDate(tasks) {
  return tasks.reduce((map, task) => {
    if (!task.dueDate) return map;
    if (!map.has(task.dueDate)) map.set(task.dueDate, []);
    map.get(task.dueDate).push(task);
    return map;
  }, new Map());
}

function groupMeetingsByDate(meetings) {
  return meetings.reduce((map, meeting) => {
    if (!meeting.date) return map;
    if (!map.has(meeting.date)) map.set(meeting.date, []);
    map.get(meeting.date).push(meeting);
    map.get(meeting.date).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return map;
  }, new Map());
}

function filteredMeetingsForCalendar() {
  const { project, search } = state.filters;
  return sortMeetings(
    state.meetings.filter((meeting) => {
      if (project !== "all" && meeting.subject !== project) return false;
      if (search) {
        const haystack = [meeting.title, meeting.subject, meeting.topic, meeting.teacher, meeting.location, meeting.notes]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    })
  );
}

function getDueClass(task) {
  if (isOverdue(task)) return "due-overdue";
  if (isToday(task.dueDate)) return "due-today";
  return "";
}

function isOverdue(task) {
  return Boolean(task.dueDate && task.status !== "done" && task.dueDate < todayISO());
}

function isToday(date) {
  return Boolean(date && date === todayISO());
}

function isUpcoming(date) {
  if (!date) return false;
  const today = todayISO();
  const next = addDaysISO(7);
  return date > today && date <= next;
}

function isWithinDays(date, days) {
  if (!date) return false;
  const then = new Date(date).getTime();
  const now = Date.now();
  return now - then <= days * 24 * 60 * 60 * 1000;
}

function todayISO() {
  return toISODate(new Date());
}

function toISODate(date) {
  const copy = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return copy.toISOString().slice(0, 10);
}

function parseISODate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDaysISO(days, iso = todayISO()) {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + Number(days));
  return toISODate(date);
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function addMonths(date, months) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfWeek(date) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

function formatDate(iso) {
  return parseISODate(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatMeetingDateTime(meeting) {
  return `${formatDate(meeting.date)} ${formatMeetingTime(meeting)}`;
}

function formatMeetingTime(meeting) {
  const start = formatClockTime(meeting.startTime);
  const end = meeting.endTime ? formatClockTime(meeting.endTime) : "";
  return end ? `${start}-${end}` : start;
}

function formatDueLabel(task) {
  const date = formatDate(task.dueDate);
  return task.dueTime ? `${date} ${formatClockTime(task.dueTime)}` : date;
}

function formatClockTime(value) {
  if (!isValidTime(value)) return "";
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function isValidTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""));
}

function normalizeClockValue(value) {
  const text = String(value || "").trim();
  const match = text.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::\d{2})?$/);
  if (!match) return "";
  return `${String(Number(match[1])).padStart(2, "0")}:${match[2]}`;
}

function dueTimeFromNotes(notes) {
  const match = String(notes || "").match(/^Due time:\s*(([01]\d|2[0-3]):[0-5]\d)\s*$/im);
  return match && isValidTime(match[1]) ? match[1] : "";
}

function stripDueTimeNote(notes) {
  return String(notes || "")
    .split(/\r?\n/)
    .filter((line) => !/^Due time:\s*([01]\d|2[0-3]):[0-5]\d\s*$/i.test(line.trim()))
    .join("\n")
    .trim();
}

function withDueTimeNote(notes, dueTime) {
  const cleanNotes = stripDueTimeNote(notes);
  if (!isValidTime(dueTime)) return cleanNotes;
  return [`Due time: ${dueTime}`, cleanNotes].filter(Boolean).join("\n");
}

function displayNotes(task) {
  return stripDueTimeNote(task.notes || "");
}

function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function parseTags(value) {
  return unique(
    value
      .split(",")
      .map(cleanToken)
      .filter(Boolean)
  );
}

function cleanTitle(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanToken(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w-]+/g, "")
    .trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function uid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function toast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  els.toastContainer.appendChild(node);
  window.setTimeout(() => {
    node.style.opacity = "0";
    node.style.transform = "translateY(8px)";
  }, 2600);
  window.setTimeout(() => node.remove(), 3200);
}
