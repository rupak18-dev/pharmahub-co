import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES, ROLE_DEFAULT_ROUTES } from '../constants/roles';

import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

import Login from '../pages/auth/Login';
import DashboardLayout from '../layouts/DashboardLayout';

import OwnerDashboard from '../pages/dashboard/OwnerDashboard';
import BranchManagerDashboard from '../pages/dashboard/BranchManagerDashboard';
import PharmacistDashboard from '../pages/dashboard/PharmacistDashboard';
import CashierDashboard from '../pages/dashboard/CashierDashboard';

// Inventory Sub-Module Pages
import Inventory from '../pages/inventory/Inventory';
import Medicines from '../pages/inventory/Medicines';
import MedicineDetails from '../pages/inventory/MedicineDetails';
import Categories from '../pages/inventory/Categories';
import Manufacturers from '../pages/inventory/Manufacturers';
import Batches from '../pages/inventory/Batches';
import Expiry from '../pages/inventory/Expiry';
import LowStock from '../pages/inventory/LowStock';
import StockAdjustment from '../pages/inventory/StockAdjustment';
import BarcodeManagement from '../pages/inventory/BarcodeManagement';

// POS Billing & Sales Sub-Module Pages
import BillingDashboard from '../pages/sales/BillingDashboard';
import NewSale from '../pages/sales/NewSale';
import SalesHistory from '../pages/sales/SalesHistory';
import InvoiceDetails from '../pages/sales/InvoiceDetails';
import SalesReturns from '../pages/sales/SalesReturns';
import HoldBills from '../pages/sales/HoldBills';
import DraftBills from '../pages/sales/DraftBills';
import PaymentHistory from '../pages/sales/PaymentHistory';

// Purchase & Supplier Management Sub-Module Pages
import Suppliers from '../pages/purchases/Suppliers';
import SupplierDetails from '../pages/purchases/SupplierDetails';
import PurchaseOrders from '../pages/purchases/PurchaseOrders';
import NewPurchase from '../pages/purchases/NewPurchase';
import PurchaseHistory from '../pages/purchases/PurchaseHistory';
import PurchaseReturns from '../pages/purchases/PurchaseReturns';
import GoodsReceivedNote from '../pages/purchases/GoodsReceivedNote';
import PriceComparison from '../pages/purchases/PriceComparison';
import PendingOrders from '../pages/purchases/PendingOrders';

// Customer, CRM & Prescription Sub-Module Pages
import Customers from '../pages/customers/Customers';
import CustomerDetails from '../pages/customers/CustomerDetails';
import AddCustomer from '../pages/customers/AddCustomer';
import CustomerWallet from '../pages/customers/CustomerWallet';
import LoyaltyProgram from '../pages/customers/LoyaltyProgram';
import PrescriptionManagement from '../pages/customers/PrescriptionManagement';
import PrescriptionDetails from '../pages/customers/PrescriptionDetails';
import CreditCustomers from '../pages/customers/CreditCustomers';
import CustomerTimeline from '../pages/customers/CustomerTimeline';
import RefillReminder from '../pages/customers/RefillReminder';
import CommunicationCenter from '../pages/customers/CommunicationCenter';

// Reports & Analytics Sub-Module Pages
import ReportsHome from '../pages/reports/ReportsHome';
import DashboardAnalytics from '../pages/reports/DashboardAnalytics';
import SalesReports from '../pages/reports/SalesReports';
import PurchaseReports from '../pages/reports/PurchaseReports';
import InventoryReports from '../pages/reports/InventoryReports';
import ProfitLoss from '../pages/reports/ProfitLoss';
import GstReports from '../pages/reports/GstReports';
import ExpiryReports from '../pages/reports/ExpiryReports';
import LowStockReports from '../pages/reports/LowStockReports';
import CustomerReports from '../pages/reports/CustomerReports';
import SupplierReports from '../pages/reports/SupplierReports';
import ReportBuilder from '../pages/reports/ReportBuilder';

// Smart Notification & Action Center Sub-Module Pages
import NotificationCenter from '../pages/notifications/NotificationCenter';
import ActivityTimelinePage from '../pages/notifications/ActivityTimelinePage';
import TasksPage from '../pages/notifications/TasksPage';
import ApprovalsPage from '../pages/notifications/ApprovalsPage';
import SmartAlertsPage from '../pages/notifications/SmartAlertsPage';
import ReminderCenterPage from '../pages/notifications/ReminderCenterPage';

// Multi-Branch & Warehouse Management Sub-Module Pages
import Branches from '../pages/branches/Branches';
import BranchDetails from '../pages/branches/BranchDetails';
import BranchDashboard from '../pages/branches/BranchDashboard';
import WarehouseManagement from '../pages/branches/WarehouseManagement';
import WarehouseDetails from '../pages/branches/WarehouseDetails';
import StockTransfer from '../pages/branches/StockTransfer';
import TransferHistory from '../pages/branches/TransferHistory';
import CentralInventory from '../pages/branches/CentralInventory';
import BranchComparison from '../pages/branches/BranchComparison';
import BranchPerformance from '../pages/branches/BranchPerformance';

