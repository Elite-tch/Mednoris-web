"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Plus, Loader2, Search, User, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { canRegisterPatient } from "@/lib/rbac";
import { useCrypto } from "@/contexts/CryptoContext";
import { decryptData, unwrapKey } from "@/lib/crypto";

function PatientRow({ patient, details, i, slug }: { patient: any; details: any; i: number; slug: string }) {

  const initials = details?.firstName?.charAt(0) || "?";
  const displayName = details ? `${details.firstName} ${details.lastName}`.trim() : null;

  return (
    <motion.tr
      key={patient.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: i * 0.03 } }}
      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-50 text-purple-600 font-bold rounded-full flex items-center justify-center text-sm shrink-0">
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
            {details && (
              <p className="text-xs text-gray-400 capitalize">{details.gender}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 hidden sm:table-cell">
        <code className="text-xs font-bold text-brand-primary bg-brand-primary/5 px-2 py-1 rounded-lg">
          {details?.mednorisId || patient.mednorisId}
        </code>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
        {details?.dob || "—"}
      </td>
      <td className="px-6 py-4 hidden md:table-cell">
        <span className="text-xs font-medium text-gray-600">{details?.createdBy || patient.createdBy}</span>
      </td>
      <td className="px-6 py-4 text-right">
        <Link
          href={`/h/${slug}/admin/patients/${patient.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary hover:underline"
        >
          View Profile <ArrowRight size={13} />
        </Link>
      </td>
    </motion.tr>
  );
}

export default function StaffPatientsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [hospital, setHospital] = useState<any>(null);
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const fetchPatients = async () => {
    setLoading(true);
    const q = query(collection(db, "hospital_patients"), where("hospitalSlug", "==", slug));
    const snap = await getDocs(q);
    
    const rawPatients = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    const decryptedPatients = await Promise.all(rawPatients.map(async (p: any) => {
      let details = null;
      if (p.encryptedDetails && dek) {
        try {
          // New architecture: encryptedDetails uses a per-patient DEK wrapped with the hospital DEK
          let activeDEK = dek;
          if (p.hospitalWrappedDEK && p.hospitalWrapIV) {
            activeDEK = await unwrapKey(p.hospitalWrappedDEK, p.hospitalWrapIV, dek);
          }
          details = await decryptData(p.encryptedDetails.ciphertext, p.encryptedDetails.iv, activeDEK);
        } catch(e) {
          details = null; // explicitly null → shows "Decryption failed" in the row
        }
      } else if (!p.encryptedDetails) {
        // Fallback for legacy plaintext records
        details = { 
          firstName: p.firstName, 
          lastName: p.lastName, 
          gender: p.gender, 
          dob: p.dob,
          mednorisId: p.mednorisId,
          createdBy: p.createdBy
        };
      }
      return { ...p, details };
    }));
    
    setPatients(decryptedPatients);
    setLoading(false);
  };

  useEffect(() => { if (dek) fetchPatients(); }, [slug, dek]);

  const filtered = patients.filter(p => {
    if (!search) return true;
    const term = search.toLowerCase();
    const name = `${p.details?.firstName || ''} ${p.details?.lastName || ''}`.toLowerCase();
    const id = (p.details?.mednorisId || p.mednorisId || "").toLowerCase();
    return name.includes(term) || id.includes(term);
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-1">Patients Directory</h2>
          <p className="text-gray-500">{patients.length} patients registered at {hospital?.name || "the hospital"}.</p>
        </div>
        {staffProfile && canRegisterPatient(staffProfile.role, staffProfile.fullAccess) && (
          <Link
            href={`/h/${slug}/admin/patients/add`}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors text-sm shrink-0"
          >
            <Plus size={16} /> Register Patient
          </Link>
        )}
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by Mednoris ID..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <User size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">{search ? "No patients match your Mednoris ID search." : "No patients registered yet."}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Patient</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Mednoris ID</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Date of Birth</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Registered by</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <PatientRow key={p.id} patient={p} details={p.details} slug={slug} i={i} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
