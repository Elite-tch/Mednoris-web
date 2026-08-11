"use client";

import { motion } from "framer-motion";
import { FileWarning, QrCode, Smartphone, FileImage } from "lucide-react";

const features = [
  {
    icon: <FileImage className="text-brand-primary w-8 h-8" />,
    title: "Authenticity Preserved",
    description: "Unlike OCR tools that convert to text, we store high-quality scans. Doctors can verify letterheads, stamps, and original formatting.",
  },
  {
    icon: <QrCode className="text-brand-primary w-8 h-8" />,
    title: "QR-Based Portability",
    description: "Patients carry their records on a physical ID card. No logins, no passwords, no hassle.",
  },
  {
    icon: <Smartphone className="text-brand-primary w-8 h-8" />,
    title: "No Smartphone Required",
    description: "Built for reality. Our system works seamlessly even for patients with zero digital literacy or smartphone access.",
  },
];

export default function ProblemSolution() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 md:px-12 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-primary mb-6">
            The Paper Record Problem, Solved.
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Hospitals lose countless hours managing paper files. Traditional digitization often strips away document authenticity, or expects patients to manage complex apps. Layer 2 changes the paradigm.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-[#f8f7fb] rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-brand-primary mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
