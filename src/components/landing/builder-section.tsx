"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CardanoWallet } from "@meshsdk/react";
import { useTheme } from "next-themes";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { CourseIcon, ProjectIcon, LoadingIcon, BackIcon } from "~/components/icons";
import { MARKETING } from "~/config/marketing";

const WEB3_SERVICES_CONFIG = {
  networkId: 0,
  projectId: "13ff4981-bdca-4aad-ba9a-41fe1018fdb0",
} as const;

type BuilderIntent = "course" | "project" | null;

/**
 * Builder section for course creators and project owners.
 *
 * Provides intent-aware entry points that redirect to studio after auth.
 */
export function BuilderSection() {
  const [mounted, setMounted] = React.useState(false);
  const [builderIntent, setBuilderIntent] = React.useState<BuilderIntent>(null);
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const {
    isAuthenticated,
    user,
    isAuthenticating,
    isWalletConnected,
  } = useAndamioAuth();

  const copy = MARKETING.landingBuilder;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to studio when authenticated with intent
  React.useEffect(() => {
    if (isAuthenticated && user?.accessTokenAlias && builderIntent) {
      const destination = builderIntent === "course"
        ? "/studio/course"
        : "/studio/project";
      router.push(destination);
    }
  }, [isAuthenticated, user?.accessTokenAlias, builderIntent, router]);

  const isDark = mounted && resolvedTheme === "dark";

  const handleCreateCourse = () => {
    if (isAuthenticated && user?.accessTokenAlias) {
      router.push("/studio/course");
    } else {
      setBuilderIntent("course");
    }
  };

  const handleLaunchProject = () => {
    if (isAuthenticated && user?.accessTokenAlias) {
      router.push("/studio/project");
    } else {
      setBuilderIntent("project");
    }
  };

  // Show wallet connect when intent is set but not connected
  if (builderIntent && !isWalletConnected) {
    return (
      <div className="w-full border-t pt-12 mt-12">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          <AndamioText className="text-lg font-semibold">
            {builderIntent === "course" ? "Create a Course" : "Launch a Project"}
          </AndamioText>
          <AndamioText variant="muted" className="mt-2">
            Connect your wallet to continue
          </AndamioText>

          <div className="mt-6 flex flex-col items-center gap-4">
            <CardanoWallet isDark={isDark} web3Services={WEB3_SERVICES_CONFIG} />
            <AndamioButton
              variant="ghost"
              size="sm"
              onClick={() => setBuilderIntent(null)}
            >
              <BackIcon className="mr-2 h-4 w-4" />
              Back
            </AndamioButton>
          </div>
        </div>
      </div>
    );
  }

  // Authenticating state
  if (builderIntent && isWalletConnected && isAuthenticating) {
    return (
      <div className="w-full border-t pt-12 mt-12">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          <AndamioText className="text-lg font-semibold">
            {builderIntent === "course" ? "Create a Course" : "Launch a Project"}
          </AndamioText>

          <div className="mt-6 flex flex-col items-center gap-4">
            <LoadingIcon className="h-6 w-6 animate-spin text-muted-foreground" />
            <AndamioText variant="muted">Signing in...</AndamioText>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border-t pt-12 mt-12">
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
        {/* Headline */}
        <AndamioText className="text-lg font-semibold">
          {copy.headline}
        </AndamioText>

        {/* Subtext */}
        <AndamioText variant="muted" className="mt-2">
          {copy.subtext}
        </AndamioText>

        {/* Builder CTAs */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <AndamioButton variant="secondary" onClick={handleCreateCourse}>
            <CourseIcon className="mr-2 h-4 w-4" />
            {copy.createCourse}
          </AndamioButton>
          <AndamioButton variant="secondary" onClick={handleLaunchProject}>
            <ProjectIcon className="mr-2 h-4 w-4" />
            {copy.launchProject}
          </AndamioButton>
        </div>
      </div>
    </div>
  );
}
