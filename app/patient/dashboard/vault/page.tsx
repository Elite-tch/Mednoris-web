"use client";
import { motion } from "framer-motion";
import { FileText, Image, Pill, Syringe, FlaskConical, Download } from "lucide-react";

const records = [
  { date: "May 19, 2025", type: "PDF", name: "Blood Test Report", category: "Lab Result", icon: FlaskConical, color: "bg-red-50 text-red-500" },
  { date: "May 10, 2025", type: "DICOM", name: "MRI Scan – Brain", category: "Imaging", icon: Image, color: "bg-blue-50 text-blue-500" },
  { date: "Apr 28, 2025", type: "PDF", name: "Prescription – Lisinopril", category: "Prescription", icon: Pill, color: "bg-green-50 text-green-600" },
  { date: "Mar 15, 2025", type: "PDF", name: "Vaccination Record", category: "Immunization", icon: Syringe, color: "bg-purple-50 text-purple-500" },
  { date: "Feb 3, 2025", type: "PDF", name: "Consultation Summary", category: "Consultation", icon: FileText, color: "bg-orange-50 text-orange-500" },
];

export default function VaultPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-primary mb-1">My Records / Medical Vault</h1>
      <p className="text-gray-400 text-sm mb-8">Chronological history of all your uploaded medical records.</p>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-100 hidden md:block"></div>

        <div className="space-y-5">
          {records.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex gap-6">
                {/* Dot */}
                <div className="hidden md:flex flex-col items-center shrink-0 w-12">
                  <div className="w-3 h-3 rounded-full bg-brand-secondary border-2 border-white shadow-sm mt-5 shrink-0"></div>
                </div>

                {/* Card */}
                <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${r.color}`}>
                    <Icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-brand-primary truncate">{r.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{r.category}</span>
                      <span>·</span>
                      <span>{r.type}</span>
                      <span>·</span>
                      <span>{r.date}</span>
                    </div>
                  </div>
                  <button className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-brand-secondary/10 hover:text-brand-secondary transition-colors cursor-pointer">
                    <Download size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
