import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/medicines/")({
  beforeLoad: () => {
    throw redirect({
      to: "/dashboard/medicines/catalog",
    });
  },
  component: () => null,
});
