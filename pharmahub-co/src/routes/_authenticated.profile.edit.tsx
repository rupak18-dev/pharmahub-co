import { createFileRoute } from "@tanstack/react-router";
import EditProfilePage from "@/Pages/Profile/EditProfilePage";

export const Route = createFileRoute("/_authenticated/profile/edit")({
  head: () => ({
    meta: [{ title: "Edit Profile · PharmaHub" }],
  }),
  component: EditProfilePage,
});
