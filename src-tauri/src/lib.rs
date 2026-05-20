use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Emitter, Manager, WebviewWindow,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[derive(Clone, serde::Serialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
enum HotkeyEvent {
    SetTool { tool: String },
    ToggleClickThrough,
    Undo,
    Redo,
    Clear,
    OpenSettings,
}

fn emit_hotkey(window: &WebviewWindow, event: HotkeyEvent) {
    let _ = window.emit("trink://hotkey", event);
}

fn emit_visibility(window: &WebviewWindow, visible: bool) {
    let _ = window.emit("trink://overlay-visibility", visible);
}

fn handle_shortcut(app: &AppHandle, shortcut: &Shortcut, state: ShortcutState) {
    if state != ShortcutState::Pressed {
        return;
    }

    let Some(window) = app.get_webview_window("main") else {
        return;
    };

    let ctrl_shift_space = Shortcut::new(
        Some(Modifiers::CONTROL | Modifiers::SHIFT),
        Code::Space,
    );
    let ctrl_shift_p = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyP);
    let ctrl_shift_h = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyH);
    let ctrl_shift_a = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyA);
    let ctrl_shift_r = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyR);
    let ctrl_shift_t = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyT);
    let ctrl_shift_e = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyE);
    let ctrl_shift_x = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyX);
    let ctrl_z = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyZ);
    let ctrl_y = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyY);
    let ctrl_shift_backspace =
        Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Backspace);

    if shortcut == &ctrl_shift_space {
        let visible = window.is_visible().unwrap_or(true);
        if visible {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
        }
        emit_visibility(&window, !visible);
        return;
    }

    if shortcut == &ctrl_shift_p {
        emit_hotkey(&window, HotkeyEvent::SetTool { tool: "pen".into() });
    } else if shortcut == &ctrl_shift_h {
        emit_hotkey(&window, HotkeyEvent::SetTool {
            tool: "highlighter".into(),
        });
    } else if shortcut == &ctrl_shift_a {
        emit_hotkey(&window, HotkeyEvent::SetTool {
            tool: "arrow".into(),
        });
    } else if shortcut == &ctrl_shift_r {
        emit_hotkey(&window, HotkeyEvent::SetTool {
            tool: "rectangle".into(),
        });
    } else if shortcut == &ctrl_shift_t {
        emit_hotkey(&window, HotkeyEvent::SetTool { tool: "text".into() });
    } else if shortcut == &ctrl_shift_e {
        emit_hotkey(&window, HotkeyEvent::SetTool {
            tool: "eraser".into(),
        });
    } else if shortcut == &ctrl_shift_x {
        emit_hotkey(&window, HotkeyEvent::ToggleClickThrough);
    } else if shortcut == &ctrl_z {
        emit_hotkey(&window, HotkeyEvent::Undo);
    } else if shortcut == &ctrl_y {
        emit_hotkey(&window, HotkeyEvent::Redo);
    } else if shortcut == &ctrl_shift_backspace {
        emit_hotkey(&window, HotkeyEvent::Clear);
    }
}

fn register_shortcuts(app: &AppHandle) {
    let shortcuts = [
        Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space),
        Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyP),
        Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyH),
        Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyA),
        Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyR),
        Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyT),
        Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyE),
        Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyX),
        Shortcut::new(Some(Modifiers::CONTROL), Code::KeyZ),
        Shortcut::new(Some(Modifiers::CONTROL), Code::KeyY),
        Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Backspace),
    ];

    for shortcut in shortcuts {
        if let Err(error) = app.global_shortcut().register(shortcut) {
            eprintln!("Failed to register shortcut {shortcut:?}: {error}");
        }
    }
}

fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let show_hide = MenuItem::with_id(app, "toggle_overlay", "Show / Hide Overlay", true, None::<&str>)?;
    let open_settings = MenuItem::with_id(app, "open_settings", "Open Settings", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_hide, &open_settings, &quit])?;

    TrayIconBuilder::new()
        .tooltip("TRInk")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| {
            let Some(window) = app.get_webview_window("main") else {
                return;
            };

            match event.id.as_ref() {
                "toggle_overlay" => {
                    let visible = window.is_visible().unwrap_or(true);
                    if visible {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                    emit_visibility(&window, !visible);
                }
                "open_settings" => {
                    let _ = window.show();
                    let _ = window.set_focus();
                    emit_hotkey(&window, HotkeyEvent::OpenSettings);
                    emit_visibility(&window, true);
                }
                "quit" => app.exit(0),
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}

#[tauri::command]
fn set_click_through(app: AppHandle, enabled: bool) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;
    window
        .set_ignore_cursor_events(enabled)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn set_overlay_visible(app: AppHandle, visible: bool) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;
    if visible {
        window.show().map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;
    } else {
        window.hide().map_err(|error| error.to_string())?;
    }
    emit_visibility(&window, visible);
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new()
            .with_handler(|app, shortcut, event| handle_shortcut(app, shortcut, event.state()))
            .build())
        .setup(|app| {
            register_shortcuts(app.handle());
            setup_tray(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_click_through, set_overlay_visible])
        .run(tauri::generate_context!())
        .expect("error while running TradeReality Ink");
}
