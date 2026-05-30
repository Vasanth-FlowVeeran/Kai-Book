<p align="center">
  <img src="src-tauri/icons/128x128@2x.png" width="128" alt="KaiBook logo">
</p>

<h1 align="center">KaiBook</h1>

<p align="center">
  <strong>A versatile system tray contact book for freelancers</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/macOS-000000?style=for-the-badge&logo=apple&logoColor=white" alt="macOS">
  <img src="https://img.shields.io/badge/Windows-0078D4?style=for-the-badge&logo=windows11&logoColor=white" alt="Windows">
  <img src="https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black" alt="Linux">
  <img src="https://img.shields.io/badge/Tauri_v2-FFC131?style=for-the-badge&logo=tauri&logoColor=333" alt="Tauri v2">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License">
  
</p>

---

KaiBook lives in your system tray and gives you instant access to your contacts without opening a full app. Search, add, and organize contacts by groups, mark favorites, and see at a glance what time it is for each contact with time-of-day indicators. Built with Tauri v2 for a tiny footprint and native performance.

## Features

- **System tray access**: click the tray icon to open a compact contact panel without leaving your workflow
- **Full main window**: expand into a feature-rich contact manager when you need more space
- **Smart search**: instantly filter contacts by name, email, phone, or notes
- **Groups & favorites**: organize contacts into custom groups and star your most-used ones
- **Time-of-day indicators**: see whether it's morning, afternoon, evening, or night for each contact based on their timezone
- **Timezone awareness**: store each contact's timezone and always know the right time to reach out
- **Quick add**: add new contacts directly from the tray without opening the main window
- **Multiple themes**: choose from several built-in themes including a cyberpunk mode
- **Import / Export**: back up your contacts as JSON or migrate from other tools
- **Lightweight**: Tauri v2 means a ~8 MB installer instead of 200+ MB Electron apps
- **Offline-first**: all data stored locally on your machine, no cloud account needed

## Install

### macOS (Homebrew)

```bash
brew tap ImSounic/kaibook
brew install --cask kaibook
```

### macOS (manual)

Download the `.dmg` for your architecture from the [latest release](https://github.com/Vasanth-FlowVeeran/Kai-Book/releases/latest):

| Chip | File |
|------|------|
| Apple Silicon (M1/M2/M3/M4) | `KaiBook_x.x.x_aarch64.dmg` |
| Intel | `KaiBook_x.x.x_x64.dmg` |

Open the DMG and drag KaiBook to Applications.

### Windows

Download the `.exe` installer from the [latest release](https://github.com/Vasanth-FlowVeeran/Kai-Book/releases/latest) and run it. The NSIS installer handles everything and no admin rights are required.

### Linux

Download from the [latest release](https://github.com/Vasanth-FlowVeeran/Kai-Book/releases/latest):

| Format | File |
|--------|------|
| Debian/Ubuntu | `KaiBook_x.x.x_amd64.deb` |
| Other distros | `KaiBook_x.x.x_amd64.AppImage` |

For `.deb`: `sudo dpkg -i KaiBook_*.deb`
For `.AppImage`: `chmod +x KaiBook_*.AppImage && ./KaiBook_*.AppImage`

## Usage

- **Single-click** the tray icon to open the quick-access popup with live local times.
- **Double-click** the tray icon (or click "Open KaiBook") to open the full app window.
- **Click a contact** in the popup to copy their email/phone to clipboard.
- **Quick Add**: use the "+" button in the popup to add a contact inline.
- **Search**: filter contacts by name, email, or phone in the popup or the main window.
- **Import/Export**: go to Settings in the main window to export or import contacts as JSON.
- **Right-click** the tray icon for a context menu with "Open KaiBook" and "Quit".

## Development

### Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Node.js 22+](https://nodejs.org/)
- [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/)

### Getting started

```bash
git clone https://github.com/Vasanth-FlowVeeran/Kai-Book.git
cd Kai-Book
npm ci
cargo tauri dev
```

### Browser-only dev mode (no Rust required)

```bash
npm run dev
# Open http://localhost:1420 in your browser
```

In browser mode contacts are stored in `localStorage` instead of the filesystem.

### Build for release

```bash
cargo tauri build
```

Installers appear in `src-tauri/target/release/bundle/`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Tauri v2 |
| Backend | Rust |
| Frontend | Vanilla JS + CSS |
| Bundler | Vite 6 |
| Storage | Local JSON via Tauri FS plugin |
| CI/CD | GitHub Actions |

## Project Structure

```
Kai-Book/
├── src/                    # Frontend (HTML, JS, CSS)
│   ├── index.html          # Main window
│   ├── tray.html           # Tray popup
│   ├── app.js              # Main window logic
│   ├── tray.js             # Tray popup logic
│   └── public/assets/      # Static assets (icons, themes)
├── src-tauri/              # Rust backend
│   ├── src/main.rs         # App entry, tray setup, commands
│   ├── tauri.conf.json     # Tauri config & bundle settings
│   └── icons/              # App icons (icns, ico, png)
├── homebrew/               # Homebrew cask formula
├── scripts/                # Release helper scripts
└── .github/workflows/      # CI/CD
```

## Releases

Tags trigger automated builds via GitHub Actions. See [RELEASE.md](RELEASE.md) for the full release process, including Homebrew publishing and optional macOS code signing.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

[MIT](LICENSE). Copyright CIFR
