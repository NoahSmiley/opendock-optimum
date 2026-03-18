use std::path::{Path, PathBuf};
use tokio::fs;

/// Save raw bytes to the uploads directory with a unique filename.
pub async fn save_file(
    uploads_dir: &str,
    original_name: &str,
    data: &[u8],
) -> std::io::Result<(String, String)> {
    let id = ulid::Ulid::new().to_string().to_lowercase();
    let ext = Path::new(original_name)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");
    let sanitized = sanitize_filename(original_name);
    let filename = if ext.is_empty() {
        format!("{id}-{sanitized}")
    } else {
        format!("{id}-{sanitized}.{ext}")
    };

    let path = PathBuf::from(uploads_dir).join(&filename);
    fs::write(&path, data).await?;

    let url = format!("/api/uploads/{filename}");
    Ok((filename, url))
}

fn sanitize_filename(name: &str) -> String {
    let stem = Path::new(name)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("file");
    stem.chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
        .take(60)
        .collect()
}
