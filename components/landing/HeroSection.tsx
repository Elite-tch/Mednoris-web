"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { ShieldCheck, BadgeCheck, LockKeyhole } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
export default function HeroSection() {
  const { login } = usePrivy();
  return (
    <section className="relative bg-[#dedaee] md:bg-transparent w-full h-[90vh] flex items-center justify-center overflow-hidden ">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="z-10  md:max-w-3xl md:px-0 px-5 md:pl-10 pt-[12%] md:pt-10 flex flex-col ">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl  font-bold text-brand-primary leading-tight mb-6"
          >
            Your Medical Records, Always in Your Control.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-lg mb-10 text-gray-700 md:max-w-2xl"
          >
            Store your health records securely, connect with verified healthcare professionals worldwide, and share your medical history only when you choose. One secure platform for lifelong healthcare.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button
              onClick={login}
              className="px-6 py-3 bg-brand-primary text-white text-md rounded-full shadow-lg shadow-brand-accent/20 cursor-pointer"
            >
              Get Started
            </button>
            <a
                href="#how-it-works"
                className="px-6 py-3 border-2 text-center border-primary text-primary font-bold rounded-full hover:bg-white hover:text-brand-primary transition-all cursor-pointer"
              >
                How It Works
              </a>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col md:flex-row md:items-center gap- md:gap-6 mt-8 "
          >
            {[
              { icon: <ShieldCheck />, label: "Patient-Owned Medical Records" },
              { icon: <BadgeCheck />, label: "Verified Doctors" },
              { icon:  <LockKeyhole />, label: "Privacy-First Security" },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-8 h-8 flex items-center justify-center text-brand-primary text-base">
                  {badge.icon}
                </span>
                <span className="font-mediu leading-4 text-gray-600">{badge.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="flex-1 md:block hidden mt-[-20px]">
          <img src="/hero.png" alt="Hero" />
        </div>

      </div>
    </section>
  );
}
