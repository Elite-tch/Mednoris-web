"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Send, Sparkles, Loader2 } from "lucide-react";

type Msg = { role: "user" | "ai"; text: string };

const starters = [
  "What does my blood test report say?",
  "Am I due for any vaccines?",
  "Summarize my last consultation",
  "What medications am I currently on?",
];

const initialMsgs: Msg[] = [
  { role: "ai", text: "Hello! I'm your Mednoris AI Assistant. I can help you understand your medical records, summarize reports, answer health questions, and more. What would you like to know?" },
];

export default function AIAssistantPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
      <div className="w-20 h-20 bg-brand-secondary/10 rounded-full flex items-center justify-center mb-6">
        <span className="text-brand-secondary text-3xl font-bold">🚧</span>
      </div>
      <h1 className="text-2xl font-extrabold text-brand-primary mb-2">Coming Soon</h1>
      <p className="text-gray-500 max-w-md mx-auto">
        Your AI Health Assistant is currently under development and will be available in the next update.
      </p>
    </div>
  );
}

function OriginalAIAssistantPage() {
  const [msgs, setMsgs] = useState<Msg[]>(initialMsgs);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setMsgs((m) => [...m, { role: "ai", text: "I'm analyzing your records... Based on your uploaded documents, I can see your last blood test from May 19, 2025 shows normal cholesterol levels but slightly elevated blood pressure. I recommend discussing this with Dr. Sarah Williams in your upcoming appointment." }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-brand-secondary flex items-center justify-center text-white">
          <Sparkles size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-brand-primary">AI Assistant</h1>
          <p className="text-gray-400 text-sm">Ask anything about your health records</p>
        </div>
      </div>

      {/* Starter prompts */}
      {msgs.length === 1 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {starters.map((s) => (
            <button key={s} onClick={() => send(s)}
              className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-sm text-brand-primary font-semibold text-left hover:border-brand-secondary hover:shadow-md transition-all cursor-pointer">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <AnimatePresence initial={false}>
          {msgs.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-brand-secondary text-white" : "bg-brand-primary/10 text-brand-primary"}`}>
                {m.role === "user" ? <User size={15} /> : <Bot size={15} />}
              </div>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${m.role === "user" ? "bg-brand-secondary text-white rounded-tr-sm" : "bg-gray-50 text-gray-700 rounded-tl-sm"}`}>
                {m.text}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                <Bot size={15} />
              </div>
              <div className="px-4 py-3 bg-gray-50 rounded-2xl rounded-tl-sm">
                <Loader2 size={16} className="animate-spin text-brand-secondary" />
              </div>
            </div>
          )}
        </AnimatePresence>
        <div ref={bottomRef}></div>
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Ask about your health records..."
          className="flex-1 px-5 py-3.5 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-brand-secondary shadow-sm" />
        <button onClick={() => send(input)} disabled={loading || !input.trim()}
          className="w-12 h-12 rounded-2xl bg-brand-secondary text-white flex items-center justify-center hover:bg-brand-primary transition-colors disabled:opacity-40 cursor-pointer">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
