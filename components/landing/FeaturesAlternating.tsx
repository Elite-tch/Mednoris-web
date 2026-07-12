"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Stethoscope,
  Fingerprint,
  BookHeart,
  ClipboardCheck,
  Video,
  BrainCircuit,
  TrendingUp,
} from "lucide-react";

type Audience = "patients" | "doctors";

interface Feature {
  title: string;
  desc: string;
  icon: React.ReactNode;
}

const featureData: Record<Audience, Feature[]> = {
  patients: [
    {
      icon: <ShieldCheck size={28} strokeWidth={1.5} />,
      title: "Secure Medical Records",
      desc: "Keep all your medical records in one secure place. Share only what a doctor needs, approve every request yourself, and let access expire automatically after your consultation.",
    },
    {
      icon: <Stethoscope size={28} strokeWidth={1.5} />,
      title: "Find Verified Doctors",
      desc: "Browse licensed doctors from around the world, compare specialties, reviews, languages, consultation fees, and available appointment times before booking.",
    },
    {
      icon: <Fingerprint size={28} strokeWidth={1.5} />,
      title: "Private Record Sharing",
      desc: "Every shared record is protected with dynamic watermarking and time-limited access, helping keep your medical information private.",
    },
    {
      icon: <BookHeart size={28} strokeWidth={1.5} />,
      title: "Medical Passport",
      desc: "Create a portable health summary that can be shared during emergencies or while travelling, giving healthcare providers quick access to important medical information.",
    },
  ],
  doctors: [
    {
      icon: <ClipboardCheck size={28} strokeWidth={1.5} />,
      title: "Patient-Approved Access",
      desc: "Request access to a patient's medical history directly through Mednoris. Patients decide what you can view and how long access remains available.",
    },
    {
      icon: <Video size={28} strokeWidth={1.5} />,
      title: "Online Consultations",
      desc: "Conduct secure video, voice, and chat consultations from one platform, with access to the information you need to deliver better care.",
    },
    {
      icon: <BrainCircuit size={28} strokeWidth={1.5} />,
      title: "AI Assistant",
      desc: "Spend less time on documentation. AI helps organize consultation notes and summarize patient history so you can focus on care.",
    },
    {
      icon: <TrendingUp size={28} strokeWidth={1.5} />,
      title: "Grow Your Practice",
      desc: "Build a verified profile, reach patients globally, receive reviews, and increase your visibility with featured listings.",
    },
  ],
};

const tabConfig = {
  patients: {
    label: "For Patients",
    pill: "bg-brand-secondary text-white",
    inactive: "text-primary hover:text-brand-secondary",
    iconBg: "bg-brand-secondary/10 text-brand-secondary",
    border: "hover:border-brand-secondary",
    badge: "bg-brand-secondary/10 text-brand-secondary",
  },
  doctors: {
    label: "For Doctors",
    pill: "bg-brand-primary text-white",
    inactive: "text-primary hover:text-brand-primary",
    iconBg: "bg-brand-primary/10 text-brand-primary",
    border: "hover:border-brand-primary",
    badge: "bg-brand-primary/10 text-brand-primary",
  },
};

export default function FeaturesAlternating() {
  const [active, setActive] = useState<Audience>("patients");
  const features = featureData[active];
  const cfg = tabConfig[active];

  return (
    <section id="features" className="md:py-14 py-8 px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
        {/* Left: text */}
        <div>
          <p className="text-brand-secondary uppercase tracking-widest text-sm font-bold mb-3">
            Everything You Need
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-brand-primary mb-3">
           Built for patients.<span className="text-secondary">Trusted by doctors. </span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl">
           From secure medical records to trusted doctor consultations, Mednoris brings everything together while keeping your privacy in your hands.
          </p>
        </div>

        {/* Right: Tab Switcher */}
        <div className="inline-flex items-center border  border-secondary rounded-full p-1.5 gap-1 shrink-0">
          {(Object.keys(tabConfig) as Audience[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer ${
                active === tab ? tabConfig[tab].pill : tabConfig[tab].inactive
              }`}
            >
              {tabConfig[tab].label}
            </button>
          ))}
        </div>
      </div>

      {/* Animated Feature Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch"
        >
          {features.map((feat, i) => (
            <motion.div
              key={i}
             
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: i * 0.08 }}
              className={`group flex flex-col h-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${cfg.border}`}
            >

              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors duration-300 ${cfg.iconBg}`}>
                {feat.icon}
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-brand-primary mb-2 leading-snug">
                {feat.title}
              </h3>

              {/* Desc — grows to fill remaining height so all cards align at bottom */}
              <p className="text-gray-500 text-md leading-relaxed flex-1">
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
