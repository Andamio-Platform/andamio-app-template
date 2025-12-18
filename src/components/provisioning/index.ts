/**
 * Provisioning Components
 *
 * Components and hooks for the "mint first" provisioning UX pattern.
 * Used when creating Courses, Projects, or other blockchain-first entities.
 *
 * @example
 * ```tsx
 * import {
 *   ProvisioningOverlay,
 *   useProvisioningState,
 *   type ProvisioningConfig,
 * } from "~/components/provisioning";
 *
 * function CreateCourseDialog() {
 *   const [provisioningConfig, setProvisioningConfig] = useState<ProvisioningConfig | null>(null);
 *   const { currentStep, navigateToEntity, isProvisioning } = useProvisioningState(
 *     provisioningConfig
 *   );
 *
 *   const handleTransactionSuccess = (result: { txHash: string }) => {
 *     setProvisioningConfig({
 *       entityType: "course",
 *       entityId: courseNftPolicyId,
 *       txHash: result.txHash,
 *       title: courseTitle,
 *       successRedirectPath: `/studio/course/${courseNftPolicyId}`,
 *     });
 *   };
 *
 *   if (isProvisioning) {
 *     return (
 *       <ProvisioningOverlay
 *         {...provisioningConfig!}
 *         currentStep={currentStep}
 *         onNavigate={navigateToEntity}
 *       />
 *     );
 *   }
 *
 *   return <CreateCourseForm onSuccess={handleTransactionSuccess} />;
 * }
 * ```
 */

// Types
export type {
  ProvisioningEntityType,
  ProvisioningStep,
  ProvisioningState,
  ProvisioningConfig,
  ProvisioningEntityDisplay,
} from "./types";

export { PROVISIONING_DISPLAY } from "./types";

// Components
export { ProvisioningOverlay } from "./provisioning-overlay";
export { ProvisioningStepIndicator } from "./provisioning-step-indicator";

// Hooks
export { useProvisioningState } from "./use-provisioning-state";
export type {
  UseProvisioningStateConfig,
  UseProvisioningStateReturn,
} from "./use-provisioning-state";
