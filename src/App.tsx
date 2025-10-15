import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import ConsumableRequestsPage from "./pages/ConsumableRequestsPage";
import BorrowRequestsPage from "./pages/BorrowRequestsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Unauthorized from "./pages/Unauthorized";
import { SessionContextProvider } from "./components/SessionContextProvider";
import ItemList from "./components/ItemList";
import ReturnRequestsAdminPage from "./pages/ReturnRequestsAdminPage";
import BorrowRequestsAdminProcessingPage from "./pages/BorrowRequestsAdminProcessingPage"; // Renamed/updated
import ConsumableRequestsAdminProcessingPage from "./pages/ConsumableRequestsAdminProcessingPage"; // New
import UserManagementPage from "./pages/UserManagementPage";
import AddItemForm from "./components/AddItemForm";
import KepalaSekolahDashboard from "./pages/KepalaSekolahDashboard"; // New
import ConsumableRequestsHeadmasterApprovalPage from "./pages/ConsumableRequestsHeadmasterApprovalPage"; // New
import BorrowRequestsHeadmasterApprovalPage from "./pages/BorrowRequestsHeadmasterApprovalPage"; // New
import ReturnRequestsPage from "./pages/ReturnRequestsPage"; // New user return page

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Public/Redirected Route */}
            <Route path="/" element={<Index />} />

            {/* Protected User Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Pengguna', 'Admin', 'Kepala Sekolah']} />}>
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/consumable-requests" element={<ConsumableRequestsPage />} />
              <Route path="/borrow-requests" element={<BorrowRequestsPage />} />
              <Route path="/return-requests" element={<ReturnRequestsPage />} /> {/* New user return page */}
            </Route>

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/items" element={<ItemList />} />
              <Route path="/admin/add-item" element={<AddItemForm />} />
              <Route path="/admin/consumable-processing" element={<ConsumableRequestsAdminProcessingPage />} /> {/* New admin processing page */}
              <Route path="/admin/borrow-processing" element={<BorrowRequestsAdminProcessingPage />} /> {/* Updated admin processing page */}
              <Route path="/admin/return-requests" element={<ReturnRequestsAdminPage />} /> {/* Admin return processing */}
              <Route path="/admin/users" element={<UserManagementPage />} />
            </Route>

            {/* Protected Headmaster Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Kepala Sekolah']} />}>
              <Route path="/headmaster/dashboard" element={<KepalaSekolahDashboard />} /> {/* New Headmaster dashboard */}
              <Route path="/headmaster/consumable-approvals" element={<ConsumableRequestsHeadmasterApprovalPage />} /> {/* New Headmaster approval page */}
              <Route path="/headmaster/borrow-approvals" element={<BorrowRequestsHeadmasterApprovalPage />} /> {/* New Headmaster approval page */}
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;