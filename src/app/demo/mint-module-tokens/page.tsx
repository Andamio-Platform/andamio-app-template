/**
 * Demo Page: Mint Module Tokens
 *
 * Demonstrates the MintModuleTokens component powered by @andamio/transactions
 */

"use client";

import { MintModuleTokens } from "~/components/transactions";
import { AndamioCard, AndamioCardContent, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { useState } from "react";
import type { ListCourseModulesOutput } from "@andamio-platform/db-api";

export default function MintModuleTokensDemo() {
  const [courseNftPolicyId] = useState("c71808760701e702383fa4d4fc490e4bda0049fc0ced7c1631cbaca6");

  // Mock module data with SLTs (matches ListCourseModulesOutput type)
  const [modules] = useState<ListCourseModulesOutput>([
    {
      moduleCode: "MODULE_1",
      title: "Introduction to Blockchain",
      description: "Learn the fundamentals of blockchain technology",
      status: "APPROVED",
      moduleHash: null,
      pendingTxHash: null,
      slts: [
        { moduleIndex: 0, sltText: "Understand blockchain basics" },
        { moduleIndex: 1, sltText: "Explain consensus mechanisms" },
      ],
    },
    {
      moduleCode: "MODULE_2",
      title: "Smart Contracts Fundamentals",
      description: "Master smart contract development",
      status: "APPROVED",
      moduleHash: null,
      pendingTxHash: null,
      slts: [
        { moduleIndex: 0, sltText: "Write a basic smart contract" },
        { moduleIndex: 1, sltText: "Deploy and test contracts" },
      ],
    },
    {
      moduleCode: "MODULE_3",
      title: "Plutus Development",
      description: "Build dApps with Plutus",
      status: "APPROVED",
      moduleHash: null,
      pendingTxHash: null,
      slts: [
        { moduleIndex: 0, sltText: "Understand Plutus architecture" },
        { moduleIndex: 1, sltText: "Write Plutus validators" },
        { moduleIndex: 2, sltText: "Test on testnet" },
      ],
    },
  ]);

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Mint Module Tokens Demo</h1>
        <p className="text-muted-foreground">
          This demonstrates the AndamioTransaction component using the MINT_MODULE_TOKENS definition from @andamio/transactions
        </p>
      </div>

      {/* Demo Info Card */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>How It Works</AndamioCardTitle>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-3">
          <div>
            <p className="text-sm"><strong>1. Transaction Definition</strong></p>
            <p className="text-sm text-muted-foreground">
              The MINT_MODULE_TOKENS definition from @andamio/transactions contains:
            </p>
            <ul className="ml-4 mt-1 list-inside list-disc text-sm text-muted-foreground">
              <li>Protocol specification (YAML reference)</li>
              <li>Input schema validation (Zod)</li>
              <li>Build endpoint configuration</li>
              <li>UI metadata (title, description, button text)</li>
              <li>Side effects (onSubmitTx, onConfirmation)</li>
            </ul>
          </div>

          <div>
            <p className="text-sm"><strong>2. Generic Component</strong></p>
            <p className="text-sm text-muted-foreground">
              The AndamioTransaction component automatically:
            </p>
            <ul className="ml-4 mt-1 list-inside list-disc text-sm text-muted-foreground">
              <li>Validates inputs against the schema</li>
              <li>Renders UI from the definition</li>
              <li>Builds and executes the transaction</li>
              <li>Handles all transaction states</li>
              <li>Shows cost estimation</li>
            </ul>
          </div>

          <div>
            <p className="text-sm"><strong>3. Component Usage</strong></p>
            <p className="text-sm text-muted-foreground">
              The MintModuleTokens component uses the formatModuleInfosForMintModuleTokens helper:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-xs">
{`// Fetch modules with SLTs from API
const modules = await fetch(
  \`\${API_URL}/courses/\${courseId}/course-modules\`
).then(r => r.json());

<MintModuleTokens
  courseNftPolicyId="${courseNftPolicyId}"
  modules={modules} // ListCourseModulesOutput
  onSuccess={() => router.refresh()}
/>`}
            </pre>
          </div>
        </AndamioCardContent>
      </AndamioCard>

      {/* Live Transaction Component */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Live Transaction</h2>
        <MintModuleTokens
          courseNftPolicyId={courseNftPolicyId}
          modules={modules}
          onSuccess={() => {
            console.log("Modules minted successfully!");
            // In a real app: router.refresh() or refetch data
          }}
          onError={(error) => {
            console.error("Failed to mint modules:", error);
          }}
        />
      </div>

      {/* Current Configuration */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Current Configuration</AndamioCardTitle>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium">Course NFT Policy ID:</p>
            <p className="font-mono text-xs text-muted-foreground">{courseNftPolicyId}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Modules to Mint ({modules.length}):</p>
            <ul className="ml-4 mt-1 list-inside list-disc text-sm text-muted-foreground">
              {modules.map((module, idx) => (
                <li key={idx}>
                  <strong>{module.moduleCode}</strong>: {module.title} ({module.slts.length} SLTs)
                </li>
              ))}
            </ul>
          </div>
        </AndamioCardContent>
      </AndamioCard>

      {/* Benefits */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Benefits of This Approach</AndamioCardTitle>
        </AndamioCardHeader>
        <AndamioCardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span>✅</span>
              <span><strong>Single Source of Truth</strong>: Transaction definition lives in @andamio/transactions</span>
            </li>
            <li className="flex gap-2">
              <span>✅</span>
              <span><strong>Type Safety</strong>: Zod schemas ensure runtime validation matches TypeScript types</span>
            </li>
            <li className="flex gap-2">
              <span>✅</span>
              <span><strong>Consistency</strong>: All transactions use the same UI patterns and workflows</span>
            </li>
            <li className="flex gap-2">
              <span>✅</span>
              <span><strong>Maintainability</strong>: Update UI metadata in one place, affects all uses</span>
            </li>
            <li className="flex gap-2">
              <span>✅</span>
              <span><strong>Documentation</strong>: Links to protocol docs and API docs included</span>
            </li>
            <li className="flex gap-2">
              <span>✅</span>
              <span><strong>Protocol Alignment</strong>: Definitions reference YAML specs from andamio-docs</span>
            </li>
          </ul>
        </AndamioCardContent>
      </AndamioCard>
    </div>
  );
}
