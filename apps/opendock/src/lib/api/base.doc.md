# base.ts

Generic HTTP request helper with CSRF token handling.

## Exports
- `request<T>(path, options)` — typed fetch wrapper with credentials and CSRF
- `ApiError` — error class with status and code from API responses

## CSRF Flow
1. Reads `od.csrf` cookie
2. Sends it as `x-opendock-csrf` header on mutating requests
3. Backend validates cookie/header match

## Used by
- All domain API modules (`auth.ts`, `boards.ts`, `notes.ts`, etc.)
