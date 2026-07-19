"use client";

export default function ConsultationChat({ appointmentId, userId }: { appointmentId: string, userId: string }) {
  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-white">
        <h3 className="font-bold text-brand-primary">Consultation Chat</h3>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto flex flex-col items-center justify-center">
        <p className="text-gray-400 text-sm text-center">Chat functionality coming soon...</p>
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 border-transparent focus:border-brand-secondary focus:ring-0 rounded-xl px-4 py-3 text-sm"
          />
          <button className="bg-brand-secondary text-white px-5 py-3 rounded-xl font-bold hover:bg-brand-primary transition-colors cursor-pointer">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
