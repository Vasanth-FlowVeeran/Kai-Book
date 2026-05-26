// ============================================
// KaiBook — Main Application Logic (Redesigned)
// ============================================

// Detect Tauri environment
const IS_TAURI = Boolean(window.__TAURI_INTERNALS__);
let _onboardingComplete = true; // assume true; overridden in initTheme

async function tauriInvoke(cmd, args = {}) {
  if (!IS_TAURI) return null;
  return window.__TAURI__.core.invoke(cmd, args);
}

// ============================================
// IANA TIMEZONES
// ============================================
const IANA_TIMEZONES = [
  "Africa/Cairo", "Africa/Johannesburg", "Africa/Lagos", "Africa/Nairobi",
  "America/Anchorage", "America/Bogota", "America/Chicago", "America/Denver",
  "America/Halifax", "America/Los_Angeles", "America/Mexico_City",
  "America/New_York", "America/Phoenix", "America/Sao_Paulo",
  "America/Toronto", "America/Vancouver",
  "Asia/Bangkok", "Asia/Dhaka", "Asia/Dubai", "Asia/Hong_Kong",
  "Asia/Jakarta", "Asia/Karachi", "Asia/Kathmandu", "Asia/Kolkata",
  "Asia/Manila", "Asia/Seoul", "Asia/Shanghai", "Asia/Singapore",
  "Asia/Taipei", "Asia/Tokyo", "Asia/Yangon",
  "Atlantic/Azores",
  "Australia/Adelaide", "Australia/Brisbane", "Australia/Darwin",
  "Australia/Melbourne", "Australia/Perth", "Australia/Sydney",
  "Europe/Amsterdam", "Europe/Berlin", "Europe/Brussels", "Europe/Budapest",
  "Europe/Dublin", "Europe/Helsinki", "Europe/Istanbul", "Europe/Kyiv",
  "Europe/Lisbon", "Europe/London", "Europe/Madrid", "Europe/Moscow",
  "Europe/Oslo", "Europe/Paris", "Europe/Prague", "Europe/Rome",
  "Europe/Stockholm", "Europe/Vienna", "Europe/Warsaw", "Europe/Zurich",
  "Pacific/Auckland", "Pacific/Fiji", "Pacific/Guam", "Pacific/Honolulu",
  "Pacific/Norfolk", "Pacific/Pago_Pago", "Pacific/Port_Moresby",
  "US/Alaska", "US/Central", "US/Eastern", "US/Hawaii", "US/Mountain", "US/Pacific",
];

// ============================================
// AVATAR GRADIENTS (shared with tray)
// ============================================
const GRADIENTS = [
  ["#6c5ce7", "#a29bfe"],
  ["#e17055", "#fab1a0"],
  ["#00b894", "#55efc4"],
  ["#0984e3", "#74b9ff"],
  ["#e84393", "#fd79a8"],
  ["#fdcb6e", "#f39c12"],
  ["#00cec9", "#81ecec"],
  ["#6c5ce7", "#fd79a8"],
  ["#e17055", "#fdcb6e"],
  ["#0984e3", "#00cec9"],
];

function avatarGradient(name) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const g = GRADIENTS[Math.abs(hash) % GRADIENTS.length];
  return `linear-gradient(135deg, ${g[0]}, ${g[1]})`;
}

