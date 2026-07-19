"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePrivy } from "@privy-io/react-auth";
import {
  Loader2, ArrowLeft, Star, MapPin, Globe, Award, Building,
  Clock, Calendar, BadgeCheckIcon, Stethoscope, CalendarDays
} from "lucide-react";
import { motion } from "framer-motion";
import Toast, { ToastType } from "@/components/ui/Toast";
import BookingModal from "@/components/patient/BookingModal";

export default function PublicDoctorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, authenticated, login } = usePrivy();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!params.id) return;
      try {
        const decodedId = decodeURIComponent(params.id as string);
        const q = query(collection(db, "doctors"), where("slug", "==", decodedId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          setDoctor({ id: docSnap.id, ...docSnap.data() });
        } else {
          const snap = await getDoc(doc(db, "doctors", decodedId));
          if (snap.exists()) setDoctor({ id: snap.id, ...snap.data() });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-brand-primary w-10 h-10" />
      </div>
    );
  }

  if (!doctor || doctor.status !== "Verified") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md w-full">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Doctor Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">
            This profile is either unavailable or not yet verified.
          </p>
          <button onClick={() => router.back()} className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors cursor-pointer">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const rating = 4.9;
  const reviewsCount = 124;

  const getActiveDaysCount = () => {
    if (!doctor.availability) return 0;
    return Object.values(doctor.availability).filter((d: any) => d.active).length;
  };

  const handleBookNow = () => {
    if (!selectedSlot) {
      setToast({ message: "Please select a time slot first.", type: "error" });
      return;
    }
    if (!authenticated) {
      login();
      return;
    }
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <title>{doctor.fullName} | Mednoris</title>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-brand-primary font-semibold transition-colors cursor-pointer mb-6"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="xl:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="relative shrink-0">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden bg-brand-secondary/10 border-4 border-white shadow-lg flex items-center justify-center font-bold text-brand-primary text-4xl">
                    {doctor.profileImage ? (
                      <img src={doctor.profileImage} alt={doctor.fullName} className="w-full h-full object-cover" />
                    ) : (
                      doctor.fullName?.charAt(0) || "?"
                    )}
                  </div>
                  <div className="absolute -bottom-3 -right-3 bg-white p-1 rounded-full shadow-sm">
                    <div className="bg-brand-primary text-white p-1.5 rounded-full flex items-center justify-center" title="Verified Provider">
                      <BadgeCheckIcon size={18} />
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-primary mb-1">
                    {doctor.title ? `${doctor.title} ` : "Dr. "}{doctor.fullName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm font-medium mb-4 mt-2">
                    <span className="flex items-center gap-1.5 rounded-lg border border-gray-100 px-3 py-1 bg-gray-50">
                      <Star size={16} className="text-yellow-400 fill-yellow-400" />
                      <span className="font-bold text-gray-900">{rating}</span> ({reviewsCount} reviews)
                    </span>
                    <span className="flex items-center gap-1.5 rounded-lg border border-gray-100 px-3 py-1 bg-gray-50">
                      <Award size={16} className="text-brand-secondary" />
                      {doctor.experienceYears} Years Exp.
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                    <div className="flex items-start gap-2 text-gray-600 min-w-0">
                      <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                      <span className="break-words min-w-0">{doctor.location ? `${doctor.location}, ` : ""}{doctor.country}</span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-600 min-w-0">
                      <Globe size={16} className="text-gray-400 shrink-0 mt-0.5" />
                      <span className="break-words min-w-0">Speaks {doctor.languages || "English"}</span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-600 min-w-0">
                      <Building size={16} className="text-gray-400 shrink-0 mt-0.5" />
                      <span className="break-words min-w-0">{doctor.hospital}</span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-600 min-w-0">
                      <Stethoscope size={16} className="text-gray-400 shrink-0 mt-0.5" />
                      <span className="break-words min-w-0">{doctor.specializations || "General Practice"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bio & Specialties */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-2 border-b border-gray-100 pb-2">
                About {doctor.title ? `${doctor.title} ` : "Dr. "}{doctor.fullName.split(" ").pop()}
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{doctor.biography}</p>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {doctor.specializations?.split(",").map((spec: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-brand-secondary/5 text-brand-secondary border border-brand-secondary/20 rounded-lg text-sm font-semibold">{spec.trim()}</span>
                    ))}
                    {doctor.secondarySpecialty && doctor.secondarySpecialty.split(",").map((spec: string, i: number) => (
                      <span key={`s-${i}`} className="px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold">{spec.trim()}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Credentials</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary shrink-0 mt-1.5" />
                      <span className="break-words min-w-0">License No: <span className="font-bold text-gray-900 break-all">{doctor.medicalLicenseNumber}</span></span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Booking Panel */}
          <div className="xl:col-span-1">
            <div className="sticky top-8 space-y-6">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl p-6 shadow-xl border border-brand-secondary/20">
                <div className="text-center mb-6 border-b border-gray-100 pb-6">
                  <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Consultation Fee</p>
                  <div className="text-4xl font-extrabold text-brand-primary">
                    ${doctor.consultationFee || "50"}<span className="text-lg text-gray-400 font-medium">/session</span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Calendar size={18} className="text-brand-secondary" /> Select a Slot
                    </h3>
                    <span className="text-xs font-bold text-brand-secondary bg-brand-secondary/10 px-2 py-1 rounded-md">
                      {getActiveDaysCount()} Days / Week
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
                    {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((day) => {
                      const dayData = doctor.availability?.[day];
                      if (!dayData?.active) return null;
                      return (
                        <div key={day} className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                          <span className="font-bold text-xs text-gray-500 uppercase tracking-wider block mb-2">{day}</span>
                          <div className="flex flex-col gap-2">
                            {dayData.slots.map((slot: any, i: number) => {
                              const slotDates: string[] = slot.dates || [];
                              if (slotDates.length > 0) {
                                return slotDates.map((date) => {
                                  const slotId = `${day}|${date}-${slot.start}-${slot.end}`;
                                  const isSelected = selectedSlot === slotId;
                                  const formatted = new Date(date).toLocaleDateString("en-GB", {
                                    weekday: "short", day: "numeric", month: "short",
                                  });
                                  return (
                                    <label key={slotId} className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${isSelected ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary" : "border-gray-200 hover:border-brand-primary/40 bg-gray-50"}`}>
                                      <div className="flex flex-col min-w-0">
                                        <span className={`text-xs font-semibold flex items-center gap-1 ${isSelected ? "text-brand-primary" : "text-gray-500"}`}>
                                          <CalendarDays size={11} className="shrink-0" /> {formatted}
                                        </span>
                                        <span className={`text-sm font-bold ${isSelected ? "text-brand-primary" : "text-gray-700"}`}>{slot.start} – {slot.end}</span>
                                      </div>
                                      <input type="radio" name="availability-slot" className="w-4 h-4 shrink-0 cursor-pointer" style={{ accentColor: "#34254e" }} checked={isSelected} onChange={() => setSelectedSlot(slotId)} />
                                    </label>
                                  );
                                });
                              }
                              const slotId = `${day}-${slot.start}-${slot.end}`;
                              const isSelected = selectedSlot === slotId;
                              return (
                                <label key={i} className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${isSelected ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary" : "border-gray-200 hover:border-brand-primary/40 bg-gray-50"}`}>
                                  <span className={`font-bold text-sm ${isSelected ? "text-brand-primary" : "text-gray-700"}`}>{slot.start} – {slot.end}</span>
                                  <input type="radio" name="availability-slot" className="w-4 h-4 shrink-0 cursor-pointer" style={{ accentColor: "#34254e" }} checked={isSelected} onChange={() => setSelectedSlot(slotId)} />
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {getActiveDaysCount() === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-xl border border-gray-100">Schedule currently unavailable.</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleBookNow}
                  disabled={getActiveDaysCount() === 0}
                  className={`w-full py-4 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                    getActiveDaysCount() === 0
                      ? "bg-gray-300 shadow-none cursor-not-allowed"
                      : "bg-brand-primary hover:bg-brand-secondary cursor-pointer"
                  }`}
                >
                  <Clock size={18} />
                  {!authenticated ? "Login to Book" : selectedSlot ? "Book Now" : "Select a Slot"}
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {showModal && selectedSlot && user && (
        <BookingModal
          doctor={doctor}
          selectedSlot={selectedSlot}
          patientId={user.id}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setToast({ message: "Appointment booked! Check your dashboard.", type: "success" });
            setSelectedSlot(null);
          }}
          onError={(msg) => setToast({ message: msg, type: "error" })}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
