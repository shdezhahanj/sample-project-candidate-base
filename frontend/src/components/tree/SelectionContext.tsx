'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';

export interface SelectionStore {
  subscribe: (listener: (id: string | null) => void) => () => void;
  getSelectedId: () => string | null;
  setSelectedId: (id: string | null) => void;
}

const SelectionContext = createContext<SelectionStore | null>(null);

export function useSelectionStore() {
  const store = useContext(SelectionContext);
  if (!store) {
    throw new Error('useSelectionStore must be used within SelectionProvider');
  }
  return store;
}

interface SelectionProviderProps {
  selectedNodeId: string | null;
  children: React.ReactNode;
}

export function SelectionProvider({ selectedNodeId, children }: SelectionProviderProps) {
  const storeRef = useRef<SelectionStore | null>(null);

  if (!storeRef.current) {
    const listeners = new Set<(id: string | null) => void>();
    let currentId = selectedNodeId;

    storeRef.current = {
      subscribe(l) {
        listeners.add(l);
        return () => listeners.delete(l);
      },
      getSelectedId() {
        return currentId;
      },
      setSelectedId(id) {
        if (currentId !== id) {
          currentId = id;
          listeners.forEach(l => l(id));
        }
      }
    };
  }

  // Keep the store in sync with the selectedNodeId prop
  useEffect(() => {
    storeRef.current?.setSelectedId(selectedNodeId);
  }, [selectedNodeId]);

  return (
    <SelectionContext.Provider value={storeRef.current}>
      {children}
    </SelectionContext.Provider>
  );
}
