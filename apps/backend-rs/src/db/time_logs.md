# time_logs.rs

Database queries for time logs, including start/stop and active-log lookup.

## Exports
- Time log CRUD functions (create, list, delete)
- `find_active()` — finds the currently running time log for a user/ticket
- `stop()` — sets end time on an active log
