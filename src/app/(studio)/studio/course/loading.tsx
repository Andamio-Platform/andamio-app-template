import { AndamioPageLoading } from "~/components/andamio";

/**
 * Loading state for studio course management.
 * Shows a cards skeleton matching the owned courses layout.
 */
export default function StudioCourseLoading() {
  return <AndamioPageLoading variant="cards" itemCount={4} />;
}