// AI Assistant & Settings final modules
import AiAssistant from '../pages/ai/AiAssistant';
import Settings from '../pages/settings/Settings';

// Settings sub-pages
import CompanyProfile from '../pages/settings/CompanyProfile';
import BranchSettings from '../pages/settings/BranchSettings';
import InvoiceSettings from '../pages/settings/InvoiceSettings';
import GstSettings from '../pages/settings/GstSettings';
import FinancialYear from '../pages/settings/FinancialYear';
import NumberSeries from '../pages/settings/NumberSeries';
import PaymentMethods from '../pages/settings/PaymentMethods';
import NotificationSettings from '../pages/settings/NotificationSettings';
import ThemeBranding from '../pages/settings/ThemeBranding';
import BackupRestore from '../pages/settings/BackupRestore';
import ImportExport from '../pages/settings/ImportExport';
import AuditSettings from '../pages/settings/AuditSettings';

// Enterprise User, Role & Permission Management Pages
import Users from '../pages/users/Users';
import UserDetails from '../pages/users/UserDetails';
import CreateUser from '../pages/users/CreateUser';
import Roles from '../pages/users/Roles';
import RoleDetails from '../pages/users/RoleDetails';
import CreateRole from '../pages/users/CreateRole';
import PermissionMatrix from '../pages/users/PermissionMatrix';
import Departments from '../pages/users/Departments';
import Designation from '../pages/users/Designation';
import ActivityLogs from '../pages/users/ActivityLogs';
import LoginSessions from '../pages/users/LoginSessions';

