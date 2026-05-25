// Native IndexedDB wrapper — no external lib required
// Session tokens stored here only — never localStorage, never cookies
const DB_NAME = "kisanSeva";
const DB_VERSION = 2;

export interface OfflineQueueItem {
  id?: number;
  method: string;
  args: unknown[];
  timestamp: number;
  retries: number;
}

export interface SessionData {
  token: string;
  principal: string;
  expiresAt: number;
}

export interface CacheEntry {
  key: string;
  data: unknown;
  cachedAt: number;
}

class KisanDB {
  private db: IDBDatabase | null = null;

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("offlineQueue")) {
          db.createObjectStore("offlineQueue", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
        if (!db.objectStoreNames.contains("session")) {
          db.createObjectStore("session", { keyPath: "token" });
        }
        if (!db.objectStoreNames.contains("cache")) {
          db.createObjectStore("cache", { keyPath: "key" });
        }
        if ((event as IDBVersionChangeEvent).oldVersion < 2) {
          db.createObjectStore("kisanCache", { keyPath: "fieldId" });
          db.createObjectStore("kisanNdviCache", { keyPath: "fieldId" });
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async enqueue(item: Omit<OfflineQueueItem, "id">): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("offlineQueue", "readwrite");
      tx.objectStore("offlineQueue").add(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getQueue(): Promise<OfflineQueueItem[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("offlineQueue", "readonly");
      const req = tx.objectStore("offlineQueue").getAll();
      req.onsuccess = () => resolve(req.result as OfflineQueueItem[]);
      req.onerror = () => reject(req.error);
    });
  }

  async removeFromQueue(id: number): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("offlineQueue", "readwrite");
      tx.objectStore("offlineQueue").delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async saveSession(session: SessionData): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("session", "readwrite");
      const store = tx.objectStore("session");
      store.clear();
      store.add(session);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getSession(): Promise<SessionData | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("session", "readonly");
      const req = tx.objectStore("session").getAll();
      req.onsuccess = () => resolve((req.result as SessionData[])[0] ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  async clearSession(): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("session", "readwrite");
      tx.objectStore("session").clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async setCache(key: string, data: unknown): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("cache", "readwrite");
      tx.objectStore("cache").put({ key, data, cachedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCache(key: string): Promise<CacheEntry | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("cache", "readonly");
      const req = tx.objectStore("cache").get(key);
      req.onsuccess = () => resolve((req.result as CacheEntry) ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  async saveFieldPolygon(
    fieldId: string,
    coordinates: number[][],
    farmId: string,
  ): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("kisanCache", "readwrite");
      tx.objectStore("kisanCache").put({
        fieldId,
        coordinates,
        farmId,
        updatedAt: Date.now(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getFieldPolygon(fieldId: string): Promise<{
    fieldId: string;
    coordinates: number[][];
    farmId: string;
    updatedAt: number;
  } | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("kisanCache", "readonly");
      const req = tx.objectStore("kisanCache").get(fieldId);
      req.onsuccess = () =>
        resolve(
          (req.result as {
            fieldId: string;
            coordinates: number[][];
            farmId: string;
            updatedAt: number;
          }) ?? null,
        );
      req.onerror = () => reject(req.error);
    });
  }

  async saveNdviTile(
    fieldId: string,
    tileDataUrl: string,
    passDate: string,
    boundingBox: object,
  ): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("kisanNdviCache", "readwrite");
      tx.objectStore("kisanNdviCache").put({
        fieldId,
        tileDataUrl,
        passDate,
        fetchedAt: Date.now(),
        boundingBox,
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getNdviTile(fieldId: string): Promise<{
    fieldId: string;
    tileDataUrl: string;
    passDate: string;
    fetchedAt: number;
    boundingBox: object;
  } | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("kisanNdviCache", "readonly");
      const req = tx.objectStore("kisanNdviCache").get(fieldId);
      req.onsuccess = () =>
        resolve(
          (req.result as {
            fieldId: string;
            tileDataUrl: string;
            passDate: string;
            fetchedAt: number;
            boundingBox: object;
          }) ?? null,
        );
      req.onerror = () => reject(req.error);
    });
  }
}

export const kisanDB = new KisanDB();
