'use client';

import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'psr_notes';

interface Note {
  id: string;
  content: string;
  createdAt: string;
}

interface NotesClientProps {
  fullPage?: boolean;
}

function loadNotes(): Note[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'string' && parsed.trim()) {
      const migrated: Note = { id: crypto.randomUUID(), content: parsed, createdAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([migrated]));
      return [migrated];
    }
    return [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }
}

export default function NotesClient({ fullPage }: NotesClientProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  const save = useCallback(() => {
    const text = content.trim();
    if (!text) return;
    const note: Note = {
      id: crypto.randomUUID(),
      content: text,
      createdAt: new Date().toISOString(),
    };
    const next = [note, ...notes];
    setNotes(next);
    saveNotes(next);
    setContent('');
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, [content, notes]);

  const deleteNote = useCallback((id: string) => {
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    saveNotes(next);
  }, [notes]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`h-full flex flex-col bg-[#161b22] ${fullPage ? 'border border-[#30363d] rounded-lg' : 'border-l border-[#30363d]'}`}>
      <div className="px-4 py-3 border-b border-[#30363d] flex justify-between items-center shrink-0">
        <h2 className="text-sm font-semibold text-[#22c55e] font-mono">
          Notes
        </h2>
        <button
          onClick={save}
          disabled={!content.trim()}
          className="px-2 py-1 text-xs bg-[#22c55e] text-[#0d1117] font-mono rounded hover:bg-[#16a34a] disabled:opacity-50"
        >
          {saved ? 'Đã lưu' : 'Lưu'}
        </button>
      </div>
      <div className="p-3 border-b border-[#30363d] shrink-0">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } }}
          placeholder="Viết ghi chú rồi bấm Lưu..."
          className="w-full p-3 resize-none bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] text-sm font-mono placeholder-[#484f58] focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
          rows={3}
        />
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {notes.length === 0 ? (
          <p className="text-[#484f58] text-sm font-mono py-4 text-center">
            Chưa có note
          </p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="flex flex-col gap-1 py-3 border-b border-[#30363d] last:border-b-0">
              <div className="flex justify-between items-center">
                <span className="text-[#8b949e] text-xs font-mono">
                  {formatDate(note.createdAt)}
                </span>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="text-[#8b949e] hover:text-red-400 text-xs"
                >
                  ×
                </button>
              </div>
              <pre className="text-[#c9d1d9] text-sm font-mono whitespace-pre-wrap break-words leading-relaxed">
                {note.content}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
