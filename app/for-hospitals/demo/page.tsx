"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Users,
  FileText,
  MessageSquare,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const FACILITY_TYPES = ["Hospital", "Clinic", "Diagnostic Center", "Specialist Practice", "Other"];
const RECORD_METHODS = ["Fully paper-based", "Partially digital", "Full EHR system", "Other"];
const PATIENT_VOLUMES = ["< 100 / month", "100 – 500 / month", "500+ / month"];
const HOW_HEARD = [
  "Google / Search",
  "Social Media",
  "Referred by a colleague",
  "Conference / Event",
  "News / Article",
  "Other",
];

type FormState = {
  // Basic Contact Info
  hospitalName: string;
  contactName: string;
  role: string;
  email: string;
  phone: string;
  // Facility Context
  facilityType: string[];
  city: string;
  stateRegion: string;
  country: string;
  staffCount: string;
  // Current State
  recordMethod: string[];
  usesEhr: string;
  ehrName: string;
  patientVolume: string;
  // Intent / Fit
  biggestChallenge: string;
  howHeard: string;
  // Optional
  preferredDate: string;
  comments: string;
};

const INITIAL: FormState = {
  hospitalName: "",
  contactName: "",
  role: "",
  email: "",
  phone: "",
  facilityType: [],
  city: "",
  stateRegion: "",
  country: "",
  staffCount: "",
  recordMethod: [],
  usesEhr: "",
  ehrName: "",
  patientVolume: "",
  biggestChallenge: "",
  howHeard: "",
  preferredDate: "",
  comments: "",
};

function CheckboxGroup({
  options,
  selected,
  onChange,
  error,
}: {
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
  error?: string;
}) {
  const toggle = (opt: string) => {
    onChange(
      selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt]
    );
  };
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              selected.includes(opt)
                ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                : error 
                  ? "bg-white text-gray-600 border-red-500 hover:border-red-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-brand-accent"
            }`}
          >
            {selected.includes(opt) && <CheckCircle2 size={14} className="inline mr-1.5 -mt-0.5" />}
            {opt}
          </button>
        ))}
      </div>
      {error && <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>}
    </div>
  );
}

function RadioGroup({
  options,
  selected,
  onChange,
  error,
}: {
  options: string[];
  selected: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              selected === opt
                ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                : error 
                  ? "bg-white text-gray-600 border-red-500 hover:border-red-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-brand-accent"
            }`}
          >
            {selected === opt && <CheckCircle2 size={14} className="inline mr-1.5 -mt-0.5" />}
            {opt}
          </button>
        ))}
      </div>
      {error && <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-brand-primary mb-2">{children}</label>;
}

function InputField({
  icon,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode; error?: string }) {
  return (
    <div>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        )}
        <input
          {...props}
          className={`w-full rounded-xl border bg-white py-3 text-sm text-brand-primary placeholder-gray-400 focus:ring-2 focus:outline-none transition ${
            icon ? "pl-10 pr-4" : "px-4"
          } ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-200 focus:border-brand-accent focus:ring-brand-accent/20"
          } ${props.className ?? ""}`}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>}
    </div>
  );
}

