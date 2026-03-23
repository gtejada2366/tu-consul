import { useState } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "../components/sidebar";
import { TopBar } from "../components/topbar";
import { AuthGuard } from "../components/auth-guard";
import { OnboardingWizard } from "../components/onboarding-wizard";

export function RootLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <AuthGuard>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
        Ir al contenido principal
      </a>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar onMenuToggle={() => setMobileMenuOpen(true)} />
          <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
      <OnboardingWizard />
    </AuthGuard>
  );
}
