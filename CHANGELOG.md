# Changelog

All notable changes to OpenDock.

Format follows [Keep a Changelog](https://keepachangelog.com/). Versions follow [SemVer](https://semver.org/).

## [Unreleased]

## [0.1.0] — 2026-04-16

Minimal rewrite. The previous codebase was discarded; this is the foundation going forward.

### Added
- Tauri 2 + React 19 desktop app under `apps/opendock/` — Notes, Boards, Calendar shell.
- Native SwiftUI iOS app under `apps/opendock-ios/` — Notes and Boards with flat file layout.
- Boards feature on both platforms — store, list view, detail view with columns, card detail sheet, column picker, drag reorder (desktop).
- Notes feature on both platforms — search, pinning, tags, word count, context menus, auto-save.
- OpenDock branding and Athion design tokens (`--a-*`) across web, desktop, iOS.
- Custom OpenAI Sans font loading on all platforms.
- Seed data for boards and notes.
- Split CSS (`src/styles/base|shell|editor|boards|overlays|responsive.css`).
- Extracted pure helpers to `src/lib/` (notes, tags) and drag logic to `src/hooks/useBoardDrag.ts`.
- Confirm and prompt dialogs replacing native browser prompts.

### Changed
- Enforced 100-line file limit across all source files.
- Moved UIKit/SwiftUI appearance setup into `Theme.swift`.
- Mobile breakpoint widened to 1024px with proper single-pane switching.

### Removed
- Previous Rust backend and legacy frontend — fully replaced.
- All emoji from UI and code.
- Dead code, placeholder stubs, debug logging.
