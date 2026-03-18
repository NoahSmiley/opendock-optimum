# Titlebar

Custom window titlebar with platform-specific window controls.

## Behavior
- Shows "OpenDock" title centered
- In Tauri: lazy-loads platform-specific window controls (macOS traffic lights or Windows buttons)
- In browser: renders without window controls

## Used by
- `App.tsx`

## Dependencies
- `MacWindowControls` (lazy), `WindowsWindowControls` (lazy)
