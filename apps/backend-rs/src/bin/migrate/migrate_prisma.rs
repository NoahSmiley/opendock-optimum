use std::path::PathBuf;

use sqlx::sqlite::SqlitePoolOptions;
use sqlx::{Row, SqlitePool};

pub async fn run(root: &PathBuf, target: &SqlitePool) -> Result<(), Box<dyn std::error::Error>> {
    let prisma_path = root.join("apps/backend/src/dal/sql/prisma/dev.db");
    if !prisma_path.exists() {
        println!("No Prisma dev.db found, skipping SQL migration");
        return Ok(());
    }
    let source_url = format!("sqlite:{}?mode=ro", prisma_path.display());
    let source = SqlitePoolOptions::new().connect(&source_url).await?;

    migrate_users(&source, target).await?;
    migrate_notes(&source, target).await?;
    migrate_folders(&source, target).await?;
    migrate_collections(&source, target).await?;
    migrate_collection_notes(&source, target).await?;
    Ok(())
}

async fn migrate_users(source: &SqlitePool, target: &SqlitePool) -> Result<(), Box<dyn std::error::Error>> {
    let users: Vec<_> = sqlx::query("SELECT * FROM User").fetch_all(source).await.unwrap_or_default();
    for row in &users {
        let id: String = row.get("id");
        let email: String = row.get("email");
        let hash: String = row.get("passwordHash");
        let name: Option<String> = row.try_get("displayName").ok();
        let role: String = row.try_get("role").unwrap_or("member".into());
        let created: String = row.try_get("createdAt").unwrap_or_default();
        let updated: String = row.try_get("updatedAt").unwrap_or_default();
        sqlx::query("INSERT OR IGNORE INTO users (id, email, password_hash, display_name, role, created_at, updated_at) VALUES (?,?,?,?,?,?,?)")
            .bind(&id).bind(&email).bind(&hash).bind(&name).bind(&role)
            .bind(&created).bind(&updated)
            .execute(target).await?;
    }
    println!("  Migrated {} users from Prisma", users.len());
    Ok(())
}

async fn migrate_notes(source: &SqlitePool, target: &SqlitePool) -> Result<(), Box<dyn std::error::Error>> {
    let notes: Vec<_> = sqlx::query("SELECT * FROM Note").fetch_all(source).await.unwrap_or_default();
    for row in &notes {
        let pinned: bool = row.try_get("isPinned").unwrap_or(false);
        let archived: bool = row.try_get("isArchived").unwrap_or(false);
        sqlx::query("INSERT OR IGNORE INTO notes (id, title, content, content_type, folder_id, tags, is_pinned, is_archived, user_id, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
            .bind(row.get::<String,_>("id"))
            .bind(row.get::<String,_>("title"))
            .bind(row.try_get::<String,_>("content").unwrap_or_default())
            .bind(row.try_get::<String,_>("contentType").unwrap_or("markdown".into()))
            .bind(row.try_get::<Option<String>,_>("folderId").unwrap_or(None))
            .bind(row.try_get::<String,_>("tags").unwrap_or("[]".into()))
            .bind(pinned as i32).bind(archived as i32)
            .bind(row.get::<String,_>("userId"))
            .bind(row.try_get::<String,_>("createdAt").unwrap_or_default())
            .bind(row.try_get::<String,_>("updatedAt").unwrap_or_default())
            .execute(target).await?;
    }
    println!("  Migrated {} notes from Prisma", notes.len());
    Ok(())
}

async fn migrate_folders(source: &SqlitePool, target: &SqlitePool) -> Result<(), Box<dyn std::error::Error>> {
    let folders: Vec<_> = sqlx::query("SELECT * FROM Folder").fetch_all(source).await.unwrap_or_default();
    for row in &folders {
        sqlx::query("INSERT OR IGNORE INTO note_folders (id, name, color, icon, parent_id, user_id, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)")
            .bind(row.get::<String,_>("id")).bind(row.get::<String,_>("name"))
            .bind(row.try_get::<Option<String>,_>("color").unwrap_or(None))
            .bind(row.try_get::<Option<String>,_>("icon").unwrap_or(None))
            .bind(row.try_get::<Option<String>,_>("parentId").unwrap_or(None))
            .bind(row.get::<String,_>("userId"))
            .bind(row.try_get::<String,_>("createdAt").unwrap_or_default())
            .bind(row.try_get::<String,_>("updatedAt").unwrap_or_default())
            .execute(target).await?;
    }
    println!("  Migrated {} folders from Prisma", folders.len());
    Ok(())
}

async fn migrate_collections(source: &SqlitePool, target: &SqlitePool) -> Result<(), Box<dyn std::error::Error>> {
    let collections: Vec<_> = sqlx::query("SELECT * FROM Collection").fetch_all(source).await.unwrap_or_default();
    for row in &collections {
        sqlx::query("INSERT OR IGNORE INTO collections (id, name, description, color, icon, user_id, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)")
            .bind(row.get::<String,_>("id")).bind(row.get::<String,_>("name"))
            .bind(row.try_get::<Option<String>,_>("description").unwrap_or(None))
            .bind(row.try_get::<Option<String>,_>("color").unwrap_or(None))
            .bind(row.try_get::<Option<String>,_>("icon").unwrap_or(None))
            .bind(row.get::<String,_>("userId"))
            .bind(row.try_get::<String,_>("createdAt").unwrap_or_default())
            .bind(row.try_get::<String,_>("updatedAt").unwrap_or_default())
            .execute(target).await?;
    }
    println!("  Migrated {} collections from Prisma", collections.len());
    Ok(())
}

async fn migrate_collection_notes(source: &SqlitePool, target: &SqlitePool) -> Result<(), Box<dyn std::error::Error>> {
    let cn: Vec<_> = sqlx::query("SELECT * FROM CollectionNote").fetch_all(source).await.unwrap_or_default();
    for row in &cn {
        sqlx::query("INSERT OR IGNORE INTO collection_notes (id, collection_id, note_id, created_at) VALUES (?,?,?,?)")
            .bind(row.get::<String,_>("id"))
            .bind(row.get::<String,_>("collectionId"))
            .bind(row.get::<String,_>("noteId"))
            .bind(row.try_get::<String,_>("createdAt").unwrap_or_default())
            .execute(target).await?;
    }
    println!("  Migrated {} collection-note links from Prisma", cn.len());
    Ok(())
}