function Textarea({ error, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <div>
      <textarea
        {...props}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-brand-primary placeholder-gray-400 focus:ring-2 focus:outline-none transition resize-none ${
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
            : "border-gray-200 focus:border-brand-accent focus:ring-brand-accent/20"
        } ${props.className ?? ""}`}
      />
      {error && <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>}
    </div>
  );
}

function SectionHeading({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="w-9 h-9 rounded-full bg-brand-primary text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <h2 className="text-lg font-bold text-brand-primary">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function DemoRequestForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = (key: keyof FormState) => (val: string | string[]) => {
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Explicit validations
    const newErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.hospitalName.trim()) newErrors.hospitalName = "Hospital/Clinic Name is required.";
    if (!form.contactName.trim()) newErrors.contactName = "Contact Person Full Name is required.";
    if (!form.role.trim()) newErrors.role = "Role/Title is required.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
        newErrors.email = "Email Address is required.";
    } else if (!emailRegex.test(form.email)) {
        newErrors.email = "Please enter a valid email address.";
    }
    
    if (!form.phone.trim()) newErrors.phone = "Phone Number is required.";

    if (form.facilityType.length === 0) newErrors.facilityType = "Please select at least one Facility Type.";
    if (!form.city.trim()) newErrors.city = "City is required.";
    if (!form.stateRegion.trim()) newErrors.stateRegion = "State/Region is required.";
    if (!form.country.trim()) newErrors.country = "Country is required.";

    if (form.recordMethod.length === 0) newErrors.recordMethod = "Please select a Current Record-Keeping Method.";
    if (!form.patientVolume) newErrors.patientVolume = "Please select an Approximate Patient Volume.";

    if (!form.biggestChallenge.trim()) newErrors.biggestChallenge = "Please describe your biggest challenge.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // 1. Save to Firestore
      const docRef = await addDoc(collection(db, "hospital_demo_requests"), {
        ...form,
        submittedAt: serverTimestamp(),
        status: "pending",
      });

      // 2. Send email notification
      await fetch("/api/notify-hospital-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, docId: docRef.id }),
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
      alert("Something went wrong. Please try again or contact us directly.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F5FD] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg text-center bg-white rounded-3xl p-12 shadow-lg border border-gray-100"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-brand-primary mb-4">Request Received!</h1>
          <p className="text-gray-600 leading-relaxed mb-8">
            Thank you, <strong>{form.contactName.split(" ")[0]}</strong>! We've received your demo
            request for <strong>{form.hospitalName}</strong>. Our team will be in touch within 1–2
            business days.
          </p>
          <Link
            href="/for-hospitals"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-full font-bold hover:bg-brand-secondary transition-colors"
          >
            Back to For Hospitals
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5FD]">
      {/* Page Header */}
      <div
        className="text-white py-14 h-[60vh] px-6 md:px-12 relative overflow-hidden"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0 bg-brand-primary/75 pointer-events-none" />
        <div className="container mx-auto max-w-4xl relative z-10">
          <Link
            href="/for-hospitals"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 transition-colors"
          >
            ← Back to For Hospitals
          </Link>
          
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Request a Demo</h1>
          <p className="text-white/75 text-lg max-w-2xl">
            Tell us about your facility. We'll review your request and schedule a personalised
            walkthrough of the Mednoris Hospital Records system.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto max-w-4xl px-4 md:px-6 py-12">
        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          {/* Section 1: Basic Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
          >
            <SectionHeading
              number="1"
              title="Basic Contact Information"
              subtitle="Who should we get in touch with?"
            />
            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Label>Hospital / Clinic Name *</Label>
                <InputField
                  icon={<Building2 size={16} />}
                  required
                  placeholder="e.g. St. Mary's General Hospital"
                  value={form.hospitalName}
                  onChange={(e) => set("hospitalName")(e.target.value)}
                  error={errors.hospitalName}
                />
              </div>
              <div>
                <Label>Contact Person Full Name *</Label>
                <InputField
                  icon={<User size={16} />}
                  required
                  placeholder="e.g. Dr. Ada Okafor"
                  value={form.contactName}
                  onChange={(e) => set("contactName")(e.target.value)}
                  error={errors.contactName}
                />
              </div>
              <div>
                <Label>Role / Title *</Label>
                <InputField
                  required
                  placeholder="e.g. Administrator, IT Lead, Owner"
                  value={form.role}
                  onChange={(e) => set("role")(e.target.value)}
                  error={errors.role}
                />
              </div>
              <div>
                <Label>Email Address *</Label>
                <InputField
                  icon={<Mail size={16} />}
                  type="email"
                  required
                  placeholder="you@hospital.com"
                  value={form.email}
                  onChange={(e) => set("email")(e.target.value)}
                  error={errors.email}
                />
              </div>
              <div>
                <Label>Phone Number (WhatsApp-friendly) *</Label>
                <InputField
                  icon={<Phone size={16} />}
                  type="tel"
                  required
                  placeholder="+234 801 234 5678"
                  value={form.phone}
                  onChange={(e) => set("phone")(e.target.value)}
                  error={errors.phone}
                />
              </div>
            </div>
          </motion.div>

          {/* Section 2: Facility Context */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
          >
            <SectionHeading
              number="2"
              title="Facility Context"
              subtitle="Helps us qualify and prepare for your demo."
            />
            <div className="space-y-6">
              <div>
                <Label>Facility Type *</Label>
                <CheckboxGroup
                  options={FACILITY_TYPES}
                  selected={form.facilityType}
                  onChange={set("facilityType")}
                  error={errors.facilityType}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-5">
                <div>
                  <Label>City *</Label>
                  <InputField
                    icon={<MapPin size={16} />}
                    required
                    placeholder="e.g. Abuja"
                    value={form.city}
                    onChange={(e) => set("city")(e.target.value)}
                    error={errors.city}
                  />
                </div>
                <div>
                  <Label>State / Region *</Label>
                  <InputField
                    required
                    placeholder="e.g. FCT"
                    value={form.stateRegion}
                    onChange={(e) => set("stateRegion")(e.target.value)}
                    error={errors.stateRegion}
                  />
                </div>
                <div>
                  <Label>Country *</Label>
                  <InputField
                    required
                    placeholder="e.g. Nigeria"
                    value={form.country}
                    onChange={(e) => set("country")(e.target.value)}
                    error={errors.country}
                  />
                </div>
              </div>
              <div>
                <Label>
                  Number of Staff Expected to Use the Platform{" "}
                  <span className="font-normal text-gray-400">(rough estimate)</span>
                </Label>
                <InputField
                  icon={<Users size={16} />}
                  type="number"
                  min={1}
                  placeholder="e.g. 15"
                  value={form.staffCount}
                  onChange={(e) => set("staffCount")(e.target.value)}
                />
              </div>
            </div>
          </motion.div>

          {/* Section 3: Current State */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
          >
            <SectionHeading
              number="3"
              title="Current Record-Keeping State"
              subtitle="Helps us scope the onboarding effort accurately."
            />
            <div className="space-y-6">
              <div>
                <Label>Current Record-Keeping Method *</Label>
                <CheckboxGroup
                  options={RECORD_METHODS}
                  selected={form.recordMethod}
                  onChange={set("recordMethod")}
                  error={errors.recordMethod}
                />
              </div>
              <div>
                <Label>Do you currently use an EHR system?</Label>
                <RadioGroup
                  options={["Yes", "No"]}
                  selected={form.usesEhr}
                  onChange={set("usesEhr")}
                />
              </div>
              {form.usesEhr === "Yes" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <Label>
                    Which EHR?{" "}
                    <span className="font-normal text-gray-400">(optional)</span>
                  </Label>
                  <InputField
                    placeholder="e.g. DHIS2, OpenMRS, proprietary system…"
                    value={form.ehrName}
                    onChange={(e) => set("ehrName")(e.target.value)}
                  />
                </motion.div>
              )}
              <div>
                <Label>Approximate Patient Volume *</Label>
                <RadioGroup
                  options={PATIENT_VOLUMES}
                  selected={form.patientVolume}
                  onChange={set("patientVolume")}
                  error={errors.patientVolume}
                />
              </div>
            </div>
          </motion.div>

          {/* Section 4: Intent / Fit Signal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
          >
            <SectionHeading
              number="4"
              title="Intent & Fit"
              subtitle="Helps us give you a relevant demo instead of a generic pitch."
            />
            <div className="space-y-6">
              <div>
                <Label>
                  What's your biggest challenge with patient records right now? *
                </Label>
                <Textarea
                  required
                  rows={4}
                  placeholder="Tell us in your own words — e.g. records get lost between departments, retrieval is too slow, staff can't access records across our branches…"
                  value={form.biggestChallenge}
                  onChange={(e) => set("biggestChallenge")(e.target.value)}
                  error={errors.biggestChallenge}
                />
              </div>
              <div>
                <Label>How did you hear about Mednoris?</Label>
                <div className="relative">
                  <select
                    value={form.howHeard}
                    onChange={(e) => set("howHeard")(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-brand-primary placeholder-gray-400 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 focus:outline-none transition"
                  >
                    <option value="">Select an option…</option>
                    {HOW_HEARD.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section 5: Optional */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
          >
            <SectionHeading
              number="5"
              title="Optional Details"
              subtitle="Nice to have — leave blank if not applicable."
            />
            <div className="space-y-5">
              <div>
                <Label>Preferred Demo Date / Time</Label>
                <InputField
                  type="datetime-local"
                  value={form.preferredDate}
                  onChange={(e) => set("preferredDate")(e.target.value)}
                />
              </div>
              <div>
                <Label>Additional Comments or Questions</Label>
                <Textarea
                  rows={3}
                  placeholder="Anything else you'd like us to know before the demo?"
                  value={form.comments}
                  onChange={(e) => set("comments")(e.target.value)}
                />
              </div>
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-4"
          >
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                Please fix the errors above before submitting.
              </div>
            )}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-gray-500 max-w-sm">
                By submitting this form, you agree to be contacted by the Mednoris team
                regarding your onboarding request.
              </p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-10 py-4 bg-brand-primary text-white rounded-full font-bold hover:bg-brand-secondary transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  Submit Request
                  <ArrowRight size={20} />
                </>
              )}
            </button>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