// Helper component for /dashboard root index redirect
const DashboardIndexRedirect = () => {
  const { user } = useAuth();
  const target = user?.role ? ROLE_DEFAULT_ROUTES[user.role] : '/dashboard/owner';
  return <Navigate to={target} replace />;
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardIndexRedirect />} />

        <Route
          path="owner"
          element={
            <RoleRoute allowedRoles={[ROLES.OWNER, ROLES.INVENTORY_MANAGER, ROLES.PURCHASE_MANAGER, ROLES.ACCOUNTS_MANAGER, ROLES.DELIVERY_STAFF, ROLES.SUPPLIER]}>
              <OwnerDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="manager"
          element={
            <RoleRoute allowedRoles={[ROLES.OWNER, ROLES.BRANCH_MANAGER]}>
              <BranchManagerDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="pharmacist"
          element={
            <RoleRoute allowedRoles={[ROLES.OWNER, ROLES.PHARMACIST]}>
              <PharmacistDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="cashier"
          element={
            <RoleRoute allowedRoles={[ROLES.OWNER, ROLES.CASHIER]}>
              <CashierDashboard />
            </RoleRoute>
          }
        />

        {/* Medicine & Inventory Sub-Module Routes */}
        <Route path="inventory" element={<Inventory />} />
        <Route path="inventory/medicines" element={<Medicines />} />
        <Route path="inventory/medicines/:id" element={<MedicineDetails />} />
        <Route path="inventory/categories" element={<Categories />} />
        <Route path="inventory/manufacturers" element={<Manufacturers />} />
        <Route path="inventory/batches" element={<Batches />} />
        <Route path="inventory/expiry" element={<Expiry />} />
        <Route path="inventory/low-stock" element={<LowStock />} />
        <Route path="inventory/adjustment" element={<StockAdjustment />} />
        <Route path="inventory/barcodes" element={<BarcodeManagement />} />

        {/* POS Billing & Sales Sub-Module Routes */}
        <Route path="billing" element={<BillingDashboard />} />
        <Route path="billing/pos" element={<NewSale />} />
        <Route path="billing/history" element={<SalesHistory />} />
        <Route path="billing/invoices/:id" element={<InvoiceDetails />} />
        <Route path="billing/returns" element={<SalesReturns />} />
        <Route path="billing/hold" element={<HoldBills />} />
        <Route path="billing/drafts" element={<DraftBills />} />
        <Route path="billing/payments" element={<PaymentHistory />} />

        {/* Purchase & Supplier Management Sub-Module Routes */}
        <Route path="purchases" element={<PurchaseOrders />} />
        <Route path="purchases/suppliers" element={<Suppliers />} />
        <Route path="purchases/suppliers/:id" element={<SupplierDetails />} />
        <Route path="purchases/orders" element={<PurchaseOrders />} />
        <Route path="purchases/new" element={<NewPurchase />} />
        <Route path="purchases/history" element={<PurchaseHistory />} />
        <Route path="purchases/returns" element={<PurchaseReturns />} />
        <Route path="purchases/grn" element={<GoodsReceivedNote />} />
        <Route path="purchases/price-comparison" element={<PriceComparison />} />
        <Route path="purchases/pending" element={<PendingOrders />} />

        {/* Customer, CRM & Prescription Sub-Module Routes */}
        <Route path="customers" element={<Customers />} />
        <Route path="customers/new" element={<AddCustomer />} />
        <Route path="customers/wallet" element={<CustomerWallet />} />
        <Route path="customers/loyalty" element={<LoyaltyProgram />} />
        <Route path="customers/prescriptions" element={<PrescriptionManagement />} />
        <Route path="customers/prescriptions/:id" element={<PrescriptionDetails />} />
        <Route path="customers/credit" element={<CreditCustomers />} />
        <Route path="customers/timeline" element={<CustomerTimeline />} />
        <Route path="customers/refills" element={<RefillReminder />} />
        <Route path="customers/communication" element={<CommunicationCenter />} />
        <Route path="customers/:id" element={<CustomerDetails />} />

        {/* Reports & Analytics Sub-Module Routes */}
        <Route path="reports" element={<ReportsHome />} />
        <Route path="reports/analytics" element={<DashboardAnalytics />} />
        <Route path="reports/sales" element={<SalesReports />} />
        <Route path="reports/purchases" element={<PurchaseReports />} />
        <Route path="reports/inventory" element={<InventoryReports />} />
        <Route path="reports/profit-loss" element={<ProfitLoss />} />
        <Route path="reports/gst" element={<GstReports />} />
        <Route path="reports/expiry" element={<ExpiryReports />} />
        <Route path="reports/low-stock" element={<LowStockReports />} />
        <Route path="reports/customers" element={<CustomerReports />} />
        <Route path="reports/suppliers" element={<SupplierReports />} />
        <Route path="reports/builder" element={<ReportBuilder />} />

        {/* Smart Notification & Action Center Sub-Module Routes */}
        <Route path="notifications" element={<NotificationCenter />} />
        <Route path="notifications/timeline" element={<ActivityTimelinePage />} />
        <Route path="notifications/tasks" element={<TasksPage />} />
        <Route path="notifications/approvals" element={<ApprovalsPage />} />
        <Route path="notifications/alerts" element={<SmartAlertsPage />} />
        <Route path="notifications/reminders" element={<ReminderCenterPage />} />

        {/* Multi-Branch & Warehouse Management Sub-Module Routes */}
        <Route path="branches" element={<Branches />} />
        <Route path="branches/dashboard" element={<BranchDashboard />} />
        <Route path="branches/comparison" element={<BranchComparison />} />
        <Route path="branches/performance" element={<BranchPerformance />} />
        <Route path="branches/:id" element={<BranchDetails />} />
        <Route path="warehouses" element={<WarehouseManagement />} />
        <Route path="warehouses/:id" element={<WarehouseDetails />} />
        <Route path="transfers" element={<TransferHistory />} />
        <Route path="transfers/new" element={<StockTransfer />} />
        <Route path="inventory/central" element={<CentralInventory />} />

        {/* AI Assistant & Settings final routes */}
        <Route path="ai-assistant" element={<AiAssistant />} />
        
        {/* Settings Sub-Module Routes */}
        <Route path="settings" element={<Settings />} />
        <Route path="settings/profile" element={<CompanyProfile />} />
        <Route path="settings/branches" element={<BranchSettings />} />
        <Route path="settings/invoices" element={<InvoiceSettings />} />
        <Route path="settings/gst" element={<GstSettings />} />
        <Route path="settings/financial-year" element={<FinancialYear />} />
        <Route path="settings/number-series" element={<NumberSeries />} />
        <Route path="settings/payments" element={<PaymentMethods />} />
        <Route path="settings/notifications" element={<NotificationSettings />} />
        <Route path="settings/theme" element={<ThemeBranding />} />
        <Route path="settings/backup" element={<BackupRestore />} />
        <Route path="settings/import-export" element={<ImportExport />} />
        <Route path="settings/audit" element={<AuditSettings />} />

        {/* Enterprise User, Role & Permission Management routes */}
        <Route path="users" element={<Users />} />
        <Route path="users/new" element={<CreateUser />} />
        <Route path="users/:id" element={<UserDetails />} />
        <Route path="roles" element={<Roles />} />
        <Route path="roles/new" element={<CreateRole />} />
        <Route path="roles/:id" element={<RoleDetails />} />
        <Route path="permissions" element={<PermissionMatrix />} />
        <Route path="departments" element={<Departments />} />
        <Route path="designations" element={<Designation />} />
        <Route path="activity-logs" element={<ActivityLogs />} />
        <Route path="sessions" element={<LoginSessions />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
