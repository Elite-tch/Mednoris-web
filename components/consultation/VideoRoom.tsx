"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, Maximize, Minimize } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, onSnapshot, collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

// Use public Google STUN servers for WebRTC
const servers = {
  iceServers: [
    { urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
  ],
  iceCandidatePoolSize: 10,
};

export default function VideoRoom({ appointmentId, isDoctor }: { appointmentId: string; isDoctor: boolean }) {
  const router = useRouter();
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [connecting, setConnecting] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  // Remote party mute states (synced via Firestore)
  const [remoteMicOff, setRemoteMicOff] = useState(false);
  const [remoteVideoOff, setRemoteVideoOff] = useState(false);

  // Subscribe to remote party's mute status
  useEffect(() => {
    const callDoc = doc(db, "consultations", appointmentId);
    const unsub = onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      const remoteKey = isDoctor ? "patientStatus" : "doctorStatus";
      if (data?.[remoteKey]) {
        setRemoteMicOff(data[remoteKey].micOff ?? false);
        setRemoteVideoOff(data[remoteKey].videoOff ?? false);
      }
    });
    return () => unsub();
  }, [appointmentId, isDoctor]);

  useEffect(() => {
    let pc: RTCPeerConnection;
    let localStream: MediaStream;
    let unsubCallDoc: () => void;
    let unsubOfferCandidates: () => void;
    let unsubAnswerCandidates: () => void;
    let isMounted = true; // Safety flag — kills all async work after unmount

    // ICE candidate buffer: hold candidates until remote description is set
    const iceCandidateBuffer: RTCIceCandidate[] = [];

    const drainBuffer = async (peerConn: RTCPeerConnection) => {
      while (iceCandidateBuffer.length > 0) {
        const c = iceCandidateBuffer.shift()!;
        try {
          await peerConn.addIceCandidate(c);
        } catch (_) {}
      }
    };

    const safeAddCandidate = async (peerConn: RTCPeerConnection, data: RTCIceCandidateInit) => {
      if (!peerConn || peerConn.signalingState === "closed") return;
      const candidate = new RTCIceCandidate(data);
      if (peerConn.remoteDescription) {
        try { await peerConn.addIceCandidate(candidate); } catch (_) {}
      } else {
        iceCandidateBuffer.push(candidate);
      }
    };

    const initWebRTC = async () => {
      try {
        // 1. Get Local Media
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!isMounted) { localStream.getTracks().forEach(t => t.stop()); return; }

        localStreamRef.current = localStream;
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;

        // 2. Initialize Peer Connection
        pc = new RTCPeerConnection(servers);
        pcRef.current = pc;

        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

        pc.ontrack = (event) => {
          if (!isMounted) return;
          const stream = event.streams?.[0] ?? new MediaStream([event.track]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
          setConnecting(false);
        };

        // Firestore References
        const callDoc = doc(db, "consultations", appointmentId);
        const offerCandidates = collection(callDoc, "offerCandidates");
        const answerCandidates = collection(callDoc, "answerCandidates");

        if (isDoctor) {
          // --- DOCTOR: Caller ---

          // Clear stale candidates from previous sessions
          try {
            const oldOffers = await getDocs(offerCandidates);
            oldOffers.forEach(d => deleteDoc(d.ref));
            const oldAnswers = await getDocs(answerCandidates);
            oldAnswers.forEach(d => deleteDoc(d.ref));
          } catch (e) { /* non-critical */ }

          if (!isMounted) return;

          pc.onicecandidate = (event) => {
            if (event.candidate && isMounted) {
              addDoc(offerCandidates, event.candidate.toJSON());
            }
          };

          const offerDescription = await pc.createOffer();
          if (!isMounted) return;
          await pc.setLocalDescription(offerDescription);
          await setDoc(callDoc, { offer: { sdp: offerDescription.sdp, type: offerDescription.type } });

          let processedAnswerSdp = "";
          unsubCallDoc = onSnapshot(callDoc, async (snapshot) => {
            if (!isMounted || !pc || pc.signalingState === "closed") return;
            const data = snapshot.data();
            if (data?.answer && data.answer.sdp !== processedAnswerSdp && pc.signalingState === "have-local-offer") {
              processedAnswerSdp = data.answer.sdp;
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                await drainBuffer(pc);
              } catch (e) { console.error("Error setting answer:", e); }
            }
          });

          unsubAnswerCandidates = onSnapshot(answerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "added" && isMounted) {
                safeAddCandidate(pc, change.doc.data() as RTCIceCandidateInit);
              }
            });
          });

        } else {
          // --- PATIENT: Callee ---

          pc.onicecandidate = (event) => {
            if (event.candidate && isMounted) {
              addDoc(answerCandidates, event.candidate.toJSON());
            }
          };

          let processedOfferSdp = "";
          unsubCallDoc = onSnapshot(callDoc, async (snapshot) => {
            if (!isMounted || !pc || pc.signalingState === "closed") return;
            const data = snapshot.data();
            if (data?.offer && data.offer.sdp !== processedOfferSdp) {
              processedOfferSdp = data.offer.sdp;
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                await drainBuffer(pc); // Apply any buffered candidates now
                const answerDescription = await pc.createAnswer();
                await pc.setLocalDescription(answerDescription);
                await setDoc(callDoc, { answer: { type: answerDescription.type, sdp: answerDescription.sdp } }, { merge: true });
              } catch (e) { console.error("Error processing offer:", e); }
            }
          });

          unsubOfferCandidates = onSnapshot(offerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "added" && isMounted) {
                safeAddCandidate(pc, change.doc.data() as RTCIceCandidateInit);
              }
            });
          });
        }
      } catch (error) {
        console.error("WebRTC setup error:", error);
      }
    };

    initWebRTC();

    return () => {
      isMounted = false;
      if (unsubCallDoc) unsubCallDoc();
      if (unsubOfferCandidates) unsubOfferCandidates();
      if (unsubAnswerCandidates) unsubAnswerCandidates();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [appointmentId, isDoctor]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const toggleFullscreen = () => {
    const videoContainer = document.getElementById(`video-container-${appointmentId}`);
    if (!videoContainer) return;

    if (!document.fullscreenElement) {
      videoContainer.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleMic = async () => {
    if (localStreamRef.current) {
      const newMicOn = !micOn;
      localStreamRef.current.getAudioTracks()[0].enabled = newMicOn;
      setMicOn(newMicOn);
      // Broadcast mute state to remote party
      const callDoc = doc(db, "consultations", appointmentId);
      const myKey = isDoctor ? "doctorStatus" : "patientStatus";
      setDoc(callDoc, { [myKey]: { micOff: !newMicOn, videoOff: !videoOn } }, { merge: true });
    }
  };

  const toggleVideo = async () => {
    if (localStreamRef.current) {
      const newVideoOn = !videoOn;
      localStreamRef.current.getVideoTracks()[0].enabled = newVideoOn;
      setVideoOn(newVideoOn);
      // Broadcast mute state to remote party
      const callDoc = doc(db, "consultations", appointmentId);
      const myKey = isDoctor ? "doctorStatus" : "patientStatus";
      setDoc(callDoc, { [myKey]: { micOff: !micOn, videoOff: !newVideoOn } }, { merge: true });
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
    }
    router.back();
  };

  return (
    <div id={`video-container-${appointmentId}`} className="flex flex-col bg-black rounded-3xl overflow-hidden relative shadow-lg border border-gray-800" style={{ minHeight: 0, height: '100%' }}>
      {/* Remote Video Area */}
      <div className="flex-1 flex items-center justify-center bg-gray-900 relative overflow-hidden" style={{ minHeight: 0 }}>
        
        {/* Remote video — hidden when they muted video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-300 ${remoteVideoOff ? 'opacity-0 absolute' : 'opacity-100'}`}
        />

        {/* Remote video off: show avatar placeholder */}
        {remoteVideoOff && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 z-10">
            <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center mb-3">
              <VideoOff size={40} className="text-gray-400" />
            </div>
            <p className="text-gray-400 text-sm font-semibold">Camera is off</p>
          </div>
        )}

        {/* Remote mic off badge */}
        {remoteMicOff && !connecting && (
          <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 z-20 shadow-lg">
            <MicOff size={13} className="text-white" />
            <span className="text-white text-xs font-bold">Muted</span>
          </div>
        )}

        {connecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 z-10">
             <Loader2 className="w-10 h-10 animate-spin text-brand-secondary mb-3" />
             <p className="text-gray-400 font-semibold animate-pulse">Waiting for other party to connect...</p>
          </div>
        )}

        {/* Local Video Picture-in-Picture */}
        <div className="absolute bottom-4 right-4 w-24 h-32 md:w-28 md:h-40 bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl z-20">
           <video
             ref={localVideoRef}
             autoPlay
             playsInline
             muted
             className={`w-full h-full object-cover transform scale-x-[-1] ${!videoOn ? 'hidden' : ''}`}
           />
           {!videoOn && (
             <div className="w-full h-full bg-gray-800 flex items-center justify-center">
               <VideoOff size={24} className="text-gray-500" />
             </div>
           )}
           {/* Mic off badge on self */}
           {!micOn && (
             <div className="absolute top-1 left-1 bg-red-500 rounded-full p-1">
               <MicOff size={10} className="text-white" />
             </div>
           )}
           <div className="absolute bottom-1 left-2 bg-black/50 px-2 py-0.5 rounded text-[10px] text-white">
             You
           </div>
        </div>
      </div>

      {/* Controls Bar — always visible at the bottom */}
      <div className="bg-gray-900 border-t border-gray-800 px-3 py-3 md:px-4 md:py-3 flex items-center justify-center gap-2 md:gap-3 z-20 shrink-0">
        <button
          onClick={toggleMic}
          className={`p-3 md:p-3.5 rounded-full transition-all cursor-pointer ${micOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
          title={micOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          {micOn ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
        <button
          onClick={toggleVideo}
          className={`p-3 md:p-3.5 rounded-full transition-all cursor-pointer ${videoOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
          title={videoOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {videoOn ? <Video size={18} /> : <VideoOff size={18} />}
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-3 md:p-3.5 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-all cursor-pointer hidden sm:block"
          title="Toggle fullscreen"
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
        <button
          onClick={endCall}
          className="flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all cursor-pointer font-bold text-xs md:text-sm ml-1 md:ml-2"
        >
          <PhoneOff size={16} className="md:w-5 md:h-5" />
          <span className="hidden sm:inline">End Call</span>
        </button>
      </div>
    </div>
  );
}
