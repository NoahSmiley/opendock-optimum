# store.ts

Auth Zustand store — manages user session, login, register, logout.

## State
- `user` — current authenticated user or null
- `loading` — true during session check or auth operations
- `error` — error message from last failed operation

## Actions
- `checkSession()` — called on app mount to restore session
- `login(email, password)` — authenticate and set user
- `register(email, password, displayName?)` — create account and set user
- `logout()` — clear session
- `clearError()` — dismiss error message

## Used by
- `App.tsx`, `AuthPage.tsx`, `LoginForm.tsx`, `RegisterForm.tsx`
