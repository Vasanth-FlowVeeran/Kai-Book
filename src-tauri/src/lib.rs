use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
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

// ============================================
// App setup
// ============================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // ---- System Tray ----
            let show_item = MenuItem::with_id(app, "show", "Open KaiBook", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("KaiBook")
                .menu(&menu)
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
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_contacts,
            save_contacts,
            export_contacts_to,
            import_contacts_from,
        ])
        .run(tauri::generate_context!())
        .expect("error while running KaiBook");
}
