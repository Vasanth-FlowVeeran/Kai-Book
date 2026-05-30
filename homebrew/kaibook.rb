# Homebrew Cask formula for KaiBook
# ---------------------------------------------------------
# To use this, create a GitHub repo called "homebrew-kaibook"
# and place this file at Casks/kaibook.rb
#
# Users install with:
#   brew tap Vasanth-FlowVeeran/kaibook
#   brew install --cask kaibook
# ---------------------------------------------------------

cask "kaibook" do
  version "1.0.0"

  # --- Architecture-specific URLs ---
  on_arm do
    url "https://github.com/Vasanth-FlowVeeran/Kai-Book/releases/download/v#{version}/KaiBook_#{version}_aarch64.dmg"
    sha256 "REPLACE_WITH_ARM64_SHA256"
  end

  on_intel do
    url "https://github.com/Vasanth-FlowVeeran/Kai-Book/releases/download/v#{version}/KaiBook_#{version}_x64.dmg"
    sha256 "REPLACE_WITH_X64_SHA256"
  end

  name "KaiBook"
  desc "A versatile system tray contact book for freelancers"
  homepage "https://github.com/Vasanth-FlowVeeran/Kai-Book"

  livecheck do
    url :url
    strategy :github_latest
  end

  app "KaiBook.app"

  zap trash: [
    "~/.kaibook",
    "~/Library/Application Support/com.kaibook.app",
    "~/Library/Caches/com.kaibook.app",
    "~/Library/Preferences/com.kaibook.app.plist",
    "~/Library/Saved Application State/com.kaibook.app.savedState",
  ]
end
