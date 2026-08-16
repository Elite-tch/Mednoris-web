"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, QrCode, Loader2, Search, User, ArrowRight, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { hashData, decryptData } from "@/lib/crypto";
import { useCrypto } from "@/contexts/CryptoContext";

export default function ScanPatientPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [manualId, setManualId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundPatient, setFoundPatient] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { dek } = useCrypto();

  // Auto-focus the input — works for physical QR barcode scanners which act as keyboards
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleSearch = async (idToSearch?: string) => {
    let rawSearchInput = (idToSearch || manualId).trim();
    if (!rawSearchInput) return;

    if (rawSearchInput.includes("http")) {
      try {
        const url = new URL(rawSearchInput);
        const parts = url.pathname.split("/");
        rawSearchInput = parts[parts.length - 1];
      } catch (e) {
        // Ignore URL parsing errors
      }
    }

    const searchId = rawSearchInput.toUpperCase();

    setLoading(true);
    setError(null);
    setFoundPatient(null);

    try {
      // Auth check
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        if (!user) {
          setError("Not authenticated.");
          setLoading(false);
          return;
        }

        const searchHash = await hashData(searchId);

        const q = query(
          collection(db, "hospital_patients"),
          where("hospitalSlug", "==", slug),
          where("mednorisIdHash", "==", searchHash),
          limit(1)
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          setError(`No patient found with Mednoris ID "${searchId}". Please verify the card.`);
        } else {
          const rawData = { id: snap.docs[0].id, ...snap.docs[0].data() };
          let decryptedDetails = null;
          
          if (rawData.encryptedDetails && dek) {
            try {
              decryptedDetails = await decryptData(rawData.encryptedDetails.ciphertext, rawData.encryptedDetails.iv, dek);
            } catch (e) {
              console.error("Failed to decrypt scanned patient", e);
            }
          } else {
            decryptedDetails = { firstName: rawData.firstName };
          }
          
          setFoundPatient({ ...rawData, details: decryptedDetails });
        }
        setLoading(false);
      });
    } catch (err: any) {
      setError(err.message || "Search failed.");
      setLoading(false);
    }
  };

  // Handle Enter key or automatic QR scanner input (which ends with Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/h/${slug}/staff/patients`}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Directory
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Scan Patient Card</h1>
        <p className="text-gray-500">
          Scan a patient's Mednoris ID card QR code, or type the Mednoris ID manually to pull up their record.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8"
      >
        {/* Scan zone visual */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-52 h-52 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center mb-4">
            {/* Corner accents */}
            <span className="absolute top-2 left-2 w-5 h-5 border-t-4 border-l-4 border-brand-primary rounded-tl-lg" />
            <span className="absolute top-2 right-2 w-5 h-5 border-t-4 border-r-4 border-brand-primary rounded-tr-lg" />
            <span className="absolute bottom-2 left-2 w-5 h-5 border-b-4 border-l-4 border-brand-primary rounded-bl-lg" />
            <span className="absolute bottom-2 right-2 w-5 h-5 border-b-4 border-r-4 border-brand-primary rounded-br-lg" />
            {loading ? (
              <Loader2 size={48} className="animate-spin text-brand-primary" />
            ) : foundPatient ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 font-black text-2xl rounded-full flex items-center justify-center mx-auto mb-2">
                  {foundPatient.details?.firstName?.charAt(0) || "?"}
                </div>
                <p className="text-xs font-bold text-green-700">Found!</p>
              </div>
            ) : (
              <QrCode size={72} className="text-gray-200" />
            )}
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {loading ? "Searching..." : foundPatient ? "Patient Located" : "Point scanner at QR code"}
          </p>
        </div>

        {/* Manual input — also captures QR scanner keyboard input */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
          <input
            ref={inputRef}
            value={manualId}
            onChange={e => { setManualId(e.target.value); setFoundPatient(null); setError(null); }}
            onKeyDown={handleKeyDown}
            placeholder="MED-XXX-000000 or scan QR code..."
            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-mono tracking-wider outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary uppercase transition-all"
            autoComplete="off"
          />
        </div>

        <button
          onClick={() => handleSearch()}
          disabled={loading || !manualId.trim()}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-primary text-white font-bold rounded-2xl hover:bg-brand-secondary transition-colors disabled:opacity-50 text-sm"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          {loading ? "Searching Records..." : "Find Patient"}
        </button>

        {/* Error state */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl"
            >
              <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Found patient card */}
        <AnimatePresence>
          {foundPatient && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 bg-green-50 border border-green-100 rounded-2xl p-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 text-green-700 font-black text-xl rounded-full flex items-center justify-center shrink-0">
                  {foundPatient.firstName?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 text-lg">
                    {foundPatient.firstName} {foundPatient.lastName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-lg">
                      {foundPatient.mednorisId}
                    </code>
                    <span className="text-xs text-gray-500 capitalize">
                      {foundPatient.gender} · DOB: {foundPatient.dob}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/h/${slug}/staff/patients/${foundPatient.id}`}
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors text-sm"
                >
                  Open Record <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <p className="text-center text-xs text-gray-400 mt-6">
        This page accepts input from USB or Bluetooth QR/barcode scanners automatically.
      </p>
    </div>
  );
}
