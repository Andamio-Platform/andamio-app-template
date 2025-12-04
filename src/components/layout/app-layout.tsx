"use client";

import React from "react";
import { AppSidebar } from "./app-sidebar";
import { AuthStatusBar } from "./auth-status-bar";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Professional full-screen app layout
 * - Minimal status bar at top
 * - Clean sidebar navigation on left
 * - Spacious main content area with refined padding
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Status Bar - Minimal height */}
      <AuthStatusBar />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Fixed width */}
        <AppSidebar />

        {/* Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
