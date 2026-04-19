/**
 * IndexedDB-backed offline queue for responses drafted without connection.
 * Flushes when back online; also drains via background-sync 'wj-response-sync'.
 */

const DB_NAME = "wisdom-journal-offline";
const DB_VERSION = 1;
const STORE = "responses";

interface QueuedResponse {
  id: string;
  payload: {
    question_id: string | null;
    response_text: string;
    input_method: "text" | "voice" | "mixed";
    mood?: string | null;
    daily_item_id?: string | null;
  };
  created_at: number;
  attempts: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueResponse(payload: QueuedResponse["payload"]): Promise<string> {
  const db = await openDB();
  const id = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry: QueuedResponse = { id, payload, created_at: Date.now(), attempts: 0 };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function listQueued(): Promise<QueuedResponse[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as QueuedResponse[]);
    req.onerror = () => reject(req.error);
  });
}

export async function removeQueued(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function drainQueue(): Promise<{ sent: number; failed: number }> {
  if (!navigator.onLine) return { sent: 0, failed: 0 };
  const queued = await listQueued();
  let sent = 0;
  let failed = 0;
  for (const entry of queued) {
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry.payload),
      });
      if (res.ok) {
        await removeQueued(entry.id);
        sent++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }
  return { sent, failed };
}

export function requestBackgroundSync() {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then((reg: any) => {
      if (reg.sync?.register) reg.sync.register("wj-response-sync").catch(() => null);
    });
  }
}
