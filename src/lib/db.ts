import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'nexus.db');

let db: Database.Database;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initTables();
  }
  return db;
}

function initTables() {
  const d = getDb();

  d.exec(`
    CREATE TABLE IF NOT EXISTS content (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      source TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'video',
      duration TEXT DEFAULT '',
      thumbnail TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      status TEXT DEFAULT 'queued',
      progress INTEGER DEFAULT 0,
      saved_by TEXT DEFAULT 'rick',
      saved_at TEXT DEFAULT (datetime('now')),
      mode_affinity TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      done INTEGER DEFAULT 0,
      date TEXT DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS signals (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      text TEXT NOT NULL,
      type TEXT DEFAULT 'alert',
      time TEXT DEFAULT (datetime('now')),
      read INTEGER DEFAULT 0
    );
  `);
}

// ─── CONTENT ───
export function getContent(status?: string) {
  const d = getDb();
  if (status) return d.prepare('SELECT * FROM content WHERE status = ? ORDER BY saved_at DESC').all(status);
  return d.prepare('SELECT * FROM content ORDER BY saved_at DESC').all();
}

export function addContent(item: { url: string; title: string; source: string; type: string; duration?: string }) {
  const d = getDb();
  const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  d.prepare('INSERT INTO content (id, url, title, source, type, duration) VALUES (?, ?, ?, ?, ?, ?)').run(
    id, item.url, item.title, item.source, item.type, item.duration || ''
  );
  return id;
}

export function updateContentProgress(id: string, progress: number) {
  const d = getDb();
  const status = progress >= 100 ? 'done' : progress > 0 ? 'in_progress' : 'queued';
  d.prepare('UPDATE content SET progress = ?, status = ? WHERE id = ?').run(progress, status, id);
}

export function updateContentStatus(id: string, status: string) {
  const d = getDb();
  d.prepare('UPDATE content SET status = ? WHERE id = ?').run(status, id);
}

export function deleteContent(id: string) {
  const d = getDb();
  d.prepare('DELETE FROM content WHERE id = ?').run(id);
}

// ─── GOALS ───
export function getGoals(date?: string) {
  const d = getDb();
  const targetDate = date || new Date().toISOString().split('T')[0];
  return d.prepare('SELECT * FROM goals WHERE date = ? ORDER BY rowid').all(targetDate);
}

export function addGoal(label: string, date?: string) {
  const d = getDb();
  const id = `g_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const targetDate = date || new Date().toISOString().split('T')[0];
  d.prepare('INSERT INTO goals (id, label, date) VALUES (?, ?, ?)').run(id, label, targetDate);
  return id;
}

export function toggleGoal(id: string) {
  const d = getDb();
  d.prepare('UPDATE goals SET done = CASE WHEN done = 0 THEN 1 ELSE 0 END WHERE id = ?').run(id);
}

// ─── SIGNALS ───
export function getSignals(limit = 20) {
  const d = getDb();
  return d.prepare('SELECT * FROM signals WHERE read = 0 ORDER BY time DESC LIMIT ?').all(limit);
}

export function addSignal(item: { source: string; text: string; type: string }) {
  const d = getDb();
  const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  d.prepare('INSERT INTO signals (id, source, text, type) VALUES (?, ?, ?, ?)').run(id, item.source, item.text, item.type);
  return id;
}

export function dismissSignal(id: string) {
  const d = getDb();
  d.prepare('UPDATE signals SET read = 1 WHERE id = ?').run(id);
}
