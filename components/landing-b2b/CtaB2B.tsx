"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CtaB2B() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Decorative background circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-3xl -z-10"></div>
      
      <div className="container mx-auto px-6 md:px-12 max-w-4xl text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-brand-primary mb-8">
          Ready to modernize your medical records?
        </h2>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Join the growing network of hospitals securing their future with Mednoris Layer 2 infrastructure. Request a demo to see it in action.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/for-hospitals/demo"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-primary text-white rounded-full font-bold hover:bg-brand-secondary transition-colors w-full sm:w-auto"
          >
            Request a Demo
            <ArrowRight size={20} />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 text-brand-primary rounded-full font-bold hover:bg-gray-200 transition-colors w-full sm:w-auto"
          >
            Contact Sales
          </Link>
        </div>
      </div>
    </section>
  );
}
