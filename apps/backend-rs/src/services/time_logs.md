# time_logs.rs

Time log service. Enforces single-active-timer constraint and calculates
duration on stop.

## Exports
- `start()` — starts a time log, returns error if one is already active
- `stop()` — stops the active log and calculates elapsed duration
