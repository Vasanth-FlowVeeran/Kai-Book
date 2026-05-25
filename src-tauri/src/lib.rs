use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    webview::WebviewWindowBuilder,
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

            // ---- Build tray icon ----
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("KaiBook")
                .menu(&menu)
                .show_menu_on_left_click(false) // left-click → popup, right-click → menu
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        // "Open KaiBook" from right-click menu
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
                            let popup_width: f64 = 320.0;
                            let popup_height: f64 = 440.0;

                            let (x, y) = if let Ok(Some(rect)) = tray.rect() {
                                let (px, py) = match rect.position {
                                    tauri::Position::Physical(p) => (p.x as f64, p.y as f64),
                                    tauri::Position::Logical(l) => (l.x, l.y),
                                };
                                let (sw, sh) = match rect.size {
                                    tauri::Size::Physical(p) => (p.width as f64, p.height as f64),
                                    tauri::Size::Logical(l) => (l.width, l.height),
                                };
                                (px - (popup_width / 2.0) + (sw / 2.0), py + sh)
                            } else {
                                (400.0, 30.0)
                            };

                            if let Some(popup) = app.get_webview_window("tray-popup") {
                                if popup.is_visible().unwrap_or(false) {
                                    let _ = popup.hide();
                                } else {
                                    let _ = popup.set_position(PhysicalPosition::new(x as i32, y as i32));
                                    let _ = popup.show();
                                    let _ = popup.set_focus();
                                    let _ = app.emit_to("tray-popup", "refresh-contacts", ());
                                }
                            } else {
                                let popup = WebviewWindowBuilder::new(
                                    app,
                                    "tray-popup",
                                    tauri::WebviewUrl::App("tray.html".into()),
                                )
                                .title("KaiBook")
                                .inner_size(popup_width, popup_height)
                                .position(x, y)
                                .resizable(false)
                                .decorations(false)
                                .skip_taskbar(true)
                                .always_on_top(true)
                                .visible(true)
                                .focused(true)
                                .build();

                                match popup {
                                    Ok(w) => {
                                        let w_clone = w.clone();
                                        w.on_window_event(move |event| {
                                            if let tauri::WindowEvent::Focused(false) = event {
                                                let _ = w_clone.hide();
                                            }
                                        });
                                    }
                                    Err(e) => {
                                        eprintln!("Failed to create tray popup: {e}");
                                    }
                                }
                            }
                        }

                        // ---- Double-click → open main KaiBook window ----
                        TrayIconEvent::DoubleClick {
                            button: MouseButton::Left,
                            ..
                        } => {
                            // Hide the popup if it's open
                            if let Some(popup) = app.get_webview_window("tray-popup") {
                                let _ = popup.hide();
                            }
                            // Show the main window
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running KaiBook");
}
