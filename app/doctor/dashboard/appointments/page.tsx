"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, CheckCircle2, XCircle, CalendarClock, Video, User, Loader2 } from "lucide-react";
import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import Toast, { ToastType } from "@/components/ui/Toast";

const tabs = ["Scheduled", "Completed", "Cancelled"];

const statusIcon = { Scheduled: CalendarClock, Completed: CheckCircle2, Cancelled: XCircle };
const statusColor = { 
  Scheduled: "text-brand-secondary bg-brand-secondary/10", 
  Completed: "text-green-600 bg-green-50", 
  Cancelled: "text-red-500 bg-red-50" 
};

export default function DoctorAppointmentsPage() {
  const { user } = usePrivy();
  const [active, setActive] = useState("Scheduled");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Listen to appointments and fetch patient profiles
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const q = query(
      collection(db, "appointments"),
      where("doctorId", "==", user.id)
    );

    const patientCache: Record<string, { name: string; image: string | null }> = {};

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const rawAppts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        
        // Resolve patient profiles dynamically
        const resolvedAppts = await Promise.all(
          rawAppts.map(async (appt: any) => {
            if (!appt.patientId) {
              return { ...appt, patientName: "Patient", patientImage: null };
            }
            if (patientCache[appt.patientId]) {
              return {
                ...appt,
                patientName: patientCache[appt.patientId].name,
                patientImage: patientCache[appt.patientId].image,
              };
            }
            try {
              const pSnap = await getDoc(doc(db, "patients", appt.patientId));
              if (pSnap.exists()) {
                const pData = pSnap.data();
                const details = {
                  name: pData.fullName || "Patient",
                  image: pData.profileImage || null,
                };
                patientCache[appt.patientId] = details;
                return {
                  ...appt,
                  patientName: details.name,
                  patientImage: details.image,
                };
              }
            } catch (err) {
              console.error("Error fetching patient profile:", err);
            }
            return { ...appt, patientName: "Patient", patientImage: null };
          })
        );

        setAppointments(resolvedAppts);
      } catch (err) {
        console.error("Error loading appointments:", err);
        setToast({ message: "Failed to load appointments.", type: "error" });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const filtered = appointments.filter((a) => a.status === active);
  const Icon = statusIcon[active as keyof typeof statusIcon];
  const color = statusColor[active as keyof typeof statusColor];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-primary mb-1">Appointments</h1>
      <p className="text-gray-400 text-sm mb-8">Manage your patient consultations and schedule.</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white rounded-2xl p-2 shadow-sm border border-gray-100 w-fit">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActive(t)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${active === t ? "bg-brand-secondary text-white" : "text-gray-400 hover:text-brand-primary"}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-brand-primary w-8 h-8" />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-brand-secondary/20 flex items-center justify-center font-bold text-brand-primary text-lg shrink-0 overflow-hidden">
                  {a.patientImage ? (
                    <img src={a.patientImage} alt={a.patientName} className="w-full h-full object-cover" />
                  ) : (
                    a.patientName?.charAt(0) || "P"
                  )}
                </div>
                <div>
                  <p className="font-bold text-brand-primary">{a.patientName}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Video size={12} className="text-blue-500" />
                    Video Consult
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:justify-end gap-4 sm:gap-6 flex-1 border-t border-gray-50 pt-4 sm:border-0 sm:pt-0 mt-2 sm:mt-0">
                <div className="flex flex-col sm:items-end text-xs text-gray-500">
                  <span className="flex items-center gap-1"><CalendarDays size={12} />{a.day}{a.appointmentDate ? ` · ${new Date(a.appointmentDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}</span>
                  <span className="flex items-center gap-1 mt-1"><Clock size={12} />{a.slot}</span>
                </div>
                
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {active === "Scheduled" ? (
                    <AppointmentAction appointment={a} />
                  ) : (
                    <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${color}`}>
                      <Icon size={13} />{active}
                    </span>
                  )}
                  
                  <div className="flex items-center gap-3 mt-1">
                    <Link
                      href={`/doctor/dashboard/appointments/${a.id}`}
                      className="text-xs font-bold text-brand-secondary hover:text-brand-primary transition-colors cursor-pointer"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">No {active.toLowerCase()} appointments.</div>
          )}
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

// --- Sub-components ---

function AppointmentAction({ appointment }: { appointment: any }) {
  const [timeLeft, setTimeLeft] = useState<string>("");
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
      
      let currentDay = d.getDay();
      let diff = targetDay - currentDay;
      if (diff < 0) diff += 7;
      
      d.setDate(d.getDate() + diff);
      return d;
    };

    const targetDate = calculateTarget();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      
      const endTime = new Date(targetDate.getTime());
      if (appointment.endTime) {
        const [eH, eM] = appointment.endTime.split(":").map(Number);
        endTime.setHours(eH, eM, 0, 0);
      } else {
        endTime.setHours(endTime.getHours() + 1);
      }
      const endDistance = endTime.getTime() - now;

      if (endDistance <= 0) {
        setCanJoin(false);
        setTimeLeft("Completed");
        return;
      }

      if (distance <= 0) {
        setCanJoin(true);
        setTimeLeft("");
        return;
      }

      setCanJoin(false);
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else {
        setTimeLeft(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [appointment]);

  if (canJoin) {
    return (
      <Link href={`/doctor/dashboard/consultation/${appointment.id}`} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-brand-primary text-white hover:bg-brand-secondary transition-colors shadow-lg animate-pulse cursor-pointer">
        <Video size={13} /> Join Call
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-brand-secondary bg-brand-secondary/10 px-2 py-1.5 rounded-full min-w-[70px] text-center">
        {timeLeft}
      </span>
      <button disabled className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-gray-200 text-gray-400 cursor-not-allowed" title="Available once booked time starts">
        Join Call
      </button>
    </div>
  );
}
