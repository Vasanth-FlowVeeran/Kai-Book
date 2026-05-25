// ============================================
// KaiBook — Main Application Logic
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
    notes: "Prefers email over phone. Available 10am–4pm ET.",
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
// INITIALIZATION
// ============================================
function init() {
  loadContacts();
  populateTimezoneDropdown();
  startLiveClock();
  bindEvents();
  renderAll();
}

function loadContacts() {
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

function saveContacts() {
  localStorage.setItem("kaibook_contacts", JSON.stringify(contacts));
}

// ============================================
// TIMEZONE DROPDOWN
// ============================================
function populateTimezoneDropdown() {
  const select = document.getElementById("form-timezone");
  select.innerHTML = '<option value="">-- Select timezone --</option>';
  IANA_TIMEZONES.sort().forEach((tz) => {
    const option = document.createElement("option");
    option.value = tz;
    option.textContent = tz;
    select.appendChild(option);
  });
}

// ============================================
// LIVE CLOCK
// ============================================
function startLiveClock() {
  setInterval(() => {
    document.querySelectorAll(".contact-card-time").forEach((el) => {
      const tz = el.dataset.timezone;
      if (tz) el.textContent = formatTime(tz);
    });
    document.querySelectorAll(".tray-contact-time").forEach((el) => {
      const tz = el.dataset.timezone;
      if (tz) el.textContent = formatTime(tz);
    });
  }, 1000);
}

function formatTime(ianaZone) {
  try {
    const now = new Date();
    const formatted = now.toLocaleTimeString("en-US", {
      timeZone: ianaZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return formatted;
  } catch (e) {
    return "—:— —";
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

  document.getElementById("btn-tray-toggle").addEventListener("click", toggleTrayPopup);
  document.getElementById("tray-open-main").addEventListener("click", () => {
    document.getElementById("tray-popup").classList.add("hidden");
  });
  document.getElementById("tray-quick-add").addEventListener("click", () => {
    const quickInput = prompt("Quick Add: name | email | phone | timezone");
    if (!quickInput) return;
    const parts = quickInput.split("|").map((s) => s.trim());
    if (parts.length < 2) return;
    contacts.push({
      id: generateId(),
      name: parts[0] || "",
      emailPrimary: parts[1] || "",
      emailSecondary: "",
      phonePrimary: parts[2] || "",
      phoneSecondary: "",
      address: "",
      timezone: parts[3] || "",
      notes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    saveContacts();
    renderAll();
  });
  document.getElementById("tray-search-input").addEventListener("input", () => renderTrayPopup());

  document.getElementById("btn-settings").addEventListener("click", () => showPage("settings"));
  document.getElementById("btn-back-settings").addEventListener("click", () => showPage("main"));

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

  document.getElementById("tray-popup").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) document.getElementById("tray-popup").classList.add("hidden");
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
// RENDER ALL
// ============================================
function renderAll() {
  renderContacts();
  renderTrayPopup();
  updateContactCount();
}

function updateContactCount() {
  document.getElementById("contact-count").textContent =
    `${contacts.length} contact${contacts.length !== 1 ? "s" : ""}`;
}

// ============================================
// RENDER MAIN CONTACT LIST
// ============================================
function renderContacts() {
  const list = document.getElementById("contact-list");
  const empty = document.getElementById("empty-state");

  const filtered = searchQuery
    ? contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery) ||
          c.emailPrimary.toLowerCase().includes(searchQuery) ||
          c.emailSecondary.toLowerCase().includes(searchQuery) ||
          c.phonePrimary.toLowerCase().includes(searchQuery) ||
          c.address.toLowerCase().includes(searchQuery) ||
          c.notes.toLowerCase().includes(searchQuery)
      )
    : contacts;

  if (filtered.length === 0 && !searchQuery) {
    empty.classList.remove("hidden");
    list.innerHTML = "";
    return;
  }

  empty.classList.add("hidden");

  list.innerHTML = filtered
    .map(
      (c) => `
    <div class="contact-card" data-id="${c.id}">
      <div class="contact-card-header">
        <div class="contact-card-name">${escapeHtml(c.name)}</div>
        <div class="contact-card-time" data-timezone="${escapeHtml(c.timezone)}">${formatTime(c.timezone)}</div>
      </div>
      <div class="contact-card-details">
        ${c.emailPrimary ? `<div class="contact-card-detail"><span class="label-icon">📧</span>${escapeHtml(c.emailPrimary)}</div>` : ""}
        ${c.emailSecondary ? `<div class="contact-card-detail"><span class="label-icon">📧</span>${escapeHtml(c.emailSecondary)}</div>` : ""}
        ${c.phonePrimary ? `<div class="contact-card-detail"><span class="label-icon">📞</span>${escapeHtml(c.phonePrimary)}</div>` : ""}
        ${c.phoneSecondary ? `<div class="contact-card-detail"><span class="label-icon">📞</span>${escapeHtml(c.phoneSecondary)}</div>` : ""}
        ${c.address ? `<div class="contact-card-detail address">📍 ${escapeHtml(c.address)}</div>` : ""}
      </div>
      ${c.timezone ? `<div class="contact-card-tz">🌐 ${escapeHtml(c.timezone)}</div>` : ""}
      <div class="contact-card-actions">
        <button type="button" class="card-action-btn edit" data-id="${c.id}">Edit</button>
        <button type="button" class="card-action-btn delete" data-id="${c.id}">Del</button>
      </div>
    </div>
  `
    )
    .join("");

  list.querySelectorAll(".card-action-btn.edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      const contact = contacts.find((c) => c.id === id);
      if (contact) openForm(contact);
    });
  });

  list.querySelectorAll(".card-action-btn.delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      const contact = contacts.find((c) => c.id === id);
      if (contact) confirmDelete(contact);
    });
  });
}

