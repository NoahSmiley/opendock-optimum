# csrf.rs

CSRF double-submit protection middleware. Compares a cookie value against
a request header to prevent cross-site request forgery.

## Exports
- `require_csrf()` — middleware that validates the `od.csrf` cookie matches the `x-opendock-csrf` header
