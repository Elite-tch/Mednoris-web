"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, setDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { db, auth, getSecondaryAuth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, User, Lock, Plus, ShieldCheck, Copy, Check, X, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { useCrypto } from "@/contexts/CryptoContext";
import { deriveKEK, wrapKey, generateRandomBytes, arrayBufferToBase64, encryptData } from "@/lib/crypto";
import { writeAuditLog } from "@/lib/audit";

const ROLES = ["receptionist", "nurse", "doctor", "scientist", "pharmacist", "lab_technician"];

function generateUsername(name: string) {
  const cleanName = name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  const rand = Math.floor(100 + Math.random() * 900);
  return `${cleanName}${rand}`;
}

export default function AddStaffPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [hospital, setHospital] = useState<any>(null);
  const [actorProfile, setActorProfile] = useState<any>(null);
  const { dek } = useCrypto();

  const [name, setName] = useState("");
  const [role, setRole] = useState("nurse");
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [password, setPassword] = useState("");
  const [fullAccess, setFullAccess] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedUser, setGeneratedUser] = useState({ username: "", password: "", link: "" });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const [h, s] = await Promise.all([
        getDoc(doc(db, "hospitals", slug)),
        getDoc(doc(db, "hospital_staff", user.uid)),
      ]);
      if (h.exists()) setHospital(h.data());
      if (s.exists()) setActorProfile(s.data());
    });
    return () => unsubscribe();
  }, [slug]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dek) {
      setError("Encryption key not found in memory. Please refresh the page and log in again to perform this action.");
      return;
    }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    
    let finalRole = role;
    if (isCustomRole) {
      if (!customRoleInput.trim()) { setError("Please specify a custom role."); return; }
      finalRole = customRoleInput.toLowerCase().trim().replace(/[^a-z0-9_ ]/g, "").replace(/\s+/g, "_");
    }

    setLoading(true);
    setError(null);

    const username = generateUsername(name);
    // Map username to a deterministic email for Firebase Auth
    const email = `${username}@${slug}.mednoris.local`;

    try {
      // 1. Prepare Cryptographic Material for the new user
      const salt = generateRandomBytes(16);
      const kek = await deriveKEK(password, salt);
      const { wrappedBase64: wrappedDEK, ivBase64: wrapIV } = await wrapKey(dek, kek);

      // 2. Create the user in secondary auth
      const secondaryAuth = getSecondaryAuth();
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const user = credential.user;
      await updateProfile(user, { displayName: name });
      
      // Immediately sign out the newly created user from the secondary app to clean up state
      await secondaryAuth.signOut();

      // 3. Encrypt the profile PII
      const encryptedProfile = await encryptData(
        {
          name,
          email,
          role: finalRole, // Store full string in case it's custom
        },
        dek
      );

      // 4. Save to Firestore
      await setDoc(doc(db, "hospital_staff", user.uid), {
        hospitalSlug: slug,
        role: ROLES.includes(finalRole) ? finalRole : "custom", // Base role for access rules
        username,
        fullAccess,
        active: true,
        salt: arrayBufferToBase64(salt),
        wrappedDEK,
        wrapIV,
        createdAt: serverTimestamp(),
        encryptedProfile,
      });

      // Audit log
      await writeAuditLog(slug, {
        actorName: actorProfile?.name || "Admin",
        actorRole: "admin",
        action: `Added a new staff member`,
      });

      const accessLink = `${window.location.origin}/h/${slug}/staff`;
      setGeneratedUser({ username, password, link: accessLink });
      setShowSuccessModal(true);
      
      setName(""); setPassword(""); setRole("nurse"); setIsCustomRole(false); setCustomRoleInput("");
    } catch (err: any) {
      setError(err.code === "auth/email-already-in-use" ? "This generated username already exists. Please try again or alter the name slightly." : err.message);
    } finally {
      setLoading(false);
    }
  };

  if (actorProfile && actorProfile.role !== "owner") {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <ShieldAlert size={48} className="mx-auto text-red-500 mb-4 opacity-50" />
        <h2 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-6">Staff management is restricted to Hospital Owners.</p>
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
          <ArrowLeft size={18} /> Back to Staff List
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Add Staff Member</h1>
        <p className="text-gray-500">Create a new account for a member of staff at {hospital?.name}.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8"
      >
        <form onSubmit={handleAdd} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Nurse Juliet" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary" />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">A unique username will be automatically generated from this name.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Role / Department</label>
            <div className="flex flex-wrap gap-4">
              {ROLES.map(r => (
                <label key={r} className={`flex items-center gap-2 py-3  px-4 border rounded-xl cursor-pointer w-fit  transition-colors ${!isCustomRole && role === r ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                  <input type="radio" name="role" checked={!isCustomRole && role === r} onChange={() => { setIsCustomRole(false); setRole(r); }} className="hidden" />
                  <span className="text-sm font-bold">{r.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
                </label>
              ))}
              <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${isCustomRole ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                <input type="radio" name="role" checked={isCustomRole} onChange={() => setIsCustomRole(true)} className="hidden" />
                <span className="text-sm font-bold">Others</span>
              </label>
            </div>
            
            <AnimatePresence>
              {isCustomRole && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden">
                  <input type="text" value={customRoleInput} onChange={e => setCustomRoleInput(e.target.value)} placeholder="e.g. Speech Therapist" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary bg-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 flex items-start gap-4">
            <div className="pt-0.5">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={fullAccess} onChange={e => setFullAccess(e.target.checked)} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            <div>
              <p className="text-sm font-bold text-purple-900">Grant full access to all patient record sections, not just their department?</p>
              <p className="text-xs text-purple-700 mt-1">If enabled, this staff member will be able to view and manage records across all clinical departments.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input type="text" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Assign a secure password" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}

          <div className="pt-2">
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors disabled:opacity-70 text-sm">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Success Modal Overlay */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="p-8 text-center border-b border-gray-100">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Staff Added Successfully!</h2>
                <p className="text-gray-500 mt-2 text-sm">Share these credentials with the staff member so they can access their dashboard.</p>
              </div>

              <div className="p-6 space-y-4 bg-gray-50">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Username</label>
                  <div className="flex items-center gap-2">
                    <input readOnly value={generatedUser.username} className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none" />
                    <button 
                      onClick={() => handleCopy(generatedUser.username, "username")}
                      className="p-3 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-brand-primary hover:border-brand-primary transition-colors shrink-0"
                    >
                      {copiedField === "username" ? <Check size={18} className="text-primary" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="flex items-center gap-2">
                    <input readOnly value={generatedUser.password} className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none" />
                    <button 
                      onClick={() => handleCopy(generatedUser.password, "password")}
                      className="p-3 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-brand-primary hover:border-brand-primary transition-colors shrink-0"
                    >
                      {copiedField === "password" ? <Check size={18} className="text-primary" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Login Link</label>
                  <div className="flex items-center gap-2">
                    <input readOnly value={generatedUser.link} className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-500 font-mono outline-none truncate" />
                    <button 
                      onClick={() => handleCopy(generatedUser.link, "link")}
                      className="p-3 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-brand-primary hover:border-brand-primary transition-colors shrink-0"
                    >
                      {copiedField === "link" ? <Check size={18} className="text-primary" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
