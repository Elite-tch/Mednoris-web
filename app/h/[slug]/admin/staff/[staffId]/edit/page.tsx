"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Save, ShieldCheck, ShieldAlert, Check } from "lucide-react";
import Link from "next/link";

const ROLES = ["receptionist", "nurse", "doctor", "scientist", "pharmacist", "lab_technician"];

export default function EditStaffPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const staffId = params.staffId as string;
  
  const [actorProfile, setActorProfile] = useState<any>(null);
  const [staffData, setStaffData] = useState<any>(null);
  
  const [role, setRole] = useState("");
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [fullAccess, setFullAccess] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const [sActor, sTarget] = await Promise.all([
        getDoc(doc(db, "hospital_staff", user.uid)),
        getDoc(doc(db, "hospital_staff", staffId)),
      ]);
      
      if (sActor.exists()) setActorProfile(sActor.data());
      
      if (sTarget.exists()) {
        const data = sTarget.data();
        setStaffData(data);
        setFullAccess(!!data.fullAccess);
        
        if (ROLES.includes(data.role)) {
          setRole(data.role);
          setIsCustomRole(false);
        } else {
          setRole("others");
          setIsCustomRole(true);
          setCustomRoleInput(data.role.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()));
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [slug, staffId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalRole = role;
    if (isCustomRole) {
      if (!customRoleInput.trim()) { setError("Please specify a custom role."); return; }
      finalRole = customRoleInput.toLowerCase().trim().replace(/[^a-z0-9_ ]/g, "").replace(/\s+/g, "_");
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateDoc(doc(db, "hospital_staff", staffId), {
        role: finalRole,
        fullAccess
      });

      // Audit log
      await setDoc(doc(collection(db, "audit_logs")), {
        hospitalSlug: slug,
        actorName: actorProfile?.name || "Owner",
        actorRole: "owner",
        action: `Owner changed ${staffData?.name}'s access. Role: ${finalRole.replace(/_/g, " ")}, Full Access: ${fullAccess}`,
        timestamp: serverTimestamp(),
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update staff member.");
    } finally {
      setSaving(false);
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
        <p className="text-gray-500 mb-6">Staff management is restricted to Hospital Owners.</p>
        <Link href={`/h/${slug}/admin/staff`} className="inline-block px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
          Return to Directory
        </Link>
      </div>
    );
  }

  if (!staffData) {
    return <div className="text-center py-20 text-gray-500">Staff member not found.</div>;
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
        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8"
      >
        <div className="mb-8 pb-6 border-b border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 mb-1">Edit Staff Access</h2>
          <p className="text-gray-500 text-sm">Managing access for <span className="font-bold text-gray-900">{staffData.name}</span> ({staffData.email})</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Role / Department</label>
            <div className="flex flex-wrap gap-4">
              {ROLES.map(r => (
                <label key={r} className={`flex items-center gap-2 py-3 px-4 border rounded-xl cursor-pointer w-fit transition-colors ${!isCustomRole && role === r ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
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
              <p className="text-xs text-purple-700 mt-1">If enabled, this staff member will be able to view and manage records across all clinical departments. Note: This does not grant administrative privileges.</p>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
          {success && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-xl border border-green-100">
              <Check size={16} /> Access level updated successfully!
            </div>
          )}

          <div className="pt-2">
            <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors disabled:opacity-70 text-sm">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
