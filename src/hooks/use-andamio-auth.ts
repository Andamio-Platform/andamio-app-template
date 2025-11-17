/**
 * Re-export of useAndamioAuth hook from context
 *
 * This file maintains backward compatibility for existing imports.
 * The actual implementation now uses React Context for global state management.
 *
 * @deprecated Import directly from "~/contexts/andamio-auth-context" for new code
 */
export { useAndamioAuth } from "~/contexts/andamio-auth-context";
