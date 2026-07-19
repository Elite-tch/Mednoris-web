import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, UploadCloud } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";

export default function DoctorForm({ onBack }: { onBack: () => void }) {
  const { user } = usePrivy();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [govIdFile, setGovIdFile] = useState<File | null>(null);
  const [medicalLicenseFile, setMedicalLicenseFile] = useState<File | null>(null);
  const [practiceCertFile, setPracticeCertFile] = useState<File | null>(null);
  const [verificationVideo, setVerificationVideo] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    title: "",
    specializations: "",
    languages: "",
    biography: "",
    country: "",
    location: "",
    hospital: "",
    emailAddress: "",
    phoneNumber: "",
    experienceYears: "",
    gender: "",
    medicalLicenseNumber: "",
    secondarySpecialty: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!govIdFile || !medicalLicenseFile || !practiceCertFile || !verificationVideo) {
      alert("Please upload all required verification documents and the verification video.");
      return;
    }

    setLoading(true);

    try {
      // Upload all files concurrently
      const uploadPromises = [];
      
      let imagePromise = Promise.resolve("");
      if (imageFile) {
        imagePromise = uploadToCloudinary(imageFile);
      }
      uploadPromises.push(imagePromise);
      uploadPromises.push(uploadToCloudinary(govIdFile));
      uploadPromises.push(uploadToCloudinary(medicalLicenseFile));
      uploadPromises.push(uploadToCloudinary(practiceCertFile));
      uploadPromises.push(uploadToCloudinary(verificationVideo));

      const [imageUrl, govIdUrl, licenseUrl, certUrl, videoUrl] = await Promise.all(uploadPromises);

      // Generate a clean slug for the URL (e.g. dr-sarah-jenkins-a1b2c3)
      const baseSlug = formData.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      const shortId = user.id.split(":").pop()?.substring(0, 6) || Math.random().toString(36).substring(2, 8);
      const slug = `${baseSlug}-${shortId}`;

      const doctorData = {
        ...formData,
        profileImage: imageUrl,
        documents: {
          governmentId: govIdUrl,
          medicalLicense: licenseUrl,
          practiceCertificate: certUrl,
          verificationVideo: videoUrl,
        },
        role: "doctor",
        status: "Pending Verification",
        slug: slug,
        privyId: user.id,
        email: user.email?.address || user.wallet?.address || "",
        wallet: user.wallet?.address || "",
        createdAt: new Date().toISOString(),
      };

      // Save to doctors collection
      await setDoc(doc(db, "doctors", user.id), doctorData);

      // Save to unified users collection for fast auth checks
      await setDoc(doc(db, "users", user.id), {
        role: "doctor",
        createdAt: new Date().toISOString(),
      });

      // Redirect to dashboard (or whatever route is next)
      router.replace("/dashboard");
    } catch (error) {
      console.error("Error saving doctor profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const FileInput = ({ 
    label, 
    file, 
    setFile 
  }: { 
    label: string, 
    file: File | null, 
    setFile: (f: File | null) => void 
  }) => (
    <div className="flex flex-col gap-2">
      <label className="block text-sm font-bold text-gray-700">{label}</label>
      <label className="flex items-center gap-3 p-4 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
        <UploadCloud className="text-brand-primary shrink-0" />
        <span className="text-sm text-gray-500 truncate flex-1">
          {file ? file.name : "Click to upload document"}
        </span>
        <input
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setFile(e.target.files[0]);
            }
          }}
        />
      </label>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full max-w-3xl bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
    >
      <button
        onClick={onBack}
        className="flex items-center text-sm font-bold text-gray-500 hover:text-brand-primary mb-6 transition-colors"
      >
        <ArrowLeft size={16} className="mr-2" /> Back
      </button>

      <h2 className="text-3xl font-bold text-brand-primary mb-2">
        Professional Profile Setup
      </h2>
      <p className="text-gray-500 mb-8">
        Complete your profile to submit for verification.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Profile Image */}
        <div>
          <label className="block text-sm font-bold text-brand-primary mb-2">
            Profile Photo
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
              {imageFile ? (
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UploadCloud className="text-gray-400" />
              )}
            </div>
            <label className="px-5 py-2.5 bg-white border border-gray-300 rounded-full text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors text-center flex items-center justify-center">
              Upload Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImageFile(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-2">
              Full Name
            </label>
            <input
              required
              type="text"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary bg-gray-50"
              placeholder="Dr. Sarah Jenkins"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-2">
              Professional Title
            </label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary bg-gray-50"
              placeholder="e.g. Chief Neurologist"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-2">
             Primary Specialty
            </label>
            <input
              required
              type="text"
              value={formData.specializations}
              onChange={(e) =>
                setFormData({ ...formData, specializations: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary bg-gray-50"
              placeholder="e.g. Cardiology, Pediatrics"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-2">
              Secondary Specialty (Optional)
            </label>
            <input
              type="text"
              value={formData.secondarySpecialty}
              onChange={(e) =>
                setFormData({ ...formData, secondarySpecialty: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary bg-gray-50"
              placeholder="e.g. Internal Medicine"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-2">
              Medical License Number
            </label>
            <input
              required
              type="text"
              value={formData.medicalLicenseNumber}
              onChange={(e) =>
                setFormData({ ...formData, medicalLicenseNumber: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary bg-gray-50"
              placeholder="e.g. MD-12345678"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-2">
              Years of Experience
            </label>
            <input
              required
              type="number"
              min="0"
              value={formData.experienceYears}
              onChange={(e) =>
                setFormData({ ...formData, experienceYears: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary bg-gray-50"
              placeholder="e.g. 10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-2">
              Email Address
            </label>
            <input
              required
              type="email"
              value={formData.emailAddress}
              onChange={(e) =>
                setFormData({ ...formData, emailAddress: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary bg-gray-50"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-2">
              Phone Number
            </label>
            <input
              required
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary bg-gray-50"
              placeholder="+1 234 567 8900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-2">
              Languages Spoken
            </label>
            <input
              required
              type="text"
              value={formData.languages}
              onChange={(e) =>
                setFormData({ ...formData, languages: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary bg-gray-50"
              placeholder="e.g. English, French"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-2">
              Gender
            </label>
            <div className="flex flex-wrap gap-2">
              {["Male", "Female", "Other", "Prefer not to say"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: g })}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                    formData.gender === g
                      ? "bg-brand-secondary text-white border-brand-secondary"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-brand-secondary/50"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Location & Hospital */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-2">
             Country of Practice
            </label>
            <input
              required
              type="text"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary bg-gray-50"
              placeholder="e.g. Nigeria, United Kingdom"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-2">
              City / State
            </label>
            <input
              required
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary bg-gray-50"
              placeholder="e.g. Lagos, London"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-brand-primary mb-2">
            Hospital / Clinic
          </label>
          <input
            required
            type="text"
            value={formData.hospital}
            onChange={(e) =>
              setFormData({ ...formData, hospital: e.target.value })
            }
            className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary bg-gray-50"
            placeholder="e.g. Lagos University Teaching Hospital"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-brand-primary mb-2">
           Professional Bio
          </label>
          <textarea
            required
            rows={4}
            value={formData.biography}
            onChange={(e) =>
              setFormData({ ...formData, biography: e.target.value })
            }
            className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary bg-gray-50 resize-none"
            placeholder="Tell patients about your experience and approach to care..."
          />
        </div>

        {/* Verification Documents */}
        <div className="border-t border-gray-100 pt-8">
          <h3 className="text-lg font-bold text-brand-primary mb-2">
            Verification Documents
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            These documents are securely stored and only used by our admin team to verify your credentials.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FileInput 
              label="Government-issued ID" 
              file={govIdFile} 
              setFile={setGovIdFile} 
            />
            <FileInput 
              label="Valid Medical License" 
              file={medicalLicenseFile} 
              setFile={setMedicalLicenseFile} 
            />
            <FileInput 
              label="Practice Certificate" 
              file={practiceCertFile} 
              setFile={setPracticeCertFile} 
            />
          </div>
        </div>

        {/* Video Verification */}
        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-lg font-bold text-brand-primary mb-4">
            Identity Verification Video
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Please record a short video (up to 30 seconds) stating your full name, your specialization, and that you are registering on Mednoris. This helps us ensure you are a real person and match your ID.
          </p>
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-2">
              Verification Video
            </label>
            <div className="flex flex-col items-start gap-4">
              {verificationVideo && (
                <div className="text-sm font-bold text-green-600 bg-green-50 px-4 py-2 rounded-xl">
                  Video Attached: {verificationVideo.name}
                </div>
              )}
              <label className="px-5 py-2.5 bg-brand-secondary text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-brand-primary transition-colors flex items-center justify-center gap-2">
                Record / Upload Video
                <input
                  type="file"
                  accept="video/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setVerificationVideo(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full py-4 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Submit for Verification"
          )}
        </button>
      </form>
    </motion.div>
  );
}
