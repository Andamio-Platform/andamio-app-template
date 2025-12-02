"use client";

import React from "react";
import Link from "next/link";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioSectionDescription } from "~/components/andamio/andamio-section-description";
import {
  Zap,
  Shield,
  Palette,
  Code2,
  Database,
  Layers,
  Wallet,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Sparkles,
  LayoutDashboard,
  FileCode2,
} from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Local and Global",
    description: "Your courses, your contributors, your community. Connected to a global network of compatible apps and shared infrastructure.",
  },
  {
    icon: Shield,
    title: "On-Chain Anchors",
    description: "Learning paths, contribution records, credentials—all verified on Cardano. Portable across apps, owned by users.",
  },
  {
    icon: Database,
    title: "Shared Infrastructure",
    description: "Build on common primitives. Extend them. Make them yours. The foundation is here, the vision is yours.",
  },
  {
    icon: Zap,
    title: "One Install",
    description: "npm install @andamio/core. Connect to global infrastructure. Build something local and unique.",
  },
  {
    icon: Palette,
    title: "Production Ready",
    description: "45+ components. Auth flow. Course management. Blockchain integration. Start with infrastructure, ship your vision.",
  },
  {
    icon: Code2,
    title: "Your Stack",
    description: "Next.js 15, TypeScript, tRPC, Tailwind v4. The modern tools you already use.",
  },
];

const quickLinks = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    href: "/dashboard",
    description: "View your personal dashboard",
  },
  {
    icon: BookOpen,
    title: "Browse Courses",
    href: "/course",
    description: "Explore published courses",
  },
  {
    icon: Sparkles,
    title: "Studio",
    href: "/studio",
    description: "Creator studio hub",
  },
  {
    icon: FileCode2,
    title: "Components",
    href: "/components",
    description: "Component showcase",
  },
];

const codeExample = `// Install Andamio
npm install @andamio/core

// Your app is now connected
import { useAndamioAuth } from "@andamio/core";
import { type Course } from "@andamio/db-api";

export function MyCourses() {
  const { authenticatedFetch } = useAndamioAuth();
  const [courses, setCourses] = useState<Course[]>([]);

  // Full type safety from API to UI
  const data = await authenticatedFetch("/courses/owned");

  return <CourseList courses={data} />;
}`;

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/50 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Andamio T3 App Template</span>
          </div>

          <h1 className="!text-5xl md:!text-6xl font-bold tracking-tight text-center">
            Build what&apos;s yours
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Connect to what&apos;s global
            </span>
          </h1>

          <AndamioSectionDescription>
            Your app, your vision, your community. Built on shared infrastructure.
            <br />
            Learning, contributions, credentials—on-chain, interoperable, yours.
          </AndamioSectionDescription>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <AndamioButton size="lg" className="w-full sm:w-auto">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </AndamioButton>
            </Link>
            <Link href="/components">
              <AndamioButton size="lg" variant="outline" className="w-full sm:w-auto">
                View Components
              </AndamioButton>
            </Link>
            <Link href="/sitemap">
              <AndamioButton size="lg" variant="ghost" className="w-full sm:w-auto">
                Explore Routes
              </AndamioButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-24">
        <div className="text-center space-y-0">
          <h2 className="!text-3xl font-bold text-center">How It Works</h2>
          <AndamioSectionDescription className="text-lg">
            Global infrastructure. Local identity. Your app stays yours.
          </AndamioSectionDescription>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <AndamioCard key={feature.title} className="border-2 hover:border-primary/50 transition-colors">
                <AndamioCardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <AndamioCardTitle className="text-lg">{feature.title}</AndamioCardTitle>
                  </div>
                </AndamioCardHeader>
                <AndamioCardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </AndamioCardContent>
              </AndamioCard>
            );
          })}
        </div>
      </div>

      {/* Code Example */}
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-0">
            <h2 className="!text-3xl font-bold text-center">Web3 Infrastructure</h2>
            <AndamioSectionDescription className="text-lg">
              The Cardano primitives that make decentralized learning and contribution systems possible.
            </AndamioSectionDescription>
          </div>

          <AndamioCard className="border-2">
            <AndamioCardContent className="p-6">
              <pre className="text-sm overflow-x-auto">
                <code>{codeExample}</code>
              </pre>
            </AndamioCardContent>
          </AndamioCard>
        </div>
      </div>

      {/* Quick Links */}
      <div className="container mx-auto px-4 py-24">
        <div className="text-center space-y-0">
          <h2 className="!text-3xl font-bold text-center">Explore</h2>
          <AndamioSectionDescription className="text-lg">
            See what&apos;s possible. Every route is ready.
          </AndamioSectionDescription>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <AndamioCard className="h-full hover:bg-accent transition-colors cursor-pointer border-2 hover:border-primary/50">
                  <AndamioCardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <AndamioCardTitle className="text-base">{link.title}</AndamioCardTitle>
                    </div>
                    <AndamioCardDescription className="text-xs">
                      {link.description}
                    </AndamioCardDescription>
                  </AndamioCardHeader>
                </AndamioCard>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-0">
            <h2 className="!text-3xl font-bold text-center">The Stack</h2>
            <AndamioSectionDescription className="text-lg">
              Platform meets tooling. Everything works together.
            </AndamioSectionDescription>
          </div>

          <AndamioCard className="border-2">
            <AndamioCardContent className="p-8">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-primary" />
                    Andamio Platform
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {[
                      "@andamio/core - Platform SDK",
                      "@andamio/db-api - Type-safe API",
                      "Course & module management",
                      "Assignment tracking",
                      "On-chain credentials",
                      "Contribution verification",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    Developer Tools
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {[
                      "Next.js 15 App Router",
                      "TypeScript & tRPC",
                      "Tailwind CSS v4",
                      "Cardano wallet auth",
                      "45+ UI components",
                      "Production patterns",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AndamioCardContent>
          </AndamioCard>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <AndamioCard className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
            <AndamioCardContent className="p-16 text-center space-y-0">
              <h2 className="!text-3xl font-bold text-center">See the System</h2>
              <AndamioSectionDescription>
                Connect your wallet. Explore how learning, contributions, and credentials work together on-chain.
              </AndamioSectionDescription>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <AndamioButton size="lg" className="w-full sm:w-auto">
                    <Wallet className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </AndamioButton>
                </Link>
                <Link href="/sitemap">
                  <AndamioButton size="lg" variant="outline" className="w-full sm:w-auto">
                    View All Routes
                  </AndamioButton>
                </Link>
              </div>
            </AndamioCardContent>
          </AndamioCard>
        </div>
      </div>

      {/* Footer */}
      <div className="container mx-auto px-4 py-12 border-t mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <p>Built with the T3 Stack and Andamio Platform</p>
          <div className="flex gap-4">
            <Link href="/sitemap" className="hover:text-foreground transition-colors">
              Sitemap
            </Link>
            <Link href="/components" className="hover:text-foreground transition-colors">
              Components
            </Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
