"use client";

import { MeshProvider as MeshProviderBase } from "@meshsdk/react";
import { type ReactNode } from "react";

/**
 * MeshProvider wrapper for Next.js App Router
 *
 * This component wraps the Mesh SDK's MeshProvider to make it compatible
 * with Next.js App Router. It must be a client component ("use client")
 * and can be imported into the root layout.
 *
 * Usage:
 * - Wrap your app in this provider in the root layout
 * - Use the useWallet hook from @meshsdk/react to access wallet functionality
 *
 * @example
 * ```tsx
 * import { MeshProvider } from "~/components/providers/mesh-provider";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <MeshProvider>
 *           {children}
 *         </MeshProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function MeshProvider({ children }: { children: ReactNode }) {
  return <MeshProviderBase>{children}</MeshProviderBase>;
}
