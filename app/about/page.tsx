"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Briefcase, Calendar, Globe, Building, Target, Mail } from "lucide-react";
import Toast, { ToastType } from "@/components/ui/Toast";
import { FaTwitter } from "react-icons/fa";
export default function AboutPage() {
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handlePartnerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      organizationName: formData.get("organizationName"),
      website: formData.get("website"),
      contactPerson: formData.get("contactPerson"),
      workEmail: formData.get("workEmail"),
      organizationType: formData.get("organizationType"),
      country: formData.get("country"),
      areasOfInterest: formData.getAll("areasOfInterest"),
      about: formData.get("about"),
      envision: formData.get("envision"),
      additionalInfo: formData.get("additionalInfo")
    };

    try {
      const res = await fetch("/api/partnership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        setToast({ message: "Application submitted successfully! We'll be in touch soon.", type: "success" });
        setShowPartnerForm(false);
      } else {
        setToast({ message: "Failed to submit application. Please try again.", type: "error" });
      }
    } catch (error) {
      console.error(error);
      setToast({ message: "An unexpected error occurred. Please try again.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f7fb] font-serif text-gray-800 pb-20">
      
      {/* 1. Hero Section */}
      <section className="relative w-full h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Brand Color Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80" 
            alt="Healthcare professionals" 
            className="w-full h-full object-cover"
          />
          {/* Brand Primary Color Overlay */}
          <div className="absolute inset-0 bg-black/60 "></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold text-white mb-3 leading-tight"
          >
            About Mednoris
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-gray-200 leading-relaxed max-w-3xl mx-auto"
          >
            Mednoris is creating a privacy-first healthcare platform where patients stay in control of their medical information and healthcare professionals can deliver secure, trusted care through one connected experience.
          </motion.p>
        </div>
      </section>

      {/* 2. Our Story */}
      <section className="py-10 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-brand-primary mb-4">Our Story</h2>
              </div>
        <div className="grid md:grid-cols-2 grid-cols-1 md:gap-20 ">
           <div className="mb-10 ">
             <h3 className="text-2xl mb-2 text-brand-secondary font-bold">Why We Started Mednoris</h3>
         <div className="prose prose-lg mx-auto text-gray-600 space-y-6 leading-relaxed ">
          <p>
            Healthcare is one of the most important parts of our lives, yet managing medical records remains unnecessarily difficult. Patients often move between hospitals, clinics, laboratories, and specialists, leaving their medical history scattered across different systems. This fragmentation creates delays, repeated tests, and limited visibility into who can access sensitive health information.
          </p>
          <p>
            Mednoris was founded to change that. By combining patient-controlled medical records, verified healthcare professionals, appointment booking, and secure consultations into one platform, we're building a more connected and transparent healthcare experience.
          </p>
        </div>
        
        </div>
    <div className="mb-10 ">
        <div className="prose prose-lg mx-auto text-gray-600 space-y-6 leading-relaxed ">
          <p>
            At Mednoris, we believe healthcare should be built around people, not fragmented systems. Every decision we make is guided by a commitment to privacy, trust, and patient empowerment.
          </p>
        </div>
        <div>
            <h4 className="text-2xl mt-8 mb-2 text-brand-secondary font-bold">
              Our Mission
            </h4>
            <div className="prose prose-lg mx-auto text-gray-600 space-y-6 leading-relaxed ">
              <p>
                To empower patients with secure ownership of their medical information, while equipping healthcare professionals with the right data at the right time. By replacing fragmented systems with a unified, privacy-first platform, we remove the barriers to accessing quality care and foster trust between doctors and patients.
              </p>
            </div>
        </div>


    </div>
          
        </div>
        <div>
              <h4 className="text-2xl mb-2 text-brand-secondary font-bold">
                Our Vision
              </h4>
              <div className="prose prose-lg mx-auto text-gray-600 space-y-6 leading-relaxed ">
                <p>
                We envision a future where healthcare is connected, secure, and accessible regardless of location. A future where patients no longer worry about losing access to their medical history, where healthcare professionals can collaborate with confidence, and where privacy is built into every interaction from the very beginning.
              </p>
              <p>
                As Mednoris grows, we aspire to become a trusted healthcare platform that supports individuals throughout every stage of their healthcare journey while embracing new technologies that make healthcare safer, more transparent, and more accessible around the world.
              </p>
              </div>
            </div>
      </section>

      

      {/* 4. Meet the Team */}
      <section className="py-10 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-brand-primary mb-4">Meet the Team</h2>
              <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Every great product starts with people who believe there's a better way to solve a problem. Mednoris is being built by a small but dedicated team that shares a common vision, creating a healthcare platform where privacy, trust, and patient ownership are at the center of every decision.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 w-[95%] md:w-[80%] mx-auto">
          {/* Johnbosco */}
          <div className="bg-white p-8 rounded-xl shadow border border-gray-100 flex flex-col items-center text-center transition-shadow">
            <div className="w-60 h-60 rounded-full bg-brand-primary/10 mb-3 overflow-hidden border-4 border-white shadow-lg">
              {/* Placeholder image until a real one is provided */}
              <img src="/izu1.jpg" alt="Johnbosco Izuchukwu" className="w-full h-full object-cover" />
            </div>
            <h4 className="text-2xl font-bold text-brand-primary mb-2">Johnbosco Izuchukwu</h4>
            <p className="text-brand-secondary font-bold text-sm mb-2">Founder & Lead Developer</p>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              Leading the technical architecture and privacy-preserving infrastructure that powers the Mednoris platform.
            </p>
            <div className="flex items-center justify-end w-[95%] gap-4 mt-auto">
              <a href="https://x.com/IzuchukwuJ99034" aria-label="Twitter" className="text-gray-400 hover:text-brand-primary transition-colors">
                <FaTwitter className="w-5 h-5" />
              </a>
              <a  href="mailto:izuchukwujohnbosco95@gmail.com" aria-label="Email" className="text-gray-400 hover:text-brand-primary transition-colors">
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Kendra */}
          <div className="bg-white p-8 rounded-xl shadow border border-gray-100 flex flex-col items-center text-center transition-shadow">
            <div className="w-60 h-60 rounded-full bg-brand-primary/10 mb-3 overflow-hidden border-4 border-white shadow-lg">
              {/* Placeholder image until a real one is provided */}
              <img src="/ken.jpg" alt="Kendra Chidimma" className="w-full h-full object-cover" />
            </div>
            <h4 className="text-2xl font-bold text-brand-primary mb-2">Kendra Chidimma</h4>
            <p className="text-brand-secondary font-bold text-sm mb-2">Co-Founder, Community & Content Lead</p>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              Driving our brand communication, content strategy, and community growth to build awareness around privacy-first healthcare.
            </p>
            <div className="flex items-center gap-4 justify-end w-[95%] mt-auto">
              <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-brand-primary transition-colors">
                <FaTwitter className="w-5 h-5" />
              </a>
              <a  href="mailto:kendrachidimma52@gmail.com" aria-label="Email" className="text-gray-400 hover:text-brand-primary transition-colors">
                <Mail size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Partnerships */}
      <section className=" py-10 px-4 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-brand-primary mb-2">Partnerships</h2>
          <h3 className="text-xl text-brand-secondary font-bold mb-4">Let's Build the Future of Healthcare Together</h3>
          
          <div className="text-gray-600 leading-relaxed mb-12 space-y-6 text-left">
            <p>
              At Mednoris, we believe meaningful innovation happens through collaboration. Healthcare is a complex and evolving industry, and building solutions that create lasting impact requires working alongside organizations that share our commitment to improving patient care, advancing privacy, and making healthcare more accessible.
            </p>
            <p>
              We're always open to exploring strategic partnerships with healthcare institutions, technology companies, research organizations, privacy-focused infrastructure providers, and organizations whose expertise can help shape the future of digital healthcare.
            </p>
          </div>

          <div className="bg-[#f8f7fb] p-8 rounded-3xl mb-12 border border-gray-200">
            <h4 className="text-xl font-bold text-brand-primary mb-6">Partnership Opportunities</h4>
            <div className="flex flex-wrap justify-center gap-3">
              {['Healthcare Providers & Hospitals', 'Health Technology Companies', 'Privacy & Security Infrastructure', 'Research & Academic Institutions', 'Government & Public Health Organizations', 'Strategic Innovation Partners'].map((tag, i) => (
                <span key={i} className="px-4 py-2 bg-white border border-brand-primary/20 text-brand-primary rounded-full text-sm font-semibold shadow-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-2xl font-bold text-brand-primary mb-4">Ready to Start the Conversation?</h4>
            <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
              If you're interested in partnering with Mednoris, we'd be happy to learn more about your organization and explore opportunities to work together.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => setShowPartnerForm(true)}
                className="w-full sm:w-auto px-8 py-4 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Briefcase size={20} />
                Become a Partner
              </button>
              
             
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Application Modal */}
      <AnimatePresence>
        {showPartnerForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowPartnerForm(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
                <div>
                  <h3 className="text-xl font-extrabold text-brand-primary">Partnership Application</h3>
                  <p className="text-xs text-gray-500 mt-1">Tell us about your organization and vision.</p>
                </div>
                <button 
                  onClick={() => setShowPartnerForm(false)}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto p-6">
                <form className="space-y-6" onSubmit={handlePartnerSubmit}>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Organization Name</label>
                      <input name="organizationName" required type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Website</label>
                      <input name="website" type="url" placeholder="https://" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Contact Person</label>
                      <input name="contactPerson" required type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Work Email</label>
                      <input name="workEmail" required type="email" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Organization Type</label>
                      <select name="organizationType" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-brand-secondary">
                        <option value="">Select type...</option>
                        <option value="provider">Healthcare Provider</option>
                        <option value="tech">Technology Company</option>
                        <option value="research">Research / Academic</option>
                        <option value="investor">Investment Firm</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Country</label>
                      <input name="country" required type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">Area of Interest (Select all that apply)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {['Technology Integration', 'Healthcare Partnership', 'Research', 'Infrastructure', 'Investment', 'Other'].map(interest => (
                        <label key={interest} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                          <input name="areasOfInterest" value={interest} type="checkbox" className="rounded text-brand-secondary focus:ring-brand-secondary accent-brand-secondary w-4 h-4" />
                          {interest}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Tell us about your organization</label>
                    <textarea name="about" required rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary resize-none"></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">How do you envision working with Mednoris?</label>
                    <textarea name="envision" required rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary resize-none"></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Additional Information <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <textarea name="additionalInfo" rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary resize-none"></textarea>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                    <button type="button" disabled={isSubmitting} onClick={() => setShowPartnerForm(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl font-bold text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed">
                      {isSubmitting ? "Sending..." : "Submit Application"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </main>
  );
}