function initial(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

// ============================================
// SVG ICONS (inline for card rendering)
// ============================================
const ICON = {
  mail: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>',
  phone: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>',
  globe: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z"/></svg>',
  mapPin: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  compose: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  edit: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>',
  star: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  starFill: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  tag: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
};

// ============================================
// MOCK DATA
// ============================================
const MOCK_CONTACTS = [
  {
    id: "c001",
    name: "Alice Chen",
    emailPrimary: "alice@innovate.co",
    emailSecondary: "alice.chen@gmail.com",
    phonePrimary: "+1 (555) 123-4567",
    phoneSecondary: "",
    address: "350 Fifth Avenue, New York, NY 10118",
    timezone: "America/New_York",
    notes: "Prefers email over phone. Available 10am-4pm ET.",
    createdAt: "2026-05-20T09:00:00Z",
    updatedAt: "2026-05-20T09:00:00Z",
  },
  {
    id: "c002",
    name: "Bob Sharma",
    emailPrimary: "bob@techsolutions.in",
    emailSecondary: "",
    phonePrimary: "+91 98765 43210",
    phoneSecondary: "+91 87654 32109",
    address: "12 Park Street, Kolkata, West Bengal 700016",
    timezone: "Asia/Kolkata",
    notes: "WhatsApp is the best way to reach him.",
    createdAt: "2026-05-21T14:30:00Z",
    updatedAt: "2026-05-21T14:30:00Z",
  },
  {
    id: "c003",
    name: "Maria Lopez",
    emailPrimary: "maria@designlab.es",
    emailSecondary: "mlopez@outlook.com",
    phonePrimary: "+34 612 345 678",
    phoneSecondary: "",
    address: "Calle Gran Via 42, 28013 Madrid, Spain",
    timezone: "Europe/Madrid",
    notes: "Speaks English and Spanish. Usually responds within 24h.",
    createdAt: "2026-05-24T08:00:00Z",
    updatedAt: "2026-05-24T08:00:00Z",
  },
  {
    id: "c004",
    name: "Yuki Tanaka",
    emailPrimary: "yuki@studiocraft.jp",
    emailSecondary: "",
    phonePrimary: "+81 90-1234-5678",
    phoneSecondary: "",
    address: "Shibuya, Tokyo, Japan",
    timezone: "Asia/Tokyo",
    notes: "UX designer. Prefers async comms.",
    createdAt: "2026-05-22T06:00:00Z",
    updatedAt: "2026-05-22T06:00:00Z",
  },
  {
    id: "c005",
    name: "Liam O'Brien",
    emailPrimary: "liam@greenfield.ie",
    emailSecondary: "liam.obrien@proton.me",
    phonePrimary: "+353 87 123 4567",
    phoneSecondary: "",
    address: "Dublin 2, Ireland",
    timezone: "Europe/Dublin",
    notes: "Full-stack dev. Usually online 9-6 GMT.",
    createdAt: "2026-05-22T10:00:00Z",
    updatedAt: "2026-05-22T10:00:00Z",
  },
  {
    id: "c006",
    name: "Fatima Al-Rashid",
    emailPrimary: "fatima@nexustech.ae",
    emailSecondary: "",
    phonePrimary: "+971 50 987 6543",
    phoneSecondary: "",
    address: "DIFC, Dubai, UAE",
    timezone: "Asia/Dubai",
    notes: "Product manager. Responds quickly on Slack.",
    createdAt: "2026-05-23T08:00:00Z",
    updatedAt: "2026-05-23T08:00:00Z",
  },
  {
    id: "c007",
    name: "Carlos Rivera",
    emailPrimary: "carlos@pixelworks.mx",
    emailSecondary: "",
    phonePrimary: "+52 55 1234 5678",
    phoneSecondary: "",
    address: "Roma Norte, Mexico City, Mexico",
    timezone: "America/Mexico_City",
    notes: "Motion designer. Night owl — often online late.",
    createdAt: "2026-05-23T11:00:00Z",
    updatedAt: "2026-05-23T11:00:00Z",
  },
  {
    id: "c008",
    name: "Sophie Laurent",
    emailPrimary: "sophie@artisancode.fr",
    emailSecondary: "s.laurent@gmail.com",
    phonePrimary: "+33 6 12 34 56 78",
    phoneSecondary: "",
    address: "Le Marais, Paris, France",
    timezone: "Europe/Paris",
    notes: "Frontend specialist. Prefers email.",
    createdAt: "2026-05-24T07:00:00Z",
    updatedAt: "2026-05-24T07:00:00Z",
  },
  {
    id: "c009",
    name: "Oluwaseun Adeyemi",
    emailPrimary: "seun@lagosbytes.ng",
    emailSecondary: "",
    phonePrimary: "+234 803 456 7890",
    phoneSecondary: "",
    address: "Victoria Island, Lagos, Nigeria",
    timezone: "Africa/Lagos",
    notes: "Backend engineer. Very responsive on WhatsApp.",
    createdAt: "2026-05-24T09:00:00Z",
    updatedAt: "2026-05-24T09:00:00Z",
  },
  {
    id: "c010",
    name: "Emma Johansson",
    emailPrimary: "emma@nordicpixels.se",
    emailSecondary: "",
    phonePrimary: "+46 70 123 4567",
    phoneSecondary: "",
    address: "Södermalm, Stockholm, Sweden",
    timezone: "Europe/Stockholm",
    notes: "Illustrator. Part-time — available Mon/Wed/Fri.",
    createdAt: "2026-05-24T12:00:00Z",
    updatedAt: "2026-05-24T12:00:00Z",
  },
  {
    id: "c011",
    name: "James Walker",
    emailPrimary: "james@outbackdev.au",
    emailSecondary: "",
    phonePrimary: "+61 4 1234 5678",
    phoneSecondary: "",
    address: "Surry Hills, Sydney, Australia",
    timezone: "Australia/Sydney",
    notes: "DevOps lead. Early riser — best before noon AEST.",
    createdAt: "2026-05-25T03:00:00Z",
    updatedAt: "2026-05-25T03:00:00Z",
  },
  {
    id: "c012",
    name: "Priya Nair",
    emailPrimary: "priya@cloudleap.in",
    emailSecondary: "priya.nair@yahoo.com",
    phonePrimary: "+91 98765 12345",
    phoneSecondary: "",
    address: "Indiranagar, Bangalore, India",
    timezone: "Asia/Kolkata",
    notes: "Data scientist. Prefers scheduled calls over async.",
    createdAt: "2026-05-25T05:30:00Z",
    updatedAt: "2026-05-25T05:30:00Z",
  },
];

// ============================================
// STATE
// ============================================
let contacts = [];
let groups = []; // ContactGroup[]  { id, name, color }
let activeTab = "all"; // "all" | "favorites" | group id
let searchQuery = "";
let editingId = null;
let confirmCallback = null;
let currentPage = 0;
const PAGE_SIZE = 10;
const MAX_PAGES = 2;
const MAX_CONTACTS = MAX_PAGES * PAGE_SIZE;

const GROUP_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6",
];

// ============================================
// THEME (dark mode + UI themes)
// ============================================
function syncNativeTheme() {
  if (!IS_TAURI) return;
  const isDark = document.body.classList.contains("dark-mode");
  const uiTheme = document.body.getAttribute("data-theme") || "skeuomorphic";
  // Paper in light mode is the only light-toolbar theme; everything else is dark
  const wantDark = !(uiTheme === "paper" && !isDark);
  tauriInvoke("set_native_theme", { dark: wantDark });
}

async function initTheme() {
  let darkMode = false;
  let uiTheme = "skeuomorphic";
  // Load from shared file via Rust command (works across webviews)
  if (IS_TAURI) {
    try {
      const settings = await tauriInvoke("load_theme");
      if (settings) {
        darkMode = settings.darkMode;
        uiTheme = settings.uiTheme || "skeuomorphic";
        _onboardingComplete = !!settings.onboardingComplete;
      }
    } catch (e) { console.warn("load_theme failed:", e); }
  }
  if (darkMode) {
    document.body.classList.add("dark-mode");
  }
  document.body.setAttribute("data-theme", uiTheme);
  syncNativeTheme();
  // Highlight correct card in settings
  setTimeout(() => {
    document.querySelectorAll(".theme-card").forEach(c => {
      c.classList.toggle("active", c.dataset.theme === uiTheme);
    });
  }, 0);
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");
  const uiTheme = document.body.getAttribute("data-theme") || "skeuomorphic";
  syncNativeTheme();
  // Persist to shared file
  if (IS_TAURI) {
    tauriInvoke("save_theme", { settings: { darkMode: isDark, uiTheme: uiTheme, onboardingComplete: _onboardingComplete } });
    // Notify tray popup immediately
    window.__TAURI__.event.emit("theme-changed", {
      theme: isDark ? "dark" : "light",
      uiTheme: uiTheme
    });
  }
}

