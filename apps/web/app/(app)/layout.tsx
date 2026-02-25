import Sidebar from "@/components/app/Sidebar";
import AppHeader from "@/components/app/AppHeader";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cloud-white">
      <Sidebar />
      <div className="ml-64">
        <AppHeader />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
