"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, User, Heart, Droplets, AlertTriangle, Activity,
  Pill, Phone, Globe, CalendarDays, Stethoscope, FileText,
  Lock, ShieldCheck, Loader2, CheckCircle2, Clock, Video,
  BadgeCheck, Languages
} from "lucide-react";
import {
  doc, getDoc, collection, query, where, getDocs, orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";

// ─── helpers ────────────────────────────────────────────────────────────────

function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  ) age--;
  return age;
}

function useCountdown(appointment: any | null) {
  const [timeLeft, setTimeLeft] = useState("");
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    if (!appointment) { setCanAccess(false); setTimeLeft(""); return; }

    const getTarget = () => {
      const [h, m] = (appointment.startTime || "00:00").split(":").map(Number);
      if (appointment.appointmentDate) {
        const d = new Date(appointment.appointmentDate);
        d.setHours(h, m, 0, 0);
        return d;
      }
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const target = new Date();
      target.setHours(h, m, 0, 0);
      let diff = days.indexOf(appointment.day) - target.getDay();
      if (diff < 0) diff += 7;
      else if (diff === 0 && target.getTime() < Date.now()) diff += 7;
      target.setDate(target.getDate() + diff);
      return target;
    };

    const target = getTarget();

    const tick = () => {
      const dist = target.getTime() - Date.now();
      if (dist <= 5 * 60 * 1000 && dist > -60 * 60 * 1000) {
        // Within 5 min before to 1 hour after start → access open
        setCanAccess(true);
        setTimeLeft("");
        return;
      }
      setCanAccess(false);
      if (dist <= 0) { setTimeLeft("Expired"); return; }
      const d = Math.floor(dist / (1000 * 60 * 60 * 24));
      const hrs = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const min = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
      const sec = Math.floor((dist % (1000 * 60)) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${hrs}h ${min}m` : `${String(hrs).padStart(2,"0")}:${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [appointment]);

  return { timeLeft, canAccess };
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PatientPublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = usePrivy();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<any>(null);
  const [consultationStats, setConsultationStats] = useState({
    total: 0,
    lastDate: null as string | null,
    doctorsCount: 0,
  });
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { timeLeft, canAccess } = useCountdown(nextAppointment);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const decodedId = decodeURIComponent(patientId);

        // 1. Patient profile
        let patData = null;
        let pId = null;

        // Try searching by fullName first as requested
        const qUsername = query(collection(db, "patients"), where("fullName", "==", decodedId));
        const usernameSnap = await getDocs(qUsername);
        
        if (!usernameSnap.empty) {
          pId = usernameSnap.docs[0].id;
          patData = usernameSnap.docs[0].data();
        } else {
          // Fallback to searching by document ID (privy ID)
          const patSnap = await getDoc(doc(db, "patients", decodedId));
          if (patSnap.exists()) {
            pId = patSnap.id;
            patData = patSnap.data();
          }
        }

        if (patData) {
          setPatient({ id: pId, ...patData });
        }

        const effectivePatientId = pId || decodedId;

        // 2. Consultation history (all appointments for this patient)
        const apptQuery = query(
          collection(db, "appointments"),
          where("patientId", "==", effectivePatientId)
        );
        const apptSnap = await getDocs(apptQuery);
        const allAppts = apptSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

        const completed = allAppts.filter((a) => a.status === "Completed");
        const uniqueDoctors = new Set(allAppts.map((a) => a.doctorId)).size;
        const lastAppt = completed.sort((a, b) => {
          const ta = a.appointmentDate ? new Date(a.appointmentDate).getTime() : 0;
          const tb = b.appointmentDate ? new Date(b.appointmentDate).getTime() : 0;
          return tb - ta;
        })[0];

        setConsultationStats({
          total: allAppts.length,
          lastDate: lastAppt?.appointmentDate || null,
          doctorsCount: uniqueDoctors,
        });

        // 3. Next scheduled appointment between THIS doctor and this patient
        if (user) {
          const scheduledQuery = query(
            collection(db, "appointments"),
            where("patientId", "==", effectivePatientId),
            where("doctorId", "==", user.id),
            where("status", "==", "Scheduled")
          );
          const scheduledSnap = await getDocs(scheduledQuery);
          if (!scheduledSnap.empty) {
            // Pick the soonest one
            const scheduled = scheduledSnap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .sort((a: any, b: any) => {
                const ta = a.appointmentDate ? new Date(a.appointmentDate).getTime() : 0;
                const tb = b.appointmentDate ? new Date(b.appointmentDate).getTime() : 0;
                return ta - tb;
              });
            setNextAppointment(scheduled[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching patient profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [patientId, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-brand-primary w-9 h-9" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-400 text-sm mb-4">Patient profile not found.</p>
        <button onClick={() => router.back()} className="text-brand-secondary font-bold hover:underline cursor-pointer">
          Go Back
        </button>
      </div>
    );
  }

  const age = calculateAge(patient.dob);
  const hasRecords = !!patient.hasUploadedRecords;

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-brand-primary font-semibold transition-colors cursor-pointer mb-6"
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Left column: main profile ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Hero card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-brand-secondary/15 flex items-center justify-center font-bold text-brand-primary text-3xl border-4 border-white shadow-md">
                  {patient.profileImage ? (
                    <img src={patient.profileImage} alt={patient.fullName} className="w-full h-full object-cover" />
                  ) : (
                    patient.fullName?.charAt(0) || "P"
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-5 h-5 rounded-full border-2 border-white" title="Verified Patient" />
              </div>

              {/* Identity */}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl font-extrabold text-brand-primary">
                    {patient.fullName || "Patient"}
                  </h1>
                  <BadgeCheck size={20} className="text-brand-secondary" />
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-2">
                  {age && (
                    <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg">
                      <User size={13} className="text-gray-400" />
                      {age} yrs · {patient.gender || "—"}
                    </span>
                  )}
                  {patient.country && (
                    <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg">
                      <Globe size={13} className="text-gray-400" />
                      {patient.country}
                    </span>
                  )}
                  {patient.preferredLanguage && (
                    <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg">
                      <Languages size={13} className="text-gray-400" />
                      {patient.preferredLanguage}
                    </span>
                  )}
                </div>

                {patient.about && (
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                    {patient.about}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Health Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
              <Heart size={18} className="text-brand-secondary" />
              <h2 className="text-lg font-extrabold text-brand-primary">Health Summary</h2>
              <span className="ml-auto text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">High-level only</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Blood Type */}
              <HealthCard
                icon={<Droplets size={18} className="text-red-500" />}
                label="Blood Type"
                value={patient.bloodGroup || "Unknown"}
                accent="red"
              />

              {/* Allergies */}
              <HealthCard
                icon={<AlertTriangle size={18} className="text-amber-500" />}
                label="Known Allergies"
                value={patient.allergies || "None reported"}
                accent="amber"
              />

              {/* Chronic Conditions */}
              <HealthCard
                icon={<Activity size={18} className="text-purple-500" />}
                label="Chronic Conditions"
                value={patient.chronicConditions || "None reported"}
                accent="purple"
              />

              {/* Current Medications */}
              <HealthCard
                icon={<Pill size={18} className="text-blue-500" />}
                label="Current Medications"
                value={patient.currentMedications || "None reported"}
                accent="blue"
              />
            </div>

            {/* Emergency Contact */}
            <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={15} className="text-gray-400" />
                <span className="font-semibold">Emergency Contact</span>
              </div>
              {patient.hasEmergencyContact === "Yes" ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                  <CheckCircle2 size={12} /> Available
                </span>
              ) : (
                <span className="text-xs font-bold text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
                  Not provided
                </span>
              )}
            </div>
          </motion.div>

          {/* Consultation History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
              <Stethoscope size={18} className="text-brand-secondary" />
              <h2 className="text-lg font-extrabold text-brand-primary">Consultation History</h2>
              <span className="ml-auto text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">Summary only</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Total Consultations" value={consultationStats.total} icon={CalendarDays} color="text-brand-secondary" />
              <StatCard
                label="Last Consultation"
                value={consultationStats.lastDate
                  ? new Date(consultationStats.lastDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                  : "—"}
                icon={Clock}
                color="text-purple-500"
              />
              <StatCard label="Doctors Seen" value={consultationStats.doctorsCount} icon={Stethoscope} color="text-blue-500" />
            </div>

            <p className="mt-4 text-xs text-gray-400 italic">
              Diagnoses, prescriptions, and medical notes are not displayed here.
            </p>
          </motion.div>
        </div>

        {/* ── Right column: Medical Records + Access ── */}
        <div className="space-y-5">
          {/* Medical Records Status */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 shadow-xl border border-brand-secondary/20"
          >
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
              <FileText size={18} className="text-brand-secondary" />
              <h2 className="text-base font-extrabold text-brand-primary">Medical Records</h2>
            </div>

            {/* Availability */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500 font-semibold">Availability</span>
              {hasRecords ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                  <CheckCircle2 size={12} /> Available
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
                  Not Available
                </span>
              )}
            </div>

            {/* Privacy */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-gray-500 font-semibold">Status</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-brand-primary bg-brand-primary/5 border border-brand-primary/20 px-3 py-1.5 rounded-full">
                <Lock size={11} /> Private
              </span>
            </div>

            {/* Appointment info */}
            {nextAppointment && (
              <div className="mb-5 p-3 bg-brand-primary/5 rounded-xl border border-brand-primary/10 text-xs text-gray-500">
                <p className="font-bold text-brand-primary mb-1">Upcoming Appointment</p>
                <p className="flex items-center gap-1"><CalendarDays size={11} /> {nextAppointment.day}{nextAppointment.appointmentDate ? ` · ${new Date(nextAppointment.appointmentDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}</p>
                <p className="flex items-center gap-1 mt-0.5"><Clock size={11} /> {nextAppointment.slot}</p>
              </div>
            )}

            {/* Access Required Button */}
            <AccessButton canAccess={canAccess} timeLeft={timeLeft} hasAppointment={!!nextAppointment} />
          </motion.div>

          {/* Next appointment card */}
          {nextAppointment && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-3">
                <Video size={15} className="text-brand-secondary" />
                <p className="text-sm font-extrabold text-brand-primary">Your Appointment</p>
              </div>
              <JoinCallWidget appointment={nextAppointment} />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function HealthCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  const accents: Record<string, string> = {
    red: "bg-red-50 border-red-100",
    amber: "bg-amber-50 border-amber-100",
    purple: "bg-purple-50 border-purple-100",
    blue: "bg-blue-50 border-blue-100",
  };
  return (
    <div className={`p-4 rounded-2xl border ${accents[accent] || "bg-gray-50 border-gray-100"}`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span></div>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
      <Icon size={20} className={`${color} mx-auto mb-2`} />
      <p className="text-xl font-extrabold text-brand-primary">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

function AccessButton({ canAccess, timeLeft, hasAppointment }: { canAccess: boolean; timeLeft: string; hasAppointment: boolean }) {
  if (!hasAppointment) {
    return (
      <button
        disabled
        className="w-full py-3.5 rounded-2xl text-sm font-bold bg-gray-100 text-gray-400 cursor-not-allowed flex items-center justify-center gap-2"
        title="No scheduled appointment with this patient"
      >
        <Lock size={15} /> Access Required
      </button>
    );
  }

  if (canAccess) {
    return (
      <button className="w-full py-3.5 rounded-2xl text-sm font-bold bg-brand-primary text-white hover:bg-brand-secondary transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-2 animate-pulse">
        <ShieldCheck size={15} /> Access Records
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button
        disabled
        className="w-full py-3.5 rounded-2xl text-sm font-bold bg-gray-100 text-gray-400 cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Lock size={15} /> Access Required
      </button>
      {timeLeft && timeLeft !== "Expired" && (
        <p className="text-center text-xs text-gray-400">
          Unlocks in <span className="font-bold text-brand-secondary font-mono">{timeLeft}</span>
        </p>
      )}
    </div>
  );
}

function JoinCallWidget({ appointment }: { appointment: any }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [canJoin, setCanJoin] = useState(false);

  useEffect(() => {
    const getTarget = () => {
      const [h, m] = (appointment.startTime || "00:00").split(":").map(Number);
      if (appointment.appointmentDate) {
        const d = new Date(appointment.appointmentDate);
        d.setHours(h, m, 0, 0);
        return d;
      }
      const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      const now = new Date();
      const d = new Date();
      d.setHours(h, m, 0, 0);
      let diff = days.indexOf(appointment.day) - d.getDay();
      if (diff < 0) diff += 7;
      else if (diff === 0 && d.getTime() < now.getTime()) diff += 7;
      d.setDate(d.getDate() + diff);
      return d;
    };

    const target = getTarget();
    const tick = () => {
      const dist = target.getTime() - Date.now();
      if (dist <= 5 * 60 * 1000) { setCanJoin(true); setTimeLeft(""); return; }
      setCanJoin(false);
      const d = Math.floor(dist / (1000 * 60 * 60 * 24));
      const h = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m2 = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((dist % (1000 * 60)) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${h}h left` : `${String(h).padStart(2,"0")}:${String(m2).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [appointment]);

  if (canJoin) {
    return (
      <Link href={`/doctor/dashboard/consultation/${appointment.id}`} className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-brand-secondary transition-colors shadow-lg animate-pulse">
        <Video size={15} /> Join Call Now
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-base font-bold text-brand-secondary bg-gray-50 border border-brand-secondary/20 px-4 py-2 rounded-xl flex-1 text-center tracking-widest">
        {timeLeft}
      </span>
      <button disabled className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-200 text-gray-400 font-bold rounded-xl cursor-not-allowed text-sm">
        <Video size={14} /> Join
      </button>
    </div>
  );
}
