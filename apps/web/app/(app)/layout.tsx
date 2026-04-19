import Sidebar from "@/components/app/Sidebar";
import AppHeader from "@/components/app/AppHeader";
import SidebarProvider from "@/components/app/SidebarProvider";
import OnboardingGuard from "@/components/app/OnboardingGuard";
import CommandPalette from "@/components/app/CommandPalette";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingGuard>
      <SidebarProvider>
        <div className="min-h-screen bg-cloud-white">
          <Sidebar />
          <div className="md:ml-64 ml-0">
            <AppHeader />
            <main className="p-4 md:p-8">{children}</main>
          </div>
          <CommandPalette />
        </div>
      </SidebarProvider>
    </OnboardingGuard>
  );
}
