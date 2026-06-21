import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useNotifications } from "@/hooks/useNotifications";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { AppLayout } from "@/components/AppLayout";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Expenses from "./pages/Expenses";
import Savings from "./pages/Savings";
import Income from "./pages/Income";
import Habits from "./pages/Habits";
import Goals from "./pages/Goals";
import Analytics from "./pages/Analytics";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-8 w-8 border-2 border-silver border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AuthedApp() {
  const { needsOnboarding, isLoading } = useUserPreferences();
  const location = useLocation();

  useNotifications();

  if (isLoading) return <LoadingScreen />;
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/despesas" element={<Expenses />} />
        <Route path="/economia" element={<Savings />} />
        <Route path="/receber" element={<Income />} />
        <Route path="/habitos" element={<Habits />} />
        <Route path="/metas" element={<Goals />} />
        <Route path="/analises" element={<Analytics />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

function RootGate() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Landing />;
  return <AuthedApp />;
}

function ProtectedShell() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  return <AuthedApp />;
}

function OnboardingRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  return <Onboarding />;
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <ThemeProvider
    attribute="class"
    defaultTheme="dark"
    enableSystem
    disableTransitionOnChange={false}
    storageKey="painel-theme"
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<AuthRoute />} />
              <Route path="/onboarding" element={<OnboardingRoute />} />
              <Route path="/" element={<RootGate />} />
              <Route path="/*" element={<ProtectedShell />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
