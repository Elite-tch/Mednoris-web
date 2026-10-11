"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, CheckCircle2, XCircle, CalendarClock, Loader2, Video } from "lucide-react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Toast, { ToastType } from "@/components/ui/Toast";

const tabs = ["Scheduled", "Completed", "Cancelled"];

const statusIcon = { Scheduled: CalendarClock, Completed: CheckCircle2, Cancelled: XCircle };
const statusColor = {
  Scheduled: "text-brand-secondary bg-brand-secondary/10",
  Completed: "text-brand-primary bg-brand-primary/10",
  Cancelled: "text-red-500 bg-red-50",
};

const calculateDynamicStatus = (appointment: any) => {
  if (appointment.status !== "Scheduled") return appointment.status;

  const [hours, minutes] = (appointment.startTime || "00:00").split(':').map(Number);
  let targetDate;

  if (appointment.appointmentDate) {
    targetDate = new Date(appointment.appointmentDate);
    targetDate.setHours(hours, minutes, 0, 0);
  } else {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const targetDay = days.indexOf(appointment.day);
    targetDate = new Date();
    targetDate.setHours(hours, minutes, 0, 0);
    let currentDay = targetDate.getDay();
    let diff = targetDay - currentDay;
    if (diff < 0) diff += 7;
    targetDate.setDate(targetDate.getDate() + diff);
  }

  const endTime = new Date(targetDate.getTime());
  if (appointment.endTime) {
    const [eH, eM] = appointment.endTime.split(":").map(Number);
    endTime.setHours(eH, eM, 0, 0);
  } else {
    endTime.setHours(endTime.getHours() + 1);
  }

  if (endTime.getTime() - new Date().getTime() <= 0) {
    return "Completed";
  }

  return "Scheduled";
};

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [active, setActive] = useState("Scheduled");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, "appointments"),
          where("patientId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => {
          const raw = { id: d.id, ...d.data() };
          return { ...raw, status: calculateDynamicStatus(raw) };
        });
        // Sort: newest booking first
        data.sort((a: any, b: any) => {
          const aTime = a.createdAt?.toDate?.()?.getTime?.() ?? new Date(a.createdAt ?? 0).getTime();
          const bTime = b.createdAt?.toDate?.()?.getTime?.() ?? new Date(b.createdAt ?? 0).getTime();
          return bTime - aTime;
        });
        setAppointments(data);
      } catch (err) {
        console.error("Error fetching appointments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [user]);

  const filtered = appointments.filter((a) => a.status === active);
  const Icon = statusIcon[active as keyof typeof statusIcon];
  const color = statusColor[active as keyof typeof statusColor];

  const handleCancel = async (appointmentId: string) => {
    try {
      const targetAppt = appointments.find((a) => a.id === appointmentId);
      await updateDoc(doc(db, "appointments", appointmentId), { status: "Cancelled" });
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: "Cancelled" } : a))
      );

      // Email notifications
      if (targetAppt) {
        // 1. Notify the patient (confirmation)
        if (targetAppt.patientEmail) {
          fetch("/api/notify-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "appointment_canceled",
              email: targetAppt.patientEmail,
              name: targetAppt.patientName,
              doctorName: targetAppt.doctorName,
              slot: targetAppt.slot,
            }),
          }).catch(e => console.error(e));
        }

        // 2. Notify the doctor
        import("firebase/firestore").then(async ({ getDoc, doc }) => {
          const docSnap = await getDoc(doc(db, "doctors", targetAppt.doctorId));
          if (docSnap.exists()) {
            const targetDoctorEmail = docSnap.data().emailAddress || docSnap.data().email;
            if (targetDoctorEmail) {
              fetch("/api/notify-doctor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "appointment_canceled",
                  doctorEmail: targetDoctorEmail,
                  doctorName: targetAppt.doctorName,
                  patientName: targetAppt.patientName,
                  slot: targetAppt.slot,
                }),
              }).catch(e => console.error(e));
            }
          }
        });
      }
    } catch (err) {
      console.error("Error cancelling appointment:", err);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-primary mb-1">Appointments</h1>
      <p className="text-gray-400 text-sm mb-8">Manage and track all your consultations.</p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white rounded-2xl p-2 shadow-sm border border-gray-100 w-full sm:w-fit">
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
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Avatar + Info row */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full bg-brand-secondary/20 flex items-center justify-center font-bold text-brand-primary text-lg shrink-0 overflow-hidden">
                  {a.doctorImage ? (
                    <img src={a.doctorImage} alt={a.doctorName} className="w-full h-full object-cover" />
                  ) : (
                    a.doctorName?.charAt(0) || "D"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-brand-primary truncate">{a.doctorTitle ? `${a.doctorTitle} ` : ''}{a.doctorName}</p>
                  <p className="text-xs text-gray-400 truncate">{a.doctorSpecialty}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1"><CalendarDays size={12} />{a.day}</span>
                    <span className="flex items-center gap-1"><Clock size={12} />{a.slot}</span>
                    {a.consultationFee && (
                      <span className="font-semibold text-brand-primary">${a.consultationFee}</span>
                    )}
                  </div>
                </div>
              </div>
              {/* Actions */}
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-2 shrink-0 border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0 mt-1 sm:mt-0 w-full sm:w-auto">
                {active === "Scheduled" ? (
                  <AppointmentAction appointment={a} color={color} Icon={Icon} />
                ) : (
                  <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${color}`}>
                    <Icon size={13} />{active}
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <Link
                    href={`/patient/dashboard/appointments/${a.id}`}
                    className="text-xs font-bold text-brand-secondary hover:text-brand-primary transition-colors cursor-pointer"
                  >
                    View Details
                  </Link>
                  {active === "Scheduled" && (
                    <button
                      onClick={() => handleCancel(a.id)}
                      className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
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

function AppointmentAction({ appointment, color, Icon }: { appointment: any, color: string, Icon: any }) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [canJoin, setCanJoin] = useState(false);

  useEffect(() => {
    const calculateTarget = () => {
      const [hours, minutes] = (appointment.startTime || "00:00").split(':').map(Number);
      
      if (appointment.appointmentDate) {
        const d = new Date(appointment.appointmentDate);
        d.setHours(hours, minutes, 0, 0);
        return d;
      }
      
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const targetDay = days.indexOf(appointment.day);
      
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
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [appointment]);

  if (canJoin) {
    return (
      <Link href={`/patient/dashboard/consultation/${appointment.id}`} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-brand-primary text-white hover:bg-brand-secondary transition-colors shadow-lg animate-pulse cursor-pointer">
        <Video size={13} /> Join Call
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-brand-secondary bg-brand-secondary/10 px-2 py-1.5 rounded-full min-w-[70px] text-center">
        {timeLeft}
      </span>
      <button disabled className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-gray-200 text-gray-400 cursor-not-allowed">
        Join Call
      </button>
    </div>
  );
}
