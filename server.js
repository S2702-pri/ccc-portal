const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Helpers ----------
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function dayNameFor(dateStr) {
  if (!dateStr) return null;
  // dateStr is 'YYYY-MM-DD' — parse as local calendar date, not UTC-shifted
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return DAY_NAMES[dt.getDay()];
}

function formatTimeRange(start, end) {
  if (!start) return null;
  return end ? `${start}\u2013${end}` : start;
}

function attachTagsAndRollup(body) {
  const rawUpdates = db.prepare(
    'SELECT id, title, tag, event_date, time_start, time_end, is_mandatory, created_at FROM updates WHERE body_id = ? ORDER BY created_at DESC'
  ).all(body.id);

  const updates = rawUpdates.map(u => ({
    ...u,
    is_mandatory: !!u.is_mandatory,
    day_name: dayNameFor(u.event_date),
    time_range: formatTimeRange(u.time_start, u.time_end)
  }));

  const resources = db.prepare('SELECT id, title, url FROM resources WHERE body_id = ?').all(body.id);
  const tags = [...new Set(updates.map(u => u.tag).filter(t => t !== 'none'))];
  const latest = updates[0] ? updates[0].title : 'No updates yet.';
  const has_mandatory = updates.some(u => u.is_mandatory);

  return { ...body, tags, latest_update: latest, has_mandatory, updates, resources };
}

// ---------- Bodies ----------
app.get('/api/bodies', (req, res) => {
  const { category, tag, search } = req.query;
  let bodies = db.prepare('SELECT * FROM bodies ORDER BY name').all();
  bodies = bodies.map(attachTagsAndRollup);

  if (category) bodies = bodies.filter(b => b.category === category);
  if (tag) bodies = bodies.filter(b => b.tags.includes(tag));
  if (search) {
    const q = search.toLowerCase();
    bodies = bodies.filter(b => b.name.toLowerCase().includes(q));
  }
  res.json(bodies);
});

app.get('/api/bodies/:id', (req, res) => {
  const body = db.prepare('SELECT * FROM bodies WHERE id = ?').get(req.params.id);
  if (!body) return res.status(404).json({ error: 'Body not found' });
  res.json(attachTagsAndRollup(body));
});

app.post('/api/bodies', (req, res) => {
  const { name, category, description, poc_name, poc_contact } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'name and category are required' });
  const info = db.prepare(`INSERT INTO bodies (name, category, description, poc_name, poc_contact) VALUES (?,?,?,?,?)`)
    .run(name, category, description || '', poc_name || '', poc_contact || '');
  res.status(201).json({ id: info.lastInsertRowid });
});

// ---------- Updates (this is the "admin posts an update" flow) ----------
app.post('/api/bodies/:id/updates', (req, res) => {
  const { title, tag, event_date, time_start, time_end, is_mandatory } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const validTags = ['recruiting', 'event', 'deadline', 'none'];
  const finalTag = validTags.includes(tag) ? tag : 'none';
  const info = db.prepare(
    'INSERT INTO updates (body_id, title, tag, event_date, time_start, time_end, is_mandatory) VALUES (?,?,?,?,?,?,?)'
  ).run(
    req.params.id,
    title,
    finalTag,
    event_date || null,
    time_start || null,
    time_end || null,
    is_mandatory ? 1 : 0
  );
  res.status(201).json({ id: info.lastInsertRowid });
});

// ---------- Upcoming Events — every dated update, across every body, in chronological order ----------
app.get('/api/events/upcoming', (req, res) => {
  const { includePast } = req.query;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, local server date

  let sql = `
    SELECT u.id, u.title, u.tag, u.event_date, u.time_start, u.time_end, u.is_mandatory,
           b.id AS body_id, b.name AS body_name, b.category AS body_category
    FROM updates u
    JOIN bodies b ON b.id = u.body_id
    WHERE u.event_date IS NOT NULL
  `;
  const params = [];
  if (!includePast) {
    sql += ' AND u.event_date >= ?';
    params.push(today);
  }
  sql += ' ORDER BY u.event_date ASC, (u.time_start IS NULL), u.time_start ASC';

  const rows = db.prepare(sql).all(...params);
  const events = rows.map(r => ({
    id: r.id,
    title: r.title,
    tag: r.tag,
    event_date: r.event_date,
    day_name: dayNameFor(r.event_date),
    time_start: r.time_start,
    time_end: r.time_end,
    time_range: formatTimeRange(r.time_start, r.time_end),
    is_mandatory: !!r.is_mandatory,
    body_id: r.body_id,
    body_name: r.body_name,
    body_category: r.body_category
  }));
  res.json(events);
});

// ---------- Resources ----------
app.post('/api/bodies/:id/resources', (req, res) => {
  const { title, url } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const info = db.prepare('INSERT INTO resources (body_id, title, url) VALUES (?,?,?)').run(req.params.id, title, url || '#');
  res.status(201).json({ id: info.lastInsertRowid });
});

// ---------- Queries (student Q&A per body) ----------
app.get('/api/bodies/:id/queries', (req, res) => {
  const queries = db.prepare('SELECT * FROM queries WHERE body_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(queries);
});

app.post('/api/bodies/:id/queries', (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'question is required' });
  const info = db.prepare('INSERT INTO queries (body_id, question) VALUES (?,?)').run(req.params.id, question);
  res.status(201).json({ id: info.lastInsertRowid });
});

app.patch('/api/queries/:id/answer', (req, res) => {
  const { answer } = req.body;
  if (!answer) return res.status(400).json({ error: 'answer is required' });
  db.prepare('UPDATE queries SET answer = ? WHERE id = ?').run(answer, req.params.id);
  res.json({ ok: true });
});

// ---------- Stats (for the dashboard numbers) ----------
app.get('/api/stats', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const total = db.prepare('SELECT COUNT(*) AS c FROM bodies').get().c;
  const recruiting = db.prepare(`SELECT COUNT(DISTINCT body_id) AS c FROM updates WHERE tag = 'recruiting'`).get().c;
  const deadlines = db.prepare(`SELECT COUNT(DISTINCT body_id) AS c FROM updates WHERE tag = 'deadline'`).get().c;
  const mandatory = db.prepare(`SELECT COUNT(*) AS c FROM updates WHERE is_mandatory = 1 AND (event_date IS NULL OR event_date >= ?)`).get(today).c;
  res.json({ total, recruiting, deadlines, mandatory });
});

app.listen(PORT, () => {
  console.log(`CCC Portal server running at http://localhost:${PORT}`);
});