function setUITheme(themeName) {
  document.body.setAttribute("data-theme", themeName);
  const isDark = document.body.classList.contains("dark-mode");
  document.querySelectorAll(".theme-card").forEach(c => {
    c.classList.toggle("active", c.dataset.theme === themeName);
  });
  syncNativeTheme();
  // Re-render contacts so TOD icons swap for cyberpunk
  renderContacts();
  // Persist to shared file
  if (IS_TAURI) {
    tauriInvoke("save_theme", { settings: { darkMode: isDark, uiTheme: themeName, onboardingComplete: _onboardingComplete } });
    // Notify tray popup immediately
    window.__TAURI__.event.emit("theme-changed", {
      theme: isDark ? "dark" : "light",
      uiTheme: themeName
    });
  }
}

// ============================================
// INITIALIZATION
// ============================================
async function init() {
  await initTheme();
  await loadContacts();
  await loadGroups();
  populateTimezoneDropdown();
  startLiveClock();
  bindEvents();
  renderTabs();
  renderAll();

  // Show onboarding on first launch
  if (!_onboardingComplete) {
    showOnboarding();
  }
}

async function loadContacts() {
  if (IS_TAURI) {
    try {
      const loaded = await tauriInvoke("load_contacts");
      if (loaded && loaded.length > 0) {
        contacts = loaded;
      } else {
        contacts = JSON.parse(JSON.stringify(MOCK_CONTACTS));
        await saveContacts();
      }
    } catch (e) {
      console.error("Tauri load_contacts failed:", e);
      contacts = JSON.parse(JSON.stringify(MOCK_CONTACTS));
    }
  } else {
    try {
      const stored = localStorage.getItem("kaibook_contacts");
      if (stored) {
        contacts = JSON.parse(stored);
      } else {
        contacts = JSON.parse(JSON.stringify(MOCK_CONTACTS));
        saveContacts();
      }
    } catch (e) {
      contacts = JSON.parse(JSON.stringify(MOCK_CONTACTS));
    }
  }
}

async function saveContacts() {
  if (IS_TAURI) {
    try {
      await tauriInvoke("save_contacts", { contacts });
    } catch (e) {
      console.error("Tauri save_contacts failed:", e);
    }
  } else {
    localStorage.setItem("kaibook_contacts", JSON.stringify(contacts));
  }
}

// ============================================
// GROUPS PERSISTENCE
// ============================================
async function loadGroups() {
  if (IS_TAURI) {
    try {
      const loaded = await tauriInvoke("load_groups");
      if (loaded) groups = loaded;
    } catch (e) { console.warn("load_groups failed:", e); }
  } else {
    try {
      const stored = localStorage.getItem("kaibook_groups");
      if (stored) groups = JSON.parse(stored);
    } catch (e) { /* ignore */ }
  }
}

async function saveGroups() {
  if (IS_TAURI) {
    try { await tauriInvoke("save_groups", { groups }); }
    catch (e) { console.error("save_groups failed:", e); }
  } else {
    localStorage.setItem("kaibook_groups", JSON.stringify(groups));
  }
}

// ============================================
// TIMEZONE DROPDOWN
// ============================================
function populateTimezoneDropdown() {
  const select = document.getElementById("form-timezone");
  select.innerHTML = '<option value="">Select timezone</option>';
  IANA_TIMEZONES.sort().forEach((tz) => {
    const option = document.createElement("option");
    option.value = tz;
    option.textContent = tz.replace(/_/g, " ");
    select.appendChild(option);
  });
}

// ============================================
// LIVE CLOCK
// ============================================
function startLiveClock() {
  setInterval(() => {
    document.querySelectorAll(".card-time").forEach((el) => {
      const tz = el.dataset.timezone;
      if (tz) el.textContent = formatTime(tz);
    });
    // Update TOD badges — only re-roll phrase when period actually changes
    document.querySelectorAll(".tod-badge").forEach((el) => {
      const card = el.closest(".card");
      if (!card) return;
      const timeEl = card.querySelector(".card-time");
      const tz = timeEl ? timeEl.dataset.timezone : "";
      if (!tz) return;
      const period = todPeriod(tz);
      const oldPeriod = el.dataset.period || "";
      if (period !== oldPeriod) {
        el.dataset.period = period;
        el.className = `tod-badge tod-${period}`;
        el.dataset.tip = todPhrase(period);
        const img = el.querySelector("img");
        if (img) img.src = todIconSrc(period);
      }
    });
  }, 1000);
}

