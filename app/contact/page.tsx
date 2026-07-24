"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, Loader2 } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import Toast, { ToastType } from "@/components/ui/Toast";


export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setToast({ message: "Message sent! We'll get back to you soon.", type: "success" });
        (e.target as HTMLFormElement).reset();
      } else {
        setToast({ message: "Failed to send message. Please try again.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "An unexpected error occurred. Please try again.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      
      <main className="min-h-screen bg-[#f8f7fb] font-serif text-gray-800">

        {/* Hero */}
        <section className="relative w-full py-24 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80"
              alt="Contact Mednoris"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>

          <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight"
            >
              Get in Touch
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-base md:text-lg text-white/80 leading-relaxed max-w-2xl mx-auto"
            >
              Have a question, partnership inquiry, or want to learn more about Mednoris? We&apos;d be happy to hear from you.
            </motion.p>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16 px-4 max-w-5xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 items-start">

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-3 bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
            >
              <h2 className="text-2xl font-extrabold text-brand-primary mb-1">Send a Message</h2>
              <p className="text-sm text-gray-500 mb-8">We typically respond within 1–2 business days.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Name</label>
                    <input
                      name="name"
                      required
                      type="text"
                      placeholder="Your full name"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Email</label>
                    <input
                      name="email"
                      required
                      type="email"
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Subject</label>
                  <input
                    name="subject"
                    required
                    type="text"
                    placeholder="What is this about?"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Message</label>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    placeholder="Tell us how we can help..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2 flex flex-col gap-6"
            >
              {/* Email */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <Mail size={20} className="text-brand-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email Us</p>
                  <a
                    href="mailto:hello.mednoristeam@gmail.com"
                    className="text-brand-primary font-bold text-sm hover:text-brand-secondary transition-colors break-all"
                  >
                    hello.mednoristeam@gmail.com
                  </a>
                </div>
              </div>

              {/* X / Twitter */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <FaXTwitter size={20} className="text-brand-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Follow on X</p>
                  <a
                    href="https://x.com/mednoris"
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-primary font-bold text-sm hover:text-brand-secondary transition-colors"
                  >
                   @MednorisHQ
                  </a>
                </div>
              </div>

              {/* Info card */}
              <div className="bg-brand-primary rounded-3xl p-6 text-white">
                <h3 className="font-extrabold text-lg mb-2">Building together</h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  Whether you&apos;re a healthcare professional, institution, or someone curious about what we&apos;re building — we&apos;re always open to conversations.
                </p>
              </div>
            </motion.div>

          </div>
        </section>

      </main>
     

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
