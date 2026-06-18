import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.expanduser("~"), ".softwarenode", "data.db")


def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_connection()
    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL DEFAULT 'Başlıksız',
            parent_id INTEGER REFERENCES pages(id) ON DELETE CASCADE,
            icon TEXT DEFAULT '📄',
            page_type TEXT DEFAULT 'note',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS blocks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
            block_type TEXT NOT NULL DEFAULT 'text',
            content TEXT DEFAULT '',
            properties TEXT DEFAULT '{}',
            order_index INTEGER DEFAULT 0
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
            page_id INTEGER REFERENCES pages(id) ON DELETE SET NULL,
            title TEXT NOT NULL,
            event_date TEXT NOT NULL,
            color TEXT DEFAULT '#4A90D9',
            note TEXT DEFAULT ''
        );
    """)
    conn.commit()
    conn.close()


# ── Pages ──────────────────────────────────────────────────────────────────

def create_page(title="Başlıksız", parent_id=None, icon="📄", page_type="note"):
    conn = get_connection()
    c = conn.cursor()
    c.execute(
        "INSERT INTO pages (title, parent_id, icon, page_type) VALUES (?, ?, ?, ?)",
        (title, parent_id, icon, page_type)
    )
    conn.commit()
    page_id = c.lastrowid
    conn.close()
    return page_id


def get_pages(parent_id=None):
    conn = get_connection()
    c = conn.cursor()
    if parent_id is None:
        c.execute("SELECT * FROM pages WHERE parent_id IS NULL ORDER BY id")
    else:
        c.execute("SELECT * FROM pages WHERE parent_id=? ORDER BY id", (parent_id,))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows


def get_page(page_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM pages WHERE id=?", (page_id,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None


def update_page(page_id, **kwargs):
    kwargs["updated_at"] = datetime.now().isoformat()
    fields = ", ".join(f"{k}=?" for k in kwargs)
    values = list(kwargs.values()) + [page_id]
    conn = get_connection()
    conn.execute(f"UPDATE pages SET {fields} WHERE id=?", values)
    conn.commit()
    conn.close()


def delete_page(page_id):
    conn = get_connection()
    conn.execute("DELETE FROM pages WHERE id=?", (page_id,))
    conn.commit()
    conn.close()


# ── Blocks ─────────────────────────────────────────────────────────────────

def get_blocks(page_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM blocks WHERE page_id=? ORDER BY order_index", (page_id,))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    for r in rows:
        r["properties"] = json.loads(r["properties"] or "{}")
    return rows


def save_blocks(page_id, blocks):
    conn = get_connection()
    conn.execute("DELETE FROM blocks WHERE page_id=?", (page_id,))
    for i, b in enumerate(blocks):
        conn.execute(
            "INSERT INTO blocks (page_id, block_type, content, properties, order_index) VALUES (?,?,?,?,?)",
            (page_id, b.get("type", "text"), b.get("content", ""),
             json.dumps(b.get("properties", {})), i)
        )
    conn.commit()
    conn.close()


# ── Database view ──────────────────────────────────────────────────────────

def get_db_columns(page_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM db_columns WHERE page_id=? ORDER BY order_index", (page_id,))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows


def add_db_column(page_id, name, col_type="text"):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM db_columns WHERE page_id=?", (page_id,))
    idx = c.fetchone()[0]
    c.execute("INSERT INTO db_columns (page_id, name, col_type, order_index) VALUES (?,?,?,?)",
              (page_id, name, col_type, idx))
    conn.commit()
    col_id = c.lastrowid
    conn.close()
    return col_id


def delete_db_column(col_id):
    conn = get_connection()
    conn.execute("DELETE FROM db_columns WHERE id=?", (col_id,))
    conn.commit()
    conn.close()


def get_db_rows(page_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM db_rows WHERE page_id=? ORDER BY id", (page_id,))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    for r in rows:
        r["row_data"] = json.loads(r["row_data"] or "{}")
    return rows


def add_db_row(page_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("INSERT INTO db_rows (page_id, row_data) VALUES (?, '{}')", (page_id,))
    conn.commit()
    row_id = c.lastrowid
    conn.close()
    return row_id


def update_db_row(row_id, row_data):
    conn = get_connection()
    conn.execute("UPDATE db_rows SET row_data=? WHERE id=?", (json.dumps(row_data), row_id))
    conn.commit()
    conn.close()


def delete_db_row(row_id):
    conn = get_connection()
    conn.execute("DELETE FROM db_rows WHERE id=?", (row_id,))
    conn.commit()
    conn.close()


# ── Calendar ────────────────────────────────────────────────────────────────

def get_events(year, month):
    prefix = f"{year}-{month:02d}-"
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM calendar_events WHERE event_date LIKE ?", (prefix + "%",))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows


def add_event(title, event_date, color="#4A90D9", note=""):
    conn = get_connection()
    c = conn.cursor()
    c.execute("INSERT INTO calendar_events (title, event_date, color, note) VALUES (?,?,?,?)",
              (title, event_date, color, note))
    conn.commit()
    eid = c.lastrowid
    conn.close()
    return eid


def delete_event(event_id):
    conn = get_connection()
    conn.execute("DELETE FROM calendar_events WHERE id=?", (event_id,))
    conn.commit()
    conn.close()


def update_event(event_id, **kwargs):
    fields = ", ".join(f"{k}=?" for k in kwargs)
    values = list(kwargs.values()) + [event_id]
    conn = get_connection()
    conn.execute(f"UPDATE calendar_events SET {fields} WHERE id=?", values)
    conn.commit()
    conn.close()
