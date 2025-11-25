import db from '../db.js';

const getUserByUsernameStmt = db.prepare('SELECT * FROM users WHERE username = ?');
const getUserByIdStmt = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?');
const insertUserStmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');

export function findUserByUsername(username) {
  return getUserByUsernameStmt.get(username);
}

export function getUserProfile(id) {
  return getUserByIdStmt.get(id);
}

export function createUser(username, passwordHash) {
  const result = insertUserStmt.run(username, passwordHash);
  return getUserProfile(result.lastInsertRowid);
}
