"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, X, Heart, Droplet, AlertTriangle, User } from "lucide-react";

type Member = { name: string; relation: string; dob: string; bloodGroup: string; allergies: string; avatar: string };

const initial: Member[] = [
  { name: "Mary Johnson", relation: "Mother", dob: "1965-03-12", bloodGroup: "A+", allergies: "Penicillin", avatar: "M" },
  { name: "Daniel Johnson", relation: "Son", dob: "2010-07-22", bloodGroup: "O+", allergies: "None", avatar: "D" },
];

export default function FamilyPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
      <div className="w-20 h-20 bg-brand-secondary/10 rounded-full flex items-center justify-center mb-6">
        <span className="text-brand-secondary text-3xl font-bold">🚧</span>
      </div>
      <h1 className="text-2xl font-extrabold text-brand-primary mb-2">Coming Soon</h1>
      <p className="text-gray-500 max-w-md mx-auto">
        The Family Health feature is currently under development and will be available in the next update.
      </p>
    </div>
  );
}

function OriginalFamilyPage() {
  const [members, setMembers] = useState<Member[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Member>({ name: "", relation: "", dob: "", bloodGroup: "", allergies: "", avatar: "" });

  const add = () => {
    if (!form.name || !form.relation) return;
    setMembers([...members, { ...form, avatar: form.name.charAt(0).toUpperCase() }]);
    setForm({ name: "", relation: "", dob: "", bloodGroup: "", allergies: "", avatar: "" });
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-primary mb-1">Family Health</h1>
          <p className="text-gray-400 text-sm">Manage health profiles for your family members.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-secondary text-white font-bold rounded-xl hover:bg-brand-primary transition-colors cursor-pointer text-sm">
          <Plus size={16} /> Add Member
        </button>
      </div>

      {/* Member cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {members.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-secondary/15 flex items-center justify-center font-bold text-brand-primary text-xl shrink-0">
                {m.avatar}
              </div>
              <div>
                <p className="font-bold text-brand-primary">{m.name}</p>
                <p className="text-xs text-gray-400">{m.relation}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500"><User size={12} /> DOB: {m.dob || "—"}</div>
              <div className="flex items-center gap-2 text-xs text-gray-500"><Droplet size={12} /> Blood Group: <span className="font-bold text-brand-primary">{m.bloodGroup || "—"}</span></div>
              <div className="flex items-center gap-2 text-xs text-gray-500"><AlertTriangle size={12} /> Allergies: {m.allergies || "None"}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-brand-primary">Add Family Member</h2>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer"><X size={16} /></button>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Full Name", key: "name", type: "text", placeholder: "e.g. Mary Johnson" },
                  { label: "Relationship", key: "relation", type: "text", placeholder: "e.g. Mother, Son" },
                  { label: "Date of Birth", key: "dob", type: "date", placeholder: "" },
                  { label: "Blood Group", key: "bloodGroup", type: "text", placeholder: "e.g. A+" },
                  { label: "Allergies", key: "allergies", type: "text", placeholder: "e.g. None" },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-brand-primary mb-1">{label}</label>
                    <input type={type} value={form[key as keyof Member]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-brand-secondary text-sm" />
                  </div>
                ))}
                <button onClick={add} className="w-full py-3 bg-brand-secondary text-white font-bold rounded-xl hover:bg-brand-primary transition-colors cursor-pointer mt-2">
                  Add Member
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
