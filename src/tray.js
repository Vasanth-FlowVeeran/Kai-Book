// ============================================
// KaiBook: Tray Popup Logic (Redesigned)
// ============================================

let contacts = [];
var groups = [];
var trayActiveTab = "all";
var trayPage = 0;
var TRAY_PAGE_SIZE = 10;
var TRAY_MAX_PAGES = 2;

async function invoke(cmd, args) {
  return window.__TAURI__.core.invoke(cmd, args || {});
}

// ============================================
// Avatar colors: gradient pairs
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
async function loadTrayGroups() {
  try { groups = await invoke("load_groups"); }
  catch (e) { console.warn("load_groups failed:", e); groups = []; }
}

function renderTrayTabs() {
  var container = document.getElementById("tray-tabs");
  // Remove old dynamic tabs
  container.querySelectorAll(".tray-tab-group").forEach(function (t) { t.remove(); });

  // Add group tabs
  groups.forEach(function (g) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tray-tab tray-tab-group" + (trayActiveTab === g.id ? " active" : "");
    btn.dataset.tab = g.id;
    btn.innerHTML = '<span class="tray-tab-dot" style="background:' + esc(g.color) + '"></span>' + esc(g.name);
    btn.addEventListener("click", function () {
      trayActiveTab = g.id;
      trayPage = 0;
      updateTrayTabActive();
      renderContacts();
    });
    container.appendChild(btn);
  });

  updateTrayTabActive();
}

function updateTrayTabActive() {
  document.querySelectorAll(".tray-tab").forEach(function (t) {
    t.classList.toggle("active", t.dataset.tab === trayActiveTab);
  });
}

function filterTrayContacts(list) {
  if (trayActiveTab === "all") return list;
  if (trayActiveTab === "favorites") return list.filter(function (c) { return c.favorite; });
  return list.filter(function (c) { return c.groups && c.groups.indexOf(trayActiveTab) !== -1; });
}

async function init() {
  await initTheme();
  await loadContacts();
  await loadTrayGroups();
  populateTZ();
  bindEvents();
  renderTrayTabs();
  renderContacts();
  startClock();

  window.__TAURI__.event.listen("refresh-contacts", async function () {
    await loadContacts();
    renderContacts();
  });

  window.__TAURI__.event.listen("groups-changed", async function () {
    await loadTrayGroups();
    renderTrayTabs();
    renderContacts();
  });

  window.__TAURI__.event.listen("theme-changed", function (event) {
    var p = event.payload || {};
    if (p.theme === "dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    if (p.uiTheme) {
      document.body.setAttribute("data-theme", p.uiTheme);
    }
    renderContacts();
  });

  if (window.__TAURI__.window && window.__TAURI__.window.getCurrentWindow) {
    var appWindow = window.__TAURI__.window.getCurrentWindow();
    appWindow.onFocusChanged(function (event) {
      if (!event.payload) {
        appWindow.hide();
      }
    });
  }
}