function formatTime(ianaZone) {
  try {
    return new Date().toLocaleTimeString("en-US", {
      timeZone: ianaZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return "--:--";
  }
}

// ============================================
// TIME-OF-DAY STATUS INDICATOR
// ============================================
function getHourIn(tz) {
  try {
    return parseInt(new Date().toLocaleString("en-US", { timeZone: tz, hour: "numeric", hour12: false }), 10);
  } catch (e) { return -1; }
}

function todPeriod(tz) {
  const h = getHourIn(tz);
  if (h < 0) return "unknown";
  if (h >= 5 && h < 8) return "early-morning";
  if (h >= 8 && h < 12) return "late-morning";
  if (h >= 12 && h < 15) return "early-afternoon";
  if (h >= 15 && h < 17) return "late-afternoon";
  if (h >= 17 && h < 19) return "early-evening";
  if (h >= 19 && h < 22) return "evening";
  return "night"; // 22-4
}

const TOD_PHRASES = {
  "early-morning": [
    "Probably still hitting snooze",
    "Coffee hasn't kicked in yet",
    "Maybe wait for their first coffee",
    "They might be mid-yawn",
    "Dawn patrol — tread lightly",
    "Give them 30 more minutes"
  ],
  "late-morning": [
    "Good time to reach out!",
    "They're warmed up — go for it",
    "Sweet spot — fully caffeinated",
    "Prime time to ping them",
    "They're in the zone, say hi!",
    "Green light — send that message"
  ],
  "early-afternoon": [
    "Post-lunch — might be slow to reply",
    "Could be in a food coma",
    "They're around, fire away",
    "Afternoon mode — fair game",
    "Probably at their desk",
    "Good window — catch them now"
  ],
  "late-afternoon": [
    "Winding down soon",
    "Still working — get in quick",
    "Last chance before EOD",
    "Clock is ticking on their day",
    "Catch them before they log off",
    "Now or wait till tomorrow"
  ],
  "early-evening": [
    "They're off the clock",
    "Dinner time — maybe wait",
    "Personal time — keep it short",
    "Unless it's urgent, hold off",
    "They've mentally checked out",
    "Evening vibes — not ideal"
  ],
  "evening": [
    "Couch mode activated",
    "Netflix > your message right now",
    "Save it for tomorrow",
    "They won't thank you for this ping",
    "Let them enjoy their evening",
    "Tomorrow is a better bet"
  ],
  "night": [
    "They're counting sheep",
    "Shhh... they're sleeping",
    "Do not disturb!",
    "Schedule this for morning",
    "Zzz... definitely wait",
    "Their phone is on silent (hopefully)"
  ],
  "unknown": [""]
};

function todPhrase(period) {
  const phrases = TOD_PHRASES[period] || [""];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

function todIconSrc(period) {
  const theme = document.body.getAttribute("data-theme");
  if (theme === "cyberpunk") return `assets/tod/cyberpunk/${period}.svg`;
  return `assets/tod/${period}.png`;
}

function todBadge(tz) {
  if (!tz) return "";
  const period = todPeriod(tz);
  if (period === "unknown") return "";
  const phrase = todPhrase(period);
  return `<span class="tod-badge tod-${period}" data-tip="${phrase}" data-period="${period}">
    <img src="${todIconSrc(period)}" alt="${phrase}">
  </span>`;
}

// ============================================
// EVENT BINDINGS
// ============================================
function bindEvents() {
  document.getElementById("main-search").addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase();
    currentPage = 0;
    renderContacts();
  });

  document.getElementById("btn-add-contact").addEventListener("click", () => openForm());
  document.getElementById("btn-add-first").addEventListener("click", () => openForm());

  // Tab bar — All and Favorites
  document.querySelector('.tab[data-tab="all"]').addEventListener("click", () => switchTab("all"));
  document.querySelector('.tab[data-tab="favorites"]').addEventListener("click", () => switchTab("favorites"));
  document.getElementById("tab-add-group").addEventListener("click", createGroupInline);

  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById("contact-form").addEventListener("submit", handleFormSubmit);

  document.getElementById("btn-theme").addEventListener("click", toggleTheme);

  document.getElementById("btn-settings").addEventListener("click", () => showPage("settings"));
  document.getElementById("btn-back-settings").addEventListener("click", () => showPage("main"));

  // Theme grid
  document.getElementById("theme-grid").addEventListener("click", (e) => {
    const card = e.target.closest(".theme-card");
    if (!card || !card.dataset.theme) return;
    setUITheme(card.dataset.theme);
  });

  document.getElementById("btn-export").addEventListener("click", exportContacts);
  document.getElementById("btn-import").addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = importContacts;
    input.click();
  });

  document.getElementById("btn-confirm-cancel").addEventListener("click", closeConfirm);
  document.getElementById("btn-confirm-ok").addEventListener("click", () => {
    if (confirmCallback) confirmCallback();
    closeConfirm();
  });
  document.getElementById("confirm-overlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeConfirm();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!document.getElementById("confirm-overlay").classList.contains("hidden")) {
        closeConfirm();
      } else if (!document.getElementById("modal-overlay").classList.contains("hidden")) {
        closeModal();
      }
    }
  });
}

// ============================================
// TABS — Groups & Favorites
// ============================================
function renderTabs() {
  const scroll = document.getElementById("tab-scroll");
  // Keep All and Favorites, remove old dynamic tabs
  const dynamicTabs = scroll.querySelectorAll(".tab-group");
  dynamicTabs.forEach(t => t.remove());

  // Add group tabs
  groups.forEach(g => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tab tab-group" + (activeTab === g.id ? " active" : "");
    btn.dataset.tab = g.id;
    btn.innerHTML = `<span class="tab-dot" style="background:${escapeHtml(g.color)}"></span>${escapeHtml(g.name)}`;
    btn.addEventListener("click", () => switchTab(g.id));
    btn.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showTabContextMenu(e, g);
    });
    scroll.appendChild(btn);
  });

  // Update active states on All and Favorites
  scroll.querySelectorAll(".tab").forEach(t => {
    if (!t.classList.contains("tab-group")) {
      t.classList.toggle("active", t.dataset.tab === activeTab);
    }
  });
}

function switchTab(tab) {
  activeTab = tab;
  currentPage = 0;
  renderTabs();
  renderContacts();
}

function showTabContextMenu(e, group) {
  closeAllDropdowns();
  const menu = document.createElement("div");
  menu.className = "tab-context";
  menu.style.left = e.clientX + "px";
  menu.style.top = e.clientY + "px";
  menu.innerHTML = `
    <button type="button" class="tab-context-item" data-action="rename">
      ${ICON.edit} Rename
    </button>
    <button type="button" class="tab-context-item tab-context-item--danger" data-action="delete">
      ${ICON.trash} Delete Group
    </button>
  `;
  menu.querySelector('[data-action="rename"]').addEventListener("click", () => {
    menu.remove();
    renameGroup(group);
  });
  menu.querySelector('[data-action="delete"]').addEventListener("click", () => {
    menu.remove();
    deleteGroup(group);
  });
  document.body.appendChild(menu);
  // Close on outside click
  setTimeout(() => {
    document.addEventListener("click", function handler() {
      menu.remove();
      document.removeEventListener("click", handler);
    }, { once: true });
  }, 0);
}

function createGroupInline() {
  // If there's already an inline input, focus it
  const existing = document.getElementById("tab-new-input");
  if (existing) { existing.focus(); return; }

  const scroll = document.getElementById("tab-scroll");
  const wrapper = document.createElement("div");
  wrapper.className = "tab tab-new-wrapper";
  wrapper.innerHTML = `<input id="tab-new-input" class="tab-new-input" type="text" placeholder="Group name…" spellcheck="false" maxlength="20">`;
  scroll.appendChild(wrapper);

  const input = wrapper.querySelector("input");
  input.focus();

  function commit() {
    const name = input.value.trim();
    wrapper.remove();
    if (!name) return;
    const g = {
      id: "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      name: name,
      color: GROUP_COLORS[groups.length % GROUP_COLORS.length],
    };
    groups.push(g);
    saveGroups();
    switchTab(g.id);
    if (IS_TAURI) {
      window.__TAURI__.event.emit("groups-changed", {});
    }
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    if (e.key === "Escape") { wrapper.remove(); }
  });
  input.addEventListener("blur", () => {
    // Small delay so click on input doesn't count as blur
    setTimeout(() => { if (document.body.contains(wrapper)) commit(); }, 120);
  });
}

