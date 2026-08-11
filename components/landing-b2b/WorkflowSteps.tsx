"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Register & Scan",
    description: "Receptionist enters basic patient details and scans any existing paper records or lab results directly into the secure portal.",
  },
  {
    number: "02",
    title: "Generate QR Card",
    description: "The system instantly generates a unique internal Patient ID and QR code, printed on a durable physical card for the patient.",
  },
  {
    number: "03",
    title: "Patient Carries Card",
    description: "The patient leaves with their card. No app download, no account creation, no passwords required.",
  },
  {
    number: "04",
    title: "Cross-Hospital Access",
    description: "Upon visiting another verified facility, the QR card is scanned to request temporary, read-only access to their medical history.",
  }
];

export default function WorkflowSteps() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 md:px-12 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-primary mb-6">
            How the Mednoris Record Ecosystem Works
          </h2>
          <p className="text-lg text-gray-600">
            A frictionless workflow designed to replace your paper archives without slowing down your reception or clinical staff.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gray-100 -z-10"></div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative"
              >
                <div className="w-24 h-24 rounded-full bg-[#f8f7fb] border-4 border-white flex items-center justify-center text-3xl font-bold text-brand-accent shadow-lg mb-8 mx-auto md:mx-0">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-brand-primary mb-4 text-center md:text-left">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-center md:text-left leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
