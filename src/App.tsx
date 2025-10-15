import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login"; // Import Login page
import { SessionContextProvider } from "./components/SessionContextProvider"; // Import SessionContextProvider
import ProtectedRoute from "./components/ProtectedRoute"; // Import ProtectedRoute
import UserManagement from "./pages/UserManagement"; // Import UserManagement

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider> {/* Wrap the app with SessionContextProvider */}
          <Routes>
            <Route path="/login" element={<Login />} /> {/* Add Login route */}
            <Route element={<ProtectedRoute />}> {/* Protect main routes */}
              <Route path="/" element={<Index />} />
              <Route path="/admin/users" element={<UserManagement />} /> {/* Add User Management route */}
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