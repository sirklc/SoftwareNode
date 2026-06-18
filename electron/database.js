const Database = require('better-sqlite3')
const path = require('path')
const os = require('os')
const fs = require('fs')

const DB_DIR = path.join(os.homedir(), '.softwarenode')
const DB_PATH = path.join(DB_DIR, 'data.db')

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT 'Başlıksız',
    parent_id INTEGER REFERENCES pages(id) ON DELETE CASCADE,
    icon TEXT DEFAULT '📄',
    cover TEXT DEFAULT '',
    page_type TEXT DEFAULT 'note',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS page_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL UNIQUE REFERENCES pages(id) ON DELETE CASCADE,
    content TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS db_columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    col_type TEXT DEFAULT 'text',
    order_index INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS db_rows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    row_data TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS calendar_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    event_date TEXT NOT NULL,
    color TEXT DEFAULT '#2eaadc',
    note TEXT DEFAULT ''
  );
`)

// ── Pages ──────────────────────────────────────────────────────────────────

const getPages = (parentId = null) => {
  if (parentId === null) {
    return db.prepare('SELECT * FROM pages WHERE parent_id IS NULL ORDER BY id').all()
  }
  return db.prepare('SELECT * FROM pages WHERE parent_id = ? ORDER BY id').all(parentId)
}

const getAllPages = () => db.prepare('SELECT * FROM pages ORDER BY id').all()

const getPage = (id) => db.prepare('SELECT * FROM pages WHERE id = ?').get(id)

const createPage = (title = 'Başlıksız', parentId = null, icon = '📄', pageType = 'note') => {
  const result = db.prepare(
    'INSERT INTO pages (title, parent_id, icon, page_type) VALUES (?, ?, ?, ?)'
  ).run(title, parentId, icon, pageType)
  return result.lastInsertRowid
}

const updatePage = (id, fields) => {
  fields.updated_at = new Date().toISOString()
  const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ')
  db.prepare(`UPDATE pages SET ${sets} WHERE id = ?`).run(...Object.values(fields), id)
}

const deletePage = (id) => db.prepare('DELETE FROM pages WHERE id = ?').run(id)

// ── Page content ───────────────────────────────────────────────────────────

const getContent = (pageId) => {
  const row = db.prepare('SELECT content FROM page_content WHERE page_id = ?').get(pageId)
  return row ? JSON.parse(row.content) : []
}

const saveContent = (pageId, content) => {
  db.prepare(`
    INSERT INTO page_content (page_id, content) VALUES (?, ?)
    ON CONFLICT(page_id) DO UPDATE SET content = excluded.content
  `).run(pageId, JSON.stringify(content))
}

// ── Database view ──────────────────────────────────────────────────────────

const getDbColumns = (pageId) =>
  db.prepare('SELECT * FROM db_columns WHERE page_id = ? ORDER BY order_index').all(pageId)

const addDbColumn = (pageId, name, colType = 'text') => {
  const count = db.prepare('SELECT COUNT(*) as c FROM db_columns WHERE page_id = ?').get(pageId).c
  const result = db.prepare(
    'INSERT INTO db_columns (page_id, name, col_type, order_index) VALUES (?, ?, ?, ?)'
  ).run(pageId, name, colType, count)
  return result.lastInsertRowid
}

const deleteDbColumn = (id) => db.prepare('DELETE FROM db_columns WHERE id = ?').run(id)
const renameDbColumn = (id, name) => db.prepare('UPDATE db_columns SET name = ? WHERE id = ?').run(name, id)

const getDbRows = (pageId) => {
  const rows = db.prepare('SELECT * FROM db_rows WHERE page_id = ? ORDER BY id').all(pageId)
  return rows.map(r => ({ ...r, row_data: JSON.parse(r.row_data || '{}') }))
}

const addDbRow = (pageId) =>
  db.prepare("INSERT INTO db_rows (page_id, row_data) VALUES (?, '{}')").run(pageId).lastInsertRowid

const updateDbRow = (id, rowData) =>
  db.prepare('UPDATE db_rows SET row_data = ? WHERE id = ?').run(JSON.stringify(rowData), id)

const deleteDbRow = (id) => db.prepare('DELETE FROM db_rows WHERE id = ?').run(id)

// ── Calendar ────────────────────────────────────────────────────────────────

const getEvents = (year, month) => {
  const prefix = `${year}-${String(month).padStart(2, '0')}-`
  return db.prepare("SELECT * FROM calendar_events WHERE event_date LIKE ?").all(prefix + '%')
}

const addEvent = (title, eventDate, color = '#2eaadc', note = '') =>
  db.prepare('INSERT INTO calendar_events (title, event_date, color, note) VALUES (?, ?, ?, ?)')
    .run(title, eventDate, color, note).lastInsertRowid

const deleteEvent = (id) => db.prepare('DELETE FROM calendar_events WHERE id = ?').run(id)

const updateEvent = (id, fields) => {
  const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ')
  db.prepare(`UPDATE calendar_events SET ${sets} WHERE id = ?`).run(...Object.values(fields), id)
}

module.exports = {
  getPages, getAllPages, getPage, createPage, updatePage, deletePage,
  getContent, saveContent,
  getDbColumns, addDbColumn, deleteDbColumn, renameDbColumn,
  getDbRows, addDbRow, updateDbRow, deleteDbRow,
  getEvents, addEvent, deleteEvent, updateEvent,
}
