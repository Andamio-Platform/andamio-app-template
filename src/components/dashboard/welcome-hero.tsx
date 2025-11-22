"use client";

import React from "react";
import Link from "next/link";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioCard, AndamioCardContent } from "~/components/andamio/andamio-card";
import { Sparkles, BookOpen, Palette, Code2 } from "lucide-react";

export function WelcomeHero() {
  return (
    <AndamioCard className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <AndamioCardContent className="p-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-4 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-background/80 backdrop-blur-sm text-xs font-medium">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>Andamio T3 Template</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold">
              Welcome to your Dashboard
            </h1>

            <p className="text-muted-foreground max-w-2xl">
              You&apos;re using a production-ready Next.js template with Cardano integration,
              type-safe APIs, and 45+ beautiful components. Explore the features below.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/course">
              <AndamioButton variant="default" size="lg" className="w-full sm:w-auto">
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Courses
              </AndamioButton>
            </Link>
            <Link href="/components">
              <AndamioButton variant="outline" size="lg" className="w-full sm:w-auto">
                <Palette className="mr-2 h-4 w-4" />
                View Components
              </AndamioButton>
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t">
          {[
            { icon: BookOpen, label: "Browse Courses", href: "/course", desc: "Explore published courses" },
            { icon: Palette, label: "Components", href: "/components", desc: "45+ UI components" },
            { icon: Code2, label: "Sitemap", href: "/sitemap", desc: "All routes" },
          ].map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
              >
                <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">
                    {link.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {link.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
