import Sidebar from "@/components/app/Sidebar";
import AppHeader from "@/components/app/AppHeader";
import SidebarProvider from "@/components/app/SidebarProvider";
import OnboardingGuard from "@/components/app/OnboardingGuard";
import FeedbackWidget from "@/components/app/FeedbackWidget";
import { ErrorBoundary } from "@/components/app/ErrorBoundary";
import { ToastProvider } from "@/components/ui/Toast";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingGuard>
      <ToastProvider>
        <SidebarProvider>
          <div className="min-h-screen bg-cloud-white">
            <Sidebar />
            <div className="md:ml-64 ml-0">
              <AppHeader />
              <main className="p-4 md:p-8">
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
            </div>
          </div>
          <FeedbackWidget />
        </SidebarProvider>
      </ToastProvider>
    </OnboardingGuard>
  );
}
