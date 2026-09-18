import { createFileRoute } from "@tanstack/react-router";
import UsersPage from "@/Pages/Users/UsersPage";

export const Route = createFileRoute("/_authenticated/dashboard/users")({
  head: () => ({
    meta: [{ title: "Users & Roles · PharmaHub" }],
  }),
  component: UsersPage,
});
