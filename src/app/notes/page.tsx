import Link from 'next/link';
import NotesClient from '../dashboard/NotesClient';

export default function NotesPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      <header className="border-b border-[#30363d] px-6 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold text-[#22c55e] font-mono hover:underline">
          ← Dashboard
        </Link>
      </header>
      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto h-[70vh] min-h-[300px] rounded-lg overflow-hidden border border-[#30363d]">
          <NotesClient fullPage />
        </div>
      </main>
    </div>
  );
}
