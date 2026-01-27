import "~/styles/globals.css";
import "@meshsdk/react/styles.css";

import { type Metadata, type Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { TRPCReactProvider } from "~/trpc/react";
import { MeshProvider } from "~/components/providers/mesh-provider";
import { AuthProvider } from "~/components/providers/auth-provider";
import { Toaster } from "~/components/ui/sonner";
import { BRANDING } from "~/config";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: BRANDING.fullTitle,
  description: BRANDING.description,
  icons: [{ rel: "icon", url: BRANDING.logo.favicon }],
  openGraph: {
    title: BRANDING.fullTitle,
    description: BRANDING.description,
    images: [BRANDING.logo.ogImage],
    siteName: BRANDING.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: BRANDING.fullTitle,
    description: BRANDING.description,
    images: [BRANDING.logo.ogImage],
  },
  metadataBase: new URL(BRANDING.links.website),
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
    <html lang="en" className={`${spaceGrotesk.variable} overflow-hidden overscroll-none`} suppressHydrationWarning>
      <body className="font-sans overflow-hidden overscroll-none">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MeshProvider>
            <AuthProvider>
              <TRPCReactProvider>
                {children}
              </TRPCReactProvider>
              <Toaster position="top-right" richColors closeButton />
            </AuthProvider>
          </MeshProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
