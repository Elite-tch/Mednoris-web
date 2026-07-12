"use client";
import { motion } from "framer-motion";
import { ShieldCheck, BadgeCheck, LockKeyhole } from "lucide-react";
import Link from "next/link";

export default function AboutSection() {
  return (
    <section id="about" className="md:py-14 py-10 px-5 md:px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8 md:gap-16 items-center">
      <div className="flex-1">
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-brand-primary mb-3 md:mb-6"
        >
      Healthcare should move with you.
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-gray-600 text-lg leading-relaxed mb-8"
        >
        Your medical history shouldn't be locked inside one hospital or clinic. Whether you're changing doctors, traveling, or seeking a second opinion, Mednoris gives you one secure place to manage your records and connect with verified healthcare professionals, while keeping you in control of who can access your information.
        </motion.p>
        <Link
          href="/about"
          className="text-brand-secondary font-bold uppercase tracking-wider text-sm border-b-2 border-brand-accent pb-1 hover:text-brand-primary transition-colors"
        >
          About Mednoris
        </Link>
      </div>

      <div className="flex-1 flex flex-col gap-8">
        {[
          { icon: ShieldCheck, title: "Secure Medical Records", desc: "Patients securely store their medical history in one place and choose when doctors can access it." },
          { icon: BadgeCheck, title: "Verified Doctors", desc: "Doctors build trusted profiles, manage appointments, and provide consultations to patients locally and across borders." },
          { icon: LockKeyhole, title: "Privacy by Default", desc: "Every record is encrypted, access is approved by the patient, and every action is recorded for transparency." }
        ].map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-6 items-start"
          >
            <div className="w-16 h-16 shrink-0 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <item.icon size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-brand-primary mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
