"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, X, RefreshCw, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WebcamCaptureProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
  facingMode?: "user" | "environment";
  title?: string;
}

export default function WebcamCapture({ onCapture, onClose, facingMode = "user", title = "Take Headshot" }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImg, setCapturedImg] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setError("Could not access camera. Please check permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capture = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw image and convert to base64
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImg(base64);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retake = useCallback(() => {
    setCapturedImg(null);
    startCamera();
  }, [startCamera]);

  const confirm = useCallback(() => {
    if (capturedImg) {
      onCapture(capturedImg);
      onClose();
    }
  }, [capturedImg, onCapture, onClose]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-md relative"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Camera size={18} className="text-brand-primary" /> {title}
          </h3>
          <button onClick={handleClose} type="button" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 bg-gray-50 flex flex-col items-center justify-center min-h-[300px]">
          {error ? (
            <div className="text-center text-red-500 p-4">
              <p>{error}</p>
              <button onClick={startCamera} type="button" className="mt-4 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm font-bold hover:bg-gray-50">
                Try Again
              </button>
            </div>
          ) : capturedImg ? (
            <img src={capturedImg} alt="Captured" className="w-64 h-64 object-cover rounded-full border-4 border-white shadow-md" />
          ) : (
            <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-white shadow-md bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
              />
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
          {capturedImg ? (
            <>
              <button onClick={retake} type="button" className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                <RefreshCw size={18} /> Retake
              </button>
              <button onClick={confirm} type="button" className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors flex items-center justify-center gap-2">
                <Check size={18} /> Use Photo
              </button>
            </>
          ) : (
            <button onClick={capture} type="button" disabled={!!error} className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              <Camera size={18} /> Capture Photo
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
