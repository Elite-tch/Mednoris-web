"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, ArrowLeft, CheckCircle, XCircle, FileText, Video, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function DoctorDetailViewPage() {
  const params = useParams();
  const router = useRouter();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<"Verified" | "Rejected" | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!params.id) return;
      try {
        const decodedId = decodeURIComponent(params.id as string);
        const snap = await getDoc(doc(db, "doctors", decodedId));
        if (snap.exists()) {
          setDoctor({ id: snap.id, ...snap.data() });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [params.id]);

  const updateStatus = async (newStatus: "Verified" | "Rejected") => {
    if (!doctor || !params.id) return;
    setUpdating(newStatus);
    try {
      const decodedId = decodeURIComponent(params.id as string);
      await updateDoc(doc(db, "doctors", decodedId), { status: newStatus });

      // Notify the doctor about their verification result
      await addDoc(collection(db, "notifications"), {
        userId: decodedId,
        title: newStatus === "Verified" ? "🎉 Account Verified!" : "Account Verification Update",
        message: newStatus === "Verified"
          ? "Congratulations! Your doctor account has been verified. You can now receive appointments and consult with patients."
          : "Your account verification was not approved at this time. Please review your submitted documents and contact support if you have questions.",
        type: "system",
        read: false,
        link: "/doctor/dashboard/profile",
        createdAt: new Date().toISOString(),
      });

      alert(`Doctor has been ${newStatus.toLowerCase()}.`);
      router.push("/admin/verification");
    } catch (e) {
      console.error(e);
      alert("Failed to update status.");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-brand-secondary" size={40} /></div>;
  }

  if (!doctor) {
    const rawId = params.id as string;
    const decodedId = decodeURIComponent(rawId);
    
    return (
      <div className="text-center py-32">
        <p className="text-gray-500 mb-4">Doctor not found.</p>
        <div className="text-xs text-gray-400 bg-gray-100 p-4 rounded-xl max-w-md mx-auto overflow-auto text-left">
          <p><strong>Raw params.id:</strong> {rawId}</p>
          <p><strong>Decoded ID:</strong> {decodedId}</p>
        </div>
      </div>
    );
  }

  const { documents = {} } = doctor;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <Link href="/admin/verification" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Queue
      </Link>

      <div className="flex flex-col md:flex-row gap-6 items-start justify-between mb-8">
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm shrink-0">
            {doctor.profileImage ? (
              <img src={doctor.profileImage} alt={doctor.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-2xl">
                {doctor.fullName?.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">{doctor.fullName}</h1>
            <p className="text-gray-500 font-medium">{doctor.title} • {doctor.specializations}</p>
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
              Current Status: {doctor.status}
            </div>
          </div>
        </div>
        
        {doctor.status === "Pending Verification" && (
          <div className="flex gap-3 shrink-0 w-full md:w-auto">
            <button onClick={() => updateStatus("Rejected")} disabled={updating !== null}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer">
              {updating === "Rejected" ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />} Reject
            </button>
            <button onClick={() => updateStatus("Verified")} disabled={updating !== null}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer">
              {updating === "Verified" ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />} Approve
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">Provider Details</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-1">Email Address</p>
                <p className="font-medium text-gray-900">{doctor.emailAddress || doctor.email || doctor.wallet || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Phone Number</p>
                <p className="font-medium text-gray-900">{doctor.phoneNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Gender</p>
                <p className="font-medium text-gray-900">{doctor.gender || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Years of Experience</p>
                <p className="font-medium text-gray-900">{doctor.experienceYears ? `${doctor.experienceYears} years` : "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Medical License Number</p>
                <p className="font-medium text-gray-900">{doctor.medicalLicenseNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Primary Specialty</p>
                <p className="font-medium text-gray-900">{doctor.specializations || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Secondary Specialty</p>
                <p className="font-medium text-gray-900">{doctor.secondarySpecialty || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Languages</p>
                <p className="font-medium text-gray-900">{doctor.languages || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Country</p>
                <p className="font-medium text-gray-900">{doctor.country || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">City / State</p>
                <p className="font-medium text-gray-900">{doctor.location || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Hospital / Clinic</p>
                <p className="font-medium text-gray-900">{doctor.hospital || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Professional Bio</p>
                <p className="font-medium text-gray-900 text-xs leading-relaxed">{doctor.biography || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Documents */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">Identity Verification Video</h2>
            {documents.verificationVideo ? (
              <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative group border border-gray-200">
                <video src={documents.verificationVideo} controls className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="p-8 bg-gray-50 rounded-xl border border-gray-200 border-dashed text-center">
                <Video size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 font-medium">No verification video uploaded</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">Professional Documents</h2>
            <div className="grid grid-cols-1 gap-6">
              {[
                { label: "Government ID", url: documents.governmentId },
                { label: "Medical License", url: documents.medicalLicense },
                { label: "Practice Certificate", url: documents.practiceCertificate },
              ].map((doc, i) => (
                <div key={i} className="flex flex-col overflow-hidden rounded-xl border border-gray-200">
                  <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
                    <p className="font-bold text-sm text-gray-900">{doc.label}</p>
                    {doc.url && (
                      <button onClick={() => setSelectedDoc(doc.url)} className="text-brand-secondary text-xs font-bold hover:underline cursor-pointer">
                        View Full Screen
                      </button>
                    )}
                  </div>
                  <div className="bg-gray-100 flex items-center justify-center min-h-[200px] p-2 relative">
                    {doc.url ? (
                      doc.url.toLowerCase().includes('.pdf') ? (
                        <div className="flex flex-col items-center justify-center text-gray-500 py-10">
                          <FileText size={48} className="mb-3 text-brand-secondary/50" />
                          <p className="font-bold text-sm">PDF Document</p>
                          <p className="text-xs mt-1 text-gray-400">Please click "View Full Screen" to read</p>
                        </div>
                      ) : (
                        <img 
                          src={doc.url} 
                          alt={doc.label} 
                          className="w-full h-auto object-contain max-h-[400px]" 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement?.insertAdjacentHTML('beforeend', 
                              `<div class="flex flex-col items-center justify-center text-gray-500 py-10">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-3 text-brand-secondary/50"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                                <p class="font-bold text-sm">Preview Unavailable</p>
                                <p class="text-xs mt-1 text-gray-400">Click "View Full Screen" to open file</p>
                              </div>`
                            );
                          }}
                        />
                      )
                    ) : (
                      <div className="py-12 flex flex-col items-center">
                        <FileText size={24} className="text-gray-300 mb-2" />
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">Document Missing</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Full Screen Document Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-8 backdrop-blur-sm">
          <div className="relative w-full h-full max-w-5xl bg-white rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white z-10">
              <h3 className="font-bold text-gray-900">Document Viewer</h3>
              <button onClick={() => setSelectedDoc(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer">
                <XCircle size={20} />
              </button>
            </div>
            <div className="flex-1 bg-gray-100 overflow-auto relative flex items-center justify-center p-4">
              {selectedDoc.toLowerCase().includes('.pdf') ? (
                <iframe src={selectedDoc} className="w-full h-full border-0 rounded-xl" title="PDF Viewer" />
              ) : (
                <img src={selectedDoc} alt="Document Viewer" className="w-auto h-auto max-w-full max-h-full object-contain rounded-xl shadow-sm" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
