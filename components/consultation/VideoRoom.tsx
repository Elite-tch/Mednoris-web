"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, Maximize, Minimize } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, onSnapshot, collection, addDoc } from "firebase/firestore";
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

  useEffect(() => {
    let pc: RTCPeerConnection;
    let localStream: MediaStream;

    const initWebRTC = async () => {
      try {
        // 1. Get Local Media (Camera & Mic)
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = localStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // 2. Initialize Peer Connection
        pc = new RTCPeerConnection(servers);
        pcRef.current = pc;
        remoteStreamRef.current = new MediaStream();

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
        }

        // Add local tracks to peer connection
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });

        // Listen for remote tracks
        pc.ontrack = (event) => {
          event.streams[0].getTracks().forEach((track) => {
            remoteStreamRef.current?.addTrack(track);
          });
          setConnecting(false); // We have received the remote stream
        };

        // Firestore References
        const callDoc = doc(db, "consultations", appointmentId);
        const offerCandidates = collection(callDoc, "offerCandidates");
        const answerCandidates = collection(callDoc, "answerCandidates");

        if (isDoctor) {
          // DOCTOR IS THE CALLER (Creates Offer)
          
          // Save ICE candidates
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              addDoc(offerCandidates, event.candidate.toJSON());
            }
          };

          // Create offer
          const offerDescription = await pc.createOffer();
          await pc.setLocalDescription(offerDescription);

          const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
          };

          await setDoc(callDoc, { offer }, { merge: true });

          // Listen for answer
          onSnapshot(callDoc, (snapshot) => {
            const data = snapshot.data();
            if (!pc.currentRemoteDescription && data?.answer) {
              const answerDescription = new RTCSessionDescription(data.answer);
              pc.setRemoteDescription(answerDescription);
            }
          });

          // Listen for remote ICE candidates
          onSnapshot(answerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "added") {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
              }
            });
          });

        } else {
          // PATIENT IS THE CALLEE (Answers Offer)
          
          // Save ICE candidates
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              addDoc(answerCandidates, event.candidate.toJSON());
            }
          };

          // Listen for offer and respond
          onSnapshot(callDoc, async (snapshot) => {
            const data = snapshot.data();
            if (data?.offer && !pc.currentRemoteDescription) {
              const offerDescription = new RTCSessionDescription(data.offer);
              await pc.setRemoteDescription(offerDescription);

              const answerDescription = await pc.createAnswer();
              await pc.setLocalDescription(answerDescription);

              const answer = {
                type: answerDescription.type,
                sdp: answerDescription.sdp,
              };

              await setDoc(callDoc, { answer }, { merge: true });
            }
          });

          // Listen for remote ICE candidates
          onSnapshot(offerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "added") {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
              }
            });
          });
        }
      } catch (error) {
        console.error("Error accessing media devices or WebRTC setup:", error);
      }
    };

    initWebRTC();

    return () => {
      // Cleanup on unmount
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
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

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks()[0].enabled = !micOn;
      setMicOn(!micOn);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks()[0].enabled = !videoOn;
      setVideoOn(!videoOn);
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
    <div id={`video-container-${appointmentId}`} className="flex flex-col h-full bg-black rounded-3xl overflow-hidden relative shadow-lg border border-gray-800">
      {/* Remote Video Area */}
      <div className="flex-1 flex items-center justify-center bg-gray-900 relative">
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover" 
        />
        
        {connecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 z-10">
             <Loader2 className="w-10 h-10 animate-spin text-brand-secondary mb-3" />
             <p className="text-gray-400 font-semibold animate-pulse">Waiting for other party to connect...</p>
          </div>
        )}

        {/* Local Video Picture-in-Picture */}
        <div className="absolute bottom-6 right-6 w-32 h-44 bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl flex items-center justify-center z-20">
           <video 
             ref={localVideoRef} 
             autoPlay 
             playsInline 
             muted 
             className="w-full h-full object-cover transform scale-x-[-1]" 
           />
           {!videoOn && (
             <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
               <VideoOff size={24} className="text-gray-500" />
             </div>
           )}
           <div className="absolute bottom-1 left-2 bg-black/50 px-2 py-0.5 rounded text-[10px] text-white">
             You
           </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-gray-900/90 backdrop-blur-md p-4 flex items-center justify-center gap-4 z-20 shrink-0">
        <button 
          onClick={toggleMic}
          className={`p-4 rounded-full transition-colors cursor-pointer ${micOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button 
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-colors cursor-pointer ${videoOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
        >
          {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button 
          onClick={toggleFullscreen}
          className="p-4 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors cursor-pointer ml-auto mr-4"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
        <button 
          onClick={endCall}
          className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer px-8 font-bold flex items-center gap-2"
        >
          <PhoneOff size={20} />
          End Call
        </button>
      </div>
    </div>
  );
}
