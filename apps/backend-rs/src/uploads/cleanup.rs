use std::path::PathBuf;
use tokio::fs;

/// Delete a file from the uploads directory.
pub async fn delete_file(uploads_dir: &str, filename: &str) -> std::io::Result<()> {
    let path = PathBuf::from(uploads_dir).join(filename);
    match fs::remove_file(&path).await {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e),
    }
}
