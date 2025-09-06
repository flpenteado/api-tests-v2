'use client';

import React from 'react';
import { useStore } from 'zustand';

import { createAppStore, type AppState, type AppActions, type AppStore } from './appStore';

const AppStoreContext = React.createContext<AppStore | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = React.useRef<AppStore>(createAppStore());
  return (
    <AppStoreContext.Provider value={storeRef.current}>{children}</AppStoreContext.Provider>
  );
}

export function useAppStore<T>(selector: (state: AppState & AppActions) => T): T {
  const store = React.useContext(AppStoreContext);
  if (!store) throw new Error('useAppStore must be used within StoreProvider');
  return useStore(store, selector);
}
