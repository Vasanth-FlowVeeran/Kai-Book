#!/bin/bash
# update-release-hashes.sh: After publishing a GitHub Release, run this to
# download the artifacts, compute SHA256 hashes, and update the Homebrew
# formula automatically.
#
# Usage:  ./scripts/update-release-hashes.sh <version> <github-username>
# Example: ./scripts/update-release-hashes.sh 1.0.0 myusername

set -euo pipefail

VERSION="${1:?Usage: $0 <version> <github-username>}"
GH_USER="${2:?Usage: $0 <version> <github-username>}"
BASE_URL="https://github.com/${GH_USER}/Kai-Book/releases/download/v${VERSION}"

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

echo "==> Downloading release artifacts for v${VERSION}..."

# macOS ARM64 DMG
DMG_ARM="${TMPDIR}/KaiBook_${VERSION}_aarch64.dmg"
curl -sL "${BASE_URL}/KaiBook_${VERSION}_aarch64.dmg" -o "$DMG_ARM" && \
  SHA_ARM=$(shasum -a 256 "$DMG_ARM" | awk '{print $1}') || SHA_ARM="DOWNLOAD_FAILED"

# macOS x64 DMG
DMG_X64="${TMPDIR}/KaiBook_${VERSION}_x64.dmg"
curl -sL "${BASE_URL}/KaiBook_${VERSION}_x64.dmg" -o "$DMG_X64" && \
  SHA_X64=$(shasum -a 256 "$DMG_X64" | awk '{print $1}') || SHA_X64="DOWNLOAD_FAILED"

# Windows NSIS installer
EXE_WIN="${TMPDIR}/KaiBook_${VERSION}_x64-setup.exe"
curl -sL "${BASE_URL}/KaiBook_${VERSION}_x64-setup.exe" -o "$EXE_WIN" && \
  SHA_WIN=$(shasum -a 256 "$EXE_WIN" | awk '{print $1}') || SHA_WIN="DOWNLOAD_FAILED"

echo ""
echo "SHA256 Hashes:"
echo "  macOS ARM64 DMG:   ${SHA_ARM}"
echo "  macOS x64 DMG:     ${SHA_X64}"
echo "  Windows x64 EXE:   ${SHA_WIN}"
echo ""

# Update Homebrew formula
FORMULA="homebrew/kaibook.rb"
if [ -f "$FORMULA" ]; then
  sed -i.bak "s/version \".*\"/version \"${VERSION}\"/" "$FORMULA"
  sed -i.bak "s/REPLACE_WITH_ARM64_SHA256/${SHA_ARM}/" "$FORMULA"
  sed -i.bak "s/REPLACE_WITH_X64_SHA256/${SHA_X64}/" "$FORMULA"
  # Also update any previously set hashes
  echo "==> Updated ${FORMULA}"
  rm -f "${FORMULA}.bak"
fi

echo ""
echo "Done! Review the changes, then:"
echo "  1. Push the Homebrew formula to your homebrew-kaibook tap repo"
