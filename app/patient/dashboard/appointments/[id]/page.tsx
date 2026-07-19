"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Calendar, Clock, Video, Phone, MessageCircle,
  Loader2, Save, CheckCircle2, XCircle, CalendarClock
} from "lucide-react";
import { useEffect as useEffectTimer, useState as useStateTimer } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Toast, { ToastType } from "@/components/ui/Toast";

const symptomOnsetOptions = [
  "Today",
  "A few days ago",
  "About a week ago",
  "A few weeks ago",
  "More than a month ago",
];

const statusIcon = { Scheduled: CalendarClock, Completed: CheckCircle2, Cancelled: XCircle };
const statusColor = {
  Scheduled: "text-brand-secondary bg-brand-secondary/10",
  Completed: "text-green-600 bg-green-50",
  Cancelled: "text-red-500 bg-red-50",
};

export default function PatientAppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const snap = await getDoc(doc(db, "appointments", id));
        if (snap.exists()) {
          const data: any = { id: snap.id, ...snap.data() };
          setAppointment(data);
          setForm({
            consultationType: data.consultationType || "Video",
            reason: data.reason || "",
            symptoms: data.symptoms || "",
            symptomOnset: data.symptomOnset || "",
            seenBefore: data.seenBefore || "",
            previousDiagnosis: data.previousDiagnosis || "",
            onMedication: data.onMedication || "",
            currentMedications: data.currentMedications || "",
            hasAllergies: data.hasAllergies || "",
            allergies: data.allergies || "",
            medicalConditions: data.medicalConditions || "",
            additionalNotes: data.additionalNotes || "",
          });
        }
      } catch (err) {
        console.error("Error fetching appointment:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [id]);

  const set = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason.trim() || !form.symptoms.trim() || !form.symptomOnset) {
      setToast({ message: "Please fill in all required fields.", type: "error" });
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
      await updateDoc(doc(db, "appointments", id), updatedData);
      setAppointment((prev: any) => ({ ...prev, ...updatedData }));
      setIsEditing(false);
      setToast({ message: "Appointment details updated successfully!", type: "success" });
    } catch (err) {
      console.error("Update error:", err);
      setToast({ message: "Failed to update appointment details.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-brand-primary w-9 h-9" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-400 text-sm mb-4">Appointment not found.</p>
        <button onClick={() => router.back()} className="text-brand-secondary font-bold hover:underline cursor-pointer">
          Go Back
        </button>
      </div>
    );
  }

  const StatusIcon = statusIcon[appointment.status as keyof typeof statusIcon] || CalendarClock;
  const statusCls = statusColor[appointment.status as keyof typeof statusColor] || statusColor.Scheduled;
  const isEditable = appointment.status === "Scheduled";

  return (
    <div>
      {/* Back nav */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-brand-primary font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} /> Back to Appointments
        </button>

        {isEditable && (
          <button
            onClick={() => {
              if (isEditing) {
                // Reset on cancel
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
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
        <h1 className="text-2xl font-extrabold text-brand-primary mb-1">Appointment Details</h1>
        <p className="text-gray-400 text-sm mb-6">
          with {appointment.doctorTitle ? `${appointment.doctorTitle} ` : ""}{appointment.doctorName}
        </p>

        {/* Doctor + Status card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-brand-secondary/20 flex items-center justify-center font-bold text-brand-primary text-xl shrink-0 overflow-hidden">
            {appointment.doctorImage ? (
              <img src={appointment.doctorImage} alt={appointment.doctorName} className="w-full h-full object-cover" />
            ) : (
              appointment.doctorName?.charAt(0) || "D"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-brand-primary">{appointment.doctorTitle ? `${appointment.doctorTitle} ` : ""}{appointment.doctorName}</p>
            <p className="text-xs text-gray-400">{appointment.doctorSpecialty}</p>
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${statusCls}`}>
            <StatusIcon size={13} />{appointment.status}
          </span>
        </div>

        {/* Slot summary */}
        <div className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/15 flex flex-wrap gap-4 mb-6">
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

        {/* Join Call widget – only for scheduled */}
        {appointment.status === "Scheduled" && (
          <JoinCallWidget appointment={appointment} />
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">


          {/* Reason */}
          <FormField label="Reason for Consultation" required={isEditing} isEditing={isEditing}>
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
          </FormField>

          {/* Symptoms */}
          <FormField label="Symptoms" required={isEditing} isEditing={isEditing}>
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
          </FormField>

          {/* Symptom onset */}
          <FormField label="Symptom Onset" required={isEditing} isEditing={isEditing}>
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {symptomOnsetOptions.map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-2 py-2 cursor-pointer text-sm font-semibold transition-all ${
                      form.symptomOnset === opt ? "text-brand-primary" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="symptomOnset"
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
          </FormField>

          <hr className="border-gray-100" />

          <RadioYesNoField
            label="Consulted a doctor before?"
            value={form.seenBefore}
            isEditing={isEditing}
            onChange={(v) => set("seenBefore", v)}
          />
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

          <RadioYesNoField
            label="Currently on medication?"
            value={form.onMedication}
            isEditing={isEditing}
            onChange={(v) => set("onMedication", v)}
          />
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

          <RadioYesNoField
            label="Any allergies?"
            value={form.hasAllergies}
            isEditing={isEditing}
            onChange={(v) => set("hasAllergies", v)}
          />
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

          <FormField label="Existing Medical Conditions" isEditing={isEditing}>
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
          </FormField>

          <FormField label="Additional Notes" isEditing={isEditing}>
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
          </FormField>

          {isEditing && (
            <div className="pt-2">
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// --- Helper sub-components ---

function JoinCallWidget({ appointment }: { appointment: any }) {
  const [timeLeft, setTimeLeft] = useStateTimer("");
  const [canJoin, setCanJoin] = useStateTimer(false);

  useEffectTimer(() => {
    const calculateTarget = () => {
      const [hours, minutes] = (appointment.startTime || "00:00").split(":").map(Number);
      if (appointment.appointmentDate) {
        const d = new Date(appointment.appointmentDate);
        d.setHours(hours, minutes, 0, 0);
        return d;
      }
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const targetDay = days.indexOf(appointment.day);
      const now = new Date();
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      let diff = targetDay - d.getDay();
      if (diff < 0) {
        diff += 7;
      } else if (diff === 0) {
        const endTime = new Date(d.getTime());
        if (appointment.endTime) {
          const [eH, eM] = appointment.endTime.split(":").map(Number);
          endTime.setHours(eH, eM, 0, 0);
        } else {
          endTime.setHours(endTime.getHours() + 1);
        }
        if (endTime.getTime() < now.getTime()) {
          diff += 7;
        }
      }
      d.setDate(d.getDate() + diff);
      return d;
    };

    const target = calculateTarget();

    const tick = () => {
      const distance = target.getTime() - Date.now();
      if (distance <= 5 * 60 * 1000) {
        setCanJoin(true);
        setTimeLeft("");
        return;
      }
      setCanJoin(false);
      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${h}h left` : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [appointment]);

  return (
    <div className="mb-6 bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 border border-brand-secondary/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4">
      <div className="flex-1">
        <p className="text-sm font-bold text-brand-primary mb-0.5">Video Consultation</p>
        {canJoin ? (
          <p className="text-xs text-green-600 font-semibold">Your appointment is ready — you can join now!</p>
        ) : (
          <p className="text-xs text-gray-500">
            Starts in <span className="font-bold text-brand-secondary">{timeLeft}</span>
          </p>
        )}
      </div>
      {canJoin ? (
        <Link href={`/patient/dashboard/consultation/${appointment.id}`} className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors shadow-lg animate-pulse cursor-pointer shrink-0">
          <Video size={16} /> Join Call Now
        </Link>
      ) : (
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono text-lg font-bold text-brand-secondary bg-white border border-brand-secondary/20 px-4 py-2 rounded-xl shadow-sm tracking-widest">
            {timeLeft}
          </span>
          <button disabled className="flex items-center gap-2 px-5 py-3 bg-gray-200 text-gray-400 font-bold rounded-xl cursor-not-allowed text-sm">
            <Video size={15} /> Join Call
          </button>
        </div>
      )}
    </div>
  );
}

function FormField({
  label, required, isEditing, children,
}: {
  label: string; required?: boolean; isEditing?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-brand-primary mb-1">
        {label} {required && isEditing && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function RadioYesNoField({
  label, value, isEditing, onChange,
}: {
  label: string; value: string; isEditing: boolean; onChange: (v: "Yes" | "No") => void;
}) {
  if (!isEditing) {
    return (
      <div>
        <label className="block text-sm font-bold text-brand-primary mb-1">{label}</label>
        <p className="text-sm text-gray-600">{value || "Not specified"}</p>
      </div>
    );
  }
  return (
    <div>
      <label className="block text-sm font-bold text-brand-primary mb-3">{label}</label>
      <div className="flex gap-3">
        {(["Yes", "No"] as const).map((opt) => (
          <label
            key={opt}
            className={`flex items-center gap-2 py-2 pr-4 cursor-pointer text-sm font-semibold transition-all ${
              value === opt ? "text-brand-primary" : "text-gray-500 hover:text-gray-700"
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
