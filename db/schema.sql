-- CCC Portal schema

CREATE TABLE IF NOT EXISTS bodies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Committee','Club','Cell')),
  description TEXT,
  poc_name TEXT,
  poc_contact TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  body_id INTEGER NOT NULL REFERENCES bodies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  tag TEXT CHECK(tag IN ('recruiting','event','deadline','none')) DEFAULT 'none',
  event_date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  body_id INTEGER NOT NULL REFERENCES bodies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT
);

CREATE TABLE IF NOT EXISTS queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  body_id INTEGER NOT NULL REFERENCES bodies(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
