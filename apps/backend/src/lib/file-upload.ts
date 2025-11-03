import multer from "multer";
import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: timestamp-randomhex-originalname
    const uniqueSuffix = `${Date.now()}-${randomBytes(8).toString("hex")}`;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const sanitizedBasename = basename.replace(/[^a-zA-Z0-9-_]/g, "_");
    cb(null, `${uniqueSuffix}-${sanitizedBasename}${ext}`);
  },
});

// File filter - accept common file types
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  // Allow images, documents, and common file types
  const allowedMimes = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Text
    "text/plain",
    "text/csv",
    "text/markdown",
    // Archives
    "application/zip",
    "application/x-zip-compressed",
    "application/gzip",
    // Code
    "application/json",
    "application/javascript",
    "text/html",
    "text/css",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`));
  }
};

// Create multer upload instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 10, // Max 10 files per upload
  },
});

// Helper to delete a file
export function deleteFile(filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.unlink(filePath, (err) => {
      if (err && err.code !== "ENOENT") {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Helper to check if file exists
export function fileExists(filename: string): boolean {
  const filePath = path.join(UPLOADS_DIR, filename);
  return fs.existsSync(filePath);
}

// Get file path
export function getFilePath(filename: string): string {
  return path.join(UPLOADS_DIR, filename);
}

// Get public URL for file
export function getFileUrl(filename: string): string {
  return `/api/uploads/${filename}`;
}
