"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Loader2, ArrowLeft, Star, MapPin, Globe,
  Award, Building, Clock, Calendar, CheckCircle2,
  BadgeCheckIcon
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PublicDoctorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!params.id) return;
      try {
        const decodedId = decodeURIComponent(params.id as string);

        // Try searching by slug first
        const q = query(collection(db, "doctors"), where("slug", "==", decodedId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          setDoctor({ id: docSnap.id, ...docSnap.data() });
        } else {
          // Fallback to searching by document ID (for old records without slugs)
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
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-primary w-10 h-10" />
      </div>
    );
  }

  if (!doctor || doctor.status !== "Verified") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Doctor Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">
            This profile is either unavailable or not yet verified by our team.
          </p>
          <button
            onClick={() => router.back()}
            className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Mock Rating for now
  const rating = 4.9;
  const reviewsCount = 124;

  const getActiveDaysCount = () => {
    if (!doctor.availability) return 0;
    return Object.values(doctor.availability).filter((d: any) => d.active).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <title>{doctor.fullName} | Mednoris</title>
     
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Top Profile Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="relative shrink-0">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden bg-brand-secondary/10 border-4 border-white shadow-lg">
                    {doctor.profileImage ? (
                      <img src={doctor.profileImage} alt={doctor.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-brand-secondary">
                        {doctor.fullName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-3 -right-3 bg-white p-1 rounded-full shadow-sm">
                    <div className="bg-primary text-white p-1.5 rounded-full flex items-center justify-center" title="Verified Provider">
                      <BadgeCheckIcon size={18} />
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-primary">Dr {doctor.fullName}</h1>
                      </div>
                      <p className="text-brand-secondary font-bold text-lg mb-2">{doctor.title}</p>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 font-medium mb-4">
                        <span className="flex items-center gap-1.5 rounded-lg">
                          <Star size={16} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-gray-900 font-bold">{rating}</span> ({reviewsCount} reviews)
                        </span>
                        <span className="flex items-center gap-1.5 rounded-lg">
                          <Award size={16} className="text-brand-secondary" />
                          {doctor.experienceYears} Years Exp.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                      <span>{doctor.location}, {doctor.country}</span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-600">
                      <Globe size={16} className="text-gray-400 shrink-0 mt-0.5" />
                      <span>Language {doctor.languages}</span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-600">
                      <Building size={16} className="text-gray-400 shrink-0 mt-0.5" />
                      <span>{doctor.hospital}</span>
                    </div>
                    
                  </div>
                </div>
              </div>
            </motion.div>

            {/* About Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-2 border-b border-gray-100 pb-2">About Dr. {doctor.fullName.split(' ').pop()}</h2>
              <p className="text-gray-600 leading-relaxed text-md whitespace-pre-wrap">{doctor.biography}</p>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {doctor.specializations?.split(',').map((spec: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-brand-secondary/5 text-brand-secondary border border-brand-secondary/20 rounded-lg text-sm font-semibold">
                        {spec.trim()}
                      </span>
                    ))}
                    {doctor.secondarySpecialty && doctor.secondarySpecialty.split(',').map((spec: string, i: number) => (
                      <span key={`sec-${i}`} className="px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold">
                        {spec.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Credentials</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary"></div>
                    License No: <span className="font-bold text-gray-900">{doctor.medicalLicenseNumber}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Right Sticky Column - Booking & Availability */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">

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
                      <Calendar size={18} className="text-brand-secondary" /> Availability
                    </h3>
                    <span className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-1 rounded-md">
                      {getActiveDaysCount()} Days / Week
                    </span>
                  </div>

                  <div className="space-y-3">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                      const dayData = doctor.availability?.[day];
                      if (!dayData?.active) return null;

                      return (
                        <div key={day} className="flex items-start justify-between text-sm">
                          <span className="font-semibold text-gray-700 w-24 shrink-0">{day}</span>
                          <div className="flex flex-col items-end gap-1">
                            {dayData.slots.map((slot: any, i: number) => (
                              <span key={i} className="text-gray-500">
                                {slot.start} - {slot.end}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {getActiveDaysCount() === 0 && (
                      <p className="text-sm text-gray-500 text-center py-2 bg-gray-50 rounded-lg">
                        Schedule currently unavailable.
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => alert("Booking functionality coming soon!")}
                  className="w-full py-4 text-md bg-brand-primary text-white rounded-xl hover:bg-brand-secondary transition-all shadow-lg hover:shadow-brand-secondary/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Clock size={18} /> Book Consultation
                </button>
              </motion.div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
