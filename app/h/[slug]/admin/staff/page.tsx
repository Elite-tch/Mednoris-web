"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp, getDoc, deleteField } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Plus, Loader2, Trash2, ShieldCheck, User, Edit, ArrowRightLeft } from "lucide-react";

export default function StaffPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [hospital, setHospital] = useState<any>(null);
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const [h, s] = await Promise.all([
        getDoc(doc(db, "hospitals", slug)),
        getDoc(doc(db, "hospital_staff", user.uid)),
      ]);
      if (h.exists()) setHospital(h.data());
      if (s.exists()) setStaffProfile(s.data());
    });
    return () => unsubscribe();
  }, [slug]);

  const fetchStaff = async () => {
    setLoading(true);
    const q = query(collection(db, "hospital_staff"), where("hospitalSlug", "==", slug));
    const snap = await getDocs(q);
    setStaffList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, [slug]);

  const handleDeactivate = async (staffId: string, name: string) => {
    await updateDoc(doc(db, "hospital_staff", staffId), { 
      active: false,
      wrappedDEK: deleteField(),
      wrapIV: deleteField(),
      salt: deleteField()
    });
    await setDoc(doc(collection(db, "audit_logs")), {
      hospitalSlug: slug,
      actorName: staffProfile?.name,
      actorRole: staffProfile?.role || "owner",
      action: `Deactivated staff account: ${name}`,
      timestamp: serverTimestamp(),
    });
    fetchStaff();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-1">Staff Accounts</h2>
          <p className="text-gray-500">Manage all staff members and their access.</p>
        </div>
        
        {staffProfile?.role === "owner" && (
          <div className="flex items-center gap-3">
            <Link
              href={`/h/${slug}/admin/settings/transfer-ownership`}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm"
            >
              <ArrowRightLeft size={16} /> Transfer Ownership
            </Link>
            <Link
              href={`/h/${slug}/admin/staff/add`}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors text-sm"
            >
              <Plus size={16} /> Add Staff Member
            </Link>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
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
                  <td className="px-6 py-4 text-sm text-gray-500">{s.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-1">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold capitalize">{s.role?.replace(/_/g, " ")}</span>
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
                      {staffProfile?.role === "owner" && s.role !== "owner" && s.role !== "admin" && s.active !== false && (
                        <>
                          <Link href={`/h/${slug}/admin/staff/${s.id}/edit`} className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors" title="Edit Staff">
                            <Edit size={16} />
                          </Link>
                          <button onClick={() => handleDeactivate(s.id, s.name)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Deactivate">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {staffList.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <User size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No staff members yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
