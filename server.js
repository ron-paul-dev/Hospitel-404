// ═══════════════════════════════════════════════════════════
//  HOSPITAL 404 — UNIFIED BACKEND SERVER
//  npm install
//  npm start   (config via environment variables — see .env.example)
// ═══════════════════════════════════════════════════════════

const express    = require('express');
const mysql      = require('mysql2/promise');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const cors       = require('cors');
const path       = require('path');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const PORT       = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── Static files ────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'HTML')));
app.use('/CSS',   express.static(path.join(__dirname, 'CSS')));
app.use('/JS',    express.static(path.join(__dirname, 'JS')));
app.use('/FILES', express.static(path.join(__dirname, 'FILES')));

// ── MySQL Pool ───────────────────────────────────────────────
const db = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'hospital404',
  waitForConnections: true,
  connectionLimit: 10
});

// ── Auth middleware ──────────────────────────────────────────
function auth(roles = []) {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (roles.length && !roles.includes(decoded.role))
        return res.status(403).json({ error: 'Forbidden' });
      req.user = decoded;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}

// ════════════════════════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════════════════════════

// REGISTER — Patient
app.post('/api/auth/register/patient', async (req, res) => {
  const { name, email, password, age, gender, dob, phone, blood_group } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [u] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)',
      [name, email, hash, 'patient']
    );
    await db.query(
      'INSERT INTO patients (user_id, name, age, gender, dob, phone, blood_group) VALUES (?,?,?,?,?,?,?)',
      [u.insertId, name, age || null, gender || null, dob || null, phone || null, blood_group || null]
    );
    res.json({ message: 'Patient registered successfully' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already registered' });
    res.status(500).json({ error: e.message });
  }
});

// REGISTER — Clinician
app.post('/api/auth/register/clinician', async (req, res) => {
  const { name, email, password, specialization, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [u] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)',
      [name, email, hash, 'clinician']
    );
    await db.query(
      'INSERT INTO doctors (user_id, name, specialization, email, phone) VALUES (?,?,?,?,?)',
      [u.insertId, name, specialization || null, email, phone || null]
    );
    res.json({ message: 'Clinician registered successfully' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already registered' });
    res.status(500).json({ error: e.message });
  }
});

