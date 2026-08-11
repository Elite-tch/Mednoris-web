"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Loader2, Lock, User, LogIn } from "lucide-react";
import { deriveKEK, unwrapKey, base64ToArrayBuffer } from "@/lib/crypto";
import { useCrypto } from "@/contexts/CryptoContext";

export default function StaffLoginModal({ slug, hospitalName }: { slug: string; hospitalName: string }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { setDek } = useCrypto();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const email = `${username.toLowerCase().trim()}@${slug}.mednoris.local`;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ── Step 1: Fetch the staff doc ──────────────────────────────────────
      const staffDocRef = doc(db, "hospital_staff", user.uid);
      const staffDoc = await getDoc(staffDocRef);

      if (!staffDoc.exists()) {
        await signOut(auth);
        setError("This username is not registered in our system.");
        setLoading(false);
        return;
      }

      const staffData = staffDoc.data();

      // ── Step 2: Validate hospital association ────────────────────────────
      if (staffData.hospitalSlug !== slug) {
        await signOut(auth);
        setError("This username is not associated with this hospital. Please check your login link or contact your administrator.");
        setLoading(false);
        return;
      }

      // ── Step 3: Validate role (admins/owners must use Admin Portal) ──────
      if (staffData.role === "admin" || staffData.role === "owner") {
        await signOut(auth);
        setError("Admin accounts cannot log in here. Please use the Admin Portal instead.");
        setLoading(false);
        return;
      }

      // ── Step 4: Check account is active ─────────────────────────────────
      if (staffData.active === false) {
        await signOut(auth);
        setError("Your account has been deactivated. Please contact your Hospital Administrator.");
        setLoading(false);
        return;
      }

      // ── Step 5: Decrypt the DEK ──────────────────────────────────────────
      try {
        const kek = await deriveKEK(password, base64ToArrayBuffer(staffData.salt));
        const unwrappedDek = await unwrapKey(staffData.wrappedDEK, staffData.wrapIV, kek);
        setDek(unwrappedDek);
      } catch (cryptoErr) {
        console.error("Crypto unwrap failed", cryptoErr);
        await signOut(auth);
        setError("Decryption failed. Please contact your Hospital Administrator.");
        setLoading(false);
        return;
      }

      // All checks passed — layout's onAuthStateChanged will now hide this modal.
    } catch (err: any) {
      if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection and try again.");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid username or password. Please try again.");
      } else {
        setError(err.message || "Failed to sign in. Please check your credentials.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh] relative"
      >
        <div className="p-8 text-center border-b border-gray-100">
          
          <h2 className="text-2xl font-black text-gray-900">Staff Portal</h2>
          <p className="text-gray-500 mt-2 text-sm">Sign in to your {hospitalName || "hospital"} dashboard.</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-5 bg-gray-50">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-3.5 text-gray-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. juliet323"
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-3.5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors disabled:opacity-70 text-sm mt-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            {loading ? "Signing in..." : "Sign In securely"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
