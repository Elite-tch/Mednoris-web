"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Search, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function VerificationQueuePage() {
  const [activeTab, setActiveTab] = useState("Pending Verification");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "doctors"), where("status", "==", activeTab));
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDoctors(docs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [activeTab]);

  const tabs = [
    { id: "Pending Verification", label: "Pending" },
    { id: "Verified", label: "Accepted" },
    { id: "Rejected", label: "Rejected" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Verification Queue</h1>
      <p className="text-gray-500 mb-8">Review and manage doctor applications.</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-px">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors cursor-pointer ${
              activeTab === t.id ? "border-brand-secondary text-brand-secondary" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-secondary" size={32} /></div>
      ) : (
        <div className="space-y-4">
          {doctors.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                  {d.profileImage ? (
                    <img src={d.profileImage} alt={d.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">
                      {d.fullName?.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{d.fullName}</p>
                  <p className="text-xs text-gray-500">{d.title} • {d.specializations}</p>
                </div>
              </div>
              <Link href={`/admin/verification/${d.id}`}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold text-sm rounded-xl transition-colors shrink-0">
                View Details <ArrowRight size={16} />
              </Link>
            </motion.div>
          ))}
          {doctors.length === 0 && (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100 border-dashed">
              No doctors found in the {activeTab.toLowerCase()} queue.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
