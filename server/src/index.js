import express from 'express';
import cors from 'cors';
import { PORT } from './config.js';
import { authenticate, comparePassword, generateToken, hashPassword } from './auth.js';
import { lab2Sort, normalizeArrayInput } from './sorting.js';
import { createUser, findUserByUsername, getUserProfile } from './services/userService.js';
import { countArrays, deleteArray, listArrays, saveArrayRecord } from './services/arrayService.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

function sanitizeUsername(username = '') {
  return String(username).trim().toLowerCase();
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const rawUsername = req.body?.username || '';
    const username = sanitizeUsername(rawUsername);
    const password = req.body?.password || '';

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const existing = findUserByUsername(username);
    if (existing) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const passwordHash = await hashPassword(password);
    const user = createUser(username, passwordHash);
    const token = generateToken(user);

    return res.status(201).json({ token, user });
  } catch (error) {
    console.error('register error', error);
    return res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const username = sanitizeUsername(req.body?.username || '');
    const password = req.body?.password || '';

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    return res.json({ token, user: { id: user.id, username: user.username, created_at: user.created_at } });
  } catch (error) {
    console.error('login error', error);
    return res.status(500).json({ message: 'Login failed' });
  }
});

app.get('/api/profile', authenticate, (req, res) => {
  const user = getUserProfile(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  return res.json({ user });
});

app.post('/api/arrays/process', authenticate, (req, res) => {
  try {
    const numbers = normalizeArrayInput(req.body?.numbers || []);
    const label = (req.body?.label || '').toString().slice(0, 120);
    const saveOriginalFlag = req.body?.saveOriginal ?? true;
    const saveSortedFlag = req.body?.saveSorted ?? true;
    const saveOriginal = Boolean(saveOriginalFlag);
    const saveSorted = Boolean(saveSortedFlag);

    if (numbers.length === 0) {
      return res.status(400).json({ message: 'Provide at least one number' });
    }

    const sorted = lab2Sort(numbers);

    let savedRecord = null;
    if (saveOriginal || saveSorted) {
      savedRecord = saveArrayRecord({
        userId: req.user.id,
        label,
        original: numbers,
        sorted,
        saveOriginal,
        saveSorted,
      });
    }

    return res.json({ sorted, saved: savedRecord });
  } catch (error) {
    console.error('process array error', error);
    return res.status(400).json({ message: error.message || 'Failed to process array' });
  }
});

app.post('/api/arrays/save', authenticate, (req, res) => {
  try {
    const original = normalizeArrayInput(req.body?.original || []);
    const sorted = normalizeArrayInput(req.body?.sorted || []);
    const label = (req.body?.label || '').toString().slice(0, 120);
    const saveOriginal = Boolean(req.body?.saveOriginal ?? true);
    const saveSorted = Boolean(req.body?.saveSorted ?? true);

    if (!saveOriginal && !saveSorted) {
      return res.status(400).json({ message: 'Choose at least one array to save' });
    }

    const saved = saveArrayRecord({
      userId: req.user.id,
      label,
      original,
      sorted,
      saveOriginal,
      saveSorted,
    });
    return res.status(201).json({ id: saved.id });
  } catch (error) {
    console.error('save array error', error);
    return res.status(400).json({ message: error.message || 'Failed to save array' });
  }
});

app.get('/api/arrays', authenticate, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const offset = (page - 1) * limit;
  const rows = listArrays(req.user.id, { limit, offset });
  const total = countArrays(req.user.id);
  return res.json({ items: rows, total, page, limit });
});

app.delete('/api/arrays/:id', authenticate, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: 'Invalid id' });
  }
  const removed = deleteArray(req.user.id, id);
  if (!removed) {
    return res.status(404).json({ message: 'Array not found' });
  }
  return res.json({ success: true });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
