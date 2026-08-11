export default function HospitalWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f7fb] flex flex-col">
      {children}
    </div>
  );
}
