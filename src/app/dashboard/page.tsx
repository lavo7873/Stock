import DashboardClient from './DashboardClient';
import NotesClient from './NotesClient';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen">
      <div className="flex-1 min-w-0">
        <DashboardClient />
      </div>
      <aside className="w-80 shrink-0 hidden lg:block lg:sticky lg:top-0 lg:h-screen">
        <NotesClient />
      </aside>
    </div>
  );
}