// ============================================
// TRAY POPUP
// ============================================
function toggleTrayPopup() {
  const popup = document.getElementById("tray-popup");
  popup.classList.toggle("hidden");
  if (!popup.classList.contains("hidden")) {
    renderTrayPopup();
    document.getElementById("tray-search-input").focus();
  }
}

function renderTrayPopup() {
  const trayList = document.getElementById("tray-contact-list");
  const traySearchInput = document.getElementById("tray-search-input");
  const trayQuery = (traySearchInput?.value || "").toLowerCase();

  const filtered = trayQuery
    ? contacts.filter((c) => c.name.toLowerCase().includes(trayQuery))
    : contacts;

  trayList.innerHTML = filtered
    .map(
      (c) => `
    <div class="tray-contact-item" data-id="${c.id}">
      <div class="tray-contact-name">${escapeHtml(c.name)}</div>
      <div class="tray-contact-time" data-timezone="${escapeHtml(c.timezone)}">${formatTime(c.timezone)}</div>
    </div>
  `
    )
    .join("");

  trayList.querySelectorAll(".tray-contact-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      const id = item.dataset.id;
      const contact = contacts.find((c) => c.id === id);
      if (contact) {
        navigator.clipboard
          .writeText(contact.emailPrimary || contact.phonePrimary || contact.name)
          .then(() => {
            item.style.background = "var(--accent-subtle)";
            setTimeout(() => (item.style.background = ""), 600);
          })
          .catch(() => {});
      }
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
    ? "✏️ Edit Contact"
    : "✏️ Add Contact";
  document.getElementById("form-id").value = contact ? contact.id : "";

  if (contact) {
    document.getElementById("form-name").value = contact.name;
    document.getElementById("form-email-primary").value = contact.emailPrimary;
    document.getElementById("form-email-secondary").value = contact.emailSecondary;
    document.getElementById("form-phone-primary").value = contact.phonePrimary;
    document.getElementById("form-phone-secondary").value = contact.phoneSecondary;
    document.getElementById("form-address").value = contact.address;
    document.getElementById("form-timezone").value = contact.timezone;
    document.getElementById("form-notes").value = contact.notes;
  }

  document.getElementById("modal-overlay").classList.remove("hidden");
  document.getElementById("form-name").focus();
}

function closeModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
  editingId = null;
}

function handleFormSubmit(e) {
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

  saveContacts();
  closeModal();
  renderAll();
}

// ============================================
// CONFIRM & DELETE
// ============================================
function confirmDelete(contact) {
  document.getElementById(
    "confirm-message"
  ).textContent = `Delete "${contact.name}"? This cannot be undone.`;
  confirmCallback = () => {
    contacts = contacts.filter((c) => c.id !== contact.id);
    saveContacts();
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
      confirmCallback = () => {
        contacts = [...contacts, ...newContacts];
        saveContacts();
        renderAll();
      };
      document.getElementById(
        "confirm-message"
      ).textContent = `Import ${newContacts.length} contact${newContacts.length !== 1 ? "s" : ""}?`;
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
  div.textContent = str;
  return div.innerHTML;
}

// ============================================
// START
// ============================================
document.addEventListener("DOMContentLoaded", init);