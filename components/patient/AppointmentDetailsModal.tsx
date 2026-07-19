"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Clock, Calendar, Video, Phone, MessageCircle,
  ChevronDown, Loader2, Save, FileText
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface AppointmentDetailsModalProps {
  appointment: any;
  onClose: () => void;
  onSuccess: (updatedAppointment: any) => void;
  onError: (msg: string) => void;
  isDoctorView?: boolean;
}

const symptomOnsetOptions = [
  "Today",
  "A few days ago",
  "About a week ago",
  "A few weeks ago",
  "More than a month ago",
];

export default function AppointmentDetailsModal({
  appointment,
  onClose,
  onSuccess,
  onError,
  isDoctorView = false,
}: AppointmentDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Initialize form with appointment data
  const [form, setForm] = useState({
    consultationType: appointment.consultationType || "Video",
    reason: appointment.reason || "",
    symptoms: appointment.symptoms || "",
    symptomOnset: appointment.symptomOnset || "",
    seenBefore: appointment.seenBefore || "",
    previousDiagnosis: appointment.previousDiagnosis || "",
    onMedication: appointment.onMedication || "",
    currentMedications: appointment.currentMedications || "",
    hasAllergies: appointment.hasAllergies || "",
    allergies: appointment.allergies || "",
    medicalConditions: appointment.medicalConditions || "",
    additionalNotes: appointment.additionalNotes || "",
  });

  const set = (key: keyof typeof form, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.reason.trim() || !form.symptoms.trim() || !form.symptomOnset) {
      onError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const updatedData = {
        consultationType: form.consultationType,
        reason: form.reason,
        symptoms: form.symptoms,
        symptomOnset: form.symptomOnset,
        seenBefore: form.seenBefore,
        previousDiagnosis: form.seenBefore === "Yes" ? form.previousDiagnosis : null,
        onMedication: form.onMedication,
        currentMedications: form.onMedication === "Yes" ? form.currentMedications : null,
        hasAllergies: form.hasAllergies,
        allergies: form.hasAllergies === "Yes" ? form.allergies : null,
        medicalConditions: form.medicalConditions || null,
        additionalNotes: form.additionalNotes || null,
      };

      await updateDoc(doc(db, "appointments", appointment.id), updatedData);
      
      onSuccess({ ...appointment, ...updatedData });
      setIsEditing(false);
    } catch (err) {
      console.error("Update error:", err);
      onError("Failed to update appointment details.");
    } finally {
      setSubmitting(false);
    }
  };

  const isEditable = !isDoctorView && appointment.status === "Scheduled";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl z-10 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-extrabold text-brand-primary">Appointment Details</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {isDoctorView 
                  ? `for ${appointment.patientName || "Patient"}` 
                  : `with ${appointment.doctorTitle ? `${appointment.doctorTitle} ` : ""}${appointment.doctorName}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Slot Summary */}
          <div className="mx-6 mt-5 p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/15 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-brand-primary font-semibold">
              <Calendar size={16} className="text-brand-secondary shrink-0" />
              <span>
                {appointment.day}
                {appointment.appointmentDate 
                  ? ` · ${new Date(appointment.appointmentDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` 
                  : ""}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-brand-primary font-semibold">
              <Clock size={16} className="text-brand-secondary shrink-0" />
              <span>{appointment.slot}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-extrabold text-brand-primary ml-auto">
              ${appointment.consultationFee || "50"}<span className="text-gray-400 font-normal text-xs">/session</span>
            </div>
          </div>

          {/* Mode Switcher (View/Edit) */}
          {isEditable && (
            <div className="px-6 mt-4 flex justify-end">
              <button
                onClick={() => {
                  if (isEditing) {
                    // Reset form on cancel
                    setForm({
                      consultationType: appointment.consultationType || "Video",
                      reason: appointment.reason || "",
                      symptoms: appointment.symptoms || "",
                      symptomOnset: appointment.symptomOnset || "",
                      seenBefore: appointment.seenBefore || "",
                      previousDiagnosis: appointment.previousDiagnosis || "",
                      onMedication: appointment.onMedication || "",
                      currentMedications: appointment.currentMedications || "",
                      hasAllergies: appointment.hasAllergies || "",
                      allergies: appointment.allergies || "",
                      medicalConditions: appointment.medicalConditions || "",
                      additionalNotes: appointment.additionalNotes || "",
                    });
                  }
                  setIsEditing(!isEditing);
                }}
                className="text-sm font-bold text-brand-secondary hover:text-brand-primary transition-colors cursor-pointer"
              >
                {isEditing ? "Cancel Editing" : "Edit Details"}
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-6">


            {/* Reason */}
            <div>
              <label className="block text-sm font-bold text-brand-primary mb-1">
                Reason for Consultation {isEditing && <span className="text-red-500">*</span>}
              </label>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={form.reason}
                  onChange={(e) => set("reason", e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm resize-none focus:outline-none focus:border-brand-secondary"
                />
              ) : (
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">{form.reason || "Not specified"}</p>
              )}
            </div>

            {/* Symptoms */}
            <div>
              <label className="block text-sm font-bold text-brand-primary mb-1">
                Symptoms {isEditing && <span className="text-red-500">*</span>}
              </label>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={form.symptoms}
                  onChange={(e) => set("symptoms", e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm resize-none focus:outline-none focus:border-brand-secondary"
                />
              ) : (
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">{form.symptoms || "Not specified"}</p>
              )}
            </div>

            {/* Symptom onset */}
            <div>
              <label className="block text-sm font-bold text-brand-primary mb-2">
                Symptom Onset {isEditing && <span className="text-red-500">*</span>}
              </label>
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {symptomOnsetOptions.map((opt) => (
                    <label
                      key={opt}
                      className={`flex items-center gap-2 py-2 cursor-pointer text-sm font-semibold transition-all ${
                        form.symptomOnset === opt
                          ? "text-brand-primary"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="symptomOnsetEdit"
                        className="w-4 h-4 shrink-0 cursor-pointer"
                        style={{ accentColor: "#34254e" }}
                        checked={form.symptomOnset === opt}
                        onChange={() => set("symptomOnset", opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">{form.symptomOnset || "Not specified"}</p>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Seen before */}
            {isEditing ? (
              <RadioYesNo
                label="Have you consulted a doctor about this before?"
                value={form.seenBefore as any}
                onChange={(v) => set("seenBefore", v)}
              />
            ) : (
              <div>
                <label className="block text-sm font-bold text-brand-primary mb-1">Consulted a doctor before?</label>
                <p className="text-sm text-gray-600">{form.seenBefore || "Not specified"}</p>
              </div>
            )}
            
            {form.seenBefore === "Yes" && (
              <div className={isEditing ? "mt-3 ml-1" : "mt-2"}>
                <label className="block text-xs font-bold text-gray-600 mb-1">Previous diagnosis or treatment</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={form.previousDiagnosis}
                    onChange={(e) => set("previousDiagnosis", e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm resize-none focus:outline-none focus:border-brand-secondary"
                  />
                ) : (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">{form.previousDiagnosis || "None provided"}</p>
                )}
              </div>
            )}

            {/* Medication */}
            <div className={!isEditing ? "mt-4" : ""}>
              {isEditing ? (
                <RadioYesNo
                  label="Are you currently taking any medication?"
                  value={form.onMedication as any}
                  onChange={(v) => set("onMedication", v)}
                />
              ) : (
                <div>
                  <label className="block text-sm font-bold text-brand-primary mb-1">Currently on medication?</label>
                  <p className="text-sm text-gray-600">{form.onMedication || "Not specified"}</p>
                </div>
              )}
            </div>

            {form.onMedication === "Yes" && (
              <div className={isEditing ? "mt-3 ml-1" : "mt-2"}>
                <label className="block text-xs font-bold text-gray-600 mb-1">Current medications</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={form.currentMedications}
                    onChange={(e) => set("currentMedications", e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm resize-none focus:outline-none focus:border-brand-secondary"
                  />
                ) : (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">{form.currentMedications || "None provided"}</p>
                )}
              </div>
            )}

            {/* Allergies */}
            <div className={!isEditing ? "mt-4" : ""}>
              {isEditing ? (
                <RadioYesNo
                  label="Do you have any allergies?"
                  value={form.hasAllergies as any}
                  onChange={(v) => set("hasAllergies", v)}
                />
              ) : (
                <div>
                  <label className="block text-sm font-bold text-brand-primary mb-1">Any allergies?</label>
                  <p className="text-sm text-gray-600">{form.hasAllergies || "Not specified"}</p>
                </div>
              )}
            </div>

            {form.hasAllergies === "Yes" && (
              <div className={isEditing ? "mt-3 ml-1" : "mt-2"}>
                <label className="block text-xs font-bold text-gray-600 mb-1">Allergies list</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={form.allergies}
                    onChange={(e) => set("allergies", e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm resize-none focus:outline-none focus:border-brand-secondary"
                  />
                ) : (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">{form.allergies || "None provided"}</p>
                )}
              </div>
            )}

            {/* Medical conditions */}
            <div className={!isEditing ? "mt-4" : ""}>
              <label className="block text-sm font-bold text-brand-primary mb-1">Existing Medical Conditions</label>
              {isEditing ? (
                <textarea
                  rows={2}
                  value={form.medicalConditions}
                  onChange={(e) => set("medicalConditions", e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm resize-none focus:outline-none focus:border-brand-secondary"
                />
              ) : (
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">{form.medicalConditions || "None provided"}</p>
              )}
            </div>

            {/* Additional notes */}
            <div className={!isEditing ? "mt-4" : ""}>
              <label className="block text-sm font-bold text-brand-primary mb-1">Additional Notes</label>
              {isEditing ? (
                <textarea
                  rows={2}
                  value={form.additionalNotes}
                  onChange={(e) => set("additionalNotes", e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm resize-none focus:outline-none focus:border-brand-secondary"
                />
              ) : (
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">{form.additionalNotes || "None provided"}</p>
              )}
            </div>

            {/* Submit */}
            {isEditing && (
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-4 font-bold text-white rounded-2xl transition-all flex items-center justify-center gap-2 text-sm ${
                    submitting
                      ? "bg-brand-primary/70 cursor-not-allowed"
                      : "bg-brand-primary hover:bg-brand-secondary cursor-pointer shadow-lg"
                  }`}
                >
                  {submitting ? (
                    <><Loader2 size={18} className="animate-spin" /> Saving Changes...</>
                  ) : (
                    <><Save size={18} /> Save Changes</>
                  )}
                </button>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function RadioYesNo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: "Yes" | "No") => void;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-brand-primary mb-3">{label}</label>
      <div className="flex gap-3">
        {(["Yes", "No"] as const).map((opt) => (
          <label
            key={opt}
            className={`flex items-center gap-2 py-2 pr-4 cursor-pointer text-sm font-semibold transition-all ${
              value === opt
                ? "text-brand-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <input
              type="radio"
              name={label}
              className="w-4 h-4 shrink-0 cursor-pointer"
              style={{ accentColor: "#34254e" }}
              checked={value === opt}
              onChange={() => onChange(opt)}
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}
