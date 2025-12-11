"use client";

import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  Beaker,
  Calendar,
  Compass,
  Pencil,
} from "lucide-react";
import { AndamioAlert } from "~/components/andamio";

export default function Home() {
  return (
    <main className="bg-background text-foreground">
      {/* =============================================
          HERO - Full viewport, one message
          ============================================= */}
      <section className="flex min-h-[90vh] flex-col justify-center px-6">
        <div className="mx-auto w-full max-w-3xl">
          <AndamioAlert className="flex w-full my-5" variant="default">
            An LLM wrote all the copy on this page, but the sentiments are true.<br />Thank you for being here and please pardon any confusion.
          </AndamioAlert>

          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Andamio Pioneers Preview
          </p>

          <h1 className="!mt-6 !mb-0 !text-5xl !leading-tight sm:!text-6xl md:!text-7xl">
            <span className="text-muted-foreground">
              Help us build <br /> Andamio V2.
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-lg text-muted-foreground">
            You&apos;re early. This is a preview of the next generation of Andamio — contribution-centered
            learning on Cardano. Explore, experiment, break things. Your feedback
            shapes what we ship.
          </p>


          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              Enter the App
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="https://docs.andamio.io/docs/pioneers"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              What is Pioneers?
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="mt-16 flex items-center gap-3 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Mainnet launch: January 2026</span>
          </div>
        </div>
      </section>

      {/* =============================================
          WHAT IS THIS - Simple explanation
          ============================================= */}
      <section className="border-t px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="!mt-0 !mb-0 !text-3xl sm:!text-4xl">
            This is a playground
          </h2>
          <p className="mt-4 text-muted-foreground">
            We&apos;re building in public. This demo connects to Cardano Preprod
            so you can test real features without real stakes. Nothing here costs
            ADA. Data may reset. That&apos;s the point.
          </p>
        </div>
      </section>

      {/* =============================================
          TWO PATHS - Discover or Create
          ============================================= */}
      <section className="border-t px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="!mt-0 !mb-0 !text-3xl sm:!text-4xl">
            Two ways to explore
          </h2>

          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2">
            {/* Discover */}
            <div className="bg-card p-8">
              <Compass className="h-8 w-8 text-primary" />
              <h3 className="mt-6 text-lg font-semibold">Discover</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Browse courses and projects. See how Andamio structures learning
                and contribution.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  href="/course"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Browse Courses →
                </Link>
                <Link
                  href="/project"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Browse Projects →
                </Link>
              </div>
            </div>

            {/* Create */}
            <div className="bg-card p-8">
              <Pencil className="h-8 w-8 text-primary" />
              <h3 className="mt-6 text-lg font-semibold">Create</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try the creator tools. Build a course, define modules, publish
                tasks to a project.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  href="/studio/course"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Course Studio →
                </Link>
                <Link
                  href="/studio/project"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Project Studio →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =============================================
          PIONEERS - The invitation
          ============================================= */}
      <section className="border-t px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="!mt-0 !mb-0 !text-3xl sm:!text-4xl">
            What are Pioneers?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Following patterns from Gimbalabs in 2021, we&apos;re inviting early
            adopters to shape Andamio V2 before mainnet. This isn&apos;t just
            beta testing — it&apos;s co-creation.
          </p>
          <p className="mt-4 text-muted-foreground">
            Your questions become documentation. Your bugs become fixes. Your
            ideas become features.
          </p>
          <Link
            href="https://docs.andamio.io/docs/pioneers"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Read the Pioneers documentation
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* =============================================
          PREPROD WARNING
          ============================================= */}
      <section className="border-t bg-muted/50 px-6 py-12">
        <div className="mx-auto flex max-w-3xl items-start gap-4">
          <Beaker className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="font-medium">This is Cardano Preprod</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use a preprod wallet. Transactions are free. Data may be wiped
              during development.
            </p>
          </div>
        </div>
      </section>

      {/* =============================================
          FINAL CTA
          ============================================= */}
      <section className="border-t px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="!mt-0 !mb-0 !text-3xl sm:!text-4xl">
            Ready?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Connect a preprod wallet and start exploring.
          </p>
          <Link
            href="/dashboard"
            className="mt-8 inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* =============================================
          FOOTER
          ============================================= */}
      <footer className="border-t px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 text-sm sm:flex-row">
          <p className="font-medium">Andamio Pioneer Preview</p>
          <div className="flex gap-6 text-muted-foreground">
            <Link
              href="https://docs.andamio.io/docs/pioneers"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              Docs
            </Link>
            <Link
              href="https://andamio.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              andamio.io
            </Link>
            <Link href="/sitemap" className="hover:text-foreground">
              Sitemap
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
