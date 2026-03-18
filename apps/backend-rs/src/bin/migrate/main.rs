//! Migration tool: imports data from Express backend into the Rust backend's SQLite DB.
//! Reads: apps/backend/data/state.json (kanban data)
//!        apps/backend/src/dal/sql/prisma/dev.db (users, sessions, notes, folders, collections)
//! Writes: apps/backend-rs/data/opendock.db

mod migrate_kanban;
mod migrate_kanban_extras;
mod migrate_prisma;

use std::path::PathBuf;

use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    let args: Vec<String> = std::env::args().collect();
    let project_root = args.get(1).map(PathBuf::from).unwrap_or_else(|| {
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..")
    });

    println!("Project root: {}", project_root.display());

    // Target DB
    let target_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("data");
    std::fs::create_dir_all(&target_dir)?;
    let target_path = target_dir.join("opendock.db");
    let opts = SqliteConnectOptions::new()
        .filename(&target_path)
        .create_if_missing(true)
        .foreign_keys(false); // Disable FK checks — source data may have orphaned refs
    let target = SqlitePoolOptions::new().connect_with(opts).await?;
    sqlx::migrate!("./migrations").run(&target).await?;
    println!("Target DB ready: {}", target_path.display());

    migrate_kanban::run(&project_root, &target).await?;
    migrate_prisma::run(&project_root, &target).await?;

    println!("Migration complete!");
    Ok(())
}
