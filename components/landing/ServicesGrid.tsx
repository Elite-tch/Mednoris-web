"use client";
import { motion } from "framer-motion";
import {
  UserPlus,
  FolderUp,
  Search,
  ShieldCheck,
  BadgeCheck,
  CalendarClock,
  FileSearch,
  ClipboardPlus,
} from "lucide-react";

const patientSteps = [
  {
    icon: UserPlus,
    title: "Create your account",
    desc: "Set up your secure Mednoris profile.",
  },
  {
    icon: FolderUp,
    title: "Upload your medical records",
    desc: "Store reports, prescriptions, scans, and vaccination history in one place.",
  },
  {
    icon: Search,
    title: "Find a verified doctor",
    desc: "Search by specialty, language, country, or availability.",
  },
  {
    icon: ShieldCheck,
    title: "Share records securely",
    desc: "Approve access only for the consultation, and let it expire automatically.",
  },
];

const doctorSteps = [
  {
    icon: BadgeCheck,
    title: "Create a verified doctor profile",
    desc: "Upload your license, credentials, and practice information for verification.",
  },
  {
    icon: CalendarClock,
    title: "Set your availability",
    desc: "Choose your consultation hours, fees, and specialties.",
  },
  {
    icon: FileSearch,
    title: "Request patient-approved access",
    desc: "View only the records a patient chooses to share with you.",
  },
  {
    icon: ClipboardPlus,
    title: "Consult and update records",
    desc: "Conduct secure consultations and upload prescriptions, notes, and treatment plans directly to the patient's vault.",
  },
];

interface Step {
  icon: React.ElementType;
  title: string;
  desc: string;
}

function StepCard({
  step,
  index,
  accent,
}: {
  step: Step;
  index: number;
  accent: "secondary" | "secondary";
}) {
  const Icon = step.icon;
  const colors =
    accent === "secondary"
      ? {
          num: "text-brand-secondary",
          iconBg: "bg-secondary ",
          connector: "bg-[#c8ccda]",
        }
      : {
          num: "text-white",
          iconBg: "bg-white text-primary",
          connector: "bg-brand-primary/20",
        };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: index * 0.1 }}
      className="flex gap-4"
    >
      {/* Left: number + connector line */}
      <div className="flex flex-col items-center">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 ${colors.iconBg}`}
        >
          {String(index + 1).padStart(2, "0")}
        </div>
        {index < 3 && (
          <div className={`w-0.5 flex-1 mt-2 mb-0 min-h-12 ${colors.connector}`} />
        )}
      </div>

      {/* Right: content */}
      <div className="">
        
        <h4 className="text-base font-bold text-white mb-1">
          {step.title}
        </h4>
        <p className="text-[#c8ccda]  text-sm leading-relaxed">{step.desc}</p>
      </div>
    </motion.div>
  );
}

export default function ServicesGrid() {
  return (
    <section id="how-it-works" className="md:py-14 py-6 md:px-12 px-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <p className="text-brand-secondary uppercase tracking-widest text-sm font-bold mb-3">
          How It Works
        </p>
        <h2 className="text-3xl md:text-5xl md:w-3xl mx-auto font-bold leading-tight text-brand-primary mb-4">
          Simple for patients.{" "}
          <span className="text-brand-secondary">Powerful for doctors.</span>
        </h2>
        <p className="text-gray-500 text-lg mx-auto max-w-2xl">
          Mednoris connects patients and verified healthcare professionals
          through secure medical records, private consultations, and
          patient-controlled access.
        </p>
      </div>

      {/* Two-column step layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 md:w-[90%] mx-auto">
        {/* Patients Column */}
        <div className="bg-primary p-8 ">
          <div className="flex items-center gap-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-white inline-block" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">
              For Patients
            </h3>
          </div>
          <div>
            {patientSteps.map((step, i) => (
              <StepCard key={i} step={step} index={i} accent="secondary" />
            ))}
          </div>
        </div>

        {/* Doctors Column */}
        <div className="bg-primary p-8">
          <div className="flex items-center gap-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-gray-100 inline-block" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">
              For Doctors
            </h3>
          </div>
          <div>
            {doctorSteps.map((step, i) => (
              <StepCard key={i} step={step} index={i} accent="secondary" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
