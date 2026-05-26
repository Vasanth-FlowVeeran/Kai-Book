use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, PhysicalPosition,
};

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
#[tauri::command]
fn load_contacts() -> Result<Vec<Contact>, String> {
    let path = contacts_path()?;
    if !path.exists() {
        return Ok(vec![]);
    }
    let data = fs::read_to_string(&path).map_err(|e| format!("Read error: {e}"))?;
    let file: ContactsFile =
        serde_json::from_str(&data).map_err(|e| format!("Parse error: {e}"))?;
    Ok(file.contacts)
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

            // ---- Hide popup when it loses focus ----
            if let Some(popup_window) = app.get_webview_window("tray-popup") {
                let pw = popup_window.clone();
                popup_window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Focused(false) = event {
                        let _ = pw.hide();
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
                        // ---- Single click → toggle tray popup ----
                        TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } => {
                            if let Some(popup) = app.get_webview_window("tray-popup") {
                                if popup.is_visible().unwrap_or(false) {
                                    let _ = popup.hide();
                                } else {
                                    // Position popup below tray icon
                                    if let Ok(Some(rect)) = tray.rect() {
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
                                        let (x, y) = {
                                            #[cfg(target_os = "windows")]
                                            {
                                                // On Windows, position the popup above the tray icon
                                                let popup_height =
                                                    popup.outer_size().unwrap().height as f64;
                                                let x = px - 160.0 + (sw / 2.0);
                                                let y = py - popup_height; // Position above the tray icon
                                                (x, y)
                                            }
                                            #[cfg(not(target_os = "windows"))]
                                            {
                                                // Default behavior for other OS: position below the tray icon
                                                let x = px - 160.0 + (sw / 2.0);
                                                let y = py + sh;
                                                (x, y)
                                            }
                                        };
                                        let _ = popup.set_position(PhysicalPosition::new(
                                            x as i32, y as i32,
                                        ));
                                    }
                                    let _ = popup.show();
                                    let _ = popup.set_focus();
                                    let _ = app.emit_to("tray-popup", "refresh-contacts", ());
                                }
                            }
                        }

                        // ---- Double-click → open main KaiBook window ----
                        TrayIconEvent::DoubleClick {
                            button: MouseButton::Left,
                            ..
                        } => {
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running KaiBook");
}
