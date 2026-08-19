import { createBrowserRouter } from "react-router";
import { AppRoot, AppRootErrorBoundary } from "@/Components/shared/AppRoot";
import AppLayout from "@/Components/shared/AppLayout";
import { FullScreenSkeleton } from "@/Components/shared/PageSkeleton";

const lazyPage = (loader) => () =>
  loader().then((mod) => ({ Component: mod.default, handle: mod.handle }));

export const router = createBrowserRouter([
  {
    Component: AppRoot,
    HydrateFallback: () => <FullScreenSkeleton />,
    ErrorBoundary: AppRootErrorBoundary,
    HydrateFallback: () => (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    ),
    children: [
      { path: "/", lazy: lazyPage(() => import("@/Pages/Landing/LandingPage")) },
      { path: "/login", lazy: lazyPage(() => import("@/Pages/Auth/LoginPage")) },
      { path: "/signup", lazy: lazyPage(() => import("@/Pages/Auth/SignupPage")) },
      {
        path: "/auth/callback",
        lazy: lazyPage(() => import("@/Pages/Auth/GoogleCallbackPage")),
      },
      {
        path: "/verify-email",
        lazy: lazyPage(() => import("@/Pages/Auth/VerifyEmailPage")),
      },
      { path: "/onboarding", lazy: lazyPage(() => import("@/Pages/Onboarding/OnboardingPage")) },
      {
        path: "/forgot-password",
        lazy: lazyPage(() => import("@/Pages/Auth/ForgotPasswordPage")),
      },
      {
        path: "/auth/demo-login",
        lazy: lazyPage(() => import("@/Pages/Auth/DemoLoginPage")),
      },
      {
        path: "/accept-invitation",
        lazy: lazyPage(() => import("@/Pages/Auth/AcceptInvitationPage")),
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
          {
            path: "/reports/data",
            lazy: lazyPage(() => import("@/Pages/Reports/data/ReportDataPage")),
          },
          { path: "/users", lazy: lazyPage(() => import("@/Pages/Users/UsersPage")) },
          { path: "/ai", lazy: lazyPage(() => import("@/Pages/AI/AiAssistantPage")) },
          {
            path: "/notifications",
            lazy: lazyPage(() => import("@/Pages/Notifications/NotificationsPage")),
          },
          { path: "/admin", lazy: lazyPage(() => import("@/Pages/Profile/ProfilePage")) },
          { path: "/profile", lazy: lazyPage(() => import("@/Pages/Profile/ProfilePage")) },
          {
            path: "/profile/edit",
            lazy: lazyPage(() => import("@/Pages/Profile/EditProfilePage")),
          },
          {
            path: "/integrations",
            lazy: lazyPage(() => import("@/Pages/Integrations/IntegrationsPage")),
          },
        ],
      },
    ],
  },
]);
