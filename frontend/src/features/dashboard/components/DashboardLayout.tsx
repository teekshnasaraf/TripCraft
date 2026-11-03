import type { PropsWithChildren } from "react";
import { Footer } from "../../../components/layout/Footer";
import { Navbar } from "../../../components/layout/Navbar";
import { Container } from "../../../components/ui/Container";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";

interface DashboardLayoutProps extends PropsWithChildren {
  preview?: boolean;
}

export function DashboardLayout({
  preview = false,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-main-background text-primary-text">
      <Navbar
        items={[
          { label: "Home", href: "/" },
          { label: "Plan a trip", href: "/plan-trip" },
        ]}
      />
      <main>
        <Container className="grid gap-6 py-8 tablet:gap-8 tablet:py-12">
          {preview && (
            <p
              role="status"
              className="rounded-control border border-warning/40 bg-warning/10 px-4 py-3 text-small-label text-warning-text"
            >
              Development preview only. Account data and dashboard actions are
              not connected.
            </p>
          )}
          <DashboardHeader />
          <div className="grid items-start gap-6 tablet:grid-cols-[15rem_minmax(0,1fr)] tablet:gap-8">
            <DashboardSidebar preview={preview} />
            <div className="min-w-0">{children}</div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
