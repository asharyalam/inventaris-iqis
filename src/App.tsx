import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { SessionContextProvider } from "./components/SessionContextProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import UserManagement from "./pages/UserManagement";
import AdminReturnRequests from "./pages/AdminReturnRequests";
import AdminBorrowRequests from "./pages/AdminBorrowRequests";
import AdminConsumableRequests from "./pages/AdminConsumableRequests"; // Import new admin consumable requests page
import ItemManagement from "./pages/ItemManagement";
import AdminPageLayout from "./components/AdminPageLayout";

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
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Index />} />
              
              {/* Admin routes wrapped by AdminPageLayout */}
              <Route element={<AdminPageLayout />}>
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/return-requests" element={<AdminReturnRequests />} />
                <Route path="/admin/borrow-requests" element={<AdminBorrowRequests />} />
                <Route path="/admin/consumable-requests" element={<AdminConsumableRequests />} /> {/* New admin route */}
                <Route path="/admin/items" element={<ItemManagement />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;