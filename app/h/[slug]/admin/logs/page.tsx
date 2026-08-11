"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Loader2, History, UserCheck, UserPlus, UserMinus, FileText, LogIn } from "lucide-react";

function getIcon(action: string) {
  if (action.toLowerCase().includes("added new staff")) return <UserPlus size={16} className="text-blue-600" />;
  if (action.toLowerCase().includes("deactivated")) return <UserMinus size={16} className="text-red-600" />;
  if (action.toLowerCase().includes("logged in")) return <LogIn size={16} className="text-green-600" />;
  if (action.toLowerCase().includes("added new patient")) return <UserCheck size={16} className="text-purple-600" />;
  if (action.toLowerCase().includes("added a correction")) return <FileText size={16} className="text-orange-600" />;
  return <FileText size={16} className="text-gray-400" />;
}

function getTimeDiff(ts: any) {
  if (!ts?.toDate) return "Just now";
  const diff = (Date.now() - ts.toDate().getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return ts.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function LogsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [hospital, setHospital] = useState<any>(null);
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
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

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "audit_logs"),
          where("hospitalSlug", "==", slug),
          orderBy("timestamp", "desc")
        );
        const snap = await getDocs(q);
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Audit log error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [slug]);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-black text-gray-900 mb-1">Audit Logs</h2>
        <p className="text-gray-500">A complete timeline of every action taken inside your workspace.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-24 text-gray-400 bg-white rounded-3xl border border-gray-100">
          <History size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium text-lg">No logs yet</p>
          <p className="text-sm mt-1">Activity from all staff members will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-2">
          {logs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0, transition: { delay: i * 0.03 } }}
              className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 shrink-0">
                {getIcon(log.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{log.action}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">by</span>
                  <span className="text-xs font-bold text-gray-600">{log.actorName}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs capitalize">{log.actorRole}</span>
                </div>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{getTimeDiff(log.timestamp)}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
