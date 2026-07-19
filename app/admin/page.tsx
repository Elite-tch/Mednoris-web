"use client";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Users, Stethoscope, CalendarCheck, Wallet } from "lucide-react";

export default function AdminAnalyticsPage() {
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalDoctors, setTotalDoctors] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const patientsSnap = await getDocs(collection(db, "patients"));
        setTotalPatients(patientsSnap.size);

        const doctorsSnap = await getDocs(collection(db, "doctors"));
        setTotalDoctors(doctorsSnap.size);
      } catch (e) {
        console.error("Error fetching stats:", e);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { label: "Total Patients", value: totalPatients.toString(), icon: Users, color: "bg-blue-100 text-blue-600" },
    { label: "Total Doctors", value: totalDoctors.toString(), icon: Stethoscope, color: "bg-purple-100 text-purple-600" },
    { label: "Total Consultations", value: "842", icon: CalendarCheck, color: "bg-green-100 text-green-600" },
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
    </div>
  );
}
