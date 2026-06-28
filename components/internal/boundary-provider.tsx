'use client';

import { createContext, useContext, useSyncExternalStore } from 'react';

export type BoundaryMode = 'off' | 'on';

type BoundaryContextType = {
  mode: BoundaryMode;
  toggleMode: () => void;
};

const BoundaryContext = createContext<BoundaryContextType | null>(null);

const BOUNDARY_MODE_KEY = 'boundaryMode';

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === BOUNDARY_MODE_KEY) cb();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}
function getSnapshot(): BoundaryMode {
  return localStorage.getItem(BOUNDARY_MODE_KEY) === 'on' ? 'on' : 'off';
}
function getServerSnapshot(): BoundaryMode {
  return 'off';
}

export function BoundaryProvider({ children }: { children: React.ReactNode }) {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleMode = () => {
    const next = mode === 'off' ? 'on' : 'off';
    localStorage.setItem(BOUNDARY_MODE_KEY, next);
    listeners.forEach(l => l());
  };

  return <BoundaryContext.Provider value={{ mode, toggleMode }}>{children}</BoundaryContext.Provider>;
}

export function useBoundaryMode() {
  const ctx = useContext(BoundaryContext);
  if (!ctx) throw new Error('useBoundaryMode must be used within BoundaryProvider');
  return ctx;
}
