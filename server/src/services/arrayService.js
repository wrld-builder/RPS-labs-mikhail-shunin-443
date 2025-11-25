import db from '../db.js';

const insertArrayStmt = db.prepare(`
  INSERT INTO arrays (user_id, label, original_data, sorted_data, save_original, save_sorted)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const listArraysStmt = db.prepare(`
  SELECT id, label, original_data, sorted_data, save_original, save_sorted, created_at
  FROM arrays
  WHERE user_id = ?
  ORDER BY datetime(created_at) DESC
  LIMIT ? OFFSET ?
`);
const deleteArrayStmt = db.prepare('DELETE FROM arrays WHERE id = ? AND user_id = ?');
const countArraysStmt = db.prepare('SELECT COUNT(*) as total FROM arrays WHERE user_id = ?');
const randomArraysStmt = db.prepare(`
  SELECT id, label, original_data, sorted_data, save_original, save_sorted, created_at
  FROM arrays
  WHERE user_id = ?
  ORDER BY RANDOM()
  LIMIT ?
`);
const clearArraysStmt = db.prepare('DELETE FROM arrays WHERE user_id = ?');

export function saveArrayRecord({
  userId,
  label = '',
  original,
  sorted,
  saveOriginal = true,
  saveSorted = true,
}) {
  const result = insertArrayStmt.run(
    userId,
    label,
    JSON.stringify(original),
    JSON.stringify(sorted),
    saveOriginal ? 1 : 0,
    saveSorted ? 1 : 0,
  );
  return {
    id: result.lastInsertRowid,
    label,
    original_data: original,
    sorted_data: sorted,
    save_original: saveOriginal,
    save_sorted: saveSorted,
    created_at: new Date().toISOString(),
  };
}

export function listArrays(userId, { limit = 20, offset = 0 } = {}) {
  return listArraysStmt.all(userId, limit, offset).map((row) => ({
    ...row,
    original_data: JSON.parse(row.original_data),
    sorted_data: JSON.parse(row.sorted_data),
  }));
}

export function deleteArray(userId, id) {
  const result = deleteArrayStmt.run(id, userId);
  return result.changes > 0;
}

export function countArrays(userId) {
  return countArraysStmt.get(userId).total;
}

export function getRandomArrays(userId, count) {
  return randomArraysStmt.all(userId, count).map((row) => ({
    ...row,
    original_data: JSON.parse(row.original_data),
    sorted_data: JSON.parse(row.sorted_data),
  }));
}

export function clearArrays(userId) {
  const result = clearArraysStmt.run(userId);
  return result.changes;
}

const bulkInsertTransaction = db.transaction((records) => {
  records.forEach((record) => {
    insertArrayStmt.run(
      record.userId,
      record.label || '',
      JSON.stringify(record.original),
      JSON.stringify(record.sorted),
      record.saveOriginal ? 1 : 0,
      record.saveSorted ? 1 : 0,
    );
  });
});

export function bulkInsertArrays(records) {
  bulkInsertTransaction(records);
}
