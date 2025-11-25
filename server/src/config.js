import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const ROOT_DIR = path.resolve(path.join(process.cwd()));

export const PORT = process.env.PORT || 4000;
export const JWT_SECRET = process.env.JWT_SECRET || 'lab3-secret';
export const DB_PATH = process.env.DB_PATH || path.join(ROOT_DIR, 'data', 'app.db');
export const TOKEN_EXPIRATION = '12h';
