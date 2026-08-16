"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { initCrypto } from "@/lib/crypto";

interface CryptoContextType {
  dek: Uint8Array | null;
  setDek: (key: Uint8Array | null) => void;
  isUnlocked: boolean;
}

const CryptoContext = createContext<CryptoContextType>({
  dek: null,
  setDek: () => {},
  isUnlocked: false,
});

export function CryptoProvider({ children }: { children: ReactNode }) {
  const [dek, setDek] = useState<Uint8Array | null>(null);

  // Initialize libsodium
  useEffect(() => {
    initCrypto().catch(console.error);
  }, []);

  // Auto-logout on 15 minutes of inactivity
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        console.log("Inactivity timeout reached. Logging out...");
        setDek(null);
        try {
          const { auth } = await import("@/lib/firebase");
          const { signOut } = await import("firebase/auth");
          if (auth.currentUser) {
            await signOut(auth);
            window.location.reload();
          }
        } catch (err) {
          console.error("Auto-logout failed:", err);
        }
      }, INACTIVITY_LIMIT);
    };

    // Listen to user activity to reset the timer
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer(); // start initially

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, []);

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
