"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Calendar, Clock, Video, Phone, MessageCircle,
  Loader2, CheckCircle2, XCircle, CalendarClock, User
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

const statusIcon = { Scheduled: CalendarClock, Completed: CheckCircle2, Cancelled: XCircle };
const statusColor = {
  Scheduled: "text-brand-secondary bg-brand-secondary/10",
  Completed: "text-green-600 bg-green-50",
  Cancelled: "text-red-500 bg-red-50",
};

export default function DoctorAppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [appointment, setAppointment] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDoc(doc(db, "appointments", id));
        if (snap.exists()) {
          const data: any = { id: snap.id, ...snap.data() };
          setAppointment(data);

          // Also fetch patient profile
          if (data.patientId) {
            try {
              const patSnap = await getDoc(doc(db, "patients", data.patientId));
              if (patSnap.exists()) {
                setPatient({ id: patSnap.id, ...patSnap.data() });
              }
            } catch (_) {}
          }
        }
      } catch (err) {
        console.error("Error fetching appointment:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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
  const patientName = patient?.fullName || appointment.patientName || "Patient";
  const patientImage = patient?.profileImage || appointment.patientImage || null;

  return (
    <div>
      {/* Back nav */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-brand-primary font-semibold transition-colors cursor-pointer mb-6"
      >
        <ArrowLeft size={18} /> Back to Appointments
      </button>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
        <h1 className="text-2xl font-extrabold text-brand-primary mb-1">Appointment Details</h1>
        <p className="text-gray-400 text-sm mb-6">Patient consultation record</p>

        {/* Patient + Status card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-brand-secondary/20 flex items-center justify-center font-bold text-brand-primary text-xl shrink-0 overflow-hidden">
            {patientImage ? (
              <img src={patientImage} alt={patientName} className="w-full h-full object-cover" />
            ) : (
              patientName?.charAt(0) || "P"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-brand-primary">{patientName}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
              <Video size={20} className="text-brand-primary" />
              Video Consult
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {appointment.patientId && (
              <Link 
                href={`/doctor/dashboard/patients/${patient?.fullName || appointment.patientName || appointment.patientId}`}
                className="text-xs font-bold text-brand-secondary hover:text-brand-primary transition-colors cursor-pointer"
              >
                View Profile
              </Link>
            )}
            <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${statusCls}`}>
              <StatusIcon size={13} />{appointment.status}
            </span>
          </div>
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

        {/* Details card (read-only) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <ReadOnlyField label="Reason for Consultation" value={appointment.reason} />
          <ReadOnlyField label="Symptoms" value={appointment.symptoms} />
          <ReadOnlyField label="Symptom Onset" value={appointment.symptomOnset} />

          <hr className="border-gray-100" />

          <ReadOnlyField label="Consulted a doctor before?" value={appointment.seenBefore} />
          {appointment.seenBefore === "Yes" && (
            <ReadOnlyField label="Previous diagnosis / treatment" value={appointment.previousDiagnosis} small />
          )}

          <ReadOnlyField label="Currently on medication?" value={appointment.onMedication} />
          {appointment.onMedication === "Yes" && (
            <ReadOnlyField label="Current medications" value={appointment.currentMedications} small />
          )}

          <ReadOnlyField label="Any allergies?" value={appointment.hasAllergies} />
          {appointment.hasAllergies === "Yes" && (
            <ReadOnlyField label="Allergies list" value={appointment.allergies} small />
          )}

          <ReadOnlyField label="Existing Medical Conditions" value={appointment.medicalConditions || "None provided"} />
          <ReadOnlyField label="Additional Notes" value={appointment.additionalNotes || "None provided"} />
        </div>
      </motion.div>
    </div>
  );
}

function ReadOnlyField({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <label className={`block font-bold text-brand-primary mb-1 ${small ? "text-xs text-gray-600" : "text-sm"}`}>{label}</label>
      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">{value || "Not specified"}</p>
    </div>
  );
}

function JoinCallWidget({ appointment }: { appointment: any }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [canJoin, setCanJoin] = useState(false);

  useEffect(() => {
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
          <p className="text-xs text-green-600 font-semibold">Patient is ready — you can join the call now!</p>
        ) : (
          <p className="text-xs text-gray-500">
            Starts in <span className="font-bold text-brand-secondary">{timeLeft}</span>
          </p>
        )}
      </div>
      {canJoin ? (
        <Link href={`/doctor/dashboard/consultation/${appointment.id}`} className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors shadow-lg animate-pulse cursor-pointer shrink-0">
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
