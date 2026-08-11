"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Users, Activity, HeartPulse, Stethoscope } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Mon", patients: 120, consultations: 45 },
  { name: "Tue", patients: 145, consultations: 52 },
  { name: "Wed", patients: 160, consultations: 60 },
  { name: "Thu", patients: 130, consultations: 48 },
  { name: "Fri", patients: 180, consultations: 75 },
  { name: "Sat", patients: 95, consultations: 30 },
  { name: "Sun", patients: 110, consultations: 40 },
];

export default function HospitalDashboardPage() {
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
        <h2 className="text-2xl font-black text-gray-900 mb-1">Overview Dashboard</h2>
        <p className="text-gray-500">Welcome back, {staffProfile?.name}. Here's what's happening at {hospital?.name || "the hospital"} today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <span className="text-sm font-bold text-green-600">+12%</span>
          </div>
          <h3 className="text-gray-500 font-medium mb-1">Total Patients</h3>
          <p className="text-3xl font-black text-gray-900">1,248</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
              <Activity size={24} />
            </div>
            <span className="text-sm font-bold text-green-600">+5%</span>
          </div>
          <h3 className="text-gray-500 font-medium mb-1">Today's Visits</h3>
          <p className="text-3xl font-black text-gray-900">42</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
              <Stethoscope size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 font-medium mb-1">Active Staff</h3>
          <p className="text-3xl font-black text-gray-900">18</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
              <HeartPulse size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 font-medium mb-1">Critical Cases</h3>
          <p className="text-3xl font-black text-gray-900">3</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Patient Activity (Last 7 Days)</h3>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorConsults" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="patients" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorPatients)" name="Total Patients" />
                <Area type="monotone" dataKey="consultations" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorConsults)" name="Consultations" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-2 h-2 mt-2 rounded-full bg-brand-primary shrink-0" />
                <div>
                  <p className="text-sm text-gray-900 font-medium">
                    Nurse Sarah added a new patient record.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {i * 10} minutes ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
