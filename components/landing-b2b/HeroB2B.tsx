"use client";

import { motion } from "framer-motion";
import { ArrowRight, Building2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function HeroB2B() {
  return (
    <section
      className="relative overflow-hidden text-brand-primary py-15 md:py-10  bg-[#e1d6f6]"
    >
      <div className="container mx-auto pl-6 md:pl-12 relative z-10 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Digitize Hospital Records. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-secondary">
                No Patient App Required.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-brand-primary/80 mb-10 leading-relaxed max-w-xl">
              Transition your hospital from vulnerable, paper-based systems to a secure, digitized infrastructure. Maintain full ownership of your records with granular audit trails, while giving patients seamless portability via physical QR cards.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/for-hospitals/demo"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-primary text-white rounded-full font-bold hover:bg-brand-secondary transition-all shadow-lg hover:shadow-xl"
              >
                Request a demo
                <ArrowRight size={20} />
              </Link>

            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative w-full aspect-square max-w-[650px] mx-auto flex items-center justify-center">
              <Image
                src="/b2b.png"
                alt="Mednoris B2B Interface"
                width={600}
                height={600}
                className="w-full h-auto "
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