function renameGroup(group) {
  // Find the tab button for this group and replace with inline input
  const tabBtn = document.querySelector(`.tab-group[data-tab="${group.id}"]`);
  if (!tabBtn) return;

  const oldHtml = tabBtn.innerHTML;
  tabBtn.innerHTML = `<input class="tab-new-input" type="text" value="${escapeHtml(group.name)}" spellcheck="false" maxlength="20">`;
  const input = tabBtn.querySelector("input");
  input.focus();
  input.select();

  function commit() {
    const newName = input.value.trim();
    if (newName) {
      group.name = newName;
      saveGroups();
      if (IS_TAURI) {
        window.__TAURI__.event.emit("groups-changed", {});
      }
    }
    renderTabs();
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    if (e.key === "Escape") { renderTabs(); }
  });
  input.addEventListener("blur", () => {
    setTimeout(() => commit(), 120);
  });
}

async function deleteGroup(group) {
  // Remove group from all contacts that have it
  contacts.forEach(c => {
    if (c.groups) {
      c.groups = c.groups.filter(gId => gId !== group.id);
    }
  });
  groups = groups.filter(g => g.id !== group.id);
  if (activeTab === group.id) activeTab = "all";
  await saveContacts();
  await saveGroups();
  renderTabs();
  renderAll();
  if (IS_TAURI) {
    window.__TAURI__.event.emit("groups-changed", {});
    window.__TAURI__.event.emit("refresh-contacts", {});
  }
}

async function toggleFavorite(contactId) {
  const c = contacts.find(x => x.id === contactId);
  if (!c) return;
  c.favorite = !c.favorite;
  await saveContacts();
  renderContacts();
  if (IS_TAURI) {
    window.__TAURI__.event.emit("refresh-contacts", {});
  }
}

async function toggleContactGroup(contactId, groupId) {
  const c = contacts.find(x => x.id === contactId);
  if (!c) return;
  if (!c.groups) c.groups = [];
  const idx = c.groups.indexOf(groupId);
  if (idx === -1) {
    c.groups.push(groupId);
  } else {
    c.groups.splice(idx, 1);
  }
  await saveContacts();
  renderContacts();
  if (IS_TAURI) {
    window.__TAURI__.event.emit("refresh-contacts", {});
  }
}

function showGroupDropdown(btn, contactId) {
  closeAllDropdowns();
  const card = btn.closest(".card");
  const dd = document.createElement("div");
  dd.className = "group-dropdown";
  const contact = contacts.find(x => x.id === contactId);
  const contactGroups = (contact && contact.groups) || [];

  if (groups.length === 0) {
    dd.innerHTML = `<div style="padding:8px;font-size:11px;color:var(--ink-muted);text-align:center;">No groups yet. Create one with the + tab.</div>`;
  } else {
    dd.innerHTML = groups.map(g => {
      const checked = contactGroups.includes(g.id);
      return `<button type="button" class="group-dropdown-item${checked ? " checked" : ""}" data-group-id="${g.id}">
        <span class="gd-dot" style="background:${escapeHtml(g.color)}"></span>
        ${escapeHtml(g.name)}
        <svg class="gd-check" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      </button>`;
    }).join("");
  }

  card.appendChild(dd);

  dd.querySelectorAll(".group-dropdown-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleContactGroup(contactId, item.dataset.groupId);
      dd.remove();
    });
  });

  // Close on outside click
  setTimeout(() => {
    document.addEventListener("click", function handler(e) {
      if (!dd.contains(e.target)) {
        dd.remove();
        document.removeEventListener("click", handler);
      }
    });
  }, 0);
}

function closeAllDropdowns() {
  document.querySelectorAll(".group-dropdown, .tab-context").forEach(d => d.remove());
}

function filterContactsByTab(list) {
  if (activeTab === "all") return list;
  if (activeTab === "favorites") return list.filter(c => c.favorite);
  // Group filter
  return list.filter(c => c.groups && c.groups.includes(activeTab));
}

// ============================================
// RENDER
// ============================================
function renderAll() {
  renderContacts();
  updateContactCount();
}

function updateContactCount() {
  const tabFiltered = filterContactsByTab(contacts);
  const total = contacts.length;
  const showing = tabFiltered.length;
  if (activeTab === "all") {
    document.getElementById("contact-count").textContent =
      `${total} contact${total !== 1 ? "s" : ""}`;
  } else {
    document.getElementById("contact-count").textContent =
      `${showing} of ${total} contact${total !== 1 ? "s" : ""}`;
  }
}

