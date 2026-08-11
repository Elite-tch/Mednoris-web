"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface CryptoContextType {
  dek: CryptoKey | null;
  setDek: (key: CryptoKey | null) => void;
  isUnlocked: boolean;
}

const CryptoContext = createContext<CryptoContextType>({
  dek: null,
  setDek: () => {},
  isUnlocked: false,
});

export function CryptoProvider({ children }: { children: ReactNode }) {
  const [dek, setDekState] = useState<CryptoKey | null>(null);

  // We explicitly clear the DEK when it is unmounted or when set to null
  const setDek = (key: CryptoKey | null) => {
    setDekState(key);
  };

  return (
    <CryptoContext.Provider value={{ dek, setDek, isUnlocked: !!dek }}>
      {children}
    </CryptoContext.Provider>
  );
}

export function useCrypto() {
  const context = useContext(CryptoContext);
  if (!context) {
    throw new Error("useCrypto must be used within a CryptoProvider");
  }
  return context;
}
