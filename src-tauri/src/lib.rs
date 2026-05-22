use std::collections::{HashMap, HashSet};
use std::sync::Mutex;

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Emitter, Manager, WebviewWindow,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

#[derive(Clone, serde::Serialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
enum OverlayCommand {
    SetTool { tool: String },
    SetToolMode { mode: String },
    ToggleClickThrough,
    SaveSession,
    LoadSession,
    ExportAnnotationsPng,
    ExportAnnotationsJson,
    Undo,
    Redo,
    Clear,
    ToggleTimerVisible,
    ToggleTimerStartPause,
    ResetTimer,
}

#[derive(Clone, serde::Serialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
enum ToolbarCommand {
    OpenSettings,
}

#[derive(Clone, serde::Deserialize)]
struct ShortcutBindingPayload {
    action: String,
    accelerator: Option<String>,
    enabled: bool,
    global: bool,
}

#[derive(Clone, serde::Serialize)]
struct ShortcutRegistrationStatusPayload {
    action: String,
    accelerator: Option<String>,
    state: String,
    message: Option<String>,
}

#[derive(Default)]
struct ShortcutRegistryState {
    bindings: Mutex<Vec<ShortcutBindingPayload>>,
    action_by_shortcut_id: Mutex<HashMap<u32, String>>,
}

fn overlay_window(app: &AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window("overlay")
}

fn toolbar_window(app: &AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window("toolbar")
}

fn emit_overlay_command(app: &AppHandle, command: OverlayCommand) {
    if let Some(window) = overlay_window(app) {
        let _ = window.emit("trink://overlay-command", command);
    }
}

fn emit_toolbar_command(app: &AppHandle, command: ToolbarCommand) {
    if let Some(window) = toolbar_window(app) {
        let _ = window.emit("trink://toolbar-command", command);
    }
}

fn emit_visibility(app: &AppHandle, visible: bool) {
    if let Some(window) = overlay_window(app) {
        let _ = window.emit("trink://overlay-visibility", visible);
    }
    if let Some(window) = toolbar_window(app) {
        let _ = window.emit("trink://overlay-visibility", visible);
    }
}

fn show_overlay_windows(app: &AppHandle, visible: bool, focus_toolbar: bool) {
    if let Some(window) = overlay_window(app) {
        if visible {
            let _ = window.show();
        } else {
            let _ = window.hide();
        }
    }

    if let Some(window) = toolbar_window(app) {
        if visible {
            let _ = window.show();
            if focus_toolbar {
                let _ = window.set_focus();
            }
        } else {
            let _ = window.hide();
        }
    }

    emit_visibility(app, visible);
}

fn is_supported_shortcut_action(action: &str) -> bool {
    matches!(
        action,
        "toggle_overlay"
            | "toggle_click_through"
            | "select_tool"
            | "pen_tool"
            | "highlighter_tool"
            | "arrow_tool"
            | "rectangle_tool"
            | "text_tool"
            | "eraser_tool"
            | "undo"
            | "redo"
            | "clear"
            | "save_session"
            | "load_session"
            | "export_png"
            | "export_json"
            | "timer_toggle"
            | "timer_start_pause"
            | "timer_reset"
    )
}

fn emit_tool_selection(app: &AppHandle, tool: &str, mode: &str) {
    emit_overlay_command(
        app,
        OverlayCommand::SetTool {
            tool: tool.to_string(),
        },
    );
    emit_overlay_command(
        app,
        OverlayCommand::SetToolMode {
            mode: mode.to_string(),
        },
    );
}

fn dispatch_shortcut_action(app: &AppHandle, action: &str) {
    match action {
        "toggle_overlay" => {
            let visible = overlay_window(app)
                .and_then(|window| window.is_visible().ok())
                .unwrap_or(true);
            show_overlay_windows(app, !visible, true);
        }
        "toggle_click_through" => emit_overlay_command(app, OverlayCommand::ToggleClickThrough),
        "select_tool" => emit_tool_selection(app, "select", "basic"),
        "pen_tool" => emit_tool_selection(app, "pen", "basic"),
        "highlighter_tool" => emit_tool_selection(app, "highlighter", "basic"),
        "arrow_tool" => emit_tool_selection(app, "arrow", "basic"),
        "rectangle_tool" => emit_tool_selection(app, "rectangle", "basic"),
        "text_tool" => emit_tool_selection(app, "text", "basic"),
        "eraser_tool" => emit_tool_selection(app, "eraser", "basic"),
        "undo" => emit_overlay_command(app, OverlayCommand::Undo),
        "redo" => emit_overlay_command(app, OverlayCommand::Redo),
        "clear" => emit_overlay_command(app, OverlayCommand::Clear),
        "save_session" => emit_overlay_command(app, OverlayCommand::SaveSession),
        "load_session" => emit_overlay_command(app, OverlayCommand::LoadSession),
        "export_png" => emit_overlay_command(app, OverlayCommand::ExportAnnotationsPng),
        "export_json" => emit_overlay_command(app, OverlayCommand::ExportAnnotationsJson),
        "timer_toggle" => emit_overlay_command(app, OverlayCommand::ToggleTimerVisible),
        "timer_start_pause" => emit_overlay_command(app, OverlayCommand::ToggleTimerStartPause),
        "timer_reset" => emit_overlay_command(app, OverlayCommand::ResetTimer),
        _ => {}
    }
}

