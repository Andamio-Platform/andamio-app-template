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
import { MARKETING } from "~/config";

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
                {MARKETING.disclaimer.text}
              </AndamioAlertDescription>
            </AndamioAlert>
          </div>

          <AndamioText variant="overline" className="text-primary">
            {MARKETING.hero.badge}
          </AndamioText>

          <h1 className="text-muted-foreground">
            {MARKETING.hero.subtitle}
          </h1>

          <AndamioText variant="lead" className="mt-8 max-w-xl">
            {MARKETING.hero.lead}
          </AndamioText>


          <div className="mt-10 flex flex-wrap gap-4">
            <AndamioButton asChild size="lg">
              <Link href={MARKETING.hero.primaryCta.href} className="inline-flex items-center">
                <span>{MARKETING.hero.primaryCta.text}</span>
                <ForwardIcon className="ml-2 h-4 w-4" />
              </Link>
            </AndamioButton>
            <AndamioButton asChild variant="outline" size="lg">
              <Link
                href={MARKETING.hero.secondaryCta.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center"
              >
                <span>{MARKETING.hero.secondaryCta.text}</span>
                <ExternalLinkIcon className="ml-2 h-4 w-4" />
              </Link>
            </AndamioButton>
          </div>

          <div className="mt-16 flex items-center gap-3 text-sm text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>{MARKETING.timeline.preprodLaunch}</span>
          </div>

          <div className="my-4 flex items-center gap-3 text-sm text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>{MARKETING.timeline.mainnetLaunch}</span>
          </div>
        </div>
      </section>

      {/* =============================================
          WHAT IS THIS - Simple explanation
          ============================================= */}
      <section className="border-t px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2>{MARKETING.playground.title}</h2>
          <AndamioText variant="muted" className="mt-4">
            {MARKETING.playground.description}
          </AndamioText>
        </div>
      </section>

      {/* =============================================
          TWO PATHS - Discover or Create
          ============================================= */}
      <section className="border-t px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2>{MARKETING.twoPaths.title}</h2>

          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2">
            {/* Discover */}
            <div className="bg-card p-8">
              <ExploreIcon className="h-8 w-8 text-primary" />
              <h3>{MARKETING.twoPaths.discover.title}</h3>
              <AndamioText variant="small" className="mt-2">
                {MARKETING.twoPaths.discover.description}
              </AndamioText>
              <div className="mt-6 flex flex-col gap-2">
                {MARKETING.twoPaths.discover.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {link.text} →
                  </Link>
                ))}
              </div>
            </div>

            {/* Create */}
            <div className="bg-card p-8">
              <EditIcon className="h-8 w-8 text-primary" />
              <h3>{MARKETING.twoPaths.create.title}</h3>
              <AndamioText variant="small" className="mt-2">
                {MARKETING.twoPaths.create.description}
              </AndamioText>
              <div className="mt-6 flex flex-col gap-2">
                {MARKETING.twoPaths.create.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {link.text} →
                  </Link>
                ))}
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
          <h2>{MARKETING.pioneers.title}</h2>
          {MARKETING.pioneers.description.map((paragraph, index) => (
            <AndamioText key={index} variant="muted" className="mt-4">
              {paragraph}
            </AndamioText>
          ))}
          <Link
            href={MARKETING.pioneers.linkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            {MARKETING.pioneers.linkText}
            <ExternalLinkIcon className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* =============================================
          PREPROD WARNING
          ============================================= */}
      <section className="border-t bg-muted/50 px-6 py-12">
        <div className="mx-auto flex max-w-3xl items-start gap-4">
          <TestIcon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <AndamioText className="font-medium">{MARKETING.preprodWarning.title}</AndamioText>
            <AndamioText variant="small" className="mt-1">
              {MARKETING.preprodWarning.description}
            </AndamioText>
          </div>
        </div>
      </section>

      {/* =============================================
          FINAL CTA
          ============================================= */}
      <section className="border-t px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2>{MARKETING.finalCta.title}</h2>
          <AndamioText variant="muted" className="mt-4">
            {MARKETING.finalCta.description}
          </AndamioText>
          <div className="mt-8">
            <AndamioButton asChild size="lg">
              <Link href={MARKETING.finalCta.buttonHref}>
                {MARKETING.finalCta.buttonText}
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
          <AndamioText className="font-medium">{MARKETING.footer.brandText}</AndamioText>
          <div className="flex gap-6 text-muted-foreground">
            {MARKETING.footer.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="hover:text-foreground"
              >
                {link.text}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
