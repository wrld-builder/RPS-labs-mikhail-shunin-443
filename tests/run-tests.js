import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'integration.db');
fs.mkdirSync(dataDir, { recursive: true });
if (fs.existsSync(dbPath)) {
  fs.rmSync(dbPath);
}
process.env.DB_PATH = dbPath;
process.env.JWT_SECRET = 'tests-only-secret';

const [{ lab2Sort }, arrayService, userService, { hashPassword }] = await Promise.all([
  import('../server/src/sorting.js'),
  import('../server/src/services/arrayService.js'),
  import('../server/src/services/userService.js'),
  import('../server/src/auth.js'),
]);

const { bulkInsertArrays, clearArrays, getRandomArrays } = arrayService;
const { createUser, findUserByUsername } = userService;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildDataset(size, userId) {
  return Array.from({ length: size }, (_, index) => {
    const length = randomInt(10, 120);
    const lower = randomInt(-5000, -50);
    const upper = randomInt(50, 5000);
    const arr = Array.from({ length }, () => randomInt(lower, upper));
    return {
      userId,
      label: `Test ${size} #${index + 1}`,
      original: arr,
      sorted: lab2Sort(arr),
      saveOriginal: true,
      saveSorted: true,
    };
  });
}

async function ensureUser() {
  const username = 'perf-tester';
  const existing = findUserByUsername(username);
  if (existing) {
    return existing;
  }
  const hash = await hashPassword('test-password');
  return createUser(username, hash);
}

async function measure(action) {
  const start = performance.now();
  await action();
  const duration = performance.now() - start;
  return Number(duration.toFixed(2));
}

function logResult(prefix, payload) {
  const info = [
    `${prefix}`,
    `size=${payload.size}`,
    `success=${payload.success}`,
    `time=${payload.durationMs}ms`,
  ];
  if (payload.avgPerArrayMs) {
    info.push(`avg=${payload.avgPerArrayMs}ms`);
  }
  console.log(info.join(' | '));
}

async function main() {
  const results = {
    database: dbPath,
    createdAt: new Date().toISOString(),
    insert: [],
    fetchSort: [],
    cleanup: [],
  };
  const datasetSizes = [100, 1000, 10000];
  const user = await ensureUser();

  for (const size of datasetSizes) {
    clearArrays(user.id);
    try {
      const insertDuration = await measure(() => bulkInsertArrays(buildDataset(size, user.id)));
      const insertRecord = { size, durationMs: insertDuration, success: true };
      results.insert.push(insertRecord);
      logResult('Insert test', insertRecord);
    } catch (error) {
      const failRecord = { size, durationMs: 0, success: false, error: error.message };
      results.insert.push(failRecord);
      console.error('Insert failure', error);
      continue;
    }

    try {
      const sampleSize = Math.min(100, size);
      let sample = [];
      const duration = await measure(() => {
        sample = getRandomArrays(user.id, sampleSize);
        sample.forEach((record) => {
          lab2Sort(record.original_data);
        });
      });
      const fetchRecord = {
        size,
        durationMs: duration,
        avgPerArrayMs: sampleSize ? Number((duration / sampleSize).toFixed(4)) : 0,
        success: true,
      };
      results.fetchSort.push(fetchRecord);
      logResult('Fetch & sort', fetchRecord);
    } catch (error) {
      const failRecord = { size, durationMs: 0, success: false, error: error.message };
      results.fetchSort.push(failRecord);
      console.error('Fetch failure', error);
    }

    try {
      const cleanupDuration = await measure(() => clearArrays(user.id));
      const cleanupRecord = { size, durationMs: cleanupDuration, success: true };
      results.cleanup.push(cleanupRecord);
      logResult('Cleanup', cleanupRecord);
    } catch (error) {
      const failRecord = { size, durationMs: 0, success: false, error: error.message };
      results.cleanup.push(failRecord);
      console.error('Cleanup failure', error);
    }
  }

  fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`\nИтоги сохранены в ${path.join('tests', 'results.json')}`);
}

main().catch((error) => {
  console.error('Unexpected error during tests', error);
  process.exitCode = 1;
});
