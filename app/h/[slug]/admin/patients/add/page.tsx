"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Plus, Loader2, ArrowLeft, Camera, ShieldCheck, Download, Printer } from "lucide-react";
import Link from "next/link";
import { canRegisterPatient } from "@/lib/rbac";
import { ShieldAlert } from "lucide-react";
import WebcamCapture from "@/components/hospital/WebcamCapture";

function generateMednorisId(slug: string) {
  const prefix = slug.substring(0, 3).toUpperCase();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `MED-${prefix}-${rand}`;
}

function QRCodeCanvas({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function renderQR() {
      if (!canvasRef.current || !value) return;
      try {
        const QRCode = (await import("qrcode")).default;
        await QRCode.toCanvas(canvasRef.current, value, {
          width: 200,
          margin: 2,
          color: { dark: "#1e1b4b", light: "#ffffff" },
        });
      } catch (err) {
        console.error("QR render error", err);
      }
    }
    renderQR();
  }, [value]);

  return <canvas ref={canvasRef} className="rounded-2xl shadow-md" />;
}

export default function StaffAddPatientPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [hospital, setHospital] = useState<any>(null);
  const [staffProfile, setStaffProfile] = useState<any>(null);

  const [form, setForm] = useState({ firstName: "", lastName: "", dob: "", gender: "", phone: "", address: "" });
  const [headshotBase64, setHeadshotBase64] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newPatientId, setNewPatientId] = useState<string | null>(null);
  const [newMednorisId, setNewMednorisId] = useState<string | null>(null);

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const mednorisId = generateMednorisId(slug);
      const docRef = await addDoc(collection(db, "hospital_patients"), {
        ...form,
        headshotBase64,
        mednorisId,
        hospitalSlug: slug,
        hospitalName: hospital?.name,
        tabs: {
          basic_info: [],
          summary: [],
          consultation: [],
          lab: [],
          pharmacy: [],
        },
        createdBy: staffProfile?.name || "Staff",
        createdByRole: staffProfile?.role || "staff",
        createdAt: serverTimestamp(),
      });

      // Audit log
      await addDoc(collection(db, "audit_logs"), {
        hospitalSlug: slug,
        actorName: staffProfile?.name || "Staff",
        actorRole: staffProfile?.role || "staff",
        action: `Registered new patient: ${form.firstName} ${form.lastName} (${mednorisId})`,
        timestamp: serverTimestamp(),
      });

      setNewPatientId(docRef.id);
      setNewMednorisId(mednorisId);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to add patient.");
    } finally {
      setLoading(false);
    }
  };

  if (staffProfile && !canRegisterPatient(staffProfile.role)) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <ShieldAlert size={48} className="mx-auto text-red-500 mb-4 opacity-50" />
        <h2 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-6">Your role ({staffProfile.role.replace(/_/g, " ")}) does not have permission to register new patients.</p>
        <Link href={`/h/${slug}/admin/patients`} className="inline-block px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
          Return to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/h/${slug}/admin/patients`}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Directory
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Register New Patient</h1>
        <p className="text-gray-500">Create a comprehensive medical record for a new patient.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8"
      >
        {success && newMednorisId ? (
          <div className="text-center py-4 space-y-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Patient Registered!</h2>
              <p className="text-gray-500 text-sm mt-1">
                {form.firstName} {form.lastName}'s Mednoris ID has been created. Print or save the QR card below.
              </p>
            </div>

            {/* QR Code Card */}
            <div className="inline-block bg-gray-50 border border-gray-100 rounded-3xl p-6 space-y-4" id="patient-qr-card">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mednoris ID Card</p>
              <div className="flex justify-center">
                <QRCodeCanvas value={newMednorisId} />
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-gray-900">{form.firstName} {form.lastName}</p>
                <code className="text-brand-primary font-bold text-sm">{newMednorisId}</code>
                <p className="text-xs text-gray-400 mt-1">{hospital?.name}</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 text-sm transition-colors"
              >
                <Printer size={16} /> Print Card
              </button>
              <button
                onClick={() => {
                  setSuccess(false);
                  setForm({ firstName: "", lastName: "", dob: "", gender: "", phone: "", address: "" });
                  setHeadshotBase64(null);
                  setNewPatientId(null);
                  setNewMednorisId(null);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 text-sm transition-colors"
              >
                Register Another
              </button>
              <Link
                href={`/h/${slug}/admin/patients/${newPatientId}`}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary text-sm transition-colors"
              >
                Open Patient Record
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAdd} className="space-y-6">
            <div className="flex flex-col items-center gap-3 pb-6 border-b border-gray-100">
              {headshotBase64 ? (
                <div 
                  onClick={() => setShowCamera(true)}
                  className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center border-4 border-white shadow-md hover:ring-2 hover:ring-brand-primary/50 transition-all cursor-pointer relative group overflow-hidden"
                >
                  <img src={headshotBase64} alt="Headshot" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => setShowCamera(true)}
                  className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200 hover:border-brand-primary hover:bg-brand-primary/5 transition-colors cursor-pointer group"
                >
                  <Camera size={28} className="text-gray-300 group-hover:text-brand-primary transition-colors" />
                </div>
              )}
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {headshotBase64 ? "Tap to retake" : "Upload Headshot (Optional)"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">First Name</label>
                <input required value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="John" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Last Name</label>
                <input required value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Doe" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Date of Birth</label>
                <input type="date" required value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Gender</label>
                <select required value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors">
                  <option value="">Select gender...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Phone Number</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+234 XXX XXXX" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Home Address</label>
              <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full residential address" rows={3} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors resize-none" />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">{error}</p>}

            <div className="pt-4 border-t border-gray-100">
              <button type="submit" disabled={loading} className="w-full sm:w-auto px-8 py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                {loading ? "Registering Patient..." : "Register Patient"}
              </button>
            </div>
          </form>
        )}
      </motion.div>

      {showCamera && (
        <WebcamCapture 
          onCapture={(base64) => setHeadshotBase64(base64)}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}

