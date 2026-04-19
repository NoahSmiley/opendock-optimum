use std::fs;
use std::io::Write;
use std::path::PathBuf;

fn token_path() -> Option<PathBuf> {
    let dir = dirs::config_dir()?.join("Opendock");
    fs::create_dir_all(&dir).ok()?;
    Some(dir.join("auth-token"))
}

pub fn store(token: &str) -> Result<(), String> {
    let path = token_path().ok_or_else(|| "no config dir".to_string())?;
    let mut f = fs::File::create(&path).map_err(|e| e.to_string())?;
    f.write_all(token.as_bytes()).map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&path, fs::Permissions::from_mode(0o600)).map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn load() -> Option<String> {
    let path = token_path()?;
    fs::read_to_string(path).ok().map(|s| s.trim().to_string()).filter(|s| !s.is_empty())
}

pub fn clear() -> Result<(), String> {
    let path = token_path().ok_or_else(|| "no config dir".to_string())?;
    match fs::remove_file(&path) {
        Ok(_) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}