fn handle_shortcut(app: &AppHandle, shortcut: &Shortcut, state: ShortcutState) {
    if state != ShortcutState::Pressed {
        return;
    }

    let registry = app.state::<ShortcutRegistryState>();
    let action = registry
        .action_by_shortcut_id
        .lock()
        .ok()
        .and_then(|bindings| bindings.get(&shortcut.id()).cloned());

    if let Some(action) = action {
        dispatch_shortcut_action(app, &action);
    }
}

fn apply_shortcut_bindings_internal(
    app: &AppHandle,
    registry: &ShortcutRegistryState,
    bindings: Vec<ShortcutBindingPayload>,
) -> Vec<ShortcutRegistrationStatusPayload> {
    if let Err(error) = app.global_shortcut().unregister_all() {
        eprintln!("Failed to unregister existing shortcuts: {error}");
    }

    let mut shortcut_map = HashMap::new();
    let mut seen_accelerators = HashSet::new();
    let mut statuses = Vec::with_capacity(bindings.len());

    for binding in &bindings {
        if !binding.enabled || binding.accelerator.as_ref().is_none_or(|value| value.trim().is_empty()) {
            statuses.push(ShortcutRegistrationStatusPayload {
                action: binding.action.clone(),
                accelerator: binding.accelerator.clone(),
                state: "disabled".into(),
                message: None,
            });
            continue;
        }

        if !binding.global {
            statuses.push(ShortcutRegistrationStatusPayload {
                action: binding.action.clone(),
                accelerator: binding.accelerator.clone(),
                state: "disabled".into(),
                message: Some("Focused-only shortcuts are handled inside the TRInk windows.".into()),
            });
            continue;
        }

        if !is_supported_shortcut_action(&binding.action) {
            statuses.push(ShortcutRegistrationStatusPayload {
                action: binding.action.clone(),
                accelerator: binding.accelerator.clone(),
                state: "unavailable".into(),
                message: Some("Unknown shortcut action.".into()),
            });
            continue;
        }

        let accelerator = binding.accelerator.clone().unwrap_or_default();
        let duplicate_key = accelerator.to_lowercase();
        if seen_accelerators.contains(&duplicate_key) {
            statuses.push(ShortcutRegistrationStatusPayload {
                action: binding.action.clone(),
                accelerator: Some(accelerator),
                state: "unavailable".into(),
                message: Some("Duplicate shortcut accelerator.".into()),
            });
            continue;
        }

        let parsed_shortcut = match accelerator.parse::<Shortcut>() {
            Ok(shortcut) => shortcut,
            Err(error) => {
                statuses.push(ShortcutRegistrationStatusPayload {
                    action: binding.action.clone(),
                    accelerator: Some(accelerator),
                    state: "unavailable".into(),
                    message: Some(error.to_string()),
                });
                continue;
            }
        };

        match app.global_shortcut().register(accelerator.as_str()) {
            Ok(_) => {
                seen_accelerators.insert(duplicate_key);
                shortcut_map.insert(parsed_shortcut.id(), binding.action.clone());
                statuses.push(ShortcutRegistrationStatusPayload {
                    action: binding.action.clone(),
                    accelerator: Some(accelerator),
                    state: "registered".into(),
                    message: None,
                });
            }
            Err(error) => {
                eprintln!(
                    "Failed to register shortcut '{}' for action '{}': {}",
                    accelerator, binding.action, error
                );
                statuses.push(ShortcutRegistrationStatusPayload {
                    action: binding.action.clone(),
                    accelerator: Some(accelerator),
                    state: "unavailable".into(),
                    message: Some(error.to_string()),
                });
            }
        }
    }

    if let Ok(mut stored_bindings) = registry.bindings.lock() {
        *stored_bindings = bindings;
    }
    if let Ok(mut stored_map) = registry.action_by_shortcut_id.lock() {
        *stored_map = shortcut_map;
    }

    statuses
}

fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let show_hide =
        MenuItem::with_id(app, "toggle_overlay", "Show / Hide TRInk", true, None::<&str>)?;
    let open_settings =
        MenuItem::with_id(app, "open_settings", "Open Settings", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_hide, &open_settings, &quit])?;

    TrayIconBuilder::new()
        .tooltip("TradeReality Ink")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "toggle_overlay" => {
                let visible = overlay_window(app)
                    .and_then(|window| window.is_visible().ok())
                    .unwrap_or(true);
                show_overlay_windows(app, !visible, true);
            }
            "open_settings" => {
                show_overlay_windows(app, true, true);
                emit_toolbar_command(app, ToolbarCommand::OpenSettings);
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .build(app)?;

    Ok(())
}

#[tauri::command]
fn set_click_through(app: AppHandle, enabled: bool) -> Result<(), String> {
    let window = overlay_window(&app).ok_or_else(|| "Overlay window not found".to_string())?;
    window
        .set_ignore_cursor_events(enabled)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn set_overlay_visible(app: AppHandle, visible: bool) -> Result<(), String> {
    show_overlay_windows(&app, visible, visible);
    Ok(())
}

#[tauri::command]
fn apply_shortcut_bindings(
    app: AppHandle,
    bindings: Vec<ShortcutBindingPayload>,
    registry: tauri::State<'_, ShortcutRegistryState>,
) -> Vec<ShortcutRegistrationStatusPayload> {
    apply_shortcut_bindings_internal(&app, &registry, bindings)
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| handle_shortcut(app, shortcut, event.state()))
                .build(),
        )
        .setup(|app| {
            app.manage(ShortcutRegistryState::default());
            setup_tray(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_click_through,
            set_overlay_visible,
            apply_shortcut_bindings
        ])
        .run(tauri::generate_context!())
        .expect("error while running TradeReality Ink");
}
