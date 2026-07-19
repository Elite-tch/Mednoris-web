"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Check, CheckCheck } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, onSnapshot, doc, 
  getDoc, setDoc, addDoc, orderBy, serverTimestamp, updateDoc, writeBatch, getDocs
} from "firebase/firestore";
import Toast, { ToastType } from "@/components/ui/Toast";
import Link from "next/link";

const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
const phoneRegex = /\b\d{8,}\b/g;

const validateMessage = (text: string) => {
  if (urlRegex.test(text)) return "URLs and links are not allowed in messages.";
  if (emailRegex.test(text)) return "Email addresses are not allowed in messages.";
  if (phoneRegex.test(text)) return "Phone numbers (or long numeric strings) are not allowed.";
  return null;
};

function ChatContent() {
  const { user } = usePrivy();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("doctorId");
  const router = useRouter();

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat if doctorId is provided
  useEffect(() => {
    const initChat = async () => {
      if (!user || !doctorId) return;
      
      const chatId = `${user.id}_${doctorId}`;
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        const docSnap = await getDoc(doc(db, "doctors", doctorId));
        const patientSnap = await getDoc(doc(db, "patients", user.id));
        if (docSnap.exists()) {
          const doctorData = docSnap.data();
          const patientData = patientSnap.exists() ? patientSnap.data() : null;
          await setDoc(chatRef, {
            patientId: user.id,
            doctorId: doctorId,
            patientName: patientData?.fullName || (user as any).name || "Patient",
            patientImage: patientData?.profileImage || null,
            doctorName: doctorData.fullName,
            doctorImage: doctorData.profileImage || null,
            doctorSpecialty: doctorData.specializations || "Doctor",
            lastMessage: "",
            lastMessageTime: serverTimestamp(),
            patientUnread: false,
            doctorUnread: false
          });
        }
      }
      
      setActiveChatId(chatId);
    };
    initChat();
  }, [user, doctorId]);

  // Listen to chats
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "chats"), where("patientId", "==", user.id));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        chatList.sort((a, b) => {
          const timeA = a.lastMessageTime?.toMillis() || 0;
          const timeB = b.lastMessageTime?.toMillis() || 0;
          return timeB - timeA;
        });
        setConversations(chatList);

        // Auto-select first chat if none is active and no doctorId param
        setActiveChatId(prev => {
          if (!prev && chatList.length > 0 && !doctorId) return chatList[0].id;
          return prev;
        });
      },
      (err) => console.error("Chats listener error:", err)
    );
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, doctorId]);

  // Listen to messages
  useEffect(() => {
    if (!activeChatId) return;
    const q = query(
      collection(db, "chats", activeChatId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setMessages(msgs);
      
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.senderId !== user?.id && !lastMsg.seen) {
        updateDoc(doc(db, "chats", activeChatId, "messages", lastMsg.id), {
          seen: true
        });
      }
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsubscribe();
  }, [activeChatId, user]);

  // Auto-clear notifications for the currently active chat
  useEffect(() => {
    if (!activeChatId || !user) return;
    const activeChat = conversations.find(c => c.id === activeChatId);
    if (!activeChat || !activeChat.doctorId) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.id),
      where("senderId", "==", activeChat.doctorId),
      where("type", "==", "message"),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => {
          batch.update(doc(db, "notifications", d.id), { read: true });
        });
        batch.commit().catch(err => console.error("Auto-clear notifs error:", err));
      }
    });
    return () => unsubscribe();
  }, [activeChatId, conversations, user]);

  const handleSend = async () => {
    if (!input.trim() || !activeChatId || !user) return;
    
    const validationError = validateMessage(input);
    if (validationError) {
      setToast({ message: validationError, type: "error" });
      return;
    }

    const text = input.trim();
    setInput("");
    
    try {
      await addDoc(collection(db, "chats", activeChatId, "messages"), {
        senderId: user.id,
        text,
        createdAt: serverTimestamp(),
        seen: false
      });
      
      await updateDoc(doc(db, "chats", activeChatId), {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        doctorUnread: true
      });

      // Notify the doctor about the new message
      if (activeChat?.doctorId) {
        await addDoc(collection(db, "notifications"), {
          userId: activeChat.doctorId,
          senderId: user.id,
          title: "New Message",
          message: `${activeChat.patientName || "A patient"} sent you a message: "${text.substring(0, 80)}${text.length > 80 ? "..." : ""}"`,
          type: "message",
          read: false,
          link: "/doctor/dashboard/chat",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      setToast({ message: "Failed to send message", type: "error" });
    }
  };

  const activeChat = conversations.find(c => c.id === activeChatId);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-primary mb-1">Chat</h1>
      <p className="text-gray-400 text-sm mb-6">Secure messaging with your healthcare team.</p>

      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[450px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Conversation List */}
        <div className="w-64 border-r border-gray-100 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-50">
            <p className="font-bold text-brand-primary text-sm">Messages</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((c) => (
              <button key={c.id} onClick={() => setActiveChatId(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer ${activeChatId === c.id ? "bg-brand-secondary/10 border-r-2 border-brand-secondary" : ""}`}>
                <div className="w-10 h-10 rounded-full bg-brand-secondary/20 flex items-center justify-center font-bold text-brand-primary shrink-0 overflow-hidden">
                  {c.doctorImage ? (
                    <img src={c.doctorImage} alt={c.doctorName} className="w-full h-full object-cover" />
                  ) : (
                    c.doctorName?.charAt(0) || "D"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-brand-primary truncate">{c.doctorName}</p>
                  <p className="text-xs text-gray-400 truncate">{c.lastMessage || "No messages yet"}</p>
                </div>
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="p-4 text-sm text-gray-400 text-center">No conversations yet.</p>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {activeChat ? (
            <>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <Link href={`/patient/dashboard/doctors/${activeChat.doctorName || activeChat.doctorId}`}
                  className="w-10 h-10 rounded-full bg-brand-secondary/20 flex items-center justify-center shrink-0 overflow-hidden text-brand-primary font-bold">
                  {activeChat.doctorImage ? (
                    <img src={activeChat.doctorImage} alt={activeChat.doctorName} className="w-full h-full object-cover" />
                  ) : (
                    activeChat.doctorName?.charAt(0) || "D"
                  )}
                </Link>
                <div>
                  <Link href={`/patient/dashboard/doctors/${activeChat.doctorName || activeChat.doctorId}`} className="font-bold text-brand-primary text-sm hover:underline">
                    {activeChat.doctorName}
                  </Link>
                  <p className="text-xs text-gray-400">{activeChat.doctorSpecialty}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                <AnimatePresence>
                  {messages.map((m) => {
                    const isMine = m.senderId === user?.id;
                    return (
                      <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                        <div className={`max-w-[70%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                            isMine 
                              ? "bg-brand-secondary text-white rounded-tr-sm" 
                              : "bg-gray-100 text-gray-800 rounded-tl-sm"
                            }`}
                          >
                            {m.text}
                          </div>
                          {isMine && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-400">
                              {m.seen ? (
                                <><CheckCheck size={12} className="text-blue-500" /> Seen</>
                              ) : (
                                <><Check size={12} /> Delivered</>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-brand-secondary" />
                <button onClick={handleSend} className="w-10 h-10 rounded-xl bg-brand-secondary text-white flex items-center justify-center hover:bg-brand-primary transition-colors cursor-pointer shrink-0">
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
      
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading chat...</div>}>
      <ChatContent />
    </Suspense>
  );
}
