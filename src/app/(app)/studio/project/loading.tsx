import { AndamioPageLoading } from "~/components/andamio";

/**
 * Loading state for studio project management.
 * Shows a table skeleton matching the projects list layout.
 */
export default function StudioProjectLoading() {
  return <AndamioPageLoading variant="table" itemCount={5} />;
}
