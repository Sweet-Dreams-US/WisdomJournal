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
          <div className="min-h-screen app-bg">
            <Sidebar />
            <div className="md:ml-64 ml-0 relative z-10">
              <AppHeader />
              <main className="p-4 md:p-8 animate-fade-in">
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
            </div>
            <FeedbackWidget />
          </div>
        </SidebarProvider>
      </ToastProvider>
    </OnboardingGuard>
  );
}
