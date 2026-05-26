// ============================================
// KaiBook — Main Application Logic (Redesigned)
// ============================================

// Detect Tauri environment
const IS_TAURI = Boolean(window.__TAURI_INTERNALS__);

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
  edit: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>',
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
];

// ============================================
// STATE
// ============================================
let contacts = [];
let searchQuery = "";
let editingId = null;
let confirmCallback = null;

// ============================================
// THEME (dark mode + UI themes)
// ============================================
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
      }
    } catch (e) { console.warn("load_theme failed:", e); }
  }
  if (darkMode) {
    document.body.classList.add("dark-mode");
  }
  document.body.setAttribute("data-theme", uiTheme);
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
  // Persist to shared file
  if (IS_TAURI) {
    tauriInvoke("save_theme", { settings: { darkMode: isDark, uiTheme: uiTheme } });
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
  // Persist to shared file
  if (IS_TAURI) {
    tauriInvoke("save_theme", { settings: { darkMode: isDark, uiTheme: themeName } });
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
  populateTimezoneDropdown();
  startLiveClock();
  bindEvents();
  renderAll();
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
// EVENT BINDINGS
// ============================================
function bindEvents() {
  document.getElementById("main-search").addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderContacts();
  });

  document.getElementById("btn-add-contact").addEventListener("click", () => openForm());
  document.getElementById("btn-add-first").addEventListener("click", () => openForm());

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
// RENDER
// ============================================
function renderAll() {
  renderContacts();
  updateContactCount();
}

function updateContactCount() {
  document.getElementById("contact-count").textContent =
    `${contacts.length} contact${contacts.length !== 1 ? "s" : ""}`;
}

function renderContacts() {
  const list = document.getElementById("contact-list");
  const empty = document.getElementById("empty-state");

  const filtered = searchQuery
    ? contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery) ||
          (c.emailPrimary || "").toLowerCase().includes(searchQuery) ||
          (c.emailSecondary || "").toLowerCase().includes(searchQuery) ||
          (c.phonePrimary || "").toLowerCase().includes(searchQuery) ||
          (c.address || "").toLowerCase().includes(searchQuery) ||
          (c.notes || "").toLowerCase().includes(searchQuery)
      )
    : contacts;

  if (filtered.length === 0 && !searchQuery) {
    empty.classList.remove("hidden");
    list.innerHTML = "";
    return;
  }

  empty.classList.add("hidden");

  list.innerHTML = filtered
    .map((c) => {
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

      return `
      <div class="card" data-id="${c.id}">
        <div class="card-top">
          <div class="card-avatar" style="background:${avatarGradient(c.name)}">${initial(c.name)}</div>
          <div class="card-main">
            <div class="card-name">${escapeHtml(c.name)}</div>
            ${subLine}
          </div>
          <div class="card-time" data-timezone="${escapeHtml(c.timezone || "")}">${c.timezone ? formatTime(c.timezone) : "--:--"}</div>
        </div>
        ${detailSection}
        <div class="card-actions">
          <button type="button" class="card-action edit" data-id="${c.id}" title="Edit">${ICON.edit}</button>
          <button type="button" class="card-action delete" data-id="${c.id}" title="Delete">${ICON.trash}</button>
        </div>
      </div>`;
    })
    .join("");

  // Bind card action buttons
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
  document.getElementById("modal-overlay").classList.add("hidden");
  editingId = null;
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
  document.getElementById("confirm-overlay").classList.add("hidden");
  confirmCallback = null;
}

// ============================================
// SETTINGS: EXPORT / IMPORT
// ============================================
function showPage(page) {
  document.getElementById("page-main").classList.toggle("hidden", page !== "main");
  document.getElementById("page-settings").classList.toggle("hidden", page !== "settings");
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
// START
// ============================================
document.addEventListener("DOMContentLoaded", init);
