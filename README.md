# Kai-Book

Kai-Book is a versatile system tray contact book designed specifically for freelancers, offering efficient client management with a focus on convenience and data privacy. It allows you to store detailed client information, including multiple emails, phone numbers, and timezones, and provides real-time local time display for each contact. All your data is securely stored locally on your machine as a JSON file.

## Features

*   **Comprehensive Contact Management:** Easily add, edit, and delete client contacts with fields for full name, primary/secondary emails, primary/secondary phone numbers, address, timezone, and notes.
*   **Live Local Time Display:** Always know your clients' current local time, facilitating seamless communication and scheduling across different timezones.
*   **Quick Access & Search:** A system tray popup (simulated in web, native in desktop build) provides instant access to your contacts and a quick search function.
*   **Data Privacy & Local Storage:** All your client data is stored locally on your machine as a JSON file, ensuring privacy and offline accessibility.
*   **Import/Export Functionality:** Easily backup and restore your contact list with JSON import and export options.
*   **Intuitive User Interface:** A clean, dark-themed interface built with pure HTML, CSS, and JavaScript for a smooth user experience.

## Technologies Used

*   **Frontend:** HTML5, CSS3 (CSS variables for theming), JavaScript (ES6+)
*   **Desktop Shell:** Tauri v2 (Rust)
*   **Build Tool:** Vite 6
*   **Data Storage:** Local JSON file (`~/.kaibook/contacts.json`)

## Prerequisites

*   [Node.js](https://nodejs.org/) 18+ and npm
*   [Rust](https://www.rust-lang.org/tools/install) (latest stable, via `rustup`)
*   Tauri v2 system dependencies — see [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/your-username/Kai-Book.git
cd Kai-Book

# 2. Install JS dependencies
npm install

# 3. Run in development mode (opens a native window with hot reload)
npm run tauri dev

# 4. Build a production binary
npm run tauri build
```

The production binary will be in `src-tauri/target/release/`.

### Browser-only dev mode (no Rust required)

If you just want to work on the UI without the native shell:

```bash
npm run dev
# Open http://localhost:1420 in your browser
```

In browser mode, contacts are stored in `localStorage` instead of the filesystem.

## Project Structure

```
Kai-Book/
├── src/                    # Frontend (served by Vite)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── src-tauri/              # Tauri / Rust backend
│   ├── Cargo.toml
│   ├── tauri.conf.json     # Tauri configuration
│   ├── capabilities/       # Tauri v2 permissions
│   ├── icons/              # App & tray icons
│   └── src/
│       ├── main.rs         # Entry point
│       └── lib.rs          # Commands & tray setup
├── package.json
└── vite.config.js
```

## Usage

*   **Add a contact:** Click "+ Add New Contact" and fill in the form.
*   **Search:** Use the search bar in the toolbar to filter contacts.
*   **Tray popup:** Click the tray icon (or the ⬇️ button in-app) for quick access.
*   **Quick Add (tray):** Use the "Quick Add" button with format: `name | email | phone | timezone`.
*   **Import/Export:** Go to Settings (⚙️) to export or import contacts as JSON.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

Kai-Book is open-source software licensed under the MIT License.
