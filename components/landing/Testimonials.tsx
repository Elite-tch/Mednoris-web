"use client";
import { motion } from "framer-motion";

export default function Testimonials() {
  return (
    <section className="bg-gray-100 py-24 px-8 text-center flex flex-col items-center">
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl font-bold text-brand-primary mb-12 uppercase tracking-widest"
      >
        Patient Stories
      </motion.h2>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative max-w-2xl bg-white p-10 rounded-3xl shadow-xl mb-8"
      >
        <div className="absolute -top-6 -left-6 text-6xl text-brand-accent opacity-50">&quot;</div>
        <p className="text-xl text-gray-700 italic relative z-10">
          For the first time in my life, I don't have to carry physical folders to every new specialist. Mednoris gives me total control, and the peace of mind knowing exactly who is looking at my records.
        </p>
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-brand-primary rounded-full"></div>
          <span className="font-bold text-brand-primary">Sarah Jenkins</span>
          <span className="text-sm text-gray-500">Verified Patient</span>
        </div>
      </motion.div>
    </section>
  );
}
