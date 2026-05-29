use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Instant;
use tauri::async_runtime::JoinHandle;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, PhysicalPosition, Theme,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[derive(Default)]
pub struct TrayState {
    click_task: Mutex<Option<JoinHandle<()>>>,
    last_double_click: Mutex<Option<Instant>>,
    pub last_window_hide: Mutex<Option<Instant>>,
}

pub struct TrayIconState {
    icon: Mutex<Option<TrayIcon>>,
}

// ============================================
// Data types
// ============================================

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Contact {
    pub id: String,
    pub name: String,
    pub email_primary: String,
    pub email_secondary: String,
    pub phone_primary: String,
    pub phone_secondary: String,
    pub address: String,
    pub timezone: String,
    pub notes: String,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default)]
    pub favorite: bool,
    #[serde(default)]
    pub groups: Vec<String>,
}

/// A user-created contact group.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ContactGroup {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub color: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ContactsFile {
    pub contacts: Vec<Contact>,
}

// ============================================
// Helpers
// ============================================

/// Returns ~/.kaibook/groups.json
fn groups_path() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not determine home directory")?;
    let dir = home.join(".kaibook");
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| format!("Failed to create .kaibook dir: {e}"))?;
    }
    Ok(dir.join("groups.json"))
}

/// Returns ~/.kaibook/contacts.json, creating the directory if needed.
fn contacts_path() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not determine home directory")?;
    let dir = home.join(".kaibook");
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| format!("Failed to create .kaibook dir: {e}"))?;
    }
    Ok(dir.join("contacts.json"))
}

// ============================================
// Tauri commands - called from the frontend JS
// ============================================

/// Theme settings shared between main window and tray popup.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ThemeSettings {
    pub dark_mode: bool,
    pub ui_theme: String,
    #[serde(default)]
    pub onboarding_complete: bool,
}

/// Returns ~/.kaibook/theme.json
fn theme_path() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not determine home directory")?;
    let dir = home.join(".kaibook");
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| format!("Failed to create .kaibook dir: {e}"))?;
    }
    Ok(dir.join("theme.json"))
}

#[tauri::command]
fn load_theme() -> Result<ThemeSettings, String> {
    let path = theme_path()?;
    if !path.exists() {
        return Ok(ThemeSettings {
            dark_mode: false,
            ui_theme: "skeuomorphic".to_string(),
            onboarding_complete: false,
        });
    }
    let data = fs::read_to_string(&path).map_err(|e| format!("Read error: {e}"))?;
    serde_json::from_str(&data).map_err(|e| format!("Parse error: {e}"))
}

#[tauri::command]
fn save_theme(settings: ThemeSettings) -> Result<(), String> {
    let path = theme_path()?;
    let json =
        serde_json::to_string_pretty(&settings).map_err(|e| format!("Serialize error: {e}"))?;
    fs::write(&path, json).map_err(|e| format!("Write error: {e}"))?;
    Ok(())
}

/// Load contacts from ~/.kaibook/contacts.json.
/// Returns an empty array if the file doesn't exist yet.
/// Handles both `{ "contacts": [...] }` and bare `[...]` formats.
#[tauri::command]
fn load_contacts() -> Result<Vec<Contact>, String> {
    let path = contacts_path()?;
    if !path.exists() {
        return Ok(vec![]);
    }
    let data = fs::read_to_string(&path).map_err(|e| format!("Read error: {e}"))?;
    // Try wrapped format first, then bare array
    if let Ok(file) = serde_json::from_str::<ContactsFile>(&data) {
        return Ok(file.contacts);
    }
    if let Ok(contacts) = serde_json::from_str::<Vec<Contact>>(&data) {
        return Ok(contacts);
    }
    Err("Parse error: invalid contacts.json format".to_string())
}

/// Save the full contacts array to ~/.kaibook/contacts.json.
#[tauri::command]
fn save_contacts(contacts: Vec<Contact>) -> Result<(), String> {
    let path = contacts_path()?;
    let file = ContactsFile { contacts };
    let json = serde_json::to_string_pretty(&file).map_err(|e| format!("Serialize error: {e}"))?;
    fs::write(&path, json).map_err(|e| format!("Write error: {e}"))?;
    Ok(())
}

/// Export contacts to a user-chosen path.
#[tauri::command]
fn export_contacts_to(contacts: Vec<Contact>, path: String) -> Result<(), String> {
    let file = ContactsFile { contacts };
    let json = serde_json::to_string_pretty(&file).map_err(|e| format!("Serialize error: {e}"))?;
    fs::write(&path, json).map_err(|e| format!("Write error: {e}"))?;
    Ok(())
}

/// Import contacts from a user-chosen JSON file path.
#[tauri::command]
fn import_contacts_from(path: String) -> Result<Vec<Contact>, String> {
    let data = fs::read_to_string(&path).map_err(|e| format!("Read error: {e}"))?;
    let file: ContactsFile =
        serde_json::from_str(&data).map_err(|e| format!("Parse error: {e}"))?;
    Ok(file.contacts)
}

