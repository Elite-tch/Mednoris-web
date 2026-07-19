import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, UploadCloud, ChevronDown } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";

export default function PatientForm({ onBack }: { onBack: () => void }) {
  const { user } = usePrivy();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    gender: "",
    country: "",
    bloodGroup: "",
    allergies: "",
    about: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      const patientData = {
        ...formData,
        profileImage: imageUrl,
        privyId: user.id,
        email: user.email?.address || "",
        wallet: user.wallet?.address || "",
        createdAt: new Date().toISOString(),
      };

      // Save to patients collection
      await setDoc(doc(db, "patients", user.id), patientData);

      // Save to unified users collection for fast auth checks
      await setDoc(doc(db, "users", user.id), {
        role: "patient",
        createdAt: new Date().toISOString(),
      });

      // Redirect to dashboard (or whatever route is next)
      router.replace("/patient/dashboard");
    } catch (error) {
      console.error("Error saving patient profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full max-w-2xl bg-white text-primary p-8 rounded-3xl shadow-sm border border-gray-100"
    >
      <button
        onClick={onBack}
        className="flex items-center text-sm font-bold text-gray-500 hover:text-brand-primary mb-6 transition-colors"
      >
        <ArrowLeft size={16} className="mr-2" /> Back
      </button>

      <h2 className="text-3xl font-bold text-brand-primary mb-2">
        Complete Your Profile
      </h2>
      <p className="text-gray-500 mb-8">
        Set up your secure Mednoris patient account.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Profile Image */}
        <div>
          <label className="block text-sm font-bold text-brand-primary mb-2">
            Profile Image
          </label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
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
            <label className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
              Upload Image
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
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-secondary bg-gray-50"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-2">
              Date of Birth
            </label>
            <input
              required
              type="date"
              value={formData.dob}
              onChange={(e) =>
                setFormData({ ...formData, dob: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-secondary bg-gray-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-2">
              Gender
            </label>
            <CustomSelect
              value={formData.gender}
              onChange={(val) => setFormData({ ...formData, gender: val })}
              options={["Male", "Female", "Other", "Prefer not to say"]}
              placeholder="Select Gender..."
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-2">
              Country
            </label>
            <input
              required
              type="text"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-secondary bg-gray-50"
              placeholder="e.g. United States"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-2">
              Blood Group
            </label>
            <CustomSelect
              value={formData.bloodGroup}
              onChange={(val) => setFormData({ ...formData, bloodGroup: val })}
              options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
              placeholder="Select Blood Group..."
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-brand-primary mb-2">
              Allergies (Optional)
            </label>
            <input
              type="text"
              value={formData.allergies}
              onChange={(e) =>
                setFormData({ ...formData, allergies: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-secondary bg-gray-50"
              placeholder="E.g., Penicillin, Peanuts"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-brand-primary mb-2">
            About
          </label>
          <textarea
            required
            rows={3}
            value={formData.about}
            onChange={(e) =>
              setFormData({ ...formData, about: e.target.value })
            }
            className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-secondary bg-gray-50 resize-none"
            placeholder="Tell us a little bit about yourself or any general medical history you want doctors to know."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full py-4 bg-brand-secondary text-white font-bold rounded-xl hover:bg-brand-primary transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Complete Setup"
          )}
        </button>
      </form>
    </motion.div>
  );
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-3 rounded-xl border ${isOpen ? 'border-brand-secondary' : 'border-gray-200'} bg-gray-50 flex justify-between items-center cursor-pointer hover:border-brand-secondary transition-colors`}
      >
        <span className={value ? "text-gray-900" : "text-gray-500"}>
          {value || placeholder}
        </span>
        <ChevronDown size={20} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className="p-3 hover:bg-gray-50 cursor-pointer text-gray-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
