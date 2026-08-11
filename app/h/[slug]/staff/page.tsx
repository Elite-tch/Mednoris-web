"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Users, Activity, Calendar } from "lucide-react";

export default function StaffDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [hospital, setHospital] = useState<any>(null);
  const [staffProfile, setStaffProfile] = useState<any>(null);

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

  return (
    <div className="p-2 md:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-gray-900 mb-1">Staff Dashboard</h2>
        <p className="text-gray-500">Welcome back, {staffProfile?.name || "Staff Member"}.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Users size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 font-medium mb-1">My Patients</h3>
          <p className="text-3xl font-black text-gray-900">24</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
              <Calendar size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 font-medium mb-1">Today's Appointments</h3>
          <p className="text-3xl font-black text-gray-900">8</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
              <Activity size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 font-medium mb-1">Pending Tasks</h3>
          <p className="text-3xl font-black text-gray-900">3</p>
        </div>
      </div>
    </div>
  );
}
