"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Users, Activity, Calendar, Loader2, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { useCrypto } from "@/contexts/CryptoContext";
import { decryptData, unwrapKey } from "@/lib/crypto";

function RecentPatientRow({ patient, dek, slug, i }: { patient: any; dek: Uint8Array | null; slug: string; i: number }) {
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    async function decrypt() {
      if (!dek) {
        setDetails({
          firstName: patient.firstName || "",
          lastName: patient.lastName || "",
          gender: patient.gender || "",
        });
        return;
      }
      try {
        if (patient.encryptedDetails) {
          let activeDEK = dek;
          if (patient.hospitalWrappedDEK && patient.hospitalWrapIV) {
            activeDEK = await unwrapKey(patient.hospitalWrappedDEK, patient.hospitalWrapIV, dek);
          }
          const d = await decryptData(patient.encryptedDetails.ciphertext, patient.encryptedDetails.iv, activeDEK);
          setDetails(d);
        } else {
          setDetails({
            firstName: patient.firstName || "",
            lastName: patient.lastName || "",
            gender: patient.gender || "",
          });
        }
      } catch {
        setDetails(null); // decryption failed
      }
    }
    decrypt();
  }, [patient, dek]);

  const initials = details?.firstName?.charAt(0) || "?";
  const displayName = details ? `${details.firstName} ${details.lastName}`.trim() : null;

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-50 text-purple-600 font-bold rounded-full flex items-center justify-center text-sm shrink-0">
          {details === null ? <Lock size={14} /> : initials}
        </div>
        <div>
          {details === null ? (
            <p className="text-sm font-semibold text-red-400">Decryption failed</p>
          ) : displayName ? (
            <p className="font-semibold text-gray-900">{displayName}</p>
          ) : (
            <div className="flex items-center gap-1 text-gray-400">
              <Loader2 size={13} className="animate-spin" />
              <span className="text-xs">Decrypting...</span>
            </div>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <code className="text-[10px] font-bold text-brand-primary bg-brand-primary/5 px-1.5 py-0.5 rounded">{patient.mednorisId}</code>
            {details && <p className="text-xs text-gray-400 capitalize">{details.gender}</p>}
          </div>
        </div>
      </div>
      <Link
        href={`/h/${slug}/staff/patients/${patient.id}`}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-brand-primary hover:text-white transition-colors"
      >
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}

export default function StaffDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [hospital, setHospital] = useState<any>(null);
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalPatients: 0,
    totalStaff: 0,
    totalDepartments: 0,
    recentPatients: [] as any[]
  });

  const { dek } = useCrypto();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const [h, s] = await Promise.all([
        getDoc(doc(db, "hospitals", slug)),
        getDoc(doc(db, "hospital_staff", user.uid)),
      ]);
      if (h.exists()) setHospital(h.data());
      if (s.exists()) setStaffProfile(s.data());
    });
    return () => unsubscribe();
  }, [slug]);

  useEffect(() => {
    if (!staffProfile) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [patSnap, recentSnap, staffSnap] = await Promise.all([
          getDocs(query(collection(db, "hospital_patients"), where("hospitalSlug", "==", slug))),
          getDocs(query(
            collection(db, "hospital_patients"), 
            where("hospitalSlug", "==", slug), 
            orderBy("createdAt", "desc"), 
            limit(10)
          )),
          getDocs(query(collection(db, "hospital_staff"), where("hospitalSlug", "==", slug)))
        ]);

        const uniqueRoles = new Set(staffSnap.docs.map(d => d.data().role));

        setStats({
          totalPatients: patSnap.size,
          totalStaff: staffSnap.size,
          totalDepartments: uniqueRoles.size,
          recentPatients: recentSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        });
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [slug, staffProfile]);

  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;
  }

  return (
    <div className="p-2 md:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-gray-900 mb-1">Staff Dashboard</h2>
        <p className="text-gray-500">Welcome back, {staffProfile?.name || "Staff Member"}.</p>
      </div>

      {staffProfile?.fullAccess && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Users size={24} />
              </div>
            </div>
            <h3 className="text-gray-500 font-medium mb-1">Total Patients Registered</h3>
            <p className="text-3xl font-black text-gray-900">{stats.totalPatients}</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                <Activity size={24} />
              </div>
            </div>
            <h3 className="text-gray-500 font-medium mb-1">Total Staff Added</h3>
            <p className="text-3xl font-black text-gray-900">{stats.totalStaff}</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <Calendar size={24} />
              </div>
            </div>
            <h3 className="text-gray-500 font-medium mb-1">Total Departments</h3>
            <p className="text-3xl font-black text-gray-900">{stats.totalDepartments}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Latest Registered Patients</h3>
          <Link href={`/h/${slug}/staff/patients`} className="text-brand-primary text-sm font-bold hover:underline">View All</Link>
        </div>
        
        <div className="flex flex-col">
          {stats.recentPatients.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No patients registered yet.</p>
          ) : (
            stats.recentPatients.map((patient, i) => (
              <RecentPatientRow key={patient.id} patient={patient} dek={dek} slug={slug} i={i} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
