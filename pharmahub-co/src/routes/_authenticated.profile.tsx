import { createFileRoute } from "@tanstack/react-router";
import ProfilePage from "@/Pages/Profile/ProfilePage";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [{ title: "Profile · PharmaHub" }],
  }),
  component: ProfilePage,
});
