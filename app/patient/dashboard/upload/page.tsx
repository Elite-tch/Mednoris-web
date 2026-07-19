"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, CheckCircle2, X, FileText, Loader2 } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";

type UploadedFile = { name: string; url: string; status: "uploading" | "done" | "error" };

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);

  const processFiles = async (selected: FileList) => {
    const arr = Array.from(selected);
    const stubs: UploadedFile[] = arr.map((f) => ({ name: f.name, url: "", status: "uploading" }));
    setFiles((prev) => [...prev, ...stubs]);

    for (let i = 0; i < arr.length; i++) {
      try {
        const url = await uploadToCloudinary(arr[i]);
        setFiles((prev) => {
          const copy = [...prev];
          const idx = copy.findIndex((f) => f.name === arr[i].name && f.status === "uploading");
          if (idx !== -1) copy[idx] = { name: arr[i].name, url, status: "done" };
          return copy;
        });
      } catch {
        setFiles((prev) => {
          const copy = [...prev];
          const idx = copy.findIndex((f) => f.name === arr[i].name && f.status === "uploading");
          if (idx !== -1) copy[idx] = { name: arr[i].name, url: "", status: "error" };
          return copy;
        });
      }
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  }, []);

  const removeFile = (i: number) => setFiles((f) => f.filter((_, idx) => idx !== i));

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-extrabold text-brand-primary mb-1">Upload Records</h1>
      <p className="text-gray-400 text-sm mb-8">Securely upload your medical files. Supported: PDF, JPEG, PNG, DICOM.</p>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed rounded-3xl transition-all ${dragging ? "border-brand-secondary bg-brand-secondary/10" : "border-gray-200 bg-white hover:border-brand-secondary/50"}`}
      >
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${dragging ? "bg-brand-secondary/20 text-brand-secondary" : "bg-gray-100 text-gray-400"}`}>
          <UploadCloud size={32} />
        </div>
        <div className="text-center">
          <p className="font-bold text-brand-primary">Drag & drop files here</p>
          <p className="text-sm text-gray-400 mt-1">or click to browse</p>
        </div>
        <label className="px-6 py-2.5 bg-brand-secondary text-white font-bold rounded-xl text-sm cursor-pointer hover:bg-brand-primary transition-colors">
          Browse Files
          <input type="file" multiple accept="image/*,.pdf" className="hidden"
            onChange={(e) => { if (e.target.files) processFiles(e.target.files); }} />
        </label>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            <h2 className="font-bold text-brand-primary text-sm">Uploaded Files</h2>
            {files.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary shrink-0">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand-primary text-sm truncate">{f.name}</p>
                  <p className="text-xs text-gray-400">
                    {f.status === "uploading" ? "Uploading..." : f.status === "done" ? "Upload complete" : "Upload failed"}
                  </p>
                </div>
                {f.status === "uploading" && <Loader2 size={18} className="animate-spin text-brand-secondary shrink-0" />}
                {f.status === "done" && <CheckCircle2 size={18} className="text-green-500 shrink-0" />}
                <button onClick={() => removeFile(i)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer shrink-0">
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
