"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Clock, Trash2, BadgeCheck } from "lucide-react";

const permissions = [
  { doctor: "Dr. Sarah Williams", specialty: "Cardiologist", avatar: "S", granted: "May 18, 2025", expires: "Jun 18, 2025", daysLeft: 7, verified: true },
  { doctor: "Dr. Emeka Nwankwo", specialty: "General Practitioner", avatar: "E", granted: "May 10, 2025", expires: "Jun 10, 2025", daysLeft: 22, verified: true },
];

const requests = [
  { doctor: "Dr. Aisha Ibrahim", specialty: "Neurologist", avatar: "A", requestedOn: "May 21, 2025", verified: true },
];

export default function PermissionsPage() {
  const [active, setActive] = useState(permissions);

  const revoke = (i: number) => {
    if (confirm("Are you sure you want to revoke this doctor's access?")) {
      setActive((p) => p.filter((_, idx) => idx !== i));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-primary mb-1">Access Requests & Permissions</h1>
      <p className="text-gray-400 text-sm mb-8">Control who has access to your medical records.</p>

      {/* Pending Requests */}
      <section className="mb-8">
        <h2 className="font-bold text-brand-primary text-base mb-4 flex items-center gap-2">
          <span className="w-5 h-5 bg-orange-400 text-white text-xs rounded-full flex items-center justify-center">{requests.length}</span>
          Pending Requests
        </h2>
        {requests.map((r, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-orange-100 mb-3">
            <div className="w-12 h-12 rounded-full bg-brand-secondary/20 flex items-center justify-center font-bold text-brand-primary text-lg shrink-0">{r.avatar}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-brand-primary">{r.doctor}</p>
                {r.verified && <BadgeCheck size={14} className="text-brand-secondary" />}
              </div>
              <p className="text-xs text-gray-400">{r.specialty} · Requested {r.requestedOn}</p>
              <p className="text-sm text-gray-500 mt-1">is requesting access to your medical records</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="px-4 py-2 bg-brand-secondary text-white text-xs font-bold rounded-xl hover:bg-brand-primary transition-colors cursor-pointer">Approve</button>
              <button className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">Decline</button>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Active Permissions */}
      <section>
        <h2 className="font-bold text-brand-primary text-base mb-4 flex items-center gap-2">
          <ShieldCheck size={18} className="text-green-500" /> Active Permissions
        </h2>
        <div className="space-y-3">
          {active.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-brand-secondary/20 flex items-center justify-center font-bold text-brand-primary text-lg shrink-0">{p.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-brand-primary">{p.doctor}</p>
                  {p.verified && <BadgeCheck size={14} className="text-brand-secondary" />}
                </div>
                <p className="text-xs text-gray-400 mb-2">{p.specialty}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>Granted: {p.granted}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-orange-500"><Clock size={11} />{p.daysLeft} days left</span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden w-48">
                  <div className="h-full bg-brand-secondary rounded-full" style={{ width: `${(p.daysLeft / 30) * 100}%` }}></div>
                </div>
              </div>
              <button onClick={() => revoke(i)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors cursor-pointer shrink-0">
                <Trash2 size={13} /> Revoke Access
              </button>
            </motion.div>
          ))}
          {active.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No active permissions.</p>}
        </div>
      </section>
    </div>
  );
}
