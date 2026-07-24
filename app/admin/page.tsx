"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Users, Stethoscope, CalendarCheck, Wallet, ArrowRight, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function AdminAnalyticsPage() {
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [totalConsultations, setTotalConsultations] = useState(0);
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const patientsSnap = await getDocs(collection(db, "patients"));
        setTotalPatients(patientsSnap.size);

        const doctorsSnap = await getDocs(collection(db, "doctors"));
        setTotalDoctors(doctorsSnap.size);

        const consultationsSnap = await getDocs(collection(db, "appointments"));
        setTotalConsultations(consultationsSnap.size);
      } catch (e) {
        console.error("Error fetching stats:", e);
      }
    };

    const fetchPending = async () => {
      try {
        const q = query(
          collection(db, "doctors"), 
          where("status", "==", "Pending Verification")
        );
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Sort in JS to avoid requiring a composite index right away
        docs.sort((a: any, b: any) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setPendingDoctors(docs.slice(0, 5));
      } catch (e) {
        console.error("Error fetching pending:", e);
      }
    };

    fetchStats();
    fetchPending();
  }, []);

  const stats = [
    { label: "Total Patients", value: totalPatients.toString(), icon: Users, color: "bg-blue-100 text-blue-600" },
    { label: "Total Doctors", value: totalDoctors.toString(), icon: Stethoscope, color: "bg-purple-100 text-purple-600" },
    { label: "Total Consultations", value: totalConsultations.toString(), icon: CalendarCheck, color: "bg-green-100 text-green-600" },
    { label: "Platform Revenue", value: "$12,450", icon: Wallet, color: "bg-orange-100 text-orange-600" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Platform Analytics</h1>
      <p className="text-gray-500 mb-8">High-level overview of Mednoris platform usage and growth.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${s.color}`}>
                <Icon size={24} />
              </div>
              <p className="text-3xl font-black text-gray-900 mb-1">{s.value}</p>
              <p className="text-sm font-semibold text-gray-500">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Verification Requests</h2>
              <p className="text-xs font-medium text-gray-500">Doctors waiting for admin approval</p>
            </div>
          </div>
          <Link href="/admin/verification" className="text-brand-primary text-sm font-bold flex items-center gap-1 hover:text-brand-secondary transition-colors">
            View All <ArrowRight size={16} />
          </Link>
        </div>
        
        <div className="divide-y divide-gray-50">
          {pendingDoctors.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-medium">No pending verifications.</div>
          ) : (
            pendingDoctors.map((doc, i) => (
              <div key={doc.id || i} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  {doc.profileImage ? (
                    <img src={doc.profileImage} alt={doc.fullName} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                      {doc.fullName?.charAt(0) || "D"}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900">{doc.fullName}</h3>
                    <p className="text-sm text-gray-500">{doc.specializations || "Doctor"}</p>
                  </div>
                </div>
                <Link 
                  href={`/admin/verification`} 
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-lg transition-colors"
                >
                  Review
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
