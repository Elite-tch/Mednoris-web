"use client";
import { motion } from "framer-motion";

export default function StatsBar() {
  const stats = [
    { number: "100K+", label: "Encrypted Vaults" },
    { number: "50+", label: "Countries Supported" },
    { number: "10K+", label: "Verified Doctors" },
    { number: "0", label: "Data Breaches" }
  ];

  return (
    <section className="bg-[#2a2a2a] py-16 px-8 text-white border-y-4 border-brand-accent">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col gap-2"
          >
            <span className="text-4xl md:text-5xl font-bold text-white">{stat.number}</span>
            <span className="text-brand-accent uppercase tracking-widest text-sm font-bold">{stat.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
