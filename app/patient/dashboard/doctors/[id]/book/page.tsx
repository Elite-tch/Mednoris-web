"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePrivy } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Calendar, Video, Phone, MessageCircle, Loader2, CheckCircle } from "lucide-react";
import Toast, { ToastType } from "@/components/ui/Toast";

const symptomOnsetOptions = [
  "Today",
  "A few days ago",
  "About a week ago",
  "A few weeks ago",
  "More than a month ago",
];

export default function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = usePrivy();

  const doctorId = params.id as string;
  const selectedSlot = searchParams.get("slot");

  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [form, setForm] = useState({
    consultationType: "Video" as "Video" | "Voice" | "Chat",
    reason: "",
    symptoms: "",
    symptomOnset: "",
    seenBefore: "" as "Yes" | "No" | "",
    previousDiagnosis: "",
    onMedication: "" as "Yes" | "No" | "",
    currentMedications: "",
    hasAllergies: "" as "Yes" | "No" | "",
    allergies: "",
    medicalConditions: "",
    additionalNotes: "",
    consentAccurate: false,
    consentShare: false,
  });

  const set = (key: keyof typeof form, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Fetch Doctor Data
  useEffect(() => {
    const fetchDoctor = async () => {
      if (!doctorId) return;
      try {
        const decodedId = decodeURIComponent(params.id as string);
        
        // Try searching by fullName first
        let q = query(collection(db, "doctors"), where("fullName", "==", decodedId));
        let querySnapshot = await getDocs(q);
        
        // Fallback to slug if not found by fullName
        if (querySnapshot.empty) {
          q = query(collection(db, "doctors"), where("slug", "==", decodedId));
          querySnapshot = await getDocs(q);
        }

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          setDoctor({ id: docSnap.id, ...docSnap.data() });
        } else {
          const snap = await getDoc(doc(db, "doctors", decodedId));
          if (snap.exists()) {
            setDoctor({ id: snap.id, ...snap.data() });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [doctorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-brand-primary w-8 h-8" />
      </div>
    );
  }

  if (!doctor || !selectedSlot) {
    return (
      <div className="p-6 bg-white rounded-3xl text-center max-w-md mx-auto">
        <p className="text-gray-500 mb-4">Doctor or slot information is invalid.</p>
        <button onClick={() => router.back()} className="px-5 py-2 bg-brand-primary text-white font-bold rounded-xl">
          Go Back
        </button>
      </div>
    );
  }

  // Parse slot details
  const parts = selectedSlot.split("-");
  const day = parts[0];
  let appointmentDate = "";
  let startTime = "";
  let endTime = "";

  if (selectedSlot.includes("|")) {
    const [dayPart, rest] = selectedSlot.split("|");
    const restParts = rest.split("-");
    appointmentDate = `${restParts[0]}-${restParts[1]}-${restParts[2]}`;
    startTime = restParts[3];
    endTime = restParts[4];
  } else {
    startTime = parts[1] || "";
    endTime = parts[2] || "";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!form.reason.trim()) {
      setToast({ message: "Please provide a reason for the consultation.", type: "error" });
      return;
    }
    if (!form.symptoms.trim()) {
      setToast({ message: "Please describe your symptoms.", type: "error" });
      return;
    }
    if (!form.symptomOnset) {
      setToast({ message: "Please select when your symptoms started.", type: "error" });
      return;
    }
    if (!form.seenBefore) {
      setToast({ message: "Please answer if you have consulted a doctor before.", type: "error" });
      return;
    }
    if (!form.onMedication) {
      setToast({ message: "Please answer if you are currently on medication.", type: "error" });
      return;
    }
    if (!form.hasAllergies) {
      setToast({ message: "Please answer if you have any allergies.", type: "error" });
      return;
    }
    if (!form.consentAccurate || !form.consentShare) {
      setToast({ message: "Please agree to both consent statements to proceed.", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const slotDisplay = `${startTime} - ${endTime}${appointmentDate ? ` on ${new Date(appointmentDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ` (${day})`}`;

      await addDoc(collection(db, "appointments"), {
        patientId: user.id,
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        doctorTitle: doctor.title || "",
        doctorSpecialty: doctor.specializations || "",
        doctorImage: doctor.profileImage || "",
        consultationFee: doctor.consultationFee || 50,
        day,
        appointmentDate: appointmentDate || null,
        startTime,
        endTime,
        slot: `${startTime} - ${endTime}`,
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
        status: "Scheduled",
        createdAt: serverTimestamp(),
      });

      // Notify patient: booking confirmed
      await addDoc(collection(db, "notifications"), {
        userId: user.id,
        title: "Appointment Confirmed",
        message: `Your ${form.consultationType} consultation with Dr. ${doctor.fullName} is scheduled for ${slotDisplay}.`,
        type: "appointment",
        read: false,
        link: "/patient/dashboard/appointments",
        createdAt: new Date().toISOString(),
      });

      // Notify doctor: new appointment
      await addDoc(collection(db, "notifications"), {
        userId: doctor.id,
        title: "New Appointment Booked",
        message: `A patient has booked a ${form.consultationType} consultation with you for ${slotDisplay}. Reason: ${form.reason.substring(0, 80)}${form.reason.length > 80 ? "..." : ""}`,
        type: "appointment",
        read: false,
        link: "/doctor/dashboard/appointments",
        createdAt: new Date().toISOString(),
      });

      setToast({ message: "Appointment booked successfully!", type: "success" });
      setTimeout(() => router.push("/patient/dashboard/appointments"), 1500);
    } catch (err) {
      console.error("Booking error:", err);
      setToast({ message: "Failed to book appointment. Please try again.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-brand-primary font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-extrabold text-brand-primary">Book a Consultation</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            with {doctor.title ? `${doctor.title} ` : "Dr. "}{doctor.fullName}
          </p>
        </div>

        {/* Slot Summary */}
        <div className="mx-6 mt-5 p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/15 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-brand-primary font-semibold">
            <Calendar size={16} className="text-brand-secondary shrink-0" />
            <span>{day}{appointmentDate ? ` · ${new Date(appointmentDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-brand-primary font-semibold">
            <Clock size={16} className="text-brand-secondary shrink-0" />
            <span>{startTime} – {endTime}</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-extrabold text-brand-primary ml-auto">
            ${doctor.consultationFee || "50"}<span className="text-gray-400 font-normal text-xs">/session</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-5 space-y-6">


          {/* Reason */}
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-1">
              Reason for Consultation <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">Briefly describe why you're booking this appointment.</p>
            <textarea
              rows={3}
              value={form.reason}
              onChange={(e) => set("reason", e.target.value)}
              placeholder="e.g. Persistent headache for 3 days..."
              className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm resize-none focus:outline-none focus:border-brand-secondary"
            />
          </div>

          {/* Symptoms */}
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-1">
              What symptoms are you experiencing? <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">Describe your symptoms in your own words.</p>
            <textarea
              rows={3}
              value={form.symptoms}
              onChange={(e) => set("symptoms", e.target.value)}
              placeholder="e.g. Dizziness, nausea, sensitivity to light..."
              className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm resize-none focus:outline-none focus:border-brand-secondary"
            />
          </div>

          {/* Symptom onset */}
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-2">
              When did your symptoms start? <span className="text-red-500">*</span>
            </label>
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
                    name="symptomOnset"
                    className="w-4 h-4 shrink-0 cursor-pointer mr-2"
                    style={{ accentColor: "#34254e" }}
                    checked={form.symptomOnset === opt}
                    onChange={() => set("symptomOnset", opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Seen before */}
          <RadioYesNo
            label="Have you consulted a doctor about this before?"
            value={form.seenBefore}
            onChange={(v) => set("seenBefore", v)}
          />
          {form.seenBefore === "Yes" && (
            <div className="mt-3 ml-1">
              <label className="block text-xs font-bold text-gray-600 mb-1">Previous diagnosis or treatment</label>
              <textarea
                rows={2}
                value={form.previousDiagnosis}
                onChange={(e) => set("previousDiagnosis", e.target.value)}
                placeholder="Describe any previous diagnosis or treatment received..."
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm resize-none focus:outline-none focus:border-brand-secondary"
              />
            </div>
          )}

          {/* Medication */}
          <RadioYesNo
            label="Are you currently taking any medication?"
            value={form.onMedication}
            onChange={(v) => set("onMedication", v)}
          />
          {form.onMedication === "Yes" && (
            <div className="mt-3 ml-1">
              <label className="block text-xs font-bold text-gray-600 mb-1">Current medications</label>
              <textarea
                rows={2}
                value={form.currentMedications}
                onChange={(e) => set("currentMedications", e.target.value)}
                placeholder="List the medications and dosage..."
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm resize-none focus:outline-none focus:border-brand-secondary"
              />
            </div>
          )}

          {/* Allergies */}
          <RadioYesNo
            label="Do you have any allergies?"
            value={form.hasAllergies}
            onChange={(v) => set("hasAllergies", v)}
          />
          {form.hasAllergies === "Yes" && (
            <div className="mt-3 ml-1">
              <label className="block text-xs font-bold text-gray-600 mb-1">Please list your allergies</label>
              <textarea
                rows={2}
                value={form.allergies}
                onChange={(e) => set("allergies", e.target.value)}
                placeholder="e.g. Penicillin, Peanuts, Latex..."
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm resize-none focus:outline-none focus:border-brand-secondary"
              />
            </div>
          )}

          {/* Medical conditions */}
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-1">Existing Medical Conditions</label>
            <p className="text-xs text-gray-400 mb-2">e.g. Diabetes, Hypertension, Asthma</p>
            <textarea
              rows={2}
              value={form.medicalConditions}
              onChange={(e) => set("medicalConditions", e.target.value)}
              placeholder="List any existing conditions..."
              className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm resize-none focus:outline-none focus:border-brand-secondary"
            />
          </div>

          {/* Additional notes */}
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-1">Additional Notes <span className="text-gray-400 font-normal">(Optional)</span></label>
            <p className="text-xs text-gray-400 mb-2">Anything else you'd like the doctor to know before your appointment.</p>
            <textarea
              rows={2}
              value={form.additionalNotes}
              onChange={(e) => set("additionalNotes", e.target.value)}
              placeholder="Any other relevant information..."
              className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm resize-none focus:outline-none focus:border-brand-secondary"
            />
          </div>

          <hr className="border-gray-100" />

          {/* Consent */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-brand-primary">Consent</p>
            <ConsentCheckbox
              id="consent-accurate"
              checked={form.consentAccurate}
              onChange={(v) => set("consentAccurate", v)}
              label="I confirm that the information I've provided is accurate."
            />
            <ConsentCheckbox
              id="consent-share"
              checked={form.consentShare}
              onChange={(v) => set("consentShare", v)}
              label="I understand this information will be shared with the doctor for this consultation."
            />
          </div>

          {/* Submit */}
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
              <><Loader2 size={18} className="animate-spin" /> Submitting Booking...</>
            ) : (
              <><CheckCircle size={18} /> Confirm Appointment</>
            )}
          </button>
        </form>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

// --- Sub-components ---

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
              className="w-4 h-4 shrink-0 cursor-pointer mr-2"
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

function ConsentCheckbox({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 py-2 cursor-pointer transition-all ${
        checked ? "opacity-100" : "opacity-80 hover:opacity-100"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        className="w-4 h-4 shrink-0 mt-0.5 cursor-pointer rounded mr-2"
        style={{ accentColor: "#34254e" }}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={`text-sm ${checked ? "text-brand-primary font-semibold" : "text-gray-600"}`}>{label}</span>
    </label>
  );
}
