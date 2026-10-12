"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Check, CheckCheck, ArrowLeft, MessageCircle, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection, query, where, onSnapshot, doc, getDoc,
  addDoc, orderBy, serverTimestamp, updateDoc, writeBatch
} from "firebase/firestore";

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

export default function DoctorChatPage() {
  const { user } = useAuth();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen to conversations for current doctor
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "chats"), where("doctorId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      chatList.sort((a, b) => (b.lastMessageTime?.toMillis() || 0) - (a.lastMessageTime?.toMillis() || 0));
      setConversations(chatList);
      if (!activeChatId && chatList.length > 0) setActiveChatId(chatList[0].id);
    });
    return () => unsubscribe();
  }, [user, activeChatId]);

  // Listen to messages for active conversation
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
    if (!activeChat?.patientId) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("senderId", "==", activeChat.patientId),
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

  const send = async () => {
    if (!input.trim() || !activeChatId || !user) return;
    const text = input.trim();
    setInput("");
    try {
      await addDoc(collection(db, "chats", activeChatId, "messages"), {
        senderId: user.uid, text, createdAt: serverTimestamp(), seen: false
      });
      await updateDoc(doc(db, "chats", activeChatId), {
        lastMessage: text, lastMessageTime: serverTimestamp(), patientUnread: true, doctorUnread: false
      });
      if (activeChat?.patientId) {
        await addDoc(collection(db, "notifications"), {
          userId: activeChat.patientId, senderId: user.uid, title: "New Message from Doctor",
          message: `Dr. ${activeChat.doctorName || "Your doctor"} sent you a message: "${text.substring(0, 80)}${text.length > 80 ? "..." : ""}"`,
          type: "message", read: false, link: "/patient/dashboard/chat", createdAt: new Date().toISOString(),
        });

        // Email the patient about the new message
        try {
          const docSnap = await getDoc(doc(db, "users", activeChat.patientId));
          // Some users might have email on users collection, others on patients
          let email = docSnap.exists() ? docSnap.data().email : null;
          
          if (!email) {
            const pSnap = await getDoc(doc(db, "patients", activeChat.patientId));
            if (pSnap.exists()) email = pSnap.data().email;
          }

          if (email) {
            fetch("/api/notify-user", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "chat_activity",
                email: email,
                name: activeChat.patientName || "Patient",
                dashboardPath: "/patient/dashboard/chat",
              }),
            }).catch(e => console.error("Async email error:", e));
          }
        } catch (e) {
          console.error("Failed to fetch patient email for chat notification:", e);
        }
      }
    } catch (err) { console.error("Failed to send message:", err); }
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
        <input type="text" placeholder="Search patients..."
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-secondary" />
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map((c) => (
          <button key={c.id} onClick={() => openChat(c.id)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 ${activeChatId === c.id ? "bg-brand-secondary/10" : ""}`}>
            <div className="w-11 h-11 rounded-full bg-brand-primary/10 flex items-center justify-center font-bold text-brand-primary shrink-0 overflow-hidden">
              {c.patientImage ? (<img src={c.patientImage} alt={c.patientName} className="w-full h-full object-cover" />) : (c.patientName?.charAt(0) || "P")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm truncate ${c.doctorUnread ? "font-bold text-brand-primary" : "font-semibold text-gray-700"}`}>{c.patientName}</p>
                <span className="text-[10px] text-gray-400 shrink-0">{formatTime(c.lastMessageTime)}</span>
              </div>
              <p className={`text-xs truncate mt-0.5 ${c.doctorUnread ? "text-brand-primary font-medium" : "text-gray-400"}`}>{c.lastMessage || "No messages yet"}</p>
            </div>
            {c.doctorUnread && <div className="w-2.5 h-2.5 rounded-full bg-brand-secondary shrink-0" />}
          </button>
        ))}
        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center px-6">
            <MessageCircle size={32} className="text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No conversations yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  // ── CHAT WINDOW ───────────────────────────────────────────────────────
  const chatWindowContent = (
    <div className="flex flex-col h-full bg-[#faf9fc]">
      {activeChat ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileView("list")} className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors mr-1">
                <ArrowLeft size={20} />
              </button>
              <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center font-bold text-brand-primary overflow-hidden shrink-0">
                {activeChat.patientImage ? (<img src={activeChat.patientImage} alt={activeChat.patientName} className="w-full h-full object-cover" />) : (activeChat.patientName?.charAt(0) || "P")}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-brand-primary text-sm truncate">{activeChat.patientName}</p>
                <p className="text-xs text-gray-400">Patient</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors shrink-0">
              <FileText size={14} /> <span className="hidden sm:inline">View Health Record</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            <AnimatePresence>
              {messages.map((m) => {
                const isMine = m.senderId === user?.uid;
                return (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine ? "bg-brand-secondary text-white rounded-tr-sm" : "bg-white border border-gray-100 text-gray-700 rounded-tl-sm shadow-sm"}`}>
                      {m.text}
                    </div>
                    {isMine && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                        {m.seen ? (<><CheckCheck size={12} className="text-blue-500" /> Seen</>) : (<><Check size={12} /> Sent</>)}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-100 bg-white flex gap-3 items-center shrink-0">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-brand-secondary" />
            <button onClick={send} className="w-10 h-10 rounded-xl bg-brand-secondary text-white flex items-center justify-center hover:bg-brand-primary transition-colors cursor-pointer shrink-0">
              <Send size={16} />
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm gap-3">
          <MessageCircle size={40} className="text-gray-200" />
          <p>Select a patient conversation to start chatting</p>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-primary mb-1">Patient Messages</h1>
      <p className="text-gray-400 text-sm mb-4">Secure communication channel with your patients.</p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: "calc(100vh - 200px)", minHeight: 480 }}>

        {/* MOBILE: one panel at a time */}
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

        {/* DESKTOP: side-by-side */}
        <div className="hidden md:flex h-full">
          <div className="w-80 border-r border-gray-100 shrink-0 h-full overflow-hidden bg-white">
            {conversationListContent}
          </div>
          <div className="flex-1 h-full overflow-hidden">
            {chatWindowContent}
          </div>
        </div>
      </div>
    </div>
  );
}
