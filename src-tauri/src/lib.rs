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

fn palette_window(app: &AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window("palette")
}

fn settings_window(app: &AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window("settings")
}

fn enforce_overlay_click_through_target(target: &str) -> Result<(), String> {
    if target != "overlay" {
        let message = format!("Refusing to apply click-through to non-overlay window '{target}'.");
        eprintln!("{message}");
        return Err(message);
    }

    Ok(())
}

fn bring_toolbar_to_front_internal(app: &AppHandle, focus_toolbar: bool) -> Result<(), String> {
    let toolbar = toolbar_window(app).ok_or_else(|| "Toolbar window not found".to_string())?;

    toolbar.show().map_err(|error| error.to_string())?;
    toolbar
        .set_always_on_top(true)
        .map_err(|error| error.to_string())?;

    if focus_toolbar {
        toolbar.set_focus().map_err(|error| error.to_string())?;
    }

    #[cfg(windows)]
    {
        if let Ok(hwnd) = toolbar.hwnd() {
            use windows::Win32::Foundation::HWND;
            use windows::Win32::UI::WindowsAndMessaging::{SetWindowPos, HWND_TOPMOST, SWP_NOMOVE, SWP_NOSIZE, SWP_NOACTIVATE};
            unsafe {
                let _ = SetWindowPos(
                    HWND(hwnd.0 as _),
                    HWND_TOPMOST,
                    0, 0, 0, 0,
                    SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
                );
            }
        }
        println!("[TRInk Basic Input] toolbar topmost reasserted");
    }

    Ok(())
}

fn emit_overlay_command(app: &AppHandle, command: OverlayCommand) {
    if let Some(window) = overlay_window(app) {
        let _ = window.emit("trink://overlay-command", command);
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

    // Hide secondary windows when hiding the app; don't auto-show them
    if !visible {
        if let Some(window) = palette_window(app) {
            let _ = window.hide();
        }
        if let Some(window) = settings_window(app) {
            let _ = window.hide();
        }
    }

    let _ = bring_toolbar_to_front_internal(app, focus_toolbar && visible);
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
    let edition_label = env!("TRINK_EDITION_LABEL");
    let is_basic = edition_label == "Basic";

    let menu = if is_basic {
        let label = MenuItem::with_id(app, "label", "TRInk Basic", false, None::<&str>)?;
        let show_toolbar = MenuItem::with_id(app, "show_toolbar", "Show toolbar", true, None::<&str>)?;
        let hide_toolbar = MenuItem::with_id(app, "hide_toolbar", "Hide toolbar", true, None::<&str>)?;
        let enable_ct = MenuItem::with_id(app, "enable_ct", "Enable click-through", true, None::<&str>)?;
        let disable_ct = MenuItem::with_id(app, "disable_ct", "Disable click-through / Edit mode", true, None::<&str>)?;
        let open_settings = MenuItem::with_id(app, "open_settings", "Settings", true, None::<&str>)?;
        let clear = MenuItem::with_id(app, "clear_drawings", "Clear drawings", true, None::<&str>)?;
        let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
        Menu::with_items(app, &[&label, &show_toolbar, &hide_toolbar, &enable_ct, &disable_ct, &open_settings, &clear, &quit])?
    } else {
        let show_hide = MenuItem::with_id(app, "toggle_overlay", "Show / Hide TRInk", true, None::<&str>)?;
        let open_settings = MenuItem::with_id(app, "open_settings", "Open Settings", true, None::<&str>)?;
        let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
        Menu::with_items(app, &[&show_hide, &open_settings, &quit])?
    };

    let mut builder = TrayIconBuilder::new()
        .tooltip(env!("TRINK_PRODUCT_NAME"))
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "toggle_overlay" => {
                let visible = overlay_window(app)
                    .and_then(|window| window.is_visible().ok())
                    .unwrap_or(true);
                show_overlay_windows(app, !visible, true);
            }
            "show_toolbar" => {
                show_overlay_windows(app, true, true);
            }
            "hide_toolbar" => {
                show_overlay_windows(app, false, true);
            }
            "enable_ct" => {
                let _ = app.emit("tray-event", "enable-click-through");
            }
            "disable_ct" => {
                let _ = app.emit("tray-event", "disable-click-through");
            }
            "clear_drawings" => {
                let _ = app.emit("tray-event", "clear-drawings");
            }
            "open_settings" => {
                show_overlay_windows(app, true, true);
                if let Some(window) = settings_window(app) {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "quit" => app.exit(0),
            _ => {}
        });

    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }

    builder.build(app)?;

    Ok(())
}

