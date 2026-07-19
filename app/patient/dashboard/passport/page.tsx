"use client";
import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { BadgeCheck, Droplet, User, MapPin, AlertTriangle, QrCode, Download } from "lucide-react";

export default function PassportPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
      <div className="w-20 h-20 bg-brand-secondary/10 rounded-full flex items-center justify-center mb-6">
        <span className="text-brand-secondary text-3xl font-bold">🚧</span>
      </div>
      <h1 className="text-2xl font-extrabold text-brand-primary mb-2">Coming Soon</h1>
      <p className="text-gray-500 max-w-md mx-auto">
        Your Medical Passport is currently being built and will be available in the next update.
      </p>
    </div>
  );
}

function OriginalPassportPage() {
  const { user } = usePrivy();
  const [patient, setPatient] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const snap = await getDoc(doc(db, "patients", user.id));
      if (snap.exists()) setPatient(snap.data() as Record<string, string>);
    };
    fetch();
  }, [user]);

  const info = [
    { icon: User, label: "Full Name", value: patient?.fullName || "—" },
    { icon: User, label: "Gender", value: patient?.gender || "—" },
    { icon: User, label: "Date of Birth", value: patient?.dob || "—" },
    { icon: Droplet, label: "Blood Group", value: patient?.bloodGroup || "—" },
    { icon: MapPin, label: "Country", value: patient?.country || "—" },
    { icon: AlertTriangle, label: "Allergies", value: patient?.allergies || "None" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-extrabold text-brand-primary mb-1">Medical Passport</h1>
      <p className="text-gray-400 text-sm mb-8">Your portable health identity — shareable with any doctor worldwide.</p>

      {/* Card front */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-brand-primary rounded-3xl p-8 text-white relative overflow-hidden shadow-xl mb-6">
        {/* decorative circles */}
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full border border-white/10"></div>
        <div className="absolute -right-4 -top-4 w-28 h-28 rounded-full border border-white/10"></div>
        <div className="absolute right-10 bottom-4 w-16 h-16 rounded-full border border-white/10"></div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Mednoris" className="w-7 h-7 object-contain brightness-0 invert" />
            <span className="font-extrabold tracking-tight text-base">MEDNORIS</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            <BadgeCheck size={14} className="text-white/70" />
            Medical Passport
          </div>
        </div>

        <div className="flex items-end gap-6">
          <div className="flex-1">
            <p className="text-white/50 text-xs mb-1">Patient Name</p>
            <p className="text-2xl font-extrabold mb-4">{patient?.fullName || "Your Name"}</p>
            <div className="flex gap-8">
              <div>
                <p className="text-white/50 text-xs">Blood Group</p>
                <p className="text-3xl font-black">{patient?.bloodGroup || "—"}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Date of Birth</p>
                <p className="text-base font-bold">{patient?.dob || "—"}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Allergies</p>
                <p className="text-base font-bold">{patient?.allergies || "None"}</p>
              </div>
            </div>
          </div>

          {/* QR placeholder */}
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
            <QrCode size={36} className="text-white/50" />
          </div>
        </div>
      </motion.div>

      {/* Details grid */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        {info.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary shrink-0">
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="font-bold text-brand-primary">{value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <button className="flex items-center gap-2 px-6 py-3 bg-brand-secondary text-white font-bold rounded-xl hover:bg-brand-primary transition-colors cursor-pointer">
        <Download size={16} /> Download Passport PDF
      </button>
    </div>
  );
}
