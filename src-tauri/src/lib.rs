use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Instant;
use tauri::async_runtime::JoinHandle;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, PhysicalPosition, Theme,
};

#[derive(Default)]
pub struct TrayState {
    click_task: Mutex<Option<JoinHandle<()>>>,
    last_double_click: Mutex<Option<Instant>>,
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
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ContactsFile {
    pub contacts: Vec<Contact>,
}

// ============================================
// Helpers
// ============================================

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
// Tauri commands — called from the frontend JS
// ============================================

/// Theme settings shared between main window and tray popup.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ThemeSettings {
    pub dark_mode: bool,
    pub ui_theme: String,
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

// ============================================
// App setup
// ============================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .manage(TrayState::default())
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
                popup_window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Focused(false) = event {
                        let _ = w.hide();
                    }
                });
            }

            // ---- Build tray icon ----
            TrayIconBuilder::new()
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
                        // ---- Single click → toggle tray popup with debounce ----
                        TrayIconEvent::Click {
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

                            // Cancel any pending click task to debounce rapid/rigorous clicking
                            if let Some(task) = state.click_task.lock().unwrap().take() {
                                task.abort();
                            }

                            let app_clone = app.clone();
                            let tray_clone = tray.clone();

                            let task = tauri::async_runtime::spawn(async move {
                                // Delay single-click processing to allow a double-click to cancel it
                                tokio::time::sleep(std::time::Duration::from_millis(200)).await;

                                if let Some(popup) = app_clone.get_webview_window("tray-popup") {
                                    if popup.is_visible().unwrap_or(false) {
                                        let _ = popup.hide();
                                    } else {
                                        // Position popup dynamically based on taskbar/tray icon position
                                        if let Ok(Some(rect)) = tray_clone.rect() {
                                            // Get monitor dimensions (usually primary monitor contains the taskbar/tray)
                                            let (monitor_x, monitor_y, monitor_w, monitor_h) = if let Ok(Some(monitor)) = app_clone.primary_monitor() {
                                                let pos = monitor.position();
                                                let size = monitor.size();
                                                (pos.x as f64, pos.y as f64, size.width as f64, size.height as f64)
                                            } else {
                                                (0.0, 0.0, 1920.0, 1080.0)
                                            };

                                            let (px, py) = match rect.position {
                                                tauri::Position::Physical(p) => {
                                                    (p.x as f64, p.y as f64)
                                                }
                                                tauri::Position::Logical(l) => (l.x, l.y),
                                            };
                                            let (sw, sh) = match rect.size {
                                                tauri::Size::Physical(p) => {
                                                    (p.width as f64, p.height as f64)
                                                }
                                                tauri::Size::Logical(l) => (l.width, l.height),
                                            };

                                            let popup_width = 320.0;
                                            let popup_height = 440.0;

                                            let tray_center_x = px + (sw / 2.0);
                                            let tray_center_y = py + (sh / 2.0);

                                            // Determine which screen boundary the tray icon is closest to
                                            let dist_bottom = (monitor_y + monitor_h) - tray_center_y;
                                            let dist_top = tray_center_y - monitor_y;
                                            let dist_right = (monitor_x + monitor_w) - tray_center_x;
                                            let dist_left = tray_center_x - monitor_x;

                                            let mut x = tray_center_x - (popup_width / 2.0);
                                            let mut y = py + sh; // Default fallback to top/below

                                            let min_dist = dist_bottom
                                                .min(dist_top)
                                                .min(dist_right)
                                                .min(dist_left);

                                            if min_dist == dist_bottom {
                                                // Taskbar is at the bottom: place popup above tray icon
                                                x = tray_center_x - (popup_width / 2.0);
                                                y = py - popup_height;
                                            } else if min_dist == dist_top {
                                                // Taskbar is at the top: place popup below tray icon
                                                x = tray_center_x - (popup_width / 2.0);
                                                y = py + sh;
                                            } else if min_dist == dist_right {
                                                // Taskbar is on the right: place popup to the left of tray icon
                                                x = px - popup_width;
                                                y = tray_center_y - (popup_height / 2.0);
                                            } else if min_dist == dist_left {
                                                // Taskbar is on the left: place popup to the right of tray icon
                                                x = px + sw;
                                                y = tray_center_y - (popup_height / 2.0);
                                            }

                                            // Constraint to ensure the window fits completely inside the monitor bounds
                                            x = x.max(monitor_x).min(monitor_x + monitor_w - popup_width);
                                            y = y.max(monitor_y).min(monitor_y + monitor_h - popup_height);

                                            let _ = popup.set_position(PhysicalPosition::new(
                                                x as i32, y as i32,
                                            ));
                                        }
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

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_contacts,
            save_contacts,
            export_contacts_to,
            import_contacts_from,
            show_main_window,
            exit_app,
            load_theme,
            save_theme,
            set_native_theme,
        ])
        .run(tauri::generate_context!())
        .expect("error while running KaiBook");
}