async function initTheme() {
  try {
    var settings = await invoke("load_theme");
    if (settings && settings.darkMode) {
      document.body.classList.add("dark-mode");
    }
    var uiTheme = (settings && settings.uiTheme) ? settings.uiTheme : "skeuomorphic";
    document.body.setAttribute("data-theme", uiTheme);
  } catch (e) { console.warn("load_theme failed:", e); }
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

  // Apply tab filter first, then search
  var tabFiltered = filterTrayContacts(contacts);
  var filtered = q
    ? tabFiltered.filter(function (c) {
        return c.name.toLowerCase().includes(q) ||
          (c.emailPrimary && c.emailPrimary.toLowerCase().includes(q)) ||
          (c.phonePrimary && c.phonePrimary.toLowerCase().includes(q));
      })
    : tabFiltered;

  // Cap to max contacts (TRAY_MAX_PAGES * TRAY_PAGE_SIZE)
  var maxContacts = TRAY_MAX_PAGES * TRAY_PAGE_SIZE;
  var capped = filtered.slice(0, maxContacts);
  var totalPages = Math.ceil(capped.length / TRAY_PAGE_SIZE) || 1;

  // Clamp current page
  if (trayPage >= totalPages) trayPage = totalPages - 1;
  if (trayPage < 0) trayPage = 0;

  var start = trayPage * TRAY_PAGE_SIZE;
  var pageItems = capped.slice(start, start + TRAY_PAGE_SIZE);

  if (capped.length === 0) {
    list.innerHTML =
      '<div class="tray-empty">' +
        '<div class="tray-empty-icon">' + (q ? "🔍" : "📇") + '</div>' +
        '<div class="tray-empty-text">' + (q ? "No matches" : "No contacts yet") + '</div>' +
      '</div>';
    return;
  }

  var rows = pageItems.map(function (c, idx) {
    var sub = c.emailPrimary || c.phonePrimary || "";
    var mailBtn = c.emailPrimary
      ? '<button type="button" class="tray-mail-btn" data-email="' + esc(c.emailPrimary) + '" data-name="' + esc(c.name) + '" title="Compose email">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' +
        '</button>'
      : '';
    return (
      '<div class="contact-row" data-id="' + c.id + '" style="animation-delay:' + (idx * 25) + 'ms">' +
        '<div class="avatar-wrap">' +
          '<div class="avatar" style="background:' + avatarGradient(c.name) + '">' + initial(c.name) + '</div>' +
          todBadge(c.timezone) +
        '</div>' +
        '<div class="contact-info">' +
          '<div class="contact-name">' + esc(c.name) + '</div>' +
          (sub ? '<div class="contact-detail">' + esc(sub) + '</div>' : '') +
        '</div>' +
        mailBtn +
        '<div class="time-badge" data-timezone="' + esc(c.timezone) + '">' + fmtTime(c.timezone) + '</div>' +
      '</div>'
    );
  }).join("");

  // Pagination controls
  var paginationHtml = '';
  if (totalPages > 1) {
    paginationHtml = '<div class="tray-pagination">' +
      '<button type="button" class="tray-page-btn' + (trayPage === 0 ? ' disabled' : '') + '" id="tray-page-prev">' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>' +
      '</button>' +
      '<span class="tray-page-info">' + (trayPage + 1) + ' / ' + totalPages + '</span>' +
      '<button type="button" class="tray-page-btn' + (trayPage >= totalPages - 1 ? ' disabled' : '') + '" id="tray-page-next">' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>' +
      '</button>' +
    '</div>';
  }

  list.innerHTML = rows + paginationHtml;

  // Bind mail buttons (before row clicks so stopPropagation works)
  list.querySelectorAll(".tray-mail-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var email = btn.dataset.email;
      var name = btn.dataset.name;
      var subject = encodeURIComponent("Hi " + name);
      var url = "mailto:" + email + "?subject=" + subject;
      invoke("open_url", { url: url });
    });
  });

  // Bind contact row clicks
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

  // Bind pagination buttons
  var prevBtn = document.getElementById("tray-page-prev");
  var nextBtn = document.getElementById("tray-page-next");
  if (prevBtn) {
    prevBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (trayPage > 0) { trayPage--; renderContacts(); }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (trayPage < totalPages - 1) { trayPage++; renderContacts(); }
    });
  }
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
    // Update TOD badges, only re-roll phrase when period actually changes
    document.querySelectorAll(".tod-badge").forEach(function (el) {
      var row = el.closest(".contact-row");
      if (!row) return;
      var badge = row.querySelector(".time-badge");
      var tz = badge ? badge.dataset.timezone : "";
      if (!tz) return;
      var period = todPeriod(tz);
      var oldPeriod = el.dataset.period || "";
      if (period !== oldPeriod) {
        el.dataset.period = period;
        el.className = "tod-badge tod-" + period;
        el.dataset.tip = todPhrase(period);
        var img = el.querySelector("img");
        if (img) img.src = todIconSrc(period);
      }
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
// Time-of-day status indicator
// ============================================
function getHourIn(tz) {
  try {
    return parseInt(new Date().toLocaleString("en-US", { timeZone: tz, hour: "numeric", hour12: false }), 10);
  } catch (e) { return -1; }
}

function todPeriod(tz) {
  var h = getHourIn(tz);
  if (h < 0) return "unknown";
  if (h >= 5 && h < 8) return "early-morning";
  if (h >= 8 && h < 12) return "late-morning";
  if (h >= 12 && h < 15) return "early-afternoon";
  if (h >= 15 && h < 17) return "late-afternoon";
  if (h >= 17 && h < 19) return "early-evening";
  if (h >= 19 && h < 22) return "evening";
  return "night"; // 22-4
}

var TOD_PHRASES = {
  "early-morning": [
    "Probably still hitting snooze",
    "Coffee hasn't kicked in yet",
    "Maybe wait for their first coffee",
    "They might be mid-yawn",
    "Dawn patrol, tread lightly",
    "Give them 30 more minutes"
  ],
  "late-morning": [
    "Good time to reach out!",
    "They're warmed up, go for it",
    "Sweet spot, fully caffeinated",
    "Prime time to ping them",
    "They're in the zone, say hi!",
    "Green light, send that message"
  ],
  "early-afternoon": [
    "Post-lunch, might be slow to reply",
    "Could be in a food coma",
    "They're around, fire away",
    "Afternoon mode, fair game",
    "Probably at their desk",
    "Good window, catch them now"
  ],
  "late-afternoon": [
    "Winding down soon",
    "Still working, get in quick",
    "Last chance before EOD",
    "Clock is ticking on their day",
    "Catch them before they log off",
    "Now or wait till tomorrow"
  ],
  "early-evening": [
    "They're off the clock",
    "Dinner time, maybe wait",
    "Personal time, keep it short",
    "Unless it's urgent, hold off",
    "They've mentally checked out",
    "Evening vibes, not ideal"
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
  var phrases = TOD_PHRASES[period] || [""];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

function todIconSrc(period) {
  var theme = document.body.getAttribute("data-theme");
  if (theme === "cyberpunk") return "assets/tod/cyberpunk/" + period + ".svg";
  return "assets/tod/" + period + ".png";
}

function todBadge(tz) {
  if (!tz) return '';
  var period = todPeriod(tz);
  if (period === 'unknown') return '';
  var phrase = todPhrase(period);
  return '<span class="tod-badge tod-' + period + '" data-tip="' + phrase + '" data-period="' + period + '">' +
    '<img src="' + todIconSrc(period) + '" alt="' + phrase + '">' +
    '</span>';
}

// ============================================
// Quick Add
// ============================================
function showQA() {
  var form = document.getElementById("quick-add-form");
  form.classList.remove("hidden");
  // Re-trigger slide animation
  form.style.animation = "none";
  void form.offsetHeight;
  form.style.animation = "";
  document.getElementById("tray-actions").classList.add("hidden");
  document.body.classList.add("qa-open");
  document.getElementById("qa-name").focus();
}

function hideQA() {
  document.getElementById("quick-add-form").classList.add("hidden");
  document.getElementById("tray-actions").classList.remove("hidden");
  document.body.classList.remove("qa-open");
  ["qa-name", "qa-email", "qa-phone", "qa-timezone"].forEach(function (id) {
    document.getElementById(id).value = "";
  });
}

async function saveQA() {
  var name = document.getElementById("qa-name").value.trim();
  if (!name) { document.getElementById("qa-name").focus(); return; }

  if (contacts.length >= TRAY_MAX_PAGES * TRAY_PAGE_SIZE) {
    alert("Maximum of " + (TRAY_MAX_PAGES * TRAY_PAGE_SIZE) + " contacts reached.");
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

  try { await invoke("save_contacts", { contacts: contacts }); }
  catch (e) { console.error(e); }

  hideQA();
  renderContacts();
}

// ============================================
// Events
// ============================================
function bindEvents() {
  document.getElementById("tray-search-input").addEventListener("input", function () {
    trayPage = 0;
    renderContacts();
  });

  // Tab clicks: All and Favorites
  document.querySelector('.tray-tab[data-tab="all"]').addEventListener("click", function () {
    trayActiveTab = "all";
    trayPage = 0;
    updateTrayTabActive();
    renderContacts();
  });
  document.querySelector('.tray-tab[data-tab="favorites"]').addEventListener("click", function () {
    trayActiveTab = "favorites";
    trayPage = 0;
    updateTrayTabActive();
    renderContacts();
  });
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