// LOGIN — All roles
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
  try {
    const [[user]] = await db.query('SELECT * FROM users WHERE email=? AND status="Active"', [email]);
    if (!user) return res.status(401).json({ error: 'User not found or disabled' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Wrong password' });
    const token = jwt.sign({ id: user.id, name: user.name, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, role: user.role, name: user.name });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ════════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ════════════════════════════════════════════════════════════

app.get('/api/stats', auth(['admin']), async (req, res) => {
  try {
    const [[{ total }]]     = await db.query('SELECT COUNT(*) AS total FROM users');
    const [[{ patients }]]  = await db.query('SELECT COUNT(*) AS patients FROM users WHERE role="patient"');
    const [[{ clinicians }]]= await db.query('SELECT COUNT(*) AS clinicians FROM users WHERE role="clinician"');
    res.json({ total, patients, clinicians });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/users', auth(['admin']), async (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT id, name, email, role, status FROM users';
  const params = [];
  if (search) { sql += ' WHERE name LIKE ? OR role LIKE ? OR id LIKE ?'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  const [rows] = await db.query(sql, params);
  res.json(rows);
});

app.post('/api/users', auth(['admin']), async (req, res) => {
  const { name, email, password, role, status } = req.body;
  if (!password) return res.status(400).json({ error: 'Password is required' });
  const hash = await bcrypt.hash(password, 10);
  try {
    const [r] = await db.query('INSERT INTO users (name,email,password,role,status) VALUES (?,?,?,?,?)', [name, email, hash, role, status || 'Active']);
    res.json({ id: r.insertId, message: 'User created successfully' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/users/:id', auth(['admin']), async (req, res) => {
  const { name, role, status } = req.body;
  await db.query('UPDATE users SET name=?,role=?,status=? WHERE id=?', [name, role, status, req.params.id]);
  res.json({ message: 'Updated' });
});

app.patch('/api/users/:id/disable', auth(['admin']), async (req, res) => {
  const [[u]] = await db.query('SELECT status FROM users WHERE id=?', [req.params.id]);
  const newStatus = u.status === 'Active' ? 'Disabled' : 'Active';
  await db.query('UPDATE users SET status=? WHERE id=?', [newStatus, req.params.id]);
  res.json({ status: newStatus });
});

app.delete('/api/users/:id', auth(['admin']), async (req, res) => {
  await db.query('DELETE FROM users WHERE id=?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

app.get('/api/system', auth(['admin']), async (req, res) => {
  const uptimeSeconds = Math.floor(process.uptime());
  const hours   = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const uptime  = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  let dbStatus = 'Normal';
  try { await db.query('SELECT 1'); } catch { dbStatus = 'Error'; }
  const lastBackup = new Date(Date.now() - 2*60*60*1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  res.json({
    cpu: Math.floor(Math.random()*40+30),
    ram: Math.floor(Math.random()*30+40),
    storage: Math.floor(Math.random()*20+60),
    uptime,
    serverStatus: 'Online',
    dbStatus,
    lastBackup
  });
});

// ════════════════════════════════════════════════════════════
//  CLINICIAN ROUTES
// ════════════════════════════════════════════════════════════

app.get('/api/appointments', auth(['clinician','admin']), async (req, res) => {
  const [rows] = await db.query(`
    SELECT a.appointment_id, a.appointment_date, a.status,
           p.name AS patient_name, p.age, p.gender,
           d.name AS doctor_name, t.treatment_name
    FROM appointments a
    JOIN patients p   ON a.patient_id=p.patient_id
    JOIN doctors d    ON a.doctor_id=d.doctor_id
    LEFT JOIN treatments t ON a.treatment_id=t.treatment_id
  `);
  res.json(rows);
});

app.get('/api/patients', auth(['clinician','admin']), async (req, res) => {
  const [rows] = await db.query('SELECT * FROM patients');
  res.json(rows);
});

app.get('/api/doctors', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM doctors');
  res.json(rows);
});

app.get('/api/treatments', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM treatments ORDER BY treatment_name');
  res.json(rows);
});

app.get('/api/feedback', auth(['clinician','admin']), async (req, res) => {
  const [rows] = await db.query(`
    SELECT p.name AS patient_name, pf.rating, pf.comments, pf.created_at
    FROM patient_feedback pf
    JOIN patients p ON pf.patient_id=p.patient_id
  `);
  res.json(rows);
});

// Clinician comments
app.get('/api/comments/:patientRef', auth(['clinician','patient','admin']), async (req, res) => {
  const { category, limit=100 } = req.query;
  let sql = 'SELECT * FROM clinician_comments WHERE patient_ref=?';
  const params = [req.params.patientRef];
  if (category) { sql += ' AND category=?'; params.push(category); }
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(parseInt(limit));
  const [rows] = await db.query(sql, params);
  res.json({ comments: rows });
});

app.post('/api/comments/:patientRef', auth(['clinician']), async (req, res) => {
  const { author, category, priority, comment_text } = req.body;
  const [r] = await db.query(
    'INSERT INTO clinician_comments (patient_ref,author,category,priority,comment_text) VALUES (?,?,?,?,?)',
    [req.params.patientRef, author, category||'General', priority||'Normal', comment_text]
  );
  res.json({ id: r.insertId });
});

app.delete('/api/comments/:patientRef/:id', auth(['clinician','admin']), async (req, res) => {
  await db.query('DELETE FROM clinician_comments WHERE id=? AND patient_ref=?', [req.params.id, req.params.patientRef]);
  res.json({ deleted: true });
});

app.delete('/api/comments/:patientRef', auth(['clinician','admin']), async (req, res) => {
  await db.query('DELETE FROM clinician_comments WHERE patient_ref=?', [req.params.patientRef]);
  res.json({ deleted: true });
});

// ════════════════════════════════════════════════════════════
//  PATIENT ROUTES
// ════════════════════════════════════════════════════════════

app.get('/api/my/appointments', auth(['patient']), async (req, res) => {
  const [[p]] = await db.query('SELECT patient_id FROM patients WHERE user_id=?', [req.user.id]);
  if (!p) return res.json([]);
  const [rows] = await db.query(`
    SELECT a.*, d.name AS doctor_name, t.treatment_name
    FROM appointments a
    JOIN doctors d    ON a.doctor_id=d.doctor_id
    LEFT JOIN treatments t ON a.treatment_id=t.treatment_id
    WHERE a.patient_id=? ORDER BY a.appointment_date DESC
  `, [p.patient_id]);
  res.json(rows);
});

app.get('/api/my/vitals', auth(['patient']), async (req, res) => {
  const [[p]] = await db.query('SELECT patient_id FROM patients WHERE user_id=?', [req.user.id]);
  if (!p) return res.json([]);
  const [rows] = await db.query('SELECT * FROM patient_vitals WHERE patient_id=? ORDER BY recorded_at DESC LIMIT 10', [p.patient_id]);
  res.json(rows);
});

app.get('/api/my/comments', auth(['patient']), async (req, res) => {
  const [[p]] = await db.query('SELECT patient_id FROM patients WHERE user_id=?', [req.user.id]);
  if (!p) return res.json({ comments: [] });
  const [rows] = await db.query('SELECT * FROM clinician_comments WHERE patient_ref=? ORDER BY created_at DESC', [`PT-${p.patient_id}`]);
  res.json({ comments: rows });
});

app.post('/api/my/feedback', auth(['patient']), async (req, res) => {
  const { doctor_id, appointment_id, rating, comments } = req.body;
  const [[p]] = await db.query('SELECT patient_id FROM patients WHERE user_id=?', [req.user.id]);
  if (!p) return res.status(404).json({ error: 'Patient not found' });
  await db.query('INSERT INTO patient_feedback (patient_id,doctor_id,appointment_id,rating,comments) VALUES (?,?,?,?,?)',
    [p.patient_id, doctor_id, appointment_id||null, rating, comments]);
  res.json({ message: 'Feedback submitted' });
});

// ── HTML page routes ─────────────────────────────────────────
// ════════════════════════════════════════════════════════════
//  FEEDBACK + REPLIES ROUTES
// ════════════════════════════════════════════════════════════

// GET all feedback with replies (for clinician)
app.get('/api/feedback/all', auth(['clinician','admin']), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT pf.feedback_id, pf.rating, pf.comments, pf.created_at,
             p.name AS patient_name,
             d.name AS doctor_name
      FROM patient_feedback pf
      JOIN patients p ON pf.patient_id = p.patient_id
      JOIN doctors d  ON pf.doctor_id  = d.doctor_id
      ORDER BY pf.created_at DESC
    `);
    // Get replies for each feedback
    for (const row of rows) {
      const [replies] = await db.query(
        'SELECT * FROM feedback_replies WHERE feedback_id=? ORDER BY created_at ASC',
        [row.feedback_id]
      );
      row.replies = replies;
    }
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST reply to feedback (clinician)
app.post('/api/feedback/:id/reply', auth(['clinician']), async (req, res) => {
  const { reply_text } = req.body;
  if (!reply_text) return res.status(400).json({ error: 'Reply text required' });
  try {
    await db.query(
      'INSERT INTO feedback_replies (feedback_id, clinician_name, reply_text) VALUES (?,?,?)',
      [req.params.id, req.user.name, reply_text]
    );
    res.json({ message: 'Reply sent' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET patient's own feedback + replies
app.get('/api/my/feedback', auth(['patient']), async (req, res) => {
  try {
    const [[p]] = await db.query('SELECT patient_id FROM patients WHERE user_id=?', [req.user.id]);
    if (!p) return res.json([]);
    const [rows] = await db.query(`
      SELECT pf.feedback_id, pf.rating, pf.comments, pf.created_at,
             d.name AS doctor_name
      FROM patient_feedback pf
      JOIN doctors d ON pf.doctor_id = d.doctor_id
      WHERE pf.patient_id = ?
      ORDER BY pf.created_at DESC
    `, [p.patient_id]);
    for (const row of rows) {
      const [replies] = await db.query(
        'SELECT * FROM feedback_replies WHERE feedback_id=? ORDER BY created_at ASC',
        [row.feedback_id]
      );
      row.replies = replies;
    }
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════
//  APPOINTMENT & NOTES — CLINICIAN ADD
// ════════════════════════════════════════════════════════════

// POST — Clinician adds appointment for patient
app.post('/api/appointments/add', auth(['clinician','admin']), async (req, res) => {
  const { patient_id, doctor_id, treatment_id, appointment_date, status, notes } = req.body;
  if (!patient_id || !doctor_id || !appointment_date) return res.status(400).json({ error: 'Missing required fields' });
  try {
    const [r] = await db.query(
      'INSERT INTO appointments (patient_id, doctor_id, treatment_id, appointment_date, status, notes) VALUES (?,?,?,?,?,?)',
      [patient_id, doctor_id, treatment_id||null, appointment_date, status||'Scheduled', notes||null]
    );
    res.json({ id: r.insertId, message: 'Appointment added successfully' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET all patients (for clinician dropdown)
app.get('/api/patients/list', auth(['clinician','admin']), async (req, res) => {
  const [rows] = await db.query('SELECT patient_id, name FROM patients ORDER BY name');
  res.json(rows);
});

// GET all treatments (for dropdown)
app.get('/api/treatments', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM treatments ORDER BY treatment_name');
  res.json(rows);
});

// POST — Clinician adds note for patient
app.post('/api/notes/add', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  let authorName = 'Clinician';
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, JWT_SECRET);
      authorName = decoded.name || 'Clinician';
    } catch(e) {}
  }
  const { patient_ref, category, priority, comment_text } = req.body;
  if (!patient_ref || !comment_text) return res.status(400).json({ error: 'Missing fields' });
  try {
    await db.query(
      'INSERT INTO clinician_comments (patient_ref, author, category, priority, comment_text) VALUES (?,?,?,?,?)',
      [patient_ref, authorName, category||'General', priority||'Normal', comment_text]
    );
    res.json({ message: 'Note added successfully' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── HTML page routes ─────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'HTML', 'index.html')));
app.get('/login',              (req, res) => res.sendFile(path.join(__dirname, 'HTML', 'login.html')));
app.get('/register',           (req, res) => res.sendFile(path.join(__dirname, 'HTML', 'register.html')));
app.get('/patient-dashboard',  (req, res) => res.sendFile(path.join(__dirname, 'HTML', 'patient-dashboard.html')));
app.get('/clinician-dashboard',(req, res) => res.sendFile(path.join(__dirname, 'HTML', 'Clinician_dashboard.html')));
app.get('/admin-dashboard',    (req, res) => res.sendFile(path.join(__dirname, 'HTML', 'admin.html')));
app.get('/about',   (req, res) => res.sendFile(path.join(__dirname, 'HTML', 'about-us.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'HTML', 'contact.html')));

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`🏥 Hospital 404 server running at http://localhost:${PORT}`));