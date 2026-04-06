import { neon } from '@neondatabase/serverless';
import type { NeonQueryFunction } from '@neondatabase/serverless';

// Lazy initialization — safe at build time when DATABASE_URL may not exist
let _sql: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    _sql = neon(process.env.DATABASE_URL!);
  }
  return _sql;
}

export async function initSchema() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS campaigns (
      id SERIAL PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_active INTEGER NOT NULL DEFAULT 1
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
      platform TEXT NOT NULL,
      content TEXT NOT NULL,
      hashtags TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      scheduled_at TIMESTAMPTZ,
      posted_at TIMESTAMPTZ,
      error TEXT,
      post_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(campaign_id, platform, content)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS platform_settings (
      id SERIAL PRIMARY KEY,
      platform TEXT NOT NULL UNIQUE,
      config TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS daily_stats (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      platform TEXT NOT NULL,
      posted_count INTEGER NOT NULL DEFAULT 0,
      UNIQUE(date, platform)
    )
  `;
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

// Re-export from constants so server-only code can use the same values
export { PLATFORMS, type Platform } from './constants';
