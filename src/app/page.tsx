"use client";

import Link from "next/link";
import {
  ForwardIcon,
  ExternalLinkIcon,
  EditIcon,
  TestIcon,
  CalendarIcon,
  ExploreIcon,
} from "~/components/icons";
import { AndamioAlert, AndamioAlertDescription, AndamioText } from "~/components/andamio";
import { AndamioButton } from "~/components/andamio/andamio-button";

export default function Home() {
  return (
    <main className="bg-background text-foreground">
      {/* =============================================
          HERO - Full viewport, one message
          ============================================= */}
      <section className="flex min-h-[90vh] flex-col justify-center px-6">
        <div className="mx-auto w-full max-w-3xl">
          <div className="my-5">
            <AndamioAlert variant="default">
              <AndamioAlertDescription>
                An LLM wrote all the copy on this page, but the sentiments are true. Thank you for being here and please pardon any confusion.
              </AndamioAlertDescription>
            </AndamioAlert>
          </div>

          <AndamioText variant="overline" className="text-primary">
            Andamio Pioneers Preview
          </AndamioText>

          <h1 className="text-muted-foreground">
            Help us build Andamio V2.
          </h1>

          <AndamioText variant="lead" className="mt-8 max-w-xl">
            You&apos;re early. This is a preview of the next generation of Andamio — contribution-centered
            learning on Cardano. Explore, experiment, break things. Your feedback
            shapes what we ship.
          </AndamioText>


          <div className="mt-10 flex flex-wrap gap-4">
            <AndamioButton asChild size="lg">
              <Link href="/dashboard" className="inline-flex items-center">
                <span>Enter the App</span>
                <ForwardIcon className="ml-2 h-4 w-4" />
              </Link>
            </AndamioButton>
            <AndamioButton asChild variant="outline" size="lg">
              <Link
                href="https://docs.andamio.io/docs/pioneers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center"
              >
                <span>What is Pioneers?</span>
                <ExternalLinkIcon className="ml-2 h-4 w-4" />
              </Link>
            </AndamioButton>
          </div>

          <div className="mt-16 flex items-center gap-3 text-sm text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>Preprod launch: January 2026</span>
          </div>

          <div className="my-4 flex items-center gap-3 text-sm text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>Mainnet launch: February 2026</span>
          </div>
        </div>
      </section>

      {/* =============================================
          WHAT IS THIS - Simple explanation
          ============================================= */}
      <section className="border-t px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2>This is a playground</h2>
          <AndamioText variant="muted" className="mt-4">
            We&apos;re building in public. This demo connects to Cardano Preprod
            so you can test real features without real stakes. Nothing here costs
            ADA. Data may reset. That&apos;s the point.
          </AndamioText>
        </div>
      </section>

      {/* =============================================
          TWO PATHS - Discover or Create
          ============================================= */}
      <section className="border-t px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2>Two ways to explore</h2>

          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2">
            {/* Discover */}
            <div className="bg-card p-8">
              <ExploreIcon className="h-8 w-8 text-primary" />
              <h3>Discover</h3>
              <AndamioText variant="small" className="mt-2">
                Browse courses and projects. See how Andamio structures learning
                and contribution.
              </AndamioText>
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
              <EditIcon className="h-8 w-8 text-primary" />
              <h3>Create</h3>
              <AndamioText variant="small" className="mt-2">
                Try the creator tools. Build a course, define modules, publish
                tasks to a project.
              </AndamioText>
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
          <h2>What are Pioneers?</h2>
          <AndamioText variant="muted" className="mt-4">
            Following patterns from Gimbalabs in 2021, we&apos;re inviting early
            adopters to shape Andamio V2 before mainnet. This isn&apos;t just
            beta testing — it&apos;s co-creation.
          </AndamioText>
          <AndamioText variant="muted" className="mt-4">
            Your questions become documentation. Your bugs become fixes. Your
            ideas become features.
          </AndamioText>
          <Link
            href="https://docs.andamio.io/docs/pioneers"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Read the Pioneers documentation
            <ExternalLinkIcon className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* =============================================
          PREPROD WARNING
          ============================================= */}
      <section className="border-t bg-muted/50 px-6 py-12">
        <div className="mx-auto flex max-w-3xl items-start gap-4">
          <TestIcon className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <AndamioText className="font-medium">This is Cardano Preprod</AndamioText>
            <AndamioText variant="small" className="mt-1">
              Use a preprod wallet. Transactions are free. Data may be wiped
              during development.
            </AndamioText>
          </div>
        </div>
      </section>

      {/* =============================================
          FINAL CTA
          ============================================= */}
      <section className="border-t px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2>Ready?</h2>
          <AndamioText variant="muted" className="mt-4">
            Connect a preprod wallet and start exploring.
          </AndamioText>
          <div className="mt-8">
            <AndamioButton asChild size="lg">
              <Link href="/dashboard">
                Go to Dashboard
                <ForwardIcon className="ml-2 h-4 w-4" />
              </Link>
            </AndamioButton>
          </div>
        </div>
      </section>

      {/* =============================================
          FOOTER
          ============================================= */}
      <footer className="border-t px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 text-sm sm:flex-row">
          <AndamioText className="font-medium">Andamio Pioneer Preview</AndamioText>
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
