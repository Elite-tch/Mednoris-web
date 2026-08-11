"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Plus, Loader2, Search, User, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PatientsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [hospital, setHospital] = useState<any>(null);
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const fetchPatients = async () => {
    setLoading(true);
    const q = query(collection(db, "hospital_patients"), where("hospitalSlug", "==", slug));
    const snap = await getDocs(q);
    setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchPatients(); }, [slug]);

  const filtered = patients.filter(p =>
    search === "" ||
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    p.mednorisId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-1">Patients Directory</h2>
          <p className="text-gray-500">{patients.length} patients registered at {hospital?.name || "the hospital"}.</p>
        </div>
        <Link 
          href={`/h/${slug}/admin/patients/add`} 
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors text-sm shrink-0"
        >
          <Plus size={16} /> Register Patient
        </Link>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or Mednoris ID..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <User size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">{search ? "No patients match your search." : "No patients registered yet."}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Patient</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Mednoris ID</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Date of Birth</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Registered by</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: i * 0.03 } }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors group cursor-pointer" 
                    onClick={() => router.push(`/h/${slug}/admin/patients/${p.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-50 text-purple-600 font-bold rounded-full flex items-center justify-center text-sm shrink-0">
                          {p.firstName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{p.firstName} {p.lastName}</p>
                          <p className="text-xs text-gray-400 capitalize">{p.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <code className="text-xs font-bold text-brand-primary bg-brand-primary/5 px-2 py-1 rounded-lg">{p.mednorisId}</code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{p.dob}</td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-xs font-medium text-gray-600">{p.createdBy}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/h/${slug}/admin/patients/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary hover:underline"
                      >
                        View Profile <ArrowRight size={13} />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
