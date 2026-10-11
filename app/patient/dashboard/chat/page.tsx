"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Check, CheckCheck, ArrowLeft, MessageCircle } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, onSnapshot, doc, 
  getDoc, setDoc, addDoc, orderBy, serverTimestamp, updateDoc, writeBatch
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

const formatTime = (timestamp: any) => {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

function ChatContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("doctorId");

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  // Mobile: null = show list, string = show chat panel
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat if doctorId is provided
  useEffect(() => {
    const initChat = async () => {
      if (!user || !doctorId) return;
      const chatId = `${user.uid}_${doctorId}`;
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        const docSnap = await getDoc(doc(db, "doctors", doctorId));
        const patientSnap = await getDoc(doc(db, "patients", user.uid));
        if (docSnap.exists()) {
          const doctorData = docSnap.data();
          const patientData = patientSnap.exists() ? patientSnap.data() : null;
          await setDoc(chatRef, {
            patientId: user.uid,
            doctorId,
            patientName: patientData?.fullName || "Patient",
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
      setMobileView("chat");
    };
    initChat();
  }, [user, doctorId]);

  // Listen to chats
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "chats"), where("patientId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      chatList.sort((a, b) => (b.lastMessageTime?.toMillis() || 0) - (a.lastMessageTime?.toMillis() || 0));
      setConversations(chatList);
      setActiveChatId(prev => {
        if (!prev && chatList.length > 0 && !doctorId) return chatList[0].id;
        return prev;
      });
    }, (err) => console.error("Chats listener error:", err));
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, doctorId]);

  // Listen to messages
  useEffect(() => {
    if (!activeChatId) return;
    const q = query(collection(db, "chats", activeChatId, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      setMessages(msgs);
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.senderId !== user?.uid && !lastMsg.seen) {
        updateDoc(doc(db, "chats", activeChatId, "messages", lastMsg.id), { seen: true });
      }
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsubscribe();
  }, [activeChatId, user]);

  // Auto-clear notifications for the currently active chat
  useEffect(() => {
    if (!activeChatId || !user) return;
    const activeChat = conversations.find(c => c.id === activeChatId);
    if (!activeChat?.doctorId) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("senderId", "==", activeChat.doctorId),
      where("type", "==", "message"),
      where("read", "==", false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => batch.update(doc(db, "notifications", d.id), { read: true }));
        batch.commit().catch(err => console.error("Auto-clear notifs error:", err));
      }
    });
    return () => unsubscribe();
  }, [activeChatId, conversations, user]);

  const handleSend = async () => {
    if (!input.trim() || !activeChatId || !user) return;
    const validationError = validateMessage(input);
    if (validationError) { setToast({ message: validationError, type: "error" }); return; }
    const text = input.trim();
    setInput("");
    try {
      await addDoc(collection(db, "chats", activeChatId, "messages"), {
        senderId: user.uid, text, createdAt: serverTimestamp(), seen: false
      });
      await updateDoc(doc(db, "chats", activeChatId), {
        lastMessage: text, lastMessageTime: serverTimestamp(), doctorUnread: true
      });
      if (activeChat?.doctorId) {
        await addDoc(collection(db, "notifications"), {
          userId: activeChat.doctorId, senderId: user.uid, title: "New Message",
          message: `${activeChat.patientName || "A patient"} sent you a message: "${text.substring(0, 80)}${text.length > 80 ? "..." : ""}"`,
          type: "message", read: false, link: "/doctor/dashboard/chat", createdAt: new Date().toISOString(),
        });

        // Email the doctor about the new message
        try {
          const docSnap = await getDoc(doc(db, "doctors", activeChat.doctorId));
          if (docSnap.exists()) {
            const targetDoctorEmail = docSnap.data().emailAddress || docSnap.data().email;
            if (targetDoctorEmail) {
              fetch("/api/notify-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "chat_activity",
                  email: targetDoctorEmail,
                  name: docSnap.data().fullName || "Doctor",
                  dashboardPath: "/doctor/dashboard/chat",
                }),
              }).catch(e => console.error("Async email error:", e));
            }
          }
        } catch (e) {
          console.error("Failed to fetch doctor email for chat notification:", e);
        }
      }
    } catch (err) { setToast({ message: "Failed to send message", type: "error" }); }
  };

  const activeChat = conversations.find(c => c.id === activeChatId);

  const openChat = (id: string) => {
    setActiveChatId(id);
    setMobileView("chat");
  };

  // ── CONVERSATION LIST ──────────────────────────────────────────────────
  const conversationListContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100">
        <p className="font-bold text-brand-primary text-sm">Messages</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map((c) => (
          <button key={c.id} onClick={() => openChat(c.id)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 ${activeChatId === c.id ? "bg-brand-secondary/10" : ""}`}>
            <div className="w-11 h-11 rounded-full bg-brand-secondary/20 flex items-center justify-center font-bold text-brand-primary shrink-0 overflow-hidden">
              {c.doctorImage ? (<img src={c.doctorImage} alt={c.doctorName} className="w-full h-full object-cover" />) : (c.doctorName?.charAt(0) || "D")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-sm text-brand-primary truncate">{c.doctorName}</p>
                <span className="text-[10px] text-gray-400 shrink-0">{formatTime(c.lastMessageTime)}</span>
              </div>
              <p className="text-xs text-gray-400 truncate mt-0.5">{c.lastMessage || "No messages yet"}</p>
            </div>
            {c.patientUnread && <div className="w-2.5 h-2.5 rounded-full bg-brand-secondary shrink-0" />}
          </button>
        ))}
        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center px-6">
            <MessageCircle size={32} className="text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No conversations yet.</p>
            <p className="text-xs text-gray-300 mt-1">Book an appointment to start chatting with a doctor.</p>
          </div>
        )}
      </div>
    </div>
  );

  // ── CHAT WINDOW ───────────────────────────────────────────────────────
  const chatWindowContent = (
    <div className="flex flex-col h-full">
      {activeChat ? (
        <>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 bg-white shrink-0">
            {/* Back button (mobile only) */}
            <button onClick={() => setMobileView("list")} className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors mr-1">
              <ArrowLeft size={20} />
            </button>
            <Link href={`/patient/dashboard/doctors/${activeChat.doctorName || activeChat.doctorId}`}
              className="w-10 h-10 rounded-full bg-brand-secondary/20 flex items-center justify-center shrink-0 overflow-hidden text-brand-primary font-bold">
              {activeChat.doctorImage ? (<img src={activeChat.doctorImage} alt={activeChat.doctorName} className="w-full h-full object-cover" />) : (activeChat.doctorName?.charAt(0) || "D")}
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/patient/dashboard/doctors/${activeChat.doctorName || activeChat.doctorId}`} className="font-bold text-brand-primary text-sm hover:underline block truncate">
                {activeChat.doctorName}
              </Link>
              <p className="text-xs text-gray-400 truncate">{activeChat.doctorSpecialty}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50">
            <AnimatePresence>
              {messages.map((m) => {
                const isMine = m.senderId === user?.id;
                return (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                    <div className={`max-w-[75%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine ? "bg-brand-secondary text-white rounded-tr-sm" : "bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100"}`}>
                        {m.text}
                      </div>
                      {isMine && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-400">
                          {m.seen ? (<><CheckCheck size={12} className="text-blue-500" /> Seen</>) : (<><Check size={12} /> Delivered</>)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-100 bg-white flex gap-3 items-center shrink-0">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-brand-secondary" />
            <button onClick={handleSend} className="w-10 h-10 rounded-xl bg-brand-secondary text-white flex items-center justify-center hover:bg-brand-primary transition-colors cursor-pointer shrink-0">
              <Send size={16} />
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm gap-3">
          <MessageCircle size={40} className="text-gray-200" />
          <p>Select a conversation to start chatting</p>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-primary mb-1">Chat</h1>
      <p className="text-gray-400 text-sm mb-4">Secure messaging with your healthcare team.</p>

      {/* Desktop: side-by-side | Mobile: one panel at a time */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: "calc(100vh - 200px)", minHeight: 480 }}>
        
        {/* MOBILE */}
        <div className="md:hidden h-full">
          <AnimatePresence mode="wait">
            {mobileView === "list" ? (
              <motion.div key="list" initial={{ x: 0 }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="h-full">
                {conversationListContent}
              </motion.div>
            ) : (
              <motion.div key="chat" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 220 }} className="h-full">
                {chatWindowContent}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* DESKTOP */}
        <div className="hidden md:flex h-full">
          {/* Left: List */}
          <div className="w-72 border-r border-gray-100 shrink-0 h-full overflow-hidden">
            {conversationListContent}
          </div>
          {/* Right: Chat */}
          <div className="flex-1 h-full overflow-hidden">
            {chatWindowContent}
          </div>
        </div>
      </div>

      {toast && (<Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />)}
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