#[tauri::command]
fn set_click_through(app: AppHandle, enabled: bool) -> Result<(), String> {
    enforce_overlay_click_through_target("overlay")?;
    let window = overlay_window(&app).ok_or_else(|| "Overlay window not found".to_string())?;
    window
        .set_ignore_cursor_events(enabled)
        .map_err(|error| error.to_string())?;
    bring_toolbar_to_front_internal(&app, false)?;
    Ok(())
}

#[tauri::command]
fn set_overlay_visible(app: AppHandle, visible: bool) -> Result<(), String> {
    show_overlay_windows(&app, visible, visible);
    Ok(())
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn toggle_palette_window(app: AppHandle, x: f64, y: f64) -> Result<(), String> {
    if let Some(window) = palette_window(&app) {
        let is_visible = window.is_visible().unwrap_or(false);
        if is_visible {
            let _ = window.hide();
        } else {
            let _ = window.set_position(tauri::LogicalPosition::new(x, y));
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
    Ok(())
}

#[tauri::command]
fn close_palette_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = palette_window(&app) {
        let _ = window.hide();
    }
    Ok(())
}

#[tauri::command]
fn toggle_settings_window(app: AppHandle, x: f64, y: f64) -> Result<(), String> {
    if let Some(window) = settings_window(&app) {
        let is_visible = window.is_visible().unwrap_or(false);
        if is_visible {
            let _ = window.hide();
        } else {
            let mut final_x = x;
            let mut final_y = y;

            if let Some(monitor) = overlay_window(&app).and_then(|w| w.current_monitor().unwrap_or(None)).or_else(|| window.primary_monitor().unwrap_or(None)) {
                let sf = monitor.scale_factor();
                let m_pos = monitor.position().to_logical::<f64>(sf);
                let m_size = monitor.size().to_logical::<f64>(sf);
                
                let cur_size = window.outer_size().unwrap_or(tauri::PhysicalSize::new(700, 720)).to_logical::<f64>(sf);
                let new_width = cur_size.width.min(m_size.width - 48.0).min(720.0);
                let new_height = cur_size.height.min(m_size.height - 48.0).min(720.0);
                
                let _ = window.set_size(tauri::LogicalSize::new(new_width, new_height));

                if final_x + new_width > m_pos.x + m_size.width {
                    final_x = m_pos.x + m_size.width - new_width - 12.0;
                }
                if final_x < m_pos.x {
                    final_x = m_pos.x + 12.0;
                }

                if final_y + new_height > m_pos.y + m_size.height {
                    final_y = m_pos.y + m_size.height - new_height - 12.0;
                }
                if final_y < m_pos.y {
                    final_y = m_pos.y + 12.0;
                }
            }

            let _ = window.set_position(tauri::LogicalPosition::new(final_x, final_y));
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
    Ok(())
}

#[tauri::command]
fn close_settings_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = settings_window(&app) {
        let _ = window.hide();
    }
    Ok(())
}

#[tauri::command]
fn bring_toolbar_to_front(app: AppHandle) -> Result<(), String> {
    bring_toolbar_to_front_internal(&app, false)
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
            if let Some(w) = app.get_webview_window("overlay") {
                let _ = w.set_always_on_top(true);
            }
            if let Some(w) = app.get_webview_window("toolbar") {
                let _ = w.set_always_on_top(true);
                let _ = w.set_ignore_cursor_events(false);
            }
            if let Some(w) = app.get_webview_window("palette") {
                let _ = w.set_ignore_cursor_events(false);
            }
            if let Some(w) = app.get_webview_window("settings") {
                let _ = w.set_ignore_cursor_events(false);
            }
            let _ = bring_toolbar_to_front_internal(app.handle(), false);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_click_through,
            set_overlay_visible,
            apply_shortcut_bindings,
            quit_app,
            toggle_palette_window,
            close_palette_window,
            toggle_settings_window,
            close_settings_window,
            bring_toolbar_to_front
        ])
        .run(tauri::generate_context!())
        .expect("error while running TRInk");
}
