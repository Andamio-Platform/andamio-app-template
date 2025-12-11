"use client";

import React from "react";
import Link from "next/link";
import { AndamioButton } from "~/components/andamio/andamio-button";
import {
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Layers,
  Shield,
  Blocks,
  Sparkles,
  GraduationCap,
  Award,
  Users,
} from "lucide-react";
import type { IconListItem, IconComponent } from "~/types/ui";

interface TechItem {
  name: string;
  icon: IconComponent;
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/3 to-transparent" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-primary/5 to-transparent" />

        <div className="relative mx-auto max-w-5xl px-6 pt-24 pb-32 sm:pt-32 sm:pb-40 lg:px-8">
          <div className="text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary tracking-wide">Andamio App Template</span>
            </div>

            {/* Main Headline - MASSIVE */}
            <h1 className="!mt-8 !mb-0 !text-6xl sm:!text-7xl md:!text-8xl lg:!text-9xl font-bold tracking-tighter">
              Learn. Build.
              <br />
              <span className="text-primary">Prove it.</span>
            </h1>

            {/* Subheadline */}
            <p className="mx-auto !my-12 text-xl text-muted-foreground sm:text-2xl">
              Professional learning with verifiable credentials on Cardano.
            </p>

            {/* CTA Buttons */}
            <div className="mt-12 flex flex-col items-center justify-center gap-4">
              <Link href="/dashboard">
                <AndamioButton size="lg" className="h-12 px-6 gap-2">
                  Start Learning
                  <ArrowRight className="h-4 w-4" />
                </AndamioButton>
              </Link>
              <Link href="/course">
                <AndamioButton size="lg" variant="outline" className="h-12 px-6">
                  Browse Courses
                </AndamioButton>
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Value Props */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="grid gap-12 sm:grid-cols-3">
            {([
              {
                icon: GraduationCap,
                title: "Structured Learning",
                description: "Goal-driven courses with clear paths from beginner to expert.",
              },
              {
                icon: Award,
                title: "Verifiable Credentials",
                description: "On-chain certificates that prove your skills. Portable and permanent.",
              },
              {
                icon: Users,
                title: "Community Driven",
                description: "Learn with peers and build your reputation in the ecosystem.",
              },
            ] as IconListItem[]).map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="!mt-5 !mb-0 !text-xl sm:!text-2xl font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-muted-foreground !mb-0">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-border bg-muted/40 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="text-center">
            <h2 className="!text-4xl sm:!text-5xl lg:!text-6xl font-bold tracking-tight !mb-0">
              How it works
            </h2>
            <p className="mt-6 text-xl text-muted-foreground !mb-0">
              Three steps to building your verified skill portfolio.
            </p>
          </div>

          <div className="mt-20 grid gap-8 sm:grid-cols-3 sm:gap-12">
            {[
              {
                step: "01",
                title: "Connect Wallet",
                description: "Link your Cardano wallet to create your learning identity.",
              },
              {
                step: "02",
                title: "Complete Courses",
                description: "Work through structured modules and hands-on assignments.",
              },
              {
                step: "03",
                title: "Earn Credentials",
                description: "Receive verifiable on-chain proof of your achievements.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-7xl sm:text-8xl font-bold text-primary/15 leading-none">
                  {item.step}
                </div>
                <h3 className="!mt-4 !mb-0 !text-xl sm:!text-2xl font-semibold">
                  {item.title}
                </h3>
                <p className="mt-3 text-muted-foreground !mb-0">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            {/* Content */}
            <div className="text-center lg:text-left">
              <h2 className="!text-4xl sm:!text-5xl lg:!text-6xl font-bold tracking-tight !mb-0">
                Everything you need
              </h2>
              <p className="mt-6 text-xl text-muted-foreground !mb-0">
                A complete platform for learning, teaching, and proving competency.
              </p>

              <div className="mt-10 grid gap-3 text-left sm:grid-cols-2">
                {[
                  "Structured course modules",
                  "Interactive assignments",
                  "Progress tracking",
                  "On-chain credentials",
                  "Wallet authentication",
                  "Role-based access",
                  "Rich text editor",
                  "Transaction monitoring",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual */}
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
                <div className="flex items-center gap-3 border-b border-border pb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Blocks className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold !mb-0">Course Progress</p>
                    <p className="text-xs text-muted-foreground !mb-0">Plutus Smart Contracts</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    { name: "Introduction to Cardano", complete: true },
                    { name: "Plutus Foundations", complete: true },
                    { name: "Building Validators", complete: false },
                    { name: "Testing & Deployment", complete: false },
                  ].map((moduleItem, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      {moduleItem.complete ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      <span className={`text-sm ${moduleItem.complete ? "text-muted-foreground line-through" : ""}`}>
                        {moduleItem.name}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">50%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-1/2 rounded-full bg-primary" />
                  </div>
                </div>
              </div>
              <div className="absolute -z-10 -top-3 -right-3 h-full w-full rounded-xl border border-primary/20" />
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="border-t border-border bg-muted/40 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <p className="text-center text-xs font-medium text-muted-foreground tracking-wider mb-8">
            BUILT WITH
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {([
              { name: "Next.js 15", icon: Blocks },
              { name: "TypeScript", icon: Blocks },
              { name: "Cardano", icon: Shield },
              { name: "Tailwind", icon: Sparkles },
              { name: "tRPC", icon: Blocks },
              { name: "Mesh SDK", icon: Blocks },
            ] as TechItem[]).map((tech) => {
              const TechIcon = tech.icon;
              return (
                <div key={tech.name} className="flex items-center gap-2 text-muted-foreground">
                  <TechIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{tech.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center">
          <h2 className="!text-4xl sm:!text-5xl lg:!text-6xl font-bold tracking-tight !mb-0">
            Ready to get started?
          </h2>
          <p className="mt-6 text-xl text-muted-foreground !mb-0">
            Connect your wallet and begin your learning journey today.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/dashboard">
              <AndamioButton size="lg" className="h-12 px-6 gap-2">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </AndamioButton>
            </Link>
            <Link href="/course">
              <AndamioButton size="lg" variant="outline" className="h-12 px-6 gap-2">
                <BookOpen className="h-4 w-4" />
                Browse Courses
              </AndamioButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Layers className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold">Andamio</span>
            </div>
            <p className="text-sm text-muted-foreground !mb-0">
              Professional learning on Cardano
            </p>
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link href="/course" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Courses
              </Link>
              <Link href="/components" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Components
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
