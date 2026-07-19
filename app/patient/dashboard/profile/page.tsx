"use client";
import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import {
  Loader2, UploadCloud, Save, User, Heart, Phone,
  CheckCircle, Globe, Droplets, AlertTriangle, Pill, Activity
} from "lucide-react";
import { motion } from "framer-motion";
import Toast, { ToastType } from "@/components/ui/Toast";

const genderOptions = ["Male", "Female", "Non-binary", "Prefer not to say"];
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];
const languageOptions = ["English", "French", "Arabic", "Spanish", "Portuguese", "Hausa", "Yoruba", "Igbo", "Swahili", "Other"];

const SECTIONS = [
  { id: "basic", label: "Basic Info", icon: User },
  { id: "health", label: "Health Summary", icon: Heart },
  { id: "emergency", label: "Emergency Contact", icon: Phone },
];

export default function ProfilePage() {
  const { user } = usePrivy();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("basic");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [form, setForm] = useState({
    // Basic
    fullName: "",
    dob: "",
    gender: "",
    country: "",
    preferredLanguage: "",
    about: "",
    profileImage: "",
    // Health summary
    bloodGroup: "",
    allergies: "",
    chronicConditions: "",
    currentMedications: "",
    hasEmergencyContact: "No" as "Yes" | "No",
    // Emergency contact
    emergencyName: "",
    emergencyRelation: "",
    emergencyPhone: "",
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const snap = await getDoc(doc(db, "patients", user.id));
      if (snap.exists()) {
        setForm((prev) => ({ ...prev, ...(snap.data() as typeof form) }));
        if (snap.data().profileImage) setImagePreview(snap.data().profileImage);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      let imageUrl = form.profileImage;
      if (imageFile) imageUrl = await uploadToCloudinary(imageFile);
      const data = { ...form, profileImage: imageUrl };
      await setDoc(doc(db, "patients", user.id), data, { merge: true });
      setForm((f) => ({ ...f, profileImage: imageUrl }));
      setToast({ message: "Profile updated successfully!", type: "success" });
    } catch {
      setToast({ message: "Failed to save. Please try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-24">
      <Loader2 className="animate-spin text-brand-primary w-8 h-8" />
    </div>
  );

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold text-brand-primary mb-1">Public Profile</h1>
        <p className="text-gray-400 text-sm mb-8">
          This information is visible to verified doctors during consultations.
        </p>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left — Avatar + section nav */}
          <div className="lg:w-64 shrink-0 space-y-4">
            {/* Avatar card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-brand-secondary/20 flex items-center justify-center font-bold text-brand-primary text-3xl border-4 border-white shadow-lg">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    form.fullName?.charAt(0) || "?"
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-brand-secondary text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-brand-primary transition-colors shadow-md">
                  <UploadCloud size={14} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
              <div className="text-center">
                <p className="font-bold text-brand-primary">{form.fullName || "Your Name"}</p>
                <p className="text-xs text-gray-400">{form.country || "Location not set"}</p>
              </div>
              {form.bloodGroup && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                  <Droplets size={12} /> {form.bloodGroup}
                </span>
              )}
            </div>

            {/* Section nav */}
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 space-y-1">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    activeSection === id
                      ? "bg-brand-primary text-white"
                      : "text-gray-500 hover:bg-gray-50 hover:text-brand-primary"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Right — Form */}
          <div className="flex-1">
            <form onSubmit={handleSave}>
              {/* ── Basic Info ── */}
              {activeSection === "basic" && (
                <motion.div key="basic" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 space-y-5">
                  <SectionHeader icon={User} title="Basic Information"
                    subtitle="Your identity details visible to doctors." />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormInput label="Full Name" value={form.fullName} onChange={(v) => set("fullName", v)} placeholder="e.g. John A." />
                    <FormInput label="Date of Birth" type="date" value={form.dob} onChange={(v) => set("dob", v)} />
                    <FormSelect label="Gender" value={form.gender} onChange={(v) => set("gender", v)} options={genderOptions} />
                    <FormInput label="Country" value={form.country} onChange={(v) => set("country", v)} placeholder="e.g. Nigeria" />
                    <FormSelect label="Preferred Language" value={form.preferredLanguage} onChange={(v) => set("preferredLanguage", v)} options={languageOptions} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-primary mb-1.5">About <span className="font-normal text-gray-400">(Optional)</span></label>
                    <textarea
                      rows={3}
                      value={form.about}
                      onChange={(e) => set("about", e.target.value)}
                      placeholder="Brief description for doctors about your background..."
                      className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-brand-secondary text-sm resize-none"
                    />
                  </div>

                  <SaveButton saving={saving} />
                </motion.div>
              )}

              {/* ── Health Summary ── */}
              {activeSection === "health" && (
                <motion.div key="health" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 space-y-5">
                  <SectionHeader icon={Heart} title="Health Summary"
                    subtitle="High-level health information only — no diagnoses or prescriptions." />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-brand-primary mb-1.5">Blood Type</label>
                      <div className="grid grid-cols-4 gap-2">
                        {bloodGroups.map((bg) => (
                          <button
                            key={bg}
                            type="button"
                            onClick={() => set("bloodGroup", bg)}
                            className={`py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                              form.bloodGroup === bg
                                ? "border-red-500 bg-red-50 text-red-600"
                                : "border-gray-200 text-gray-500 hover:border-red-300"
                            }`}
                          >
                            {bg}
                          </button>
                        ))}
                      </div>
                    </div>

                    <FormInput
                      label="Known Allergies"
                      icon={AlertTriangle}
                      value={form.allergies}
                      onChange={(v) => set("allergies", v)}
                      placeholder="e.g. Penicillin, Peanuts"
                    />
                  </div>

                  <FormInput
                    label="Chronic Conditions"
                    icon={Activity}
                    value={form.chronicConditions}
                    onChange={(v) => set("chronicConditions", v)}
                    placeholder="e.g. Diabetes Type 2, Asthma, Hypertension"
                  />

                  <div>
                    <label className="block text-xs font-bold text-brand-primary mb-1.5">
                      Current Medications <span className="font-normal text-gray-400">(Optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={form.currentMedications}
                      onChange={(e) => set("currentMedications", e.target.value)}
                      placeholder="e.g. Metformin 500mg, Salbutamol inhaler..."
                      className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-brand-secondary text-sm resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-primary mb-3">Emergency Contact Available?</label>
                    <div className="flex gap-3">
                      {(["Yes", "No"] as const).map((opt) => (
                        <label
                          key={opt}
                          className={`flex items-center gap-2 py-2 pr-5 cursor-pointer text-sm font-bold transition-all ${
                            form.hasEmergencyContact === opt ? "text-brand-primary" : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          <input
                            type="radio"
                            name="emergencyContact"
                            className="w-4 h-4 cursor-pointer"
                            style={{ accentColor: "#34254e" }}
                            checked={form.hasEmergencyContact === opt}
                            onChange={() => set("hasEmergencyContact", opt)}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>

                  <SaveButton saving={saving} />
                </motion.div>
              )}

              {/* ── Emergency Contact ── */}
              {activeSection === "emergency" && (
                <motion.div key="emergency" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 space-y-5">
                  <SectionHeader icon={Phone} title="Emergency Contact"
                    subtitle="Contact info for emergencies. Not shown publicly — only accessible during active consultations." />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormInput label="Contact Name" value={form.emergencyName} onChange={(v) => set("emergencyName", v)} placeholder="e.g. Mary Doe" />
                    <FormInput label="Relationship" value={form.emergencyRelation} onChange={(v) => set("emergencyRelation", v)} placeholder="e.g. Mother, Spouse" />
                    <FormInput label="Phone Number" value={form.emergencyPhone} onChange={(v) => set("emergencyPhone", v)} placeholder="e.g. +234 800 000 0000" />
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold flex items-start gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    This information is only accessible to a doctor during an active consultation. It is never shown on your public profile.
                  </div>

                  <SaveButton saving={saving} />
                </motion.div>
              )}
            </form>
          </div>
        </div>
      </motion.div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ── Sub-components ──

function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="pb-4 border-b border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={18} className="text-brand-secondary" />
        <h2 className="text-lg font-extrabold text-brand-primary">{title}</h2>
      </div>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}

function FormInput({
  label, value, onChange, placeholder, type = "text", icon: Icon,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; icon?: any;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-brand-primary mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-brand-secondary text-sm ${Icon ? "pl-9" : ""}`}
        />
      </div>
    </div>
  );
}

function FormSelect({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-brand-primary mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-brand-secondary text-sm cursor-pointer"
      >
        <option value="">Select...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function SaveButton({ saving }: { saving: boolean }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors disabled:opacity-60 cursor-pointer shadow-sm mt-2"
    >
      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      {saving ? "Saving..." : "Save Changes"}
    </button>
  );
}
