import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="flex max-w-[1280px] mx-auto">
        <Sidebar />
        <main className="flex-1 min-w-0 px-4 py-6 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
