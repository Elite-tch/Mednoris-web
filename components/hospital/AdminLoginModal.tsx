"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Loader2, Lock, Mail, LogIn, Building2, Key, AlertTriangle } from "lucide-react";
import { deriveKEK, unwrapKey, wrapKey, generateRandomBytes, arrayBufferToBase64, base64ToArrayBuffer } from "@/lib/crypto";
import { useCrypto } from "@/contexts/CryptoContext";

export default function AdminLoginModal({ slug, hospitalName }: { slug: string; hospitalName: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Recovery States
  const [needsRecovery, setNeedsRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [userDoc, setUserDoc] = useState<any>(null); // Store doc for recovery step

  const { setDek } = useCrypto();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const staffDocRef = doc(db, "hospital_staff", user.uid);
      const staffDoc = await getDoc(staffDocRef);
      
      if (!staffDoc.exists()) {
        await signOut(auth);
        throw new Error("Access denied. You are not registered as staff.");
      }

      const staffData = staffDoc.data();

      if (staffData.hospitalSlug !== slug) {
        await signOut(auth);
        throw new Error("Access denied. You do not belong to this hospital workspace.");
      }
      
      if (staffData.role !== "admin" && staffData.role !== "owner") {
        await signOut(auth);
        throw new Error("Access denied. This login is for Administrators only.");
      }

      // Cryptographic Unwrapping Phase
      try {
        const kek = await deriveKEK(password, base64ToArrayBuffer(staffData.salt));
        const unwrappedDek = await unwrapKey(staffData.wrappedDEK, staffData.wrapIV, kek);
        
        // Success! Inject into context
        setDek(unwrappedDek);
      } catch (cryptoErr) {
        console.error("Crypto unwrap failed", cryptoErr);
        // This happens if the password was changed via email reset. The new password doesn't match the old KEK.
        if (staffData.role === "owner" && staffData.recoveryWrappedDEK) {
          setNeedsRecovery(true);
          setUserDoc({ ref: staffDocRef, data: staffData });
          setLoading(false);
          return; // Stop here and wait for recovery code
        } else {
          await signOut(auth);
          throw new Error("Decryption failed. If your password was reset, please contact the Hospital Owner to issue a new account.");
        }
      }

      // Layout will detect auth change + DEK presence and remove this modal automatically
    } catch (err: any) {
      if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection and try again.");
      } else if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password.");
      } else {
        setError(err.message || "Failed to log in.");
      }
      setLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, ref } = userDoc;
      
      // 1. Unwrap DEK using the Recovery Code
      const recoveryKek = await deriveKEK(recoveryCode, base64ToArrayBuffer(data.recoverySalt));
      const unwrappedDek = await unwrapKey(data.recoveryWrappedDEK, data.recoveryWrapIV, recoveryKek);

      // 2. We now have the plaintext DEK. Re-wrap it with the NEW password they just logged in with.
      const newSalt = generateRandomBytes(16);
      const newKek = await deriveKEK(password, newSalt); // 'password' is still in state from the login form
      const { wrappedBase64: newWrappedDEK, ivBase64: newWrapIV } = await wrapKey(unwrappedDek, newKek);

      // 3. Update Firestore with the new primary wrap
      await updateDoc(ref, {
        salt: arrayBufferToBase64(newSalt),
        wrappedDEK: newWrappedDEK,
        wrapIV: newWrapIV
      });

      // 4. Inject DEK into context
      setDek(unwrappedDek);

    } catch (err: any) {
      console.error("Recovery failed", err);
      setError("Invalid recovery code. Data could not be restored.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo("Password reset email sent. After resetting, log in with your new password to trigger the recovery flow.");
    } catch (err: any) {
      if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection and try again.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // base64ToArrayBuffer is imported from @/lib/crypto

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh] relative"
      >
        <div className="p-8 text-center border-b border-gray-100">
          <h2 className="text-2xl font-black text-gray-900">
            {needsRecovery ? "Restore Encrypted Data" : "Admin Portal"}
          </h2>
          <p className="text-gray-500 mt-2 text-sm"><span className="font-black text-brand-primary">{hospitalName || "Hospital"}</span> Workspace</p>
        </div>
 
        {!needsRecovery ? (
          <form onSubmit={handleLogin} className="p-8 space-y-5 bg-gray-50">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-3.5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hospital.com"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                <button type="button" onClick={handleForgotPassword} className="text-xs font-bold text-brand-primary hover:underline">
                  Forgot Password?
                </button>
              </div>
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
            {info && <p className="text-sm text-brand-primary bg-brand-primary/10 p-3 rounded-xl border border-brand-primary/20">{info}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors disabled:opacity-70 text-sm mt-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
              {loading ? "Verifying..." : "Login to Workspace"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRecovery} className="p-8 space-y-5 bg-orange-50">
            <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-orange-200 shadow-sm">
              <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-orange-900 font-medium">
                Your password was reset, so your encryption key could not be unwrapped. Enter your offline Recovery Code to restore access and re-encrypt your data with your new password.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Master Recovery Code</label>
              <div className="relative">
                <Key size={16} className="absolute left-4 top-3.5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-mono tracking-widest outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors uppercase"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-70 text-sm mt-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              {loading ? "Restoring..." : "Restore Data"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
