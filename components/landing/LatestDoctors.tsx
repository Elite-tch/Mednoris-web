"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, query, where, limit, getDocs, doc, getDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BadgeCheck, Star, Globe, Stethoscope, CalendarPlus, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Toast, { ToastType } from "@/components/ui/Toast";

export default function LatestDoctors() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  
  const { authenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const q = query(
          collection(db, "doctors"), 
          where("status", "==", "Verified"),
          limit(4)
        );
        const querySnapshot = await getDocs(q);
        const docsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDoctors(docsData);
      } catch (error) {
        console.error("Error fetching verified doctors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleViewAll = async () => {
    if (!authenticated || !user) {
      setToast({ message: "Please log in to view all doctors.", type: "error" });
      router.push('/auth');
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const role = userDoc.data().role?.toLowerCase() || "patient";
        router.push(`/${role}/dashboard/doctors`);
      } else {
        setToast({ message: "Please complete your registration first.", type: "error" });
        setTimeout(() => { router.push("/auth"); }, 1500);
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      setToast({ message: "An error occurred. Please try again.", type: "error" });
    }
  };

  const handleBook = async (doctor: any) => {
    if (!authenticated || !user) {
      setToast({ message: "Please login or register as a patient first.", type: "error" });
      router.push('/auth');
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const role = userDoc.data().role?.toLowerCase() || "patient";
        if (role === "patient") {
          const targetId = doctor.fullName || doctor.slug || doctor.id;
          router.push(`/patient/dashboard/doctors/${targetId}`);
        } else {
          setToast({ message: "Only patients can book appointments. Please register as a patient.", type: "error" });
        }
      } else {
        setToast({ message: "Please complete your registration first.", type: "error" });
        setTimeout(() => { router.push("/auth"); }, 1500);
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      setToast({ message: "An error occurred. Please try again.", type: "error" });
    }
  };

  return (
    <section id="doctors" className="py-14 px-4 bg-white border-y border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-extrabold text-brand-primary mb-3"
          >
            Meet Our Top Specialists
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 max-w-2xl mx-auto text-lg"
          >
            Consult with verified healthcare professionals from around the world.
          </motion.p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 w-full h-full">
            <Loader2 className="animate-spin text-brand-primary w-10 h-10" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.map((d, i) => {
              const rating = 4.9; // Mock rating for landing page
              const reviews = 124; // Mock reviews for landing page
              const fee = d.consultationFee ? `$${d.consultationFee}` : "$50";

              return (
                <motion.div 
                  key={d.id}
                  initial={{ opacity: 0, y: 20 }} 
                  whileInView={{ opacity: 1, y: 0 }} 
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-brand-secondary/30 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start gap-3 mb-5">
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 rounded-2xl bg-brand-secondary/10 overflow-hidden flex items-center justify-center font-bold text-brand-primary text-xl">
                          {d.profileImage ? (
                            <img src={d.profileImage} alt={d.fullName} className="w-full h-full object-cover" />
                          ) : (
                            d.fullName?.charAt(0) || "?"
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                          <BadgeCheck size={18} className="text-brand-secondary fill-brand-secondary/10" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="font-bold text-brand-primary text-base line-clamp-1">{d.title ? `${d.title} ` : ''}{d.fullName}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <Star size={12} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-bold text-brand-primary">{rating}</span>
                          <span className="text-[10px] text-gray-400">({reviews})</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Globe size={14} className="shrink-0 text-brand-secondary/70" />
                        <span className="line-clamp-1">{d.location ? `${d.location}, ` : ''}{d.country || 'Global'}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {d.specializations?.split(",").slice(0, 3).map((spec: string, idx: number) => (
                          <span key={idx} className=" flex items-center gap-2 text-gray-500 text-[10px] font-semibold whitespace-nowrap">
                          <Stethoscope size={14} className="shrink-0 text-brand-secondary/70" />  {spec.trim()}
                          </span>
                        ))}
                        {d.secondarySpecialty && d.secondarySpecialty.split(",").slice(0, 1).map((spec: string, idx: number) => (
                          <span key={`sec-${idx}`} className="flex items-center gap-2 text-gray-500 text-[10px] text-[10px] font-semibold whitespace-nowrap">
                          <Stethoscope size={14} className="shrink-0 text-brand-secondary/70" />  {spec.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Fee</p>
                      <p className="font-extrabold text-brand-primary">{fee}</p>
                    </div>
                    <button 
                      onClick={() => handleBook(d)}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer bg-brand-primary text-white hover:bg-brand-secondary"
                    >
                      <CalendarPlus size={14} />
                      View Profile
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <button 
            onClick={handleViewAll}
            className="px-8 py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            View All Doctors
          </button>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </section>
  );
}
