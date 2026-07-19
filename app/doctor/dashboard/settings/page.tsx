"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { Bell, Shield, Wallet, LogOut, Moon } from "lucide-react";

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button onClick={onChange}
    className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${checked ? "bg-brand-secondary" : "bg-gray-200"}`}>
    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`}></div>
  </button>
);

export default function DoctorSettingsPage() {
  const { logout, user } = usePrivy();
  const [settings, setSettings] = useState({
    newAppointments: true,
    patientMessages: true,
    recordAccess: true,
    darkMode: false,
    twoFactor: true,
  });

  const toggle = (key: keyof typeof settings) => setSettings((s) => ({ ...s, [key]: !s[key] }));

  const sections = [
    {
      title: "Practice Notifications",
      icon: Bell,
      items: [
        { label: "New Appointment Requests", key: "newAppointments" },
        { label: "Patient Messages", key: "patientMessages" },
        { label: "Record Access Approvals", key: "recordAccess" },
      ],
    },
    {
      title: "Security & Privacy",
      icon: Shield,
      items: [
        { label: "Two-Factor Authentication", key: "twoFactor" },
      ],
    },
    {
      title: "Appearance",
      icon: Moon,
      items: [
        { label: "Dark Mode", key: "darkMode" },
      ],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold text-brand-primary mb-1">Settings</h1>
      <p className="text-gray-400 text-sm mb-8">Manage your practice preferences and account security.</p>

      {/* Connected account */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-5 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-secondary flex items-center justify-center text-white shrink-0">
          <Wallet size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-brand-primary">Connected Account</p>
          <p className="text-xs text-gray-500 truncate">{user?.email?.address || user?.wallet?.address || "—"}</p>
        </div>
        <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full shrink-0">Verified</span>
      </motion.div>

      {/* Toggle sections */}
      <div className="space-y-5">
        {sections.map(({ title, icon: Icon, items }, si) => (
          <motion.div key={title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.08 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
              <Icon size={16} className="text-brand-secondary" />
              <p className="font-bold text-brand-primary text-sm">{title}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {items.map(({ label, key }) => (
                <div key={key} className="flex items-center justify-between px-6 py-4">
                  <p className="text-sm text-gray-700">{label}</p>
                  <Toggle checked={settings[key as keyof typeof settings]} onChange={() => toggle(key as keyof typeof settings)} />
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Danger zone */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <p className="font-bold text-brand-primary text-sm mb-4">Account Actions</p>
        <button onClick={logout}
          className="flex items-center gap-2 w-full px-5 py-3 rounded-xl border border-red-200 text-red-500 font-bold text-sm hover:bg-red-50 transition-colors cursor-pointer">
          <LogOut size={16} /> Sign Out
        </button>
      </motion.div>
    </div>
  );
}
