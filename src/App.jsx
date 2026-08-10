import { createBrowserRouter } from "react-router";
import { AppRoot, AppRootErrorBoundary } from "@/Components/shared/AppRoot";
import AppLayout from "@/Components/shared/AppLayout";

const lazyPage = (loader) => () =>
  loader().then((mod) => ({ Component: mod.default, handle: mod.handle }));

export const router = createBrowserRouter([
  {
    Component: AppRoot,
    ErrorBoundary: AppRootErrorBoundary,
    children: [
      { path: "/", lazy: lazyPage(() => import("@/Pages/Landing/LandingPage")) },
      { path: "/login", lazy: lazyPage(() => import("@/Pages/Auth/LoginPage")) },
      { path: "/signup", lazy: lazyPage(() => import("@/Pages/Auth/SignupPage")) },
      {
        path: "/forgot-password",
        lazy: lazyPage(() => import("@/Pages/Auth/ForgotPasswordPage")),
      },
      {
        Component: AppLayout,
        children: [
          {
            path: "/dashboard",
            lazy: lazyPage(() => import("@/Pages/Dashboard/DashboardHomePage")),
          },
          {
            path: "/medicines",
            lazy: lazyPage(() => import("@/Pages/Medicines/MedicinesStorePage")),
          },
          {
            path: "/medicines/catalog",
            lazy: lazyPage(() => import("@/Pages/Medicines/MedicinesCatalogPage")),
          },
          {
            path: "/medicines/categories",
            lazy: lazyPage(() => import("@/Pages/Medicines/CategoriesPage")),
          },
          {
            path: "/medicines/manufacturers",
            lazy: lazyPage(() => import("@/Pages/Medicines/ManufacturersPage")),
          },
          {
            path: "/medicines/:medicineId",
            lazy: lazyPage(() => import("@/Pages/Medicines/MedicineDetailPage")),
          },
          { path: "/batches", lazy: lazyPage(() => import("@/Pages/Batches/BatchesPage")) },
          {
            path: "/batches/:batchId",
            lazy: lazyPage(() => import("@/Pages/Batches/BatchDetailPage")),
          },
          { path: "/sales", lazy: lazyPage(() => import("@/Pages/Sales/SalesPage")) },
          { path: "/sales/:saleId", lazy: lazyPage(() => import("@/Pages/Sales/SaleDetailPage")) },
          { path: "/purchases", lazy: lazyPage(() => import("@/Pages/Purchases/PurchasesPage")) },
          { path: "/shortbook", lazy: lazyPage(() => import("@/Pages/Shortbook/ShortbookPage")) },
          { path: "/inventory", lazy: lazyPage(() => import("@/Pages/Inventory/InventoryPage")) },
          { path: "/expiry", lazy: lazyPage(() => import("@/Pages/Expiry/ExpiryPage")) },
          { path: "/audit", lazy: lazyPage(() => import("@/Pages/Audit/AuditPage")) },
          { path: "/reports", lazy: lazyPage(() => import("@/Pages/Reports/ReportsPage")) },
          { path: "/users", lazy: lazyPage(() => import("@/Pages/Users/UsersPage")) },
          { path: "/ai", lazy: lazyPage(() => import("@/Pages/AI/AiAssistantPage")) },
          {
            path: "/notifications",
            lazy: lazyPage(() => import("@/Pages/Notifications/NotificationsPage")),
          },
          { path: "/admin", lazy: lazyPage(() => import("@/Pages/Admin/AdminPage")) },
          {
            path: "/integrations",
            lazy: lazyPage(() => import("@/Pages/Integrations/IntegrationsPage")),
          },
        ],
      },
    ],
  },
]);
