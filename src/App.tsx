import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import HomePage from "@/pages/HomePage";
import CadastroPage from "@/pages/CadastroPage";
import BancoPage from "@/pages/BancoPage";
import AssessmentsPage from "@/pages/AssessmentsPage";
import PedagogicalPage from "@/pages/PedagogicalPage";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";
import UsersPage from "@/pages/UsersPage";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 5_000 },
  },
});

function ProtectedRoute({ component: Component, requiredRole }: { component: any, requiredRole?: 'admin' | 'user' }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    // If a specific role is required and the user doesn't have it (and isn't admin)
    setLocation("/");
    return null;
  }

  return <Component />;
}

function Router() {
  const { user, loading } = useAuth();

  if (loading) return null; // Avoid flashing layout

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      
      {/* Protected Routes Wrapped in AppLayout */}
      <Route path="/.*">
        {user ? (
          <AppLayout>
            <Switch>
              <Route path="/" component={() => <ProtectedRoute component={HomePage} />} />
              <Route path="/cadastro" component={() => <ProtectedRoute component={CadastroPage} />} />
              <Route path="/banco" component={() => <ProtectedRoute component={BancoPage} />} />
              <Route path="/avaliacoes" component={() => <ProtectedRoute component={AssessmentsPage} />} />
              
              {/* Admin Only Routes */}
              <Route path="/pedagogico" component={() => <ProtectedRoute component={PedagogicalPage} requiredRole="admin" />} />
              <Route path="/pedagogico/:tab" component={() => <ProtectedRoute component={PedagogicalPage} requiredRole="admin" />} />
              <Route path="/usuarios" component={() => <ProtectedRoute component={UsersPage} requiredRole="admin" />} />
              
              <Route component={NotFound} />
            </Switch>
          </AppLayout>
        ) : (
          <Route component={() => <ProtectedRoute component={HomePage} />} /> // Will trigger redirect
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
        <SonnerToaster richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
