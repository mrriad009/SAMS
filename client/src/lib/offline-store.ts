const DB_NAME = 'sams-offline';
const DB_VERSION = 1;

export interface PendingAttendance {
  localId: string;
  sessionId: string | null;
  courseId: string;
  date: string;
  records: Array<{ studentId: string; status: string }>;
  savedAt: string;
}

export interface CachedRoster {
  key: string;
  sessionId: string | null;
  courseId: string;
  date: string;
  section: string;
  sheet: Array<{
    studentDbId: string;
    studentId: string;
    name: string;
    section: string;
    attendance: { status: string; markSource?: string } | null;
  }>;
  savedAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('queue')) db.createObjectStore('queue', { keyPath: 'localId' });
      if (!db.objectStoreNames.contains('rosters')) db.createObjectStore('rosters', { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function rosterKey(courseId: string, date: string, section: string) {
  return `${courseId}|${date}|${section}`;
}

export async function cacheRoster(roster: Omit<CachedRoster, 'key' | 'savedAt'> & { savedAt?: string }) {
  const db = await openDb();
  const record: CachedRoster = {
    ...roster,
    key: rosterKey(roster.courseId, roster.date, roster.section),
    savedAt: roster.savedAt || new Date().toISOString(),
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('rosters', 'readwrite');
    tx.objectStore('rosters').put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function readRoster(courseId: string, date: string, section: string) {
  const db = await openDb();
  const key = rosterKey(courseId, date, section);
  const record = await new Promise<CachedRoster | undefined>((resolve, reject) => {
    const tx = db.transaction('rosters', 'readonly');
    const request = tx.objectStore('rosters').get(key);
    request.onsuccess = () => resolve(request.result as CachedRoster | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return record;
}

export async function enqueueAttendance(item: Omit<PendingAttendance, 'localId' | 'savedAt'>) {
  const db = await openDb();
  const record: PendingAttendance = {
    ...item,
    localId: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('queue', 'readwrite');
    tx.objectStore('queue').put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return record;
}

export async function listPendingAttendance() {
  const db = await openDb();
  const rows = await new Promise<PendingAttendance[]>((resolve, reject) => {
    const tx = db.transaction('queue', 'readonly');
    const request = tx.objectStore('queue').getAll();
    request.onsuccess = () => resolve((request.result as PendingAttendance[]) || []);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return rows.sort((a, b) => a.savedAt.localeCompare(b.savedAt));
}

export async function removePendingAttendance(localId: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('queue', 'readwrite');
    tx.objectStore('queue').delete(localId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
