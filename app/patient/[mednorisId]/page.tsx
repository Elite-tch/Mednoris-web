"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, Download, Activity, QrCode } from "lucide-react";
import Link from "next/link";

function QRCodeCanvas({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function renderQR() {
      if (!canvasRef.current || !value) return;
      try {
        const QRCode = (await import("qrcode")).default;
        await QRCode.toCanvas(canvasRef.current, value, {
          width: 180,
          margin: 2,
          color: { dark: "#1e1b4b", light: "#ffffff" },
        });
      } catch (err) {
        console.error("QR render error", err);
      }
    }
    renderQR();
  }, [value]);

  return <canvas ref={canvasRef} className="rounded-2xl shadow-sm" />;
}

export default function PatientPortalPage() {
  const params = useParams();
  const mednorisId = (params.mednorisId as string).toUpperCase();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPatient() {
      try {
        const q = query(
          collection(db, "hospital_patients"),
          where("mednorisId", "==", mednorisId),
          limit(1)
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          setError("Digital Identity not found. Please verify your Mednoris ID.");
        } else {
          setPatient({ id: snap.docs[0].id, ...snap.docs[0].data() });
        }
      } catch (err: any) {
        setError("Failed to load digital identity.");
      } finally {
        setLoading(false);
      }
    }
    fetchPatient();
  }, [mednorisId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7fb]">
        <Loader2 className="animate-spin text-brand-primary" size={36} />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f7fb] p-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Record Not Found</h1>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link href="/" className="px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7fb] flex flex-col">
      {/* Topbar */}
      <header className="h-20 bg-white border-b border-gray-100 flex items-center px-6 shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Mednoris" className="h-8 w-auto object-contain" />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden relative">
            {/* Header pattern */}
            <div className="h-32 bg-brand-primary relative overflow-hidden flex flex-col items-center justify-center pt-4">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-2 shadow-inner">
                <span className="text-2xl font-black text-white">{patient.firstName.charAt(0)}</span>
              </div>
            </div>

            <div className="p-8 pt-6 text-center">
              <h1 className="text-2xl font-black text-gray-900">
                {patient.firstName} {patient.lastName}
              </h1>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
                Verified Digital Identity
              </p>

              <div className="mt-8 flex justify-center">
                <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100 inline-block">
                  <QRCodeCanvas value={patient.mednorisId} />
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <p className="text-sm font-mono font-bold text-brand-primary tracking-widest">
                  {patient.mednorisId}
                </p>
                <p className="text-xs text-blue-600/70 font-medium mt-1">
                  Registered at {patient.hospitalName}
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8 max-w-xs mx-auto">
            Clinical records are securely encrypted on the Mednoris network. Show this QR code to a verified practitioner to grant access to your medical history.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
