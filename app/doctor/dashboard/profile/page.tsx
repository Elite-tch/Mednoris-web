"use client";
import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Loader2, UploadCloud, Save, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Toast, { ToastType } from "@/components/ui/Toast";

export default function DoctorProfilePage() {
  const { user } = usePrivy();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  
  const [form, setForm] = useState({
    fullName: "",
    title: "",
    specializations: "",
    secondarySpecialty: "",
    languages: "",
    biography: "",
    profileImage: "",
    status: "Pending Verification",
    slug: "",
    emailAddress: "",
    phoneNumber: "",
    experienceYears: "",
    gender: "",
    medicalLicenseNumber: "",
    country: "",
    location: "",
    hospital: "",
  });

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      setLoading(true);
      const snap = await getDoc(doc(db, "doctors", user.id));
      if (snap.exists()) setForm(snap.data() as typeof form);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      let imageUrl = form.profileImage;
      if (imageFile) imageUrl = await uploadToCloudinary(imageFile);
      
      let currentSlug = form.slug;
      if (!currentSlug && form.fullName) {
        const baseSlug = form.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
        const shortId = user.id.split(":").pop()?.substring(0, 6) || Math.random().toString(36).substring(2, 8);
        currentSlug = `${baseSlug}-${shortId}`;
      }

      await updateDoc(doc(db, "doctors", user.id), { ...form, profileImage: imageUrl, slug: currentSlug });
      setForm({ ...form, profileImage: imageUrl, slug: currentSlug });
      setToast({ message: "Profile updated successfully!", type: "success" });
    } catch {
      setToast({ message: "Failed to save profile. Please try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-primary" /></div>;

  const status = form.status || "Pending Verification";
  const isVerified = status === "Verified";
  const isRejected = status === "Rejected";

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-primary mb-1">Public Profile</h1>
            <p className="text-gray-400 text-sm">Manage how patients see you on the Mednoris platform.</p>
          </div>
          <Link 
            href={`/doctor/dashboard/doctors/${form.slug || user?.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-primary/10 text-brand-primary font-bold rounded-xl hover:bg-brand-primary/20 transition-colors text-sm shrink-0"
          >
            Preview Public Profile <ExternalLink size={16} />
          </Link>
        </div>

        {/* Verification Banner */}
        <div className={`p-4 rounded-xl mb-8 border ${
          isVerified ? "bg-green-50 border-green-200" :
          isRejected ? "bg-red-50 border-red-200" :
          "bg-orange-50 border-orange-200"
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-bold text-sm ${
              isVerified ? "text-green-700" :
              isRejected ? "text-red-700" :
              "text-orange-700"
            }`}>
              Status: {status}
            </h3>
          </div>
          <p className={`text-xs ${
            isVerified ? "text-green-600" :
            isRejected ? "text-red-600" :
            "text-orange-600"
          }`}>
            {isVerified
              ? "Your profile is fully verified and listed in the Patient Marketplace."
              : isRejected
              ? "Your application was rejected. Please contact support or update your documents."
              : "Only verified doctors are listed in the Patient Marketplace. Our admin team is reviewing your documents."}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6 bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          {/* Profile Image */}
          <div className="flex items-center gap-6 border-b border-gray-100 pb-8 mb-4">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-brand-secondary/10 shrink-0">
              {imageFile ? (
                <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
              ) : form.profileImage ? (
                <img src={form.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-secondary font-bold text-3xl">
                  {form.fullName?.charAt(0) || "?"}
                </div>
              )}
            </div>
            <div>
              <p className="font-bold text-brand-primary mb-1">Professional Photo</p>
              <p className="text-xs text-gray-500 mb-3">Upload a clear photo to help patients recognize you.</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
                <UploadCloud size={16} /> Choose Photo
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) setImageFile(e.target.files[0]); }} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-brand-primary mb-1">Full Name</label>
              <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-brand-secondary text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-primary mb-1">Professional Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. MD, PhD"
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-brand-secondary text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-primary mb-1">Email Address</label>
              <input type="email" value={form.emailAddress} onChange={(e) => setForm({ ...form, emailAddress: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-brand-secondary text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-primary mb-1">Phone Number</label>
              <input type="tel" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-brand-secondary text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-primary mb-1">Primary Specialty</label>
              <input type="text" value={form.specializations} onChange={(e) => setForm({ ...form, specializations: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-brand-secondary text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-primary mb-1">Secondary Specialty</label>
              <input type="text" value={form.secondarySpecialty} onChange={(e) => setForm({ ...form, secondarySpecialty: e.target.value })} placeholder="Optional"
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-brand-secondary text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-primary mb-1">Medical License Number</label>
              <input type="text" value={form.medicalLicenseNumber} onChange={(e) => setForm({ ...form, medicalLicenseNumber: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-brand-secondary text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-primary mb-1">Years of Experience</label>
              <input type="number" min="0" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-brand-secondary text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-primary mb-1">Gender</label>
              <div className="flex flex-wrap gap-2">
                {["Male", "Female", "Other", "Prefer not to say"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm({ ...form, gender: g })}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                      form.gender === g
                        ? "bg-brand-secondary text-white border-brand-secondary"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-brand-secondary/50"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-primary mb-1">Languages Spoken</label>
              <input type="text" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} placeholder="e.g. English, Spanish"
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-brand-secondary text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-primary mb-1">Country of Practice</label>
              <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-brand-secondary text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-primary mb-1">City / State</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-brand-secondary text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-primary mb-1">Hospital / Clinic</label>
            <input type="text" value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-brand-secondary text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-primary mb-1">Professional Bio</label>
            <textarea rows={5} value={form.biography} onChange={(e) => setForm({ ...form, biography: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-brand-secondary text-sm resize-none" />
          </div>

          <button type="submit" disabled={saving}
            className="flex items-center justify-center gap-2 w-full py-4 bg-brand-secondary text-white font-bold rounded-xl hover:bg-brand-primary transition-colors disabled:opacity-50 cursor-pointer">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Profile
          </button>
        </form>
      </motion.div>

      {/* Toast Notification */}
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
