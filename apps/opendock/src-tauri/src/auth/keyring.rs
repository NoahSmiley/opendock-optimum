use keyring::Entry;

const SERVICE: &str = "me.athion.opendock";
const ACCOUNT: &str = "auth-token";

pub fn store(token: &str) -> Result<(), String> {
    Entry::new(SERVICE, ACCOUNT)
        .map_err(|e| e.to_string())?
        .set_password(token)
        .map_err(|e| e.to_string())
}

pub fn load() -> Option<String> {
    let entry = Entry::new(SERVICE, ACCOUNT).ok()?;
    entry.get_password().ok()
}

pub fn clear() -> Result<(), String> {
    let entry = Entry::new(SERVICE, ACCOUNT).map_err(|e| e.to_string())?;
    match entry.delete_credential() {
        Ok(_) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}
