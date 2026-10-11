"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<{ user: User; isNew: boolean }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authenticated: false,
  logout: async () => {},
  signInWithGoogle: async () => {
    throw new Error("AuthProvider not mounted");
  },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const signInWithGoogle = async (): Promise<{ user: User; isNew: boolean }> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    // Check if this is a brand-new Firebase user
    const isNew =
      result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
    return { user: result.user, isNew };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authenticated: !!user,
        logout,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