function renderContacts() {
  const list = document.getElementById("contact-list");
  const empty = document.getElementById("empty-state");

  // Apply tab filter first, then search
  const tabFiltered = filterContactsByTab(contacts);
  const filtered = searchQuery
    ? tabFiltered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery) ||
          (c.emailPrimary || "").toLowerCase().includes(searchQuery) ||
          (c.emailSecondary || "").toLowerCase().includes(searchQuery) ||
          (c.phonePrimary || "").toLowerCase().includes(searchQuery) ||
          (c.address || "").toLowerCase().includes(searchQuery) ||
          (c.notes || "").toLowerCase().includes(searchQuery)
      )
    : tabFiltered;

  // Cap to max contacts
  const capped = filtered.slice(0, MAX_CONTACTS);
  const totalPages = Math.ceil(capped.length / PAGE_SIZE) || 1;

  // Clamp current page
  if (currentPage >= totalPages) currentPage = totalPages - 1;
  if (currentPage < 0) currentPage = 0;

  const start = currentPage * PAGE_SIZE;
  const pageItems = capped.slice(start, start + PAGE_SIZE);

  if (capped.length === 0 && !searchQuery) {
    empty.classList.remove("hidden");
    list.innerHTML = "";
    return;
  }

  empty.classList.add("hidden");

  const cards = pageItems
    .map((c, idx) => {
      // Build subtitle line (email + phone)
      const subParts = [];
      if (c.emailPrimary) {
        subParts.push(`<span>${ICON.mail} ${escapeHtml(c.emailPrimary)}</span>`);
      }
      if (c.phonePrimary) {
        subParts.push(`<span>${ICON.phone} ${escapeHtml(c.phonePrimary)}</span>`);
      }
      const subLine = subParts.length > 0
        ? `<div class="card-sub">${subParts.join("")}</div>`
        : "";

      // Build detail tags
      const tags = [];
      if (c.timezone) {
        tags.push(`<span class="card-tag">${ICON.globe} ${escapeHtml(c.timezone.replace(/_/g, " "))}</span>`);
      }
      if (c.address) {
        tags.push(`<span class="card-tag">${ICON.mapPin} ${escapeHtml(c.address)}</span>`);
      }
      if (c.emailSecondary) {
        tags.push(`<span class="card-tag">${ICON.mail} ${escapeHtml(c.emailSecondary)}</span>`);
      }
      if (c.phoneSecondary) {
        tags.push(`<span class="card-tag">${ICON.phone} ${escapeHtml(c.phoneSecondary)}</span>`);
      }
      if (c.notes) {
        tags.push(`<span class="card-tag">${escapeHtml(c.notes)}</span>`);
      }
      const detailSection = tags.length > 0
        ? `<div class="card-details">${tags.join("")}</div>`
        : "";

      // Group badges for this contact
      const contactGroupBadges = (c.groups || []).map(gId => {
        const g = groups.find(x => x.id === gId);
        if (!g) return "";
        return `<span class="card-tag" style="border-color:${g.color}30;background:${g.color}12"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${g.color};margin-right:3px"></span>${escapeHtml(g.name)}</span>`;
      }).join("");

      return `
      <div class="card" data-id="${c.id}" style="animation-delay:${idx * 30}ms">
        <div class="drag-handle" title="Drag to reorder"><span></span><span></span><span></span></div>
        <div class="card-top">
          <div class="card-avatar-wrap">
            <div class="card-avatar" style="background:${avatarGradient(c.name)}">${initial(c.name)}</div>
            ${todBadge(c.timezone)}
          </div>
          <div class="card-main">
            <div class="card-name">${escapeHtml(c.name)}</div>
            ${subLine}
          </div>
          <div class="card-time" data-timezone="${escapeHtml(c.timezone || "")}">${c.timezone ? formatTime(c.timezone) : "--:--"}</div>
        </div>
        ${detailSection}
        ${contactGroupBadges ? `<div class="card-details card-group-badges">${contactGroupBadges}</div>` : ""}
        <div class="card-actions">
          <button type="button" class="card-action favorite${c.favorite ? " is-fav" : ""}" data-id="${c.id}" title="Favorite">${c.favorite ? ICON.starFill : ICON.star}</button>
          <button type="button" class="card-action group-assign" data-id="${c.id}" title="Assign to group">${ICON.tag}</button>
          ${c.emailPrimary ? `<button type="button" class="card-action email" data-email="${escapeHtml(c.emailPrimary)}" data-name="${escapeHtml(c.name)}" title="Compose email">${ICON.compose}</button>` : ""}
          <button type="button" class="card-action edit" data-id="${c.id}" title="Edit">${ICON.edit}</button>
          <button type="button" class="card-action delete" data-id="${c.id}" title="Delete">${ICON.trash}</button>
        </div>
      </div>`;
    })
    .join("");

  // Pagination controls
  let paginationHtml = "";
  if (totalPages > 1) {
    paginationHtml = `
    <div class="pagination">
      <button type="button" class="page-btn${currentPage === 0 ? " disabled" : ""}" id="page-prev">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Prev
      </button>
      <span class="page-info">${currentPage + 1} / ${totalPages}</span>
      <button type="button" class="page-btn${currentPage >= totalPages - 1 ? " disabled" : ""}" id="page-next">
        Next
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>`;
  }

  list.innerHTML = cards + paginationHtml;

  // Bind card action buttons
  list.querySelectorAll(".card-action.email").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const email = e.currentTarget.dataset.email;
      const name = e.currentTarget.dataset.name;
      const subject = encodeURIComponent(`Hi ${name}`);
      const url = `mailto:${email}?subject=${subject}`;
      if (IS_TAURI) {
        tauriInvoke("open_url", { url });
      } else {
        window.location.href = url;
      }
    });
  });

  list.querySelectorAll(".card-action.edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;
      const contact = contacts.find((c) => c.id === id);
      if (contact) openForm(contact);
    });
  });

  list.querySelectorAll(".card-action.delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;
      const contact = contacts.find((c) => c.id === id);
      if (contact) confirmDelete(contact);
    });
  });

  // Bind favorite toggle
  list.querySelectorAll(".card-action.favorite").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(e.currentTarget.dataset.id);
    });
  });

  // Bind group assign
  list.querySelectorAll(".card-action.group-assign").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      showGroupDropdown(e.currentTarget, e.currentTarget.dataset.id);
    });
  });

  // Bind drag-to-reorder
  bindDragReorder(list);

  // Bind pagination buttons
  const prevBtn = document.getElementById("page-prev");
  const nextBtn = document.getElementById("page-next");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPage > 0) { currentPage--; renderContacts(); }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages - 1) { currentPage++; renderContacts(); }
    });
  }
}

// ============================================
// DRAG TO REORDER (mouse-event based)
// ============================================

// Shared drag state — lives outside bindDragReorder so mousemove/mouseup
// on document can reference it even after a re-render.
let _drag = null;

function _ensureDropLine() {
  let line = document.getElementById("drag-drop-line");
  if (!line) {
    line = document.createElement("div");
    line.id = "drag-drop-line";
    line.className = "drag-drop-line";
    document.body.appendChild(line);
  }
  return line;
}

