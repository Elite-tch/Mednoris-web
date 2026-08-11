"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getDoc, collection, setDoc, updateDoc, deleteField, serverTimestamp } from "firebase/firestore";
import { db, auth, getSecondaryAuth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Save, ShieldCheck, ShieldAlert, Check, User, Mail, Lock } from "lucide-react";
import Link from "next/link";

import { useCrypto } from "@/contexts/CryptoContext";
import { deriveKEK, wrapKey, generateRandomBytes, arrayBufferToBase64 } from "@/lib/crypto";

export default function TransferOwnershipPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [actorProfile, setActorProfile] = useState<any>(null);
  const [hospital, setHospital] = useState<any>(null);
  const { dek } = useCrypto();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const [h, s] = await Promise.all([
        getDoc(doc(db, "hospitals", slug)),
        getDoc(doc(db, "hospital_staff", user.uid)),
      ]);
      if (h.exists()) setHospital(h.data());
      if (s.exists()) setActorProfile({ id: s.id, ...s.data() });
      setLoading(false);
    });
    return () => unsubscribe();
  }, [slug]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dek) {
      setError("Encryption key not found in memory. Please refresh the page and log in again to perform this action.");
      return;
    }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    
    // Confirm before proceeding
    const confirmed = window.confirm(
      "WARNING: Transferring ownership is an irreversible action.\n\n" +
      "You will immediately lose access to this dashboard, your cryptographic keys will be deleted, and the new owner will take full control.\n\n" +
      "Are you sure you want to proceed?"
    );
    if (!confirmed) return;

    setTransferring(true);
    setError(null);

    try {
      // 1. Prepare Cryptographic Material for the new owner
      const salt = generateRandomBytes(16);
      const kek = await deriveKEK(password, salt);
      const { wrappedBase64: wrappedDEK, ivBase64: wrapIV } = await wrapKey(dek, kek);

      // Recovery key generation for new owner
      const recoverySalt = generateRandomBytes(16);
      const recoveryCode = Array.from(crypto.getRandomValues(new Uint32Array(3)))
        .map((n) => n.toString(36).padStart(7, "0"))
        .join("-")
        .toUpperCase();
      const recoveryKek = await deriveKEK(recoveryCode, recoverySalt);
      const { wrappedBase64: recoveryWrappedDEK, ivBase64: recoveryWrapIV } = await wrapKey(dek, recoveryKek);

      // 2. Create the new owner in secondary auth
      const secondaryAuth = getSecondaryAuth();
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const newUser = credential.user;
      await updateProfile(newUser, { displayName: name });
      
      // Immediately sign out from secondary auth
      await secondaryAuth.signOut();

      const newUsername = email.split("@")[0] + Math.floor(100 + Math.random() * 900);

      // 3. Save new owner to Firestore
      await setDoc(doc(db, "hospital_staff", newUser.uid), {
        hospitalSlug: slug,
        hospitalName: hospital?.name,
        role: "owner",
        name,
        email, 
        username: newUsername,
        fullAccess: true,
        active: true,
        salt: arrayBufferToBase64(salt),
        wrappedDEK,
        wrapIV,
        recoverySalt: arrayBufferToBase64(recoverySalt),
        recoveryWrappedDEK,
        recoveryWrapIV,
        createdAt: serverTimestamp(),
      });

      // 4. Update Hospital Contact Info (optional but good practice)
      await updateDoc(doc(db, "hospitals", slug), {
        contactName: name,
        contactEmail: email
      });

      // 5. Log the transfer
      await setDoc(doc(collection(db, "audit_logs")), {
        hospitalSlug: slug,
        actorName: actorProfile?.name || "Owner",
        actorRole: "owner",
        action: `Ownership transferred from ${actorProfile?.name} to ${name}`,
        timestamp: serverTimestamp(),
      });

      // 6. Revoke current owner's access
      await updateDoc(doc(db, "hospital_staff", actorProfile.id), {
        active: false,
        wrappedDEK: deleteField(),
        wrapIV: deleteField(),
        salt: deleteField(),
        recoveryWrappedDEK: deleteField(),
        recoveryWrapIV: deleteField(),
        recoverySalt: deleteField(),
      });

      // 7. Force sign out current user
      alert(`Ownership transferred successfully!\n\nPlease save this Recovery Code for the new owner:\n${recoveryCode}\n\nYou will now be logged out.`);
      await signOut(auth);
      
    } catch (err: any) {
      setError(err.code === "auth/email-already-in-use" ? "This email is already in use by another account." : err.message);
      setTransferring(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;
  }

  if (actorProfile && actorProfile.role !== "owner") {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <ShieldAlert size={48} className="mx-auto text-red-500 mb-4 opacity-50" />
        <h2 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-6">Ownership transfers are restricted to the current Hospital Owner.</p>
        <Link href={`/h/${slug}/admin/staff`} className="inline-block px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
          Return to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto relative">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/h/${slug}/admin/staff`}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Staff Directory
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden"
      >
        <div className="bg-red-50 p-8 border-b border-red-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-red-900 mb-1">Transfer Ownership</h2>
              <p className="text-red-700 text-sm">Transfer full control of this workspace to a new administrator.</p>
            </div>
          </div>
          <div className="text-sm text-red-800 bg-white p-4 rounded-xl border border-red-200">
            <strong>Warning:</strong> This action is irreversible. You will immediately lose access to this dashboard, and your encryption keys will be securely wiped from our servers. The new owner will take complete control of {hospital?.name}.
          </div>
        </div>

        <form onSubmit={handleTransfer} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">New Owner's Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Dr. Sarah Jenkins" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">New Owner's Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="sarah@hospital.com" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary" />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">They will use this email to log into the Admin portal.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Assign Initial Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input type="text" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Assign a secure password" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}

          <div className="pt-4">
            <button type="submit" disabled={transferring} className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-70 text-sm">
              {transferring ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
              {transferring ? "Transferring Ownership..." : "Transfer Ownership Now"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
