# App.tsx

Root application component — router setup, auth gate, titlebar, loading state.

## Behavior
1. On mount, calls `checkSession()` to restore auth
2. While loading, shows titlebar + loading indicator
3. If authenticated: renders `AppLayout` with route pages
4. If not authenticated: renders `AuthPage`

## Used by
- `main.tsx`

## Dependencies
- `stores/auth/store.ts`, `Titlebar`, `ZoomControls`, `AppLayout`, `AuthPage`, `DashboardPage`
