"use client";
import { motion } from "framer-motion";

export default function Newsletter() {
  return (
    <section className="bg-brand-secondary py-16 px-8 relative overflow-hidden flex items-center justify-center">
      <div className="max-w-5xl w-full flex flex-col md:flex-row items-center justify-between gap-8 z-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="text-white flex-1"
        >
          <h2 className="text-2xl font-bold mb-2">Subscribe to our Medical Newsletter</h2>
          <p className="text-gray-300">Get the latest updates on digital health and privacy.</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex-1 w-full max-w-md flex"
        >
          <input 
            type="email" 
            placeholder="Email Address" 
            className="flex-1 px-6 py-3 rounded-l-full focus:outline-none text-brand-primary"
          />
          <button className="px-8 py-3 bg-brand-accent text-brand-primary font-bold rounded-r-full hover:opacity-90 transition-opacity cursor-pointer">
            Subscribe
          </button>
        </motion.div>
      </div>
    </section>
  );
}