function _cleanupDrag() {
  if (!_drag) return;
  if (_drag.ghost && _drag.ghost.parentNode) _drag.ghost.remove();
  if (_drag.srcCard) _drag.srcCard.classList.remove("dragging");
  const line = document.getElementById("drag-drop-line");
  if (line) line.classList.remove("visible");
  document.body.classList.remove("is-dragging");
  _drag = null;
}

// Runs once — attaches the global mousemove / mouseup that drive every drag.
let _dragGlobalBound = false;
function _bindDragGlobal() {
  if (_dragGlobalBound) return;
  _dragGlobalBound = true;

  document.addEventListener("mousemove", (e) => {
    if (!_drag) return;
    e.preventDefault();

    // Move ghost
    _drag.ghost.style.left = (e.clientX - _drag.offsetX) + "px";
    _drag.ghost.style.top  = (e.clientY - _drag.offsetY) + "px";

    // Find which card we're over
    const cards = Array.from(_drag.list.querySelectorAll(".card"));
    const line = _ensureDropLine();
    let placed = false;

    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      if (c.dataset.id === _drag.contactId) continue;
      const rect = c.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      if (e.clientY < midY) {
        // Insert BEFORE this card — line goes above it
        line.style.top = (rect.top - 1) + "px";
        line.style.left = rect.left + "px";
        line.style.width = rect.width + "px";
        line.classList.add("visible");
        _drag.dropBeforeId = c.dataset.id;
        _drag.dropAfter = false;
        placed = true;
        break;
      } else if (i === cards.length - 1 || (e.clientY >= midY && (i + 1 >= cards.length || e.clientY < cards[i + 1].getBoundingClientRect().top + cards[i + 1].getBoundingClientRect().height / 2))) {
        // Insert AFTER this card — line goes below it
        line.style.top = (rect.bottom + 1) + "px";
        line.style.left = rect.left + "px";
        line.style.width = rect.width + "px";
        line.classList.add("visible");
        _drag.dropBeforeId = c.dataset.id;
        _drag.dropAfter = true;
        placed = true;
        break;
      }
    }

    if (!placed) {
      line.classList.remove("visible");
      _drag.dropBeforeId = null;
    }
  });

  document.addEventListener("mouseup", () => {
    if (!_drag) return;

    const fromId = _drag.contactId;
    const toId = _drag.dropBeforeId;
    const dropAfter = _drag.dropAfter;

    _cleanupDrag();

    if (!toId || fromId === toId) return;

    const fromIdx = contacts.findIndex(c => c.id === fromId);
    if (fromIdx === -1) return;

    // Remove from old position
    const [moved] = contacts.splice(fromIdx, 1);
    // Find target
    let toIdx = contacts.findIndex(c => c.id === toId);
    if (toIdx === -1) { contacts.push(moved); } else {
      if (dropAfter) toIdx++;
      contacts.splice(toIdx, 0, moved);
    }

    saveContacts();
    renderContacts();
    if (IS_TAURI) {
      window.__TAURI__.event.emit("refresh-contacts", {});
    }
  });
}

function bindDragReorder(list) {
  _bindDragGlobal();

  list.querySelectorAll(".card").forEach(card => {
    const handle = card.querySelector(".drag-handle");
    if (!handle) return;

    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = card.getBoundingClientRect();

      // Create a floating ghost clone
      const ghost = card.cloneNode(true);
      ghost.className = "card drag-ghost";
      ghost.style.position = "fixed";
      ghost.style.width = rect.width + "px";
      ghost.style.left = rect.left + "px";
      ghost.style.top = rect.top + "px";
      ghost.style.zIndex = "9999";
      ghost.style.pointerEvents = "none";
      ghost.style.opacity = "0.85";
      ghost.style.transform = "scale(1.02) rotate(1deg)";
      ghost.style.boxShadow = "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)";
      ghost.style.transition = "none";
      ghost.style.animation = "none";
      document.body.appendChild(ghost);

      card.classList.add("dragging");
      document.body.classList.add("is-dragging");

      _drag = {
        contactId: card.dataset.id,
        srcCard: card,
        ghost: ghost,
        list: list,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        dropBeforeId: null,
        dropAfter: false,
      };
    });
  });
}

// ============================================
// FORM: OPEN / CLOSE / SUBMIT
// ============================================
function openForm(contact = null) {
  editingId = contact ? contact.id : null;
  const form = document.getElementById("contact-form");
  form.reset();

  document.getElementById("modal-title").textContent = contact
    ? "Edit Contact"
    : "Add Contact";
  document.getElementById("form-id").value = contact ? contact.id : "";

  if (contact) {
    document.getElementById("form-name").value = contact.name;
    document.getElementById("form-email-primary").value = contact.emailPrimary || "";
    document.getElementById("form-email-secondary").value = contact.emailSecondary || "";
    document.getElementById("form-phone-primary").value = contact.phonePrimary || "";
    document.getElementById("form-phone-secondary").value = contact.phoneSecondary || "";
    document.getElementById("form-address").value = contact.address || "";
    document.getElementById("form-timezone").value = contact.timezone || "";
    document.getElementById("form-notes").value = contact.notes || "";
  }

  document.getElementById("modal-overlay").classList.remove("hidden");
  document.getElementById("form-name").focus();
}

