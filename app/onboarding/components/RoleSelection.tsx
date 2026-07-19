import { motion } from "framer-motion";
import { User, Stethoscope } from "lucide-react";

export default function RoleSelection({
  onSelect,
}: {
  onSelect: (role: "patient" | "doctor") => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl text-center"
    >
      <h1 className="text-4xl md:text-5xl font-extrabold text-brand-primary mb-4">
        Welcome to Mednoris
      </h1>
      <p className="text-gray-500 text-lg mb-12">
        To get started, please tell us how you will be using the platform.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => onSelect("patient")}
          className="group flex flex-col items-center justify-center p-8 bg-white border-2 border-gray-100 rounded-3xl shadow-sm hover:border-brand-secondary hover:shadow-md transition-all cursor-pointer"
        >
          <div className="w-16 h-16 bg-brand-secondary/10 rounded-2xl flex items-center justify-center text-brand-secondary mb-6 group-hover:scale-110 transition-transform">
            <User size={32} />
          </div>
          <h3 className="text-xl font-bold text-brand-primary mb-2">
            I am a Patient
          </h3>
          <p className="text-gray-500 text-sm">
            I want to store my medical records and connect with doctors.
          </p>
        </button>

        <button
          onClick={() => onSelect("doctor")}
          className="group flex flex-col items-center justify-center p-8 bg-white border-2 border-gray-100 rounded-3xl shadow-sm hover:border-brand-primary hover:shadow-md transition-all cursor-pointer"
        >
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
            <Stethoscope size={32} />
          </div>
          <h3 className="text-xl font-bold text-brand-primary mb-2">
            I am a Doctor
          </h3>
          <p className="text-gray-500 text-sm">
            I want to consult with patients and manage their records.
          </p>
        </button>
      </div>
    </motion.div>
  );
}
