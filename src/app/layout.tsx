import "~/styles/globals.css";
import "@meshsdk/react/styles.css";

import { type Metadata, type Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { TRPCReactProvider } from "~/trpc/react";
import { MeshProvider } from "~/components/providers/mesh-provider";
import { AndamioAuthProvider } from "~/contexts/andamio-auth-context";
import { Toaster } from "~/components/ui/sonner";
import { PendingTxWatcher } from "~/components/pending-tx-watcher";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: "Andamio T3 App Template",
  description: "Reference template for building Andamio apps using the T3 stack.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={spaceGrotesk.variable} suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MeshProvider>
            <AndamioAuthProvider>
              <TRPCReactProvider>
                <PendingTxWatcher>
                  {children}
                </PendingTxWatcher>
              </TRPCReactProvider>
              <Toaster position="top-right" richColors closeButton />
            </AndamioAuthProvider>
          </MeshProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