function closeModal() {
  const overlay = document.getElementById("modal-overlay");
  overlay.classList.add("closing");
  setTimeout(() => {
    overlay.classList.add("hidden");
    overlay.classList.remove("closing");
    editingId = null;
  }, 180);
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const formData = {
    id: editingId,
    name: document.getElementById("form-name").value.trim(),
    emailPrimary: document.getElementById("form-email-primary").value.trim(),
    emailSecondary: document.getElementById("form-email-secondary").value.trim(),
    phonePrimary: document.getElementById("form-phone-primary").value.trim(),
    phoneSecondary: document.getElementById("form-phone-secondary").value.trim(),
    address: document.getElementById("form-address").value.trim(),
    timezone: document.getElementById("form-timezone").value,
    notes: document.getElementById("form-notes").value.trim(),
  };

  if (!formData.name) {
    document.getElementById("form-name").focus();
    return;
  }

  if (editingId) {
    const index = contacts.findIndex((c) => c.id === editingId);
    if (index !== -1) {
      contacts[index] = {
        ...contacts[index],
        ...formData,
        updatedAt: new Date().toISOString(),
      };
    }
  } else {
    if (contacts.length >= MAX_CONTACTS) {
      alert(`Maximum of ${MAX_CONTACTS} contacts reached.`);
      return;
    }
    contacts.push({
      ...formData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  await saveContacts();
  closeModal();
  renderAll();
}

// ============================================
// CONFIRM & DELETE
// ============================================
function confirmDelete(contact) {
  document.getElementById("confirm-message").textContent =
    `Delete "${contact.name}"? This cannot be undone.`;
  confirmCallback = async () => {
    contacts = contacts.filter((c) => c.id !== contact.id);
    await saveContacts();
    renderAll();
  };
  document.getElementById("confirm-overlay").classList.remove("hidden");
}

function closeConfirm() {
  const overlay = document.getElementById("confirm-overlay");
  overlay.classList.add("closing");
  setTimeout(() => {
    overlay.classList.add("hidden");
    overlay.classList.remove("closing");
    confirmCallback = null;
  }, 150);
}

// ============================================
// SETTINGS: EXPORT / IMPORT
// ============================================
function showPage(page) {
  const main = document.getElementById("page-main");
  const settings = document.getElementById("page-settings");
  const tabBar = document.getElementById("tab-bar");
  // Remove hidden from the incoming page, add to outgoing
  main.classList.toggle("hidden", page !== "main");
  settings.classList.toggle("hidden", page !== "settings");
  // Hide tab bar on settings page
  tabBar.classList.toggle("hidden", page !== "main");
  // Re-trigger fade-in animation on the visible page
  const active = page === "main" ? main : settings;
  active.style.animation = "none";
  // Force reflow to restart animation
  void active.offsetHeight;
  active.style.animation = "";
}

function exportContacts() {
  const blob = new Blob([JSON.stringify({ contacts }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kaibook-export-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importContacts(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      const imported = Array.isArray(data.contacts) ? data.contacts : Array.isArray(data) ? data : [];
      if (imported.length === 0) {
        alert("No valid contacts found in file.");
        return;
      }
      const existingIds = new Set(contacts.map((c) => c.id));
      const newContacts = imported.map((c) => ({
        ...c,
        id: c.id && !existingIds.has(c.id) ? c.id : generateId(),
      }));
      confirmCallback = async () => {
        contacts = [...contacts, ...newContacts];
        await saveContacts();
        renderAll();
      };
      document.getElementById("confirm-message").textContent =
        `Import ${newContacts.length} contact${newContacts.length !== 1 ? "s" : ""}?`;
      document.getElementById("confirm-overlay").classList.remove("hidden");
    } catch (err) {
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
}

// ============================================
// UTILITY
// ============================================
function generateId() {
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

// ============================================
// ONBOARDING
// ============================================

function showOnboarding() {
  const overlay = document.getElementById("onboarding-overlay");
  overlay.classList.remove("hidden");
  // Sync dark-mode checkbox with current state
  const darkCheck = document.getElementById("ob-dark-check");
  darkCheck.checked = document.body.classList.contains("dark-mode");

  // Sync active theme card
  const currentTheme = document.body.getAttribute("data-theme") || "skeuomorphic";
  document.querySelectorAll(".ob-theme-card").forEach(c => {
    c.classList.toggle("active", c.dataset.theme === currentTheme);
  });

  bindOnboarding();
}

function bindOnboarding() {
  const overlay = document.getElementById("onboarding-overlay");

  // Step navigation — "Get Started" / "Next"
  document.getElementById("ob-start").addEventListener("click", () => goToOnboardingStep(1));
  document.getElementById("ob-theme-next").addEventListener("click", () => goToOnboardingStep(2));

  // Back buttons
  overlay.querySelectorAll(".onboarding-back").forEach(btn => {
    btn.addEventListener("click", () => {
      goToOnboardingStep(parseInt(btn.dataset.back, 10));
    });
  });

  // Theme cards — live preview
  document.querySelectorAll(".ob-theme-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".ob-theme-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      setUITheme(card.dataset.theme);
    });
  });

  // Dark mode toggle
  document.getElementById("ob-dark-check").addEventListener("change", (e) => {
    if (e.target.checked) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    syncNativeTheme();
    // Persist
    const isDark = e.target.checked;
    const uiTheme = document.body.getAttribute("data-theme") || "skeuomorphic";
    if (IS_TAURI) {
      tauriInvoke("save_theme", { settings: { darkMode: isDark, uiTheme, onboardingComplete: _onboardingComplete } });
      window.__TAURI__.event.emit("theme-changed", {
        theme: isDark ? "dark" : "light",
        uiTheme
      });
    }
  });

  // Finish
  document.getElementById("ob-finish").addEventListener("click", finishOnboarding);
}

function goToOnboardingStep(step) {
  // Update step content
  document.querySelectorAll(".onboarding-step").forEach(s => {
    s.classList.toggle("active", parseInt(s.dataset.step, 10) === step);
  });
  // Update dots
  document.querySelectorAll(".onboarding-dot").forEach(d => {
    const dotStep = parseInt(d.dataset.step, 10);
    d.classList.toggle("active", dotStep === step);
    d.classList.toggle("done", dotStep < step);
  });
}

async function finishOnboarding() {
  _onboardingComplete = true;
  const isDark = document.body.classList.contains("dark-mode");
  const uiTheme = document.body.getAttribute("data-theme") || "skeuomorphic";

  // Persist with onboarding flag
  if (IS_TAURI) {
    await tauriInvoke("save_theme", { settings: { darkMode: isDark, uiTheme, onboardingComplete: true } });
  }

  // Also sync the settings page theme cards
  document.querySelectorAll(".theme-card").forEach(c => {
    c.classList.toggle("active", c.dataset.theme === uiTheme);
  });

  // Animate out
  const overlay = document.getElementById("onboarding-overlay");
  overlay.classList.add("fade-out");
  setTimeout(() => {
    overlay.classList.add("hidden");
    overlay.classList.remove("fade-out");
  }, 300);
}

// ============================================
// START
// ============================================
document.addEventListener("DOMContentLoaded", init);
