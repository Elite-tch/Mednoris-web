"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { onAuthStateChanged, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp, getDoc, deleteField } from "firebase/firestore";
import { db, auth, getSecondaryAuth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Trash2, ShieldCheck, User, Copy, Check, X, UserPlus } from "lucide-react";
import { useCrypto } from "@/contexts/CryptoContext";
import { deriveKEK, wrapKey, generateRandomBytes, arrayBufferToBase64 } from "@/lib/crypto";

export default function StaffPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { dek } = useCrypto();
  
  const [hospital, setHospital] = useState<any>(null);
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [assignSlot, setAssignSlot] = useState<any>(null);
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success Modal State
  const [generatedUser, setGeneratedUser] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Auto-generate username from name
  const autoUsername = newName
    ? newName.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, "") +
      Math.floor(100 + Math.random() * 900)
    : "";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const [h, s] = await Promise.all([
        getDoc(doc(db, "hospitals", slug)),
        getDoc(doc(db, "hospital_staff", user.uid)),
      ]);
      if (h.exists()) setHospital({ id: h.id, ...h.data() });
      if (s.exists()) setStaffProfile(s.data());
    });
    return () => unsubscribe();
  }, [slug]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const qStaff = query(collection(db, "hospital_staff"), where("hospitalSlug", "==", slug));
      const snapStaff = await getDocs(qStaff);
      setStaffList(snapStaff.docs.map(d => ({ id: d.id, ...d.data() })));

      const snapSlots = await getDocs(collection(db, `hospitals/${slug}/slots`));
      setSlots(snapSlots.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [slug]);

  // Reset a slot: delete staff crypto keys + mark slot as unassigned
  const handleResetSlot = async (staffId: string, staffName: string, slotId: string) => {
    if (!confirm(`Remove ${staffName} and reset this slot? They will immediately lose access.`)) return;
    try {
      // 1. Strip crypto keys — their password is now useless for decryption
      await updateDoc(doc(db, "hospital_staff", staffId), {
        active: false,
        wrappedDEK: deleteField(),
        wrapIV: deleteField(),
        salt: deleteField(),
      });

      // 2. Reset the slot back to unassigned so the Owner can fill it with someone new
      await updateDoc(doc(db, `hospitals/${slug}/slots`, slotId), {
        isFilled: false,
        assignedToUid: null,
      });

      // 3. Audit log
      await setDoc(doc(collection(db, "audit_logs")), {
        hospitalSlug: slug,
        actorName: staffProfile?.name,
        actorRole: staffProfile?.role || "owner",
        action: `Removed staff member: ${staffName} — slot reset to unassigned`,
        timestamp: serverTimestamp(),
      });

      fetchData();
    } catch (err) {
      console.error("Error resetting slot", err);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dek) {
      setError("Encryption Key not available. Please log in again.");
      return;
    }
    if (!newName.trim() || !newPassword.trim()) {
      setError("Please fill out all fields.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    // Compute a stable username for this submission
    const usernameToUse = newName.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, "") +
      Math.floor(100 + Math.random() * 900);

    setSubmitting(true);
    setError(null);
    const email = `${usernameToUse}@${slug}.mednoris.local`;

    try {
      // 1. Wrap DEK
      const salt = generateRandomBytes(16);
      const kek = await deriveKEK(newPassword, salt);
      const { wrappedBase64: wrappedDEK, ivBase64: wrapIV } = await wrapKey(dek, kek);

      // 2. Create User in Secondary Auth
      const secondaryAuth = getSecondaryAuth();
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, newPassword);
      const user = credential.user;
      await updateProfile(user, { displayName: newName });
      await secondaryAuth.signOut();

      // 3. Save Staff Record
      await setDoc(doc(db, "hospital_staff", user.uid), {
        hospitalSlug: slug,
        hospitalName: hospital?.name,
        role: assignSlot.role,
        fullAccess: assignSlot.fullAccess || false,
        name: newName,
        email, 
        username: usernameToUse,
        active: true,
        salt: arrayBufferToBase64(salt),
        wrappedDEK,
        wrapIV,
        createdAt: serverTimestamp(),
      });

      // 4. Update Slot to Filled
      await updateDoc(doc(db, `hospitals/${slug}/slots`, assignSlot.id), {
        isFilled: true,
        assignedToUid: user.uid
      });

      setGeneratedUser({
        username: usernameToUse,
        password: newPassword,
        link: `${window.location.origin}/h/${slug}/staff`
      });
      
      setAssignSlot(null);
      setNewPassword("");
      setNewName("");
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to assign staff to slot.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const unfilledSlots = slots.filter(s => !s.isFilled);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-1">Staff Management</h2>
          <p className="text-gray-500">Manage your provisioned staff slots and active accounts.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>
      ) : (
        <div className="space-y-8">
          
          {/* Unfilled Slots Section */}
          {staffProfile?.role === "owner" && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-1">Available Staff Slots ({unfilledSlots.length})</h3>
              <p className="text-sm text-gray-500 mb-4">These slots have been provisioned by Mednoris. Assign a user to fill them.</p>
              
              {unfilledSlots.length === 0 ? (
                <div className="p-6 text-center text-gray-500 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                  <p className="font-semibold mb-1">No empty slots available.</p>
                  <p className="text-xs">If you need to add more staff, please contact the Mednoris team to provision additional slots for your hospital.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unfilledSlots.map(slot => (
                    <div key={slot.id} className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between bg-gray-50">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-900 capitalize text-sm">{slot.role.replace("_", " ")}</span>
                          {slot.fullAccess && <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase rounded-md">Full Access</span>}
                        </div>
                        <p className="text-xs font-semibold text-orange-500">Unassigned</p>
                      </div>
                      <button 
                        onClick={() => setAssignSlot(slot)}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-secondary transition-colors text-xs"
                      >
                        <UserPlus size={14} /> Assign User
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Active Staff List */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Active Staff Accounts</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Username</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {staffList.map((s, i) => (
                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: i * 0.04 } }} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-brand-primary/10 text-brand-primary font-bold rounded-full flex items-center justify-center text-sm">
                          {s.name?.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-900">{s.name}</span>
                        {(s.role === "admin" || s.role === "owner") && <ShieldCheck size={15} className="text-brand-primary" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500">{s.username || s.email.split('@')[0]}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold capitalize">{s.role?.replace(/_/g, " ")}</span>
                        {s.fullAccess && <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold">Full Access</span>}
                      </div>
                    </td> 
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.active !== false ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {s.active !== false ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {staffProfile?.role === "owner" && s.role !== "owner" && s.active !== false && (() => {
                          // Find the slot this staff member is assigned to
                          const theirSlot = slots.find(sl => sl.assignedToUid === s.id);
                          return (
                            <button
                              onClick={() => handleResetSlot(s.id, s.name, theirSlot?.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                              title="Remove and reset slot"
                            >
                              <Trash2 size={13} /> Remove & Reset Slot
                            </button>
                          );
                        })()}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Slot Modal */}
      <AnimatePresence>
        {assignSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              <button 
                onClick={() => setAssignSlot(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-black text-gray-900 mb-1">Assign Staff User</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-500">Slot:</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 font-bold text-xs rounded uppercase">{assignSlot.role.replace("_", " ")}</span>
                  {assignSlot.fullAccess && <span className="px-2 py-1 bg-brand-primary/10 text-brand-primary font-bold text-xs rounded uppercase">Full Access</span>}
                </div>
              </div>

              <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    required
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-brand-primary focus:bg-white transition-colors"
                  />
                  {newName && (
                    <p className="mt-1.5 text-xs text-gray-400">
                      Username will be: <span className="font-bold text-gray-600 font-mono">{newName.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, "")}***</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                  <input required type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Assign a secure password" minLength={8} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-brand-primary focus:bg-white transition-colors" />
                </div>

                {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

                <button type="submit" disabled={submitting} className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors disabled:opacity-50 mt-2">
                  {submitting ? "Assigning..." : "Assign & Create User"}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Success Modal */}
        {generatedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
              <button onClick={() => setGeneratedUser(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
              <div className="p-8 text-center border-b border-gray-100">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck size={32} /></div>
                <h2 className="text-xl font-black text-gray-900">Staff Assigned Successfully!</h2>
                <p className="text-gray-500 mt-2 text-sm">Share these credentials with the staff member.</p>
              </div>
              <div className="p-6 space-y-4 bg-gray-50">
                {['username', 'password', 'link'].map(field => (
                  <div key={field}>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{field}</label>
                    <div className="flex items-center gap-2">
                      <input readOnly value={generatedUser[field]} className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none" />
                      <button onClick={() => handleCopy(generatedUser[field], field)} className="p-3 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-brand-primary hover:border-brand-primary transition-colors shrink-0">
                        {copiedField === field ? <Check size={18} className="text-brand-primary" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
