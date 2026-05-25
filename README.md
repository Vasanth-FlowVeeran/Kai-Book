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

## Installation

### macOS

1. **Install Node.js 18+** — download from [nodejs.org](https://nodejs.org/) (LTS) or via Homebrew:
   ```bash
   brew install node
   ```

2. **Install Rust** via rustup:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source "$HOME/.cargo/env"
   ```

3. **Install Xcode Command Line Tools** (provides the C/C++ compiler Rust needs):
   ```bash
   xcode-select --install
   ```

4. **Clone and run:**
   ```bash
   git clone https://github.com/your-username/Kai-Book.git
   cd Kai-Book
   npm install
   npm run tauri dev
   ```

### Windows

1. **Install Node.js 18+** — download the LTS installer from [nodejs.org](https://nodejs.org/).

2. **Install Microsoft C++ Build Tools** — download [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/), run the installer, and select the **"Desktop development with C++"** workload. This provides the MSVC linker that Rust requires.

3. **Install Rust** — open PowerShell and run:
   ```powershell
   winget install Rustlang.Rustup
   ```
   Close and reopen PowerShell after installation so `cargo` is on your PATH.

4. **Install WebView2** — Windows 10 (1803+) and Windows 11 ship with it pre-installed. If you're on an older version, download it from [Microsoft](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).

5. **Clone and run:**
   ```powershell
   git clone https://github.com/your-username/Kai-Book.git
   cd Kai-Book
   npm install
   npm run tauri dev
   ```

### Linux (Ubuntu / Debian)

1. **Install system dependencies:**
   ```bash
   sudo apt update
   sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
     libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
   ```

2. **Install Node.js 18+:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. **Install Rust:**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source "$HOME/.cargo/env"
   ```

4. **Clone and run:**
   ```bash
   git clone https://github.com/your-username/Kai-Book.git
   cd Kai-Book
   npm install
   npm run tauri dev
   ```

### Linux (Fedora / RHEL)

1. **Install system dependencies:**
   ```bash
   sudo dnf install -y webkit2gtk4.1-devel openssl-devel curl wget file \
     libxdo-devel libappindicator-gtk3-devel librsvg2-devel
   sudo dnf group install -y "C Development Tools and Libraries"
   ```

2. **Install Node.js 18+:**
   ```bash
   sudo dnf install -y nodejs
   ```

3. **Install Rust:**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source "$HOME/.cargo/env"
   ```

4. **Clone and run:**
   ```bash
   git clone https://github.com/your-username/Kai-Book.git
   cd Kai-Book
   npm install
   npm run tauri dev
   ```

### Building for Production

```bash
npm run tauri build
```

The production binary will be in `src-tauri/target/release/`. On macOS this produces a `.dmg`, on Windows an `.msi` installer, and on Linux `.deb` and `.AppImage` files.

### Browser-only Dev Mode (no Rust required)

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

*   **Single-click** the tray icon to open the quick-access popup with live local times.
*   **Double-click** the tray icon (or click "Open KaiBook") to open the full app window.
*   **Click a contact** in the popup to copy their email/phone to clipboard.
*   **Quick Add:** Use the "+ Quick Add" button in the popup to add a contact inline.
*   **Search:** Filter contacts by name, email, or phone in the popup or the main window.
*   **Import/Export:** Go to Settings (⚙️) in the main window to export or import contacts as JSON.
*   **Right-click** the tray icon for a context menu with "Open KaiBook" and "Quit".

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

Kai-Book is open-source software licensed under the MIT License.
