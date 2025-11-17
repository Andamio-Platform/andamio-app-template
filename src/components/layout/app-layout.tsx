"use client";

import React from "react";
import { AppSidebar } from "./app-sidebar";
import { AuthStatusBar } from "./auth-status-bar";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Full-screen app layout with status bar and sidebar
 * - AuthStatusBar at top showing auth/wallet state
 * - Sidebar on left for navigation
 * - Main content area on right
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <AuthStatusBar />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
