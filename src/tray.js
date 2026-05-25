// ============================================
// KaiBook — Tray Popup Logic
// ============================================

let contacts = [];

// Tauri v2 invoke — safe wrapper
async function invoke(cmd, args) {
  return window.__TAURI__.core.invoke(cmd, args || {});
}

// ============================================
// Common timezones for quick-add dropdown
// ============================================
const COMMON_TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Toronto", "America/Vancouver", "America/Sao_Paulo", "America/Mexico_City",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Europe/Rome",
  "Europe/Moscow", "Europe/Istanbul", "Europe/Kyiv",
  "Asia/Kolkata", "Asia/Dubai", "Asia/Shanghai", "Asia/Tokyo", "Asia/Singapore",
  "Asia/Seoul", "Asia/Hong_Kong", "Asia/Bangkok", "Asia/Jakarta",
  "Australia/Sydney", "Australia/Melbourne", "Pacific/Auckland",
  "Africa/Cairo", "Africa/Lagos", "Africa/Johannesburg",
];

// ============================================
// Initialization
// ============================================
async function init() {
  await loadContacts();
  populateTimezoneDropdown();
  bindEvents();
  renderContacts();
  startLiveClock();

  // Listen for refresh events from Rust backend
  window.__TAURI__.event.listen("refresh-contacts", async () => {
    await loadContacts();
    renderContacts();
  });
}

async function loadContacts() {
  try {
    contacts = await invoke("load_contacts");
  } catch (e) {
    console.error("Failed to load contacts:", e);
    contacts = [];
  }
}

function populateTimezoneDropdown() {
  const sel = document.getElementById("qa-timezone");
  COMMON_TIMEZONES.forEach((tz) => {
    const opt = document.createElement("option");
    opt.value = tz;
    opt.textContent = tz;
    sel.appendChild(opt);
  });
}

// ============================================
// Rendering
// ============================================
function renderContacts() {
  const list = document.getElementById("tray-contact-list");
  const query = (document.getElementById("tray-search-input").value || "").toLowerCase();

  const filtered = query
    ? contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.emailPrimary && c.emailPrimary.toLowerCase().includes(query)) ||
          (c.phonePrimary && c.phonePrimary.toLowerCase().includes(query))
      )
    : contacts;

  if (filtered.length === 0) {
    list.innerHTML = '<div class="tray-empty">' + (query ? "No matches" : "No contacts yet") + "</div>";
    return;
  }

  list.innerHTML = filtered
    .map(
      (c) =>
        '<div class="tray-contact-item" data-id="' + c.id + '">' +
          '<div class="tray-contact-name">' + escapeHtml(c.name) + "</div>" +
          '<div class="tray-contact-time" data-timezone="' + escapeHtml(c.timezone) + '">' + formatTime(c.timezone) + "</div>" +
        "</div>"
    )
    .join("");

  // Click contact → copy email/phone to clipboard
  list.querySelectorAll(".tray-contact-item").forEach(function (item) {
    item.addEventListener("click", function () {
      var contact = contacts.find(function (c) { return c.id === item.dataset.id; });
      if (!contact) return;
      var text = contact.emailPrimary || contact.phonePrimary || contact.name;
      navigator.clipboard.writeText(text).then(function () {
        item.classList.add("copied");
        setTimeout(function () { item.classList.remove("copied"); }, 600);
      });
    });
  });
}

// ============================================
// Live Clock
// ============================================
function startLiveClock() {
  setInterval(function () {
    document.querySelectorAll(".tray-contact-time").forEach(function (el) {
      var tz = el.dataset.timezone;
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
    return "--:-- --";
  }
}

// ============================================
// Quick Add Form
// ============================================
function showQuickAdd() {
  document.getElementById("quick-add-form").classList.remove("hidden");
  document.getElementById("tray-actions").classList.add("hidden");
  document.getElementById("qa-name").focus();
}

function hideQuickAdd() {
  document.getElementById("quick-add-form").classList.add("hidden");
  document.getElementById("tray-actions").classList.remove("hidden");
  // Clear form
  document.getElementById("qa-name").value = "";
  document.getElementById("qa-email").value = "";
  document.getElementById("qa-phone").value = "";
  document.getElementById("qa-timezone").value = "";
}

async function saveQuickAdd() {
  var name = document.getElementById("qa-name").value.trim();
  if (!name) {
    document.getElementById("qa-name").focus();
    return;
  }

  var now = new Date().toISOString();
  contacts.push({
    id: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name: name,
    emailPrimary: document.getElementById("qa-email").value.trim(),
    emailSecondary: "",
    phonePrimary: document.getElementById("qa-phone").value.trim(),
    phoneSecondary: "",
    address: "",
    timezone: document.getElementById("qa-timezone").value,
    notes: "",
    createdAt: now,
    updatedAt: now,
  });

  try {
    await invoke("save_contacts", { contacts: contacts });
  } catch (e) {
    console.error("Save failed:", e);
  }

  hideQuickAdd();
  renderContacts();
}

// ============================================
// Event Bindings
// ============================================
function bindEvents() {
  // Search
  document.getElementById("tray-search-input").addEventListener("input", renderContacts);

  // Quick Add toggle
  document.getElementById("tray-quick-add").addEventListener("click", showQuickAdd);
  document.getElementById("qa-cancel").addEventListener("click", hideQuickAdd);
  document.getElementById("qa-save").addEventListener("click", saveQuickAdd);

  // Enter key in quick-add form saves
  document.getElementById("quick-add-form").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      saveQuickAdd();
    }
    if (e.key === "Escape") {
      hideQuickAdd();
    }
  });

  // Open KaiBook — use Rust command to show main window
  document.getElementById("tray-open-main").addEventListener("click", function () {
    invoke("show_main_window");
  });

  // Exit — use Rust command to quit
  document.getElementById("tray-exit").addEventListener("click", function () {
    invoke("exit_app");
  });
}

// ============================================
// Utility
// ============================================
function escapeHtml(str) {
  var div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

// ============================================
// Start
// ============================================
document.addEventListener("DOMContentLoaded", init);