/// Show the main KaiBook window.
#[tauri::command]
fn show_main_window(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
    // Hide the tray popup if open
    if let Some(popup) = app.get_webview_window("tray-popup") {
        let _ = popup.hide();
    }
}

/// Set the native window theme (title bar appearance).
#[tauri::command]
fn set_native_theme(app: tauri::AppHandle, dark: bool) {
    let theme = if dark { Some(Theme::Dark) } else { Some(Theme::Light) };
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.set_theme(theme);
    }
}

/// Quit the entire application.
#[tauri::command]
fn exit_app(app: tauri::AppHandle) {
    app.exit(0);
}

/// Load contact groups from ~/.kaibook/groups.json.
#[tauri::command]
fn load_groups() -> Result<Vec<ContactGroup>, String> {
    let path = groups_path()?;
    if !path.exists() {
        return Ok(vec![]);
    }
    let data = fs::read_to_string(&path).map_err(|e| format!("Read error: {e}"))?;
    serde_json::from_str(&data).map_err(|e| format!("Parse error: {e}"))
}

/// Save contact groups to ~/.kaibook/groups.json.
#[tauri::command]
fn save_groups(groups: Vec<ContactGroup>) -> Result<(), String> {
    let path = groups_path()?;
    let json =
        serde_json::to_string_pretty(&groups).map_err(|e| format!("Serialize error: {e}"))?;
    fs::write(&path, json).map_err(|e| format!("Write error: {e}"))?;
    Ok(())
}

/// Open a URL (mailto:, https:, etc.) with the system default handler.
#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    tauri_plugin_opener::open_url(url, None::<&str>)
        .map_err(|e| format!("Failed to open URL: {e}"))
}

// ============================================
// Shared popup positioning helper
// ============================================

fn position_popup_near_tray(app: &tauri::AppHandle, center: tauri::PhysicalPosition<f64>) {
    if let Some(popup) = app.get_webview_window("tray-popup") {
        let popup_w = 320.0;
        let popup_h = 440.0;
        let gap = 8.0; // ~0.5 rem gap between cursor and popup

        let tray_cx = center.x;
        let tray_cy = center.y;

        // --- 2. Get monitor bounds ---
        let monitor = popup
            .monitor_from_point(tray_cx, tray_cy)
            .unwrap_or(None)
            .or_else(|| app.primary_monitor().unwrap_or(None));

        let (mon_x, mon_y, mon_w, mon_h) = if let Some(m) = monitor {
            let pos = m.position();
            let size = m.size();
            (
                pos.x as f64,
                pos.y as f64,
                size.width as f64,
                size.height as f64,
            )
        } else {
            (0.0, 0.0, 1920.0, 1080.0)
        };

        let mon_right = mon_x + mon_w;
        let mon_bottom = mon_y + mon_h;

        // --- 3. Detect which edge the taskbar (and tray) is on ---
        let dist_to_bottom = mon_bottom - tray_cy;
        let dist_to_top = tray_cy - mon_y;
        let dist_to_right = mon_right - tray_cx;
        let dist_to_left = tray_cx - mon_x;

        let min_dist = dist_to_bottom
            .min(dist_to_top)
            .min(dist_to_right)
            .min(dist_to_left);

        // --- 4. Position popup on the OPPOSITE side of the taskbar edge ---
        let (mut x, mut y);

        if min_dist == dist_to_bottom {
            x = tray_cx - popup_w / 2.0;
            y = tray_cy - popup_h - gap;
        } else if min_dist == dist_to_top {
            x = tray_cx - popup_w / 2.0;
            y = tray_cy + gap;
        } else if min_dist == dist_to_right {
            x = tray_cx - popup_w - gap;
            y = tray_cy - popup_h / 2.0;
        } else {
            x = tray_cx + gap;
            y = tray_cy - popup_h / 2.0;
        }

        // --- 5. Clamp to screen bounds (keep fully on-screen) ---
        x = x.max(mon_x).min(mon_right - popup_w);
        y = y.max(mon_y).min(mon_bottom - popup_h);

        let _ = popup.set_position(PhysicalPosition::new(x as i32, y as i32));
    }
}

