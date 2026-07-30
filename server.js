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
function attachTagsAndRollup(body) {
  const updates = db.prepare('SELECT id, title, tag, created_at FROM updates WHERE body_id = ? ORDER BY created_at DESC').all(body.id);
  const resources = db.prepare('SELECT id, title, url FROM resources WHERE body_id = ?').all(body.id);
  const tags = [...new Set(updates.map(u => u.tag).filter(t => t !== 'none'))];
  const latest = updates[0] ? updates[0].title : 'No updates yet.';
  return { ...body, tags, latest_update: latest, updates, resources };
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
  const { title, tag } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const validTags = ['recruiting', 'event', 'deadline', 'none'];
  const finalTag = validTags.includes(tag) ? tag : 'none';
  const info = db.prepare('INSERT INTO updates (body_id, title, tag) VALUES (?,?,?)').run(req.params.id, title, finalTag);
  res.status(201).json({ id: info.lastInsertRowid });
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
  const total = db.prepare('SELECT COUNT(*) AS c FROM bodies').get().c;
  const recruiting = db.prepare(`SELECT COUNT(DISTINCT body_id) AS c FROM updates WHERE tag = 'recruiting'`).get().c;
  const deadlines = db.prepare(`SELECT COUNT(DISTINCT body_id) AS c FROM updates WHERE tag = 'deadline'`).get().c;
  res.json({ total, recruiting, deadlines });
});

app.listen(PORT, () => {
  console.log(`CCC Portal server running at http://localhost:${PORT}`);
});
