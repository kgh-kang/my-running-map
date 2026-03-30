import { create } from 'zustand';
import type { RunningPath } from '../types/strava';

const CACHE_KEY = 'my-running-universe-paths';

function loadCachedPaths(): RunningPath[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveCachedPaths(paths: RunningPath[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(paths));
  } catch {
    // localStorage full or unavailable
  }
}

interface AppState {
  // Nike Auth
  nikeToken: string | null;
  setNikeToken: (token: string) => void;

  // Data
  paths: RunningPath[];
  setPaths: (paths: RunningPath[]) => void;
  isCached: boolean;
  isLoading: boolean;
  setLoading: (v: boolean) => void;

  // UI
  selectedPath: RunningPath | null;
  setSelectedPath: (path: RunningPath | null) => void;
}

const cachedPaths = loadCachedPaths();

export const useStore = create<AppState>((set) => ({
  nikeToken: null,
  setNikeToken: (nikeToken) => set({ nikeToken }),

  paths: cachedPaths,
  isCached: cachedPaths.length > 0,
  setPaths: (paths) => {
    saveCachedPaths(paths);
    set({ paths, isCached: false });
  },
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),

  selectedPath: null,
  setSelectedPath: (selectedPath) => set({ selectedPath }),
}));
