import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/medicines")({
  component: MedicinesLayout,
});

function MedicinesLayout() {
  return <Outlet />;
}
