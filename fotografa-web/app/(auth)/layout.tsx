import Header from "FotosMony/components/ui/Header";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="flex items-center justify-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}
