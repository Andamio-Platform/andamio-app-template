/**
 * Andamio wrapper for shadcn/ui Card
 *
 * Re-exports all Card components with consistent naming.
 *
 * Usage:
 * import { AndamioCard, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio";
 */

// Re-export all card components
export {
  Card as AndamioCard,
  CardHeader as AndamioCardHeader,
  CardFooter as AndamioCardFooter,
  CardTitle as AndamioCardTitle,
  CardDescription as AndamioCardDescription,
  CardContent as AndamioCardContent,
} from "~/components/ui/card";
