// ============================================
// KaiBook — Tray Popup Logic (Redesigned)
// ============================================

let contacts = [];

async function invoke(cmd, args) {
  return window.__TAURI__.core.invoke(cmd, args || {});
}

// ============================================
// Avatar colors — gradient pairs
// ============================================
var GRADIENTS = [
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
  var hash = 0;
  for (var i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  var g = GRADIENTS[Math.abs(hash) % GRADIENTS.length];
  return "linear-gradient(135deg, " + g[0] + ", " + g[1] + ")";
}

function initial(name) {
  if (!name) return "?";
  var parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

// ============================================
// Timezones for quick-add
// ============================================
var COMMON_TZ = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Toronto", "America/Sao_Paulo", "Europe/London", "Europe/Paris",
  "Europe/Berlin", "Europe/Moscow", "Asia/Kolkata", "Asia/Dubai",
  "Asia/Shanghai", "Asia/Tokyo", "Asia/Singapore", "Australia/Sydney",
  "Pacific/Auckland",
];

// ============================================
// Init
// ============================================
async function init() {
  initTheme();
  await loadContacts();
  populateTZ();
  bindEvents();
  renderContacts();
  startClock();

  window.__TAURI__.event.listen("refresh-contacts", async function () {
    await loadContacts();
    renderContacts();
  });

  window.__TAURI__.event.listen("theme-changed", function (event) {
    var theme = event.payload && event.payload.theme;
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  });
}

function initTheme() {
  try {
    if (localStorage.getItem("kaibook_theme") === "dark") {
      document.body.classList.add("dark-mode");
    }
  } catch (e) { /* localStorage may not be available */ }
}

async function loadContacts() {
  try { contacts = await invoke("load_contacts"); }
  catch (e) { console.error(e); contacts = []; }
}

function populateTZ() {
  var sel = document.getElementById("qa-timezone");
  COMMON_TZ.forEach(function (tz) {
    var o = document.createElement("option");
    o.value = tz; o.textContent = tz.replace(/_/g, " ");
    sel.appendChild(o);
  });
}

// ============================================
// Render
// ============================================
function renderContacts() {
  var list = document.getElementById("tray-contact-list");
  var q = (document.getElementById("tray-search-input").value || "").toLowerCase();

  var filtered = q
    ? contacts.filter(function (c) {
        return c.name.toLowerCase().includes(q) ||
          (c.emailPrimary && c.emailPrimary.toLowerCase().includes(q)) ||
          (c.phonePrimary && c.phonePrimary.toLowerCase().includes(q));
      })
    : contacts;

  if (filtered.length === 0) {
    list.innerHTML =
      '<div class="tray-empty">' +
        '<div class="tray-empty-icon">' + (q ? "🔍" : "📇") + '</div>' +
        '<div class="tray-empty-text">' + (q ? "No matches" : "No contacts yet") + '</div>' +
      '</div>';
    return;
  }

  list.innerHTML = filtered.map(function (c) {
    var sub = c.emailPrimary || c.phonePrimary || "";
    return (
      '<div class="contact-row" data-id="' + c.id + '">' +
        '<div class="avatar" style="background:' + avatarGradient(c.name) + '">' + initial(c.name) + '</div>' +
        '<div class="contact-info">' +
          '<div class="contact-name">' + esc(c.name) + '</div>' +
          (sub ? '<div class="contact-detail">' + esc(sub) + '</div>' : '') +
        '</div>' +
        '<div class="time-badge" data-timezone="' + esc(c.timezone) + '">' + fmtTime(c.timezone) + '</div>' +
      '</div>'
    );
  }).join("");

  list.querySelectorAll(".contact-row").forEach(function (row) {
    row.addEventListener("click", function () {
      var c = contacts.find(function (x) { return x.id === row.dataset.id; });
      if (!c) return;
      navigator.clipboard.writeText(c.emailPrimary || c.phonePrimary || c.name).then(function () {
        row.classList.add("copied");
        setTimeout(function () { row.classList.remove("copied"); }, 800);
      });
    });
  });
}

// ============================================
// Clock
// ============================================
function startClock() {
  setInterval(function () {
    document.querySelectorAll(".time-badge").forEach(function (el) {
      var tz = el.dataset.timezone;
      if (tz) el.textContent = fmtTime(tz);
    });
  }, 1000);
}

function fmtTime(tz) {
  try {
    return new Date().toLocaleTimeString("en-US", {
      timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true
    });
  } catch (e) { return "--:--"; }
}

// ============================================
// Quick Add
// ============================================
function showQA() {
  document.getElementById("quick-add-form").classList.remove("hidden");
  document.getElementById("tray-actions").classList.add("hidden");
  document.getElementById("qa-name").focus();
}

function hideQA() {
  document.getElementById("quick-add-form").classList.add("hidden");
  document.getElementById("tray-actions").classList.remove("hidden");
  ["qa-name", "qa-email", "qa-phone", "qa-timezone"].forEach(function (id) {
    document.getElementById(id).value = "";
  });
}

async function saveQA() {
  var name = document.getElementById("qa-name").value.trim();
  if (!name) { document.getElementById("qa-name").focus(); return; }

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

  try { await invoke("save_contacts", { contacts: contacts }); }
  catch (e) { console.error(e); }

  hideQA();
  renderContacts();
}

// ============================================
// Events
// ============================================
function bindEvents() {
  document.getElementById("tray-search-input").addEventListener("input", renderContacts);
  document.getElementById("tray-quick-add").addEventListener("click", showQA);
  document.getElementById("qa-cancel").addEventListener("click", hideQA);
  document.getElementById("qa-save").addEventListener("click", saveQA);

  document.getElementById("quick-add-form").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); saveQA(); }
    if (e.key === "Escape") hideQA();
  });

  document.getElementById("tray-open-main").addEventListener("click", function () {
    invoke("show_main_window");
  });

  document.getElementById("tray-exit").addEventListener("click", function () {
    invoke("exit_app");
  });
}

// ============================================
// Utility
// ============================================
function esc(str) {
  var d = document.createElement("div");
  d.textContent = str || "";
  return d.innerHTML;
}

document.addEventListener("DOMContentLoaded", init);
