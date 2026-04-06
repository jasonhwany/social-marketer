import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'social-marketer.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      title TEXT,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
      platform TEXT NOT NULL,
      content TEXT NOT NULL,
      hashtags TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      scheduled_at TEXT,
      posted_at TEXT,
      error TEXT,
      post_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(campaign_id, platform, content)
    );

    CREATE TABLE IF NOT EXISTS platform_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL UNIQUE,
      config TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS daily_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      platform TEXT NOT NULL,
      posted_count INTEGER NOT NULL DEFAULT 0,
      UNIQUE(date, platform)
    );
  `);
}

export type Campaign = {
  id: number;
  url: string;
  title: string | null;
  description: string | null;
  created_at: string;
  is_active: number;
};

export type Post = {
  id: number;
  campaign_id: number;
  platform: string;
  content: string;
  hashtags: string | null;
  status: string;
  scheduled_at: string | null;
  posted_at: string | null;
  error: string | null;
  post_url: string | null;
  created_at: string;
};

export type PlatformConfig = {
  id: number;
  platform: string;
  config: string;
  updated_at: string;
};

// Re-export from constants so server-only code can use the same values
export { PLATFORMS, type Platform } from './constants';
