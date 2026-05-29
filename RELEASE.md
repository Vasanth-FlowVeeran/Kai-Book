# KaiBook — Release Guide

## Prerequisites

- [Rust](https://rustup.rs/) installed
- [Node.js 20+](https://nodejs.org/) installed
- [Tauri CLI](https://v2.tauri.app/start/prerequisites/) set up
- GitHub account with a repo for Kai-Book
- (macOS) Apple Developer account for code signing & notarization (optional but recommended)
- (Windows) [Chocolatey account](https://community.chocolatey.org/account) for publishing


## 1. Bump the Version

Update the version in all three files:

| File                     | Field     |
|--------------------------|-----------|
| `src-tauri/tauri.conf.json` | `"version"` |
| `src-tauri/Cargo.toml`      | `version`   |
| `package.json`              | `"version"` |


## 2. Build Release Binaries Locally (optional)

```bash
npm ci
cargo tauri build
```

Outputs land in `src-tauri/target/release/bundle/`:

| Platform | Files |
|----------|-------|
| macOS    | `dmg/KaiBook_x.y.z_aarch64.dmg`, `macos/KaiBook.app` |
| Windows  | `nsis/KaiBook_x.y.z_x64-setup.exe`, `msi/KaiBook_x.y.z_x64_en-US.msi` |


## 3. Create a Git Tag & Push

```bash
git add .
git commit -m "Release v1.0.0"
git tag -a v1.0.0 -m "KaiBook v1.0.0"
git push origin main
git push origin v1.0.0
```

Pushing the tag triggers the GitHub Actions workflow at `.github/workflows/release.yml`. It builds for macOS (ARM64 + x64) and Windows (x64), then creates a **draft** GitHub Release with all the installers attached.


## 4. Publish the GitHub Release

1. Go to **Releases** on your GitHub repo
2. Find the draft release created by CI
3. Edit the release notes if needed
4. Click **Publish release**


## 5. Update Package Manager Hashes

After the release is published and artifacts are downloadable:

```bash
./scripts/update-release-hashes.sh 1.0.0 YOUR_GITHUB_USERNAME
```

This downloads each artifact, computes SHA256 checksums, and patches the Homebrew formula and Chocolatey install script automatically.


## 6. Publish to Homebrew

Homebrew uses a **tap** — a separate GitHub repo that holds your formula.

### First-time setup

```bash
# Create a new repo on GitHub called "homebrew-kaibook"
# Clone it locally
git clone https://github.com/YOUR_USERNAME/homebrew-kaibook.git
mkdir -p homebrew-kaibook/Casks
cp homebrew/kaibook.rb homebrew-kaibook/Casks/kaibook.rb
cd homebrew-kaibook
git add . && git commit -m "Add KaiBook cask v1.0.0" && git push
```

### Users install with

```bash
brew tap YOUR_USERNAME/kaibook
brew install --cask kaibook
```

### Future releases

1. Run the hash update script (step 5)
2. Copy the updated `homebrew/kaibook.rb` into your tap repo's `Casks/` folder
3. Commit and push


## 7. Publish to Chocolatey

### First-time setup

1. Create an account at https://community.chocolatey.org
2. Get your API key from your account page
3. Save it locally: `choco apikey --key YOUR_API_KEY --source https://push.chocolatey.org/`

### Pack and push

```bash
cd chocolatey
choco pack
choco push kaibook.1.0.0.nupkg --source https://push.chocolatey.org/
```

Chocolatey has a moderation queue — your package will be reviewed before going live (usually 1–3 days).

### Users install with

```powershell
choco install kaibook
```

### Future releases

1. Run the hash update script (step 5) — it patches the nuspec version and installer URL
2. `cd chocolatey && choco pack && choco push`


## 8. macOS Code Signing & Notarization (Optional)

For a signed release that doesn't trigger Gatekeeper warnings, set these GitHub repo secrets:

| Secret | Description |
|--------|-------------|
| `APPLE_CERTIFICATE` | Base64-encoded .p12 certificate |
| `APPLE_CERTIFICATE_PASSWORD` | Password for the .p12 |
| `KEYCHAIN_PASSWORD` | Temp keychain password (any string) |
| `APPLE_SIGNING_IDENTITY` | e.g. `Developer ID Application: Your Name (TEAMID)` |
| `APPLE_ID` | Your Apple ID email |
| `APPLE_PASSWORD` | App-specific password from appleid.apple.com |
| `APPLE_TEAM_ID` | Your 10-character team ID |

Without these, the app builds fine but users will see "unidentified developer" on first launch (they can right-click > Open to bypass).


## Quick Reference

| Action | Command |
|--------|---------|
| Dev mode | `cargo tauri dev` |
| Release build | `cargo tauri build` |
| Tag release | `git tag -a v1.0.0 -m "v1.0.0" && git push origin v1.0.0` |
| Update hashes | `./scripts/update-release-hashes.sh 1.0.0 USERNAME` |
| Homebrew push | Copy formula to tap repo, commit, push |
| Chocolatey push | `cd chocolatey && choco pack && choco push` |
