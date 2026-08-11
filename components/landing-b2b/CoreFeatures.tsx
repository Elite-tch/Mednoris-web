"use client";

import { motion } from "framer-motion";
import { FileScan, Key, Search, Network } from "lucide-react";

const features = [
  {
    icon: <FileScan size={32} />,
    title: "Rapid Digitization",
    description: "Empower your staff with an intuitive interface to securely scan and attach physical documents to a patient's internal profile.",
  },
  {
    icon: <Network size={32} />,
    title: "Seamless Portability",
    description: "Patients can carry their medical history between facilities using a simple, physical, scannable QR-coded ID card.",
  },
  {
    icon: <Key size={32} />,
    title: "Trust-Tier Access",
    description: "4-Tier access model ensures only verified Mednoris hospitals or approved external professionals can view records.",
  },
  {
    icon: <Search size={32} />,
    title: "Granular Audit Trails",
    description: "Every record view, creation, modification, and deletion is immutably logged for total hospital accountability.",
  }
];

export default function CoreFeatures() {
  return (
    <section className="py-24 bg-[#f8f7fb]">
      <div className="container mx-auto px-6 md:px-12 max-w-7xl">
        <div className="flex flex-col md:flex-row gap-12 items-center mb-16">
          <div className="md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-primary mb-6">
              Built for Healthcare Realities
            </h2>
            <p className="text-lg text-gray-600">
              We designed Layer 2 to address the specific needs of underserved and rural healthcare facilities. It's fast, secure, and doesn't require sweeping behavioral changes from your patients.
            </p>
          </div>
          <div className="md:w-1/2 grid grid-cols-2 gap-4">
             {/* Decorative grid elements */}
             {[1, 2, 3, 4].map((i) => (
               <div key={i} className={`h-24 rounded-xl ${i % 2 === 0 ? 'bg-brand-primary/10' : 'bg-brand-accent/10'}`}></div>
             ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-shadow border-t-4 border-brand-accent"
            >
              <div className="text-brand-accent mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-brand-primary mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
