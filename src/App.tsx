import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "@/context/AppContext";
import { QuotationsProvider } from "@/context/QuotationsContext";
import { BaseIngredientsProvider } from "@/context/BaseIngredientsContext";
import { LaborProvider } from "@/context/LaborContext";
import { IndirectCostsProvider } from "@/context/IndirectCostsContext";
import { InstallPrompt } from "@/components/InstallPrompt";
import { UpdatePopup } from "@/components/UpdatePopup";
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import CalculatorPage from "./pages/CalculatorPage";
import RecipesPage from "./pages/RecipesPage";
import OrdersPage from "./pages/OrdersPage";
import FinancesPage from "./pages/FinancesPage";
import QuotationsPage from "./pages/QuotationsPage";
import PersonalizationPage from "./pages/PersonalizationPage";
import IngredientsPage from "./pages/IngredientsPage";
import LaborPage from "./pages/LaborPage";
import IndirectCostsPage from "./pages/IndirectCostsPage";
import SettingsPage from "./pages/SettingsPage";
import HelpPage from "./pages/HelpPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Public Route wrapper (redirects to dashboard if logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><WelcomePage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/calculator" element={<ProtectedRoute><CalculatorPage /></ProtectedRoute>} />
      <Route path="/recipes" element={<ProtectedRoute><RecipesPage /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
      <Route path="/quotations" element={<ProtectedRoute><QuotationsPage /></ProtectedRoute>} />
      <Route path="/personalization" element={<ProtectedRoute><PersonalizationPage /></ProtectedRoute>} />
      <Route path="/ingredients" element={<ProtectedRoute><IngredientsPage /></ProtectedRoute>} />
      <Route path="/labor" element={<ProtectedRoute><LaborPage /></ProtectedRoute>} />
      <Route path="/indirect-costs" element={<ProtectedRoute><IndirectCostsPage /></ProtectedRoute>} />
      <Route path="/finances" element={<ProtectedRoute><FinancesPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <BaseIngredientsProvider>
          <LaborProvider>
            <IndirectCostsProvider>
              <QuotationsProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppRoutes />
                  <InstallPrompt />
                  <UpdatePopup />
                </BrowserRouter>
              </QuotationsProvider>
            </IndirectCostsProvider>
          </LaborProvider>
        </BaseIngredientsProvider>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
