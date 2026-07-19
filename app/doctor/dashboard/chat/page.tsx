"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Check, CheckCheck, FileText } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { db } from "@/lib/firebase";
import {
  collection, query, where, onSnapshot, doc,
  addDoc, orderBy, serverTimestamp, updateDoc, writeBatch, getDocs
} from "firebase/firestore";

const formatTime = (timestamp: any) => {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "long" });
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
};

export default function DoctorChatPage() {
  const { user } = usePrivy();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen to conversations for current doctor
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "chats"), where("doctorId", "==", user.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      chatList.sort((a, b) => {
        const timeA = a.lastMessageTime?.toMillis() || 0;
        const timeB = b.lastMessageTime?.toMillis() || 0;
        return timeB - timeA;
      });
      setConversations(chatList);
      
      if (!activeChatId && chatList.length > 0) {
        setActiveChatId(chatList[0].id);
      }
    });
    return () => unsubscribe();
  }, [user, activeChatId]);

  // Listen to messages for active conversation
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
    if (!activeChat || !activeChat.patientId) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.id),
      where("senderId", "==", activeChat.patientId),
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

  const send = async () => {
    if (!input.trim() || !activeChatId || !user) return;
    
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
        patientUnread: true,
        doctorUnread: false
      });

      // Notify the patient about the new message
      if (activeChat?.patientId) {
        await addDoc(collection(db, "notifications"), {
          userId: activeChat.patientId,
          senderId: user.id,
          title: "New Message from Doctor",
          message: `Dr. ${activeChat.doctorName || "Your doctor"} sent you a message: "${text.substring(0, 80)}${text.length > 80 ? "..." : ""}"`,
          type: "message",
          read: false,
          link: "/patient/dashboard/chat",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const activeChat = conversations.find(c => c.id === activeChatId);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-primary mb-1">Patient Messages</h1>
      <p className="text-gray-400 text-sm mb-6">Secure communication channel with your patients.</p>

      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[450px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Conversation List */}
        <div className="w-72 border-r border-gray-100 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-50">
            <input type="text" placeholder="Search patients..." className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-secondary" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((c) => (
              <button key={c.id} onClick={() => setActiveChatId(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer ${activeChatId === c.id ? "bg-brand-secondary/10 border-r-2 border-brand-secondary" : ""}`}>
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center font-bold text-brand-primary shrink-0 overflow-hidden">
                  {c.patientImage ? (
                    <img src={c.patientImage} alt={c.patientName} className="w-full h-full object-cover" />
                  ) : (
                    c.patientName?.charAt(0) || "P"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${c.doctorUnread ? "font-bold text-brand-primary" : "font-semibold text-gray-700"}`}>{c.patientName}</p>
                    <span className="text-[10px] text-gray-400 shrink-0">{formatTime(c.lastMessageTime)}</span>
                  </div>
                  <p className={`text-xs truncate ${c.doctorUnread ? "text-brand-primary font-medium" : "text-gray-400"}`}>{c.lastMessage || "No messages yet"}</p>
                </div>
                {c.doctorUnread && <div className="w-2 h-2 rounded-full bg-brand-secondary shrink-0"></div>}
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="p-4 text-sm text-gray-400 text-center">No conversations yet.</p>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-[#faf9fc]">
          {activeChat ? (
            <>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center font-bold text-brand-primary overflow-hidden">
                    {activeChat.patientImage ? (
                      <img src={activeChat.patientImage} alt={activeChat.patientName} className="w-full h-full object-cover" />
                    ) : (
                      activeChat.patientName?.charAt(0) || "P"
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-brand-primary text-sm">{activeChat.patientName}</p>
                    <p className="text-xs text-gray-400">Patient</p>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors">
                  <FileText size={14} /> View Health Record
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                <AnimatePresence>
                  {messages.map((m) => {
                    const isMine = m.senderId === user?.id;
                    return (
                      <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${isMine ? "bg-brand-secondary text-white rounded-tr-sm" : "bg-white border border-gray-100 text-gray-700 rounded-tl-sm shadow-sm"}`}>
                          {m.text}
                        </div>
                        {isMine && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                            {m.seen ? (
                              <><CheckCheck size={12} className="text-blue-500" /> Seen</>
                            ) : (
                              <><Check size={12} /> Sent</>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              <div className="px-5 py-4 border-t border-gray-100 bg-white flex gap-3">
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Type your medical advice..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-brand-secondary" />
                <button onClick={send} className="w-10 h-10 rounded-xl bg-brand-secondary text-white flex items-center justify-center hover:bg-brand-primary transition-colors cursor-pointer shrink-0">
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a patient conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
