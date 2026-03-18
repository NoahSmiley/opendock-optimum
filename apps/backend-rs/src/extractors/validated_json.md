# validated_json.rs

Validated JSON body extractor. Deserializes the request body and runs
validation rules before passing it to the handler.

## Exports
- `ValidatedJson<T>` — extractor that deserializes JSON and validates it, returning 422 on failure
