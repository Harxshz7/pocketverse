import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'pocketverse.db');
export const db = new sqlite3.Database(dbPath);

export function initDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON');

      // Table 1: Series
      db.run(`
        CREATE TABLE IF NOT EXISTS series (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          creator_id TEXT NOT NULL DEFAULT 'creator-default',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Table 2: Episodes
      db.run(`
        CREATE TABLE IF NOT EXISTS episodes (
          id TEXT PRIMARY KEY,
          series_id TEXT NOT NULL,
          episode_number INTEGER NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          status TEXT CHECK(status IN ('draft', 'analyzed', 'finalized')) DEFAULT 'draft',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
        );
      `);

      // Table 3: AnalysisRuns
      db.run(`
        CREATE TABLE IF NOT EXISTS analysis_runs (
          id TEXT PRIMARY KEY,
          episode_id TEXT NOT NULL,
          continuity_result TEXT,
          grammar_result TEXT,
          tone_remix_result TEXT,
          status TEXT CHECK(status IN ('pending', 'continuity_done', 'grammar_done', 'tone_step', 'complete')) DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
        );
      `, (err) => {
        if (err) {
          console.error('Error initializing database tables:', err);
          reject(err);
        } else {
          console.log('Database initialized successfully at', dbPath);
          resolve();
        }
      });
    });
  });
}

// Database helper promises
export function dbRun(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
}

export function dbAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}
