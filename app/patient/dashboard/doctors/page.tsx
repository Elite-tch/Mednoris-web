"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, BadgeCheck, Star, Globe, Stethoscope, CalendarPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const specialtiesList = ["All", "Cardiology", "General Practice", "Neurology", "Dermatology", "Pediatrics", "Orthopedics"];

export default function DoctorsPage() {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "doctors"), where("status", "==", "Verified"));
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

  const filtered = doctors.filter((d) => {
    const nameMatch = d.fullName?.toLowerCase().includes(search.toLowerCase());
    const specMatch = d.specializations?.toLowerCase().includes(search.toLowerCase());
    const matchSearch = nameMatch || specMatch;
    
    // For specialty filter, handle 'All' and exact or partial match
    const matchSpec = specialty === "All" || (d.specializations && d.specializations.includes(specialty));
    
    return matchSearch && matchSpec;
  });

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-primary mb-1">Find a Doctor</h1>
      <p className="text-gray-400 text-sm mb-6">Browse verified healthcare professionals worldwide.</p>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or specialty..."
            className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-brand-secondary" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {specialtiesList.map((s) => (
            <button key={s} onClick={() => setSpecialty(s)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${specialty === s ? "bg-brand-secondary text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-brand-secondary"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 w-full h-full">
          <Loader2 className="animate-spin text-brand-primary w-10 h-10" />
        </div>
      ) : (
        <>
          {/* Doctor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((d, i) => {
              const rating = 4.9; // Mock rating for now
              const reviews = 124; // Mock reviews for now
              const isAvailable = d.availability && Object.values(d.availability).some((day: any) => day.active);
              const fee = d.consultationFee ? `$${d.consultationFee}` : "$50";

              return (
                <Link key={d.id} href={`/patient/dashboard/doctors/${d.fullName || d.slug || d.id}`}>
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-secondary/30 transition-all cursor-pointer h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-start gap-3 mb-4">
                        <div className="relative shrink-0">
                          <div className="w-14 h-14 rounded-2xl bg-brand-secondary/15 overflow-hidden flex items-center justify-center font-bold text-brand-primary text-xl">
                            {d.profileImage ? (
                              <img src={d.profileImage} alt={d.fullName} className="w-full h-full object-cover" />
                            ) : (
                              d.fullName?.charAt(0) || "?"
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                            <BadgeCheck size={16} className="text-brand-secondary fill-brand-secondary/10" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <p className="font-bold text-brand-primary text-sm line-clamp-1">{d.title ? `${d.title} ` : ''}{d.fullName}</p>
                          </div>
                          <p className="text-xs text-gray-400 line-clamp-1">{d.specializations || "General"}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={11} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-xs font-bold text-brand-primary">{rating}</span>
                            <span className="text-xs text-gray-400">({reviews} reviews)</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Globe size={12} className="shrink-0" />
                          <span className="line-clamp-1">{d.location ? `${d.location}, ` : ''}{d.country || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Stethoscope size={12} className="shrink-0" />
                          <span className="line-clamp-1">{d.languages || "English"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        <p className="text-xs text-gray-400">Consultation fee</p>
                        <p className="font-extrabold text-brand-primary">{fee}</p>
                      </div>
                      <button disabled={!isAvailable}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${isAvailable ? "bg-brand-secondary text-white hover:bg-brand-primary" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                        <CalendarPlus size={13} />
                        {isAvailable ? "Book Now" : "Unavailable"}
                      </button>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
          {filtered.length === 0 && <p className="text-center text-gray-400 py-12">No doctors found matching your search.</p>}
        </>
      )}
    </div>
  );
}
