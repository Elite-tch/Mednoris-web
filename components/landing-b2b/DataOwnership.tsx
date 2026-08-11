"use client";

import { motion } from "framer-motion";
import { Shield, Lock, FileCheck } from "lucide-react";

export default function DataOwnership() {
  return (
    <section className="py-24 bg-brand-primary text-white">
      <div className="container mx-auto px-6 md:px-12 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6">
              <Shield size={16} className="text-brand-accent" />
              <span className="text-sm font-semibold tracking-wide uppercase">Clear Data Boundaries</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Your Hospital.
              <br />
              <span className="text-brand-accent">Your Data.</span>
            </h2>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              Mednoris Layer 2 establishes a strict boundary for data ownership. Unlike consumer apps where patients manage their own files, Layer 2 ensures that the hospital retains complete ownership and control over the records it generates.
            </p>

            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-accent/20 flex items-center justify-center shrink-0">
                  <Lock size={20} className="text-brand-accent" />
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-1">No Patient Editing Rights</h4>
                  <p className="text-white/70">Patients cannot alter, delete, or manipulate their clinical history, preserving absolute medical integrity.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-accent/20 flex items-center justify-center shrink-0">
                  <FileCheck size={20} className="text-brand-accent" />
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-1">Granular Staff Permissions</h4>
                  <p className="text-white/70">Every receptionist, nurse, and doctor has unique credentials. You decide who can upload, edit, or view files within your facility.</p>
                </div>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Decorative background for the card */}
            <div className="absolute inset-0 bg-brand-accent opacity-20 blur-3xl rounded-full"></div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative shadow-2xl">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                <div>
                  <h3 className="text-xl font-bold">Audit Dashboard</h3>
                  <p className="text-sm text-white/60">Owner Level Access Only</p>
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
              </div>
              
              <div className="space-y-4">
                {[ 
                  { user: "Dr. Sarah Jenkins", action: "Updated Record", time: "10 mins ago", id: "PT-4921" },
                  { user: "Rec. Mike Ross", action: "Generated QR Card", time: "1 hr ago", id: "PT-8832" },
                  { user: "Dr. Alan Smith", action: "Viewed History", time: "2 hrs ago", id: "PT-1129" },
                ].map((log, i) => (
                  <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors cursor-default">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand-primary border border-white/20 flex items-center justify-center text-xs font-bold">
                        {log.user.split(' ')[1][0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{log.user}</p>
                        <p className="text-xs text-white/60">{log.action} • {log.id}</p>
                      </div>
                    </div>
                    <span className="text-xs text-white/40">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
