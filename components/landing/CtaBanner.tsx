"use client";
import { motion } from "framer-motion";
import { usePrivy } from '@privy-io/react-auth';

export default function CtaBanner() {
  const { login } = usePrivy();
  return (
    <section className="bg-brand-primary py-16 px-8 text-center text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('/pattern.svg')]"></div>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6"
      >
        <h2 className="text-3xl md:text-4xl md:w-lg font-bold">
Own your records. Connect with trusted doctors.
</h2>

<p className="text-gray-300 text-lg">
Store your medical records securely, book consultations with verified doctors, and stay in control of who can access your health information, all in one privacy-first platform.
</p>

<button
  onClick={login}
  className="px-8 py-3 bg-secondary text-white font-bold rounded-full hover:scale-105 transition-transform mt-4 shadow-lg cursor-pointer"
>
  Create Free Account
</button>
      </motion.div>
    </section>
  );
}
