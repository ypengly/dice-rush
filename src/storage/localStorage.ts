import type { GameState } from '../types/game';

/**
 * Storage abstraction. The store only talks to this interface, so a real backend
 * (REST, Supabase, IndexedDB…) can be dropped in later by implementing it.
 */
export interface StorageAdapter {
  load(): Partial<GameState> | null;
  save(state: GameState): void;
  clear(): void;
}

export const STORAGE_KEY = 'dice-rush:v1';

export const localStorageAdapter: StorageAdapter = {
  load() {
    try {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? (parsed as Partial<GameState>) : null;
    } catch {
      return null;
    }
  },
  save(state) {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable – the game keeps working in memory */
    }
  },
  clear() {
    try {
      globalThis.localStorage?.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },
};

/** In-memory adapter used by unit tests. */
export function createMemoryStorage(initial: Partial<GameState> | null = null): StorageAdapter & {
  snapshot(): Partial<GameState> | null;
} {
  let data: Partial<GameState> | null = initial ? structuredClone(initial) : null;
  return {
    load: () => (data ? structuredClone(data) : null),
    save: (s) => {
      data = structuredClone(s);
    },
    clear: () => {
      data = null;
    },
    snapshot: () => (data ? structuredClone(data) : null),
  };
}
