"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Users, Activity, HeartPulse, Stethoscope, Loader2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { getLastNDates, formatDayLabel } from "@/lib/stats";

function getTimeDiff(ts: any) {
  if (!ts?.toDate) return "Just now";
  const diff = (Date.now() - ts.toDate().getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return ts.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function HospitalDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [hospital, setHospital] = useState<any>(null);
  const [staffProfile, setStaffProfile] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeStaff: 0,
    recentActivity: [] as any[]
  });
  const [chartData, setChartData] = useState<any[]>([]);

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const last7 = getLastNDates(7);

        const [patSnap, staffSnap, logsSnap, ...dailySnaps] = await Promise.all([
          getDocs(query(collection(db, "hospital_patients"), where("hospitalSlug", "==", slug))),
          getDocs(query(collection(db, "hospital_staff"), where("hospitalSlug", "==", slug))),
          getDocs(query(collection(db, "audit_logs"), where("hospitalSlug", "==", slug), orderBy("timestamp", "desc"), limit(5))),
          // Fetch each of the last 7 daily_stats docs
          ...last7.map(date =>
            getDoc(doc(db, "hospitals", slug, "daily_stats", date))
          ),
        ]);

        // Build chart data from daily_stats — one entry per day
        const chart = last7.map((date, i) => {
          const snap = dailySnaps[i];
          const data = snap.exists() ? snap.data() : {};
          return {
            name: formatDayLabel(date),
            date,
            patients: data.patientsRegistered || 0,
            consultations: data.consultations || 0,
            lab: data.labEntries || 0,
            pharmacy: data.pharmacyEntries || 0,
          };
        });

        setChartData(chart);
        setStats({
          totalPatients: patSnap.size,
          activeStaff: staffSnap.size,
          recentActivity: logsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        });
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [slug]);

  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;
  }

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
          </div>
          <h3 className="text-gray-500 font-medium mb-1">Total Patients</h3>
          <p className="text-3xl font-black text-gray-900">{stats.totalPatients}</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
              <Activity size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 font-medium mb-1">Registered Today</h3>
          <p className="text-3xl font-black text-gray-900">
            {chartData.length > 0 ? chartData[chartData.length - 1].patients : 0}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
              <Stethoscope size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 font-medium mb-1">Active Staff</h3>
          <p className="text-3xl font-black text-gray-900">{stats.activeStaff}</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
              <HeartPulse size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 font-medium mb-1">Consultations Today</h3>
          <p className="text-3xl font-black text-gray-900">
            {chartData.length > 0 ? chartData[chartData.length - 1].consultations : 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Patient Activity (Last 7 Days)</h3>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} allowDecimals={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="patients" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorPatients)" name="Patients Registered" />
                <Area type="monotone" dataKey="consultations" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorConsults)" name="Consultations" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 overflow-y-auto max-h-[420px]">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No recent activity.</p>
            ) : (
              stats.recentActivity.map((log, i) => (
                <div key={log.id || i} className="flex gap-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-brand-primary shrink-0" />
                  <div>
                    <p className="text-sm text-gray-900 font-medium">
                      {log.action}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      by {log.actorName} · {getTimeDiff(log.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
