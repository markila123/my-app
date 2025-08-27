// Simple async storage wrapper. Prefers AsyncStorage if available
// and falls back to an in-memory map so the app still runs in dev.
// For persistence between sessions, ensure @react-native-async-storage/async-storage
// is installed (added in package.json).

let memoryStore = new Map<string, string>();

type StorageDriver = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

let driver: StorageDriver | null = null;

async function loadDriver(): Promise<StorageDriver> {
  if (driver) return driver;
  try {
    // Dynamically import to avoid crashes on unsupported platforms
    const mod = await import("@react-native-async-storage/async-storage");
    const AsyncStorage = mod.default;
    driver = {
      getItem: (k) => AsyncStorage.getItem(k),
      setItem: (k, v) => AsyncStorage.setItem(k, v),
      removeItem: (k) => AsyncStorage.removeItem(k),
    };
  } catch (_e) {
    // Fallback to in-memory store (not persisted across app restarts)
    driver = {
      async getItem(k) {
        return memoryStore.has(k) ? (memoryStore.get(k) as string) : null;
      },
      async setItem(k, v) {
        memoryStore.set(k, v);
      },
      async removeItem(k) {
        memoryStore.delete(k);
      },
    };
  }
  return driver!;
}

export async function storageGet(key: string): Promise<string | null> {
  const d = await loadDriver();
  return d.getItem(key);
}

export async function storageSet(key: string, value: string): Promise<void> {
  const d = await loadDriver();
  return d.setItem(key, value);
}

export async function storageRemove(key: string): Promise<void> {
  const d = await loadDriver();
  return d.removeItem(key);
}

export const STORAGE_KEYS = {
  token: "auth_token",
  email: "auth_email",
  name: "auth_name", // Added for persisting user name
};