// ============================================
// App setup
// ============================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        let ctrl_shift_k = Shortcut::new(
                            Some(Modifiers::CONTROL | Modifiers::SHIFT),
                            Code::KeyK,
                        );
                        if shortcut == &ctrl_shift_k {
                            if let Some(popup) = app.get_webview_window("tray-popup") {
                                if popup.is_visible().unwrap_or(false) {
                                    let _ = popup.hide();
                                } else {
                                    // Position relative to the tray icon (same as click)
                                    let tray_state = app.state::<TrayIconState>();
                                    if let Some(tray) = tray_state.icon.lock().unwrap().as_ref() {
                                        if let Ok(Some(rect)) = tray.rect() {
                                            let (tx, ty) = match rect.position {
                                                tauri::Position::Physical(p) => (p.x as f64, p.y as f64),
                                                tauri::Position::Logical(l) => (l.x, l.y),
                                            };
                                            let (tw, th) = match rect.size {
                                                tauri::Size::Physical(p) => (p.width as f64, p.height as f64),
                                                tauri::Size::Logical(l) => (l.width, l.height),
                                            };
                                            position_popup_near_tray(app, PhysicalPosition::new(tx + tw / 2.0, ty + th / 2.0));
                                        }
                                    }
                                    let _ = popup.show();
                                    let _ = popup.set_focus();
                                    let _ = app.emit_to("tray-popup", "refresh-contacts", ());
                                }
                            }
                        }
                    }
                })
                .build(),
        )
        .manage(TrayState::default())
        .manage(TrayIconState {
            icon: Mutex::new(None),
        })
        .setup(|app| {
            // ---- Right-click context menu for tray ----
            let show_item = MenuItem::with_id(app, "show", "Open KaiBook", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            // ---- Intercept main window close → hide to tray instead ----
            if let Some(main_window) = app.get_webview_window("main") {
                let w = main_window.clone();
                main_window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = w.hide();
                    }
                });
            }

            // ---- Auto-hide tray popup when it loses focus ----
            if let Some(popup_window) = app.get_webview_window("tray-popup") {
                let w = popup_window.clone();
                let app_handle = app.handle().clone();
                popup_window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Focused(false) = event {
                        if let Some(state) = app_handle.try_state::<TrayState>() {
                            *state.last_window_hide.lock().unwrap() = Some(Instant::now());
                        }
                        let _ = w.hide();
                    }
                });
            }

            // ---- Register global shortcut Ctrl+Shift+K ----
            app.global_shortcut().register(Shortcut::new(
                Some(Modifiers::CONTROL | Modifiers::SHIFT),
                Code::KeyK,
            ))?;

            // ---- Build tray icon ----
            let tray_icon = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("KaiBook")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    let app = tray.app_handle();

                    match event {
                        TrayIconEvent::Click {
                            position,
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } => {
                            let state = app.state::<TrayState>();

                            // If a double-click occurred within 500ms, ignore this trailing single click
                            if let Some(last_dbl) = *state.last_double_click.lock().unwrap() {
                                if last_dbl.elapsed() < std::time::Duration::from_millis(500) {
                                    return;
                                }
                            }

                            // If the main window is visible, single-clicking the tray icon should hide the main window
                            // and NOT show the tray popup.
                            if let Some(main_window) = app.get_webview_window("main") {
                                if main_window.is_visible().unwrap_or(false) {
                                    // Cancel any pending click task to debounce rapid/rigorous clicking
                                    if let Some(task) = state.click_task.lock().unwrap().take() {
                                        task.abort();
                                    }
                                    let _ = main_window.hide();
                                    return;
                                }
                            }

                            // If the window was hidden via focus loss within the last 300ms,
                            // the user clicked the tray while the window was open, causing it to lose focus.
                            // We shouldn't reopen it in this case!
                            if let Some(last_hide) = *state.last_window_hide.lock().unwrap() {
                                if last_hide.elapsed() < std::time::Duration::from_millis(300) {
                                    return;
                                }
                            }

                            // Cancel any pending click task to debounce rapid/rigorous clicking
                            if let Some(task) = state.click_task.lock().unwrap().take() {
                                task.abort();
                            }

                            let app_clone = app.clone();
                            let tray_pos = position;

                            let task = tauri::async_runtime::spawn(async move {
                                // Delay single-click processing to allow a double-click to cancel it
                                tokio::time::sleep(std::time::Duration::from_millis(200)).await;

                                if let Some(popup) = app_clone.get_webview_window("tray-popup") {
                                    if !popup.is_visible().unwrap_or(false) {
                                        position_popup_near_tray(&app_clone, tray_pos);
                                        let _ = popup.show();
                                        let _ = popup.set_focus();
                                        let _ = app_clone.emit_to("tray-popup", "refresh-contacts", ());
                                    }
                                }
                            });

                            *state.click_task.lock().unwrap() = Some(task);
                        }

                        // ---- Double-click → open main KaiBook window, cancelling single-click ----
                        TrayIconEvent::DoubleClick {
                            button: MouseButton::Left,
                            ..
                        } => {
                            let state = app.state::<TrayState>();

                            // Abort any pending single-click task immediately
                            if let Some(task) = state.click_task.lock().unwrap().take() {
                                task.abort();
                            }

                            // Record the double-click timestamp
                            *state.last_double_click.lock().unwrap() = Some(Instant::now());

                            if let Some(popup) = app.get_webview_window("tray-popup") {
                                let _ = popup.hide();
                            }
                            if let Some(main_win) = app.get_webview_window("main") {
                                let _ = main_win.show();
                                let _ = main_win.set_focus();
                            }
                        }

                        _ => {}
                    }
                })
                .build(app)?;

            // Store tray icon so the global shortcut handler can position relative to it
            *app.state::<TrayIconState>().icon.lock().unwrap() = Some(tray_icon);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_contacts,
            save_contacts,
            export_contacts_to,
            import_contacts_from,
            load_groups,
            save_groups,
            show_main_window,
            exit_app,
            load_theme,
            save_theme,
            set_native_theme,
            open_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running KaiBook");
}
