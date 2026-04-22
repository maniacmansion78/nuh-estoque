 import { lazy, Suspense } from "react";
 import { Toaster } from "@/components/ui/toaster";
 import { Toaster as Sonner } from "@/components/ui/sonner";
 import { TooltipProvider } from "@/components/ui/tooltip";
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
 import { AuthProvider, useAuth } from "@/contexts/AuthContext";
 import { AppLayout } from "@/components/AppLayout";
 
 // Lazy load pages for better performance
 const Dashboard = lazy(() => import("@/pages/Dashboard"));
 const FichasTecnicas = lazy(() => import("@/pages/FichasTecnicas"));
 const AlterarSenha = lazy(() => import("@/pages/AlterarSenha"));
 const ContaBloqueada = lazy(() => import("@/pages/ContaBloqueada"));
 const Produtos = lazy(() => import("@/pages/Produtos"));
 const Fornecedores = lazy(() => import("@/pages/Fornecedores"));
 const Movimentacoes = lazy(() => import("@/pages/Movimentacoes"));
 const SaidaPratos = lazy(() => import("@/pages/SaidaPratos"));
 const RelatorioMovimentacoes = lazy(() => import("@/pages/RelatorioMovimentacoes"));
 const Funcionarios = lazy(() => import("@/pages/Funcionarios"));
 const NaoConformidadesPage = lazy(() => import("@/pages/NaoConformidades"));
 const Manual = lazy(() => import("@/pages/Manual"));
 const Login = lazy(() => import("@/pages/Login"));
 const ScriptVenda = lazy(() => import("@/pages/ScriptVenda"));
 const Banners = lazy(() => import("@/pages/Banners"));
 const FichasTecnicasInfo = lazy(() => import("@/pages/FichasTecnicasInfo"));
 const Manual2 = lazy(() => import("@/pages/Manual2"));
 const Proposta = lazy(() => import("@/pages/Proposta"));
 const NotFound = lazy(() => import("./pages/NotFound"));
 
 const queryClient = new QueryClient({
   defaultOptions: {
     queries: {
       staleTime: 1000 * 60 * 5, // 5 minutes
       gcTime: 1000 * 60 * 30, // 30 minutes
       retry: 1,
       refetchOnWindowFocus: false,
     },
   },
 });
 
 const PageLoader = () => (
   <div className="flex min-h-[60vh] items-center justify-center">
     <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
   </div>
 );

function ProtectedRoute({ children, adminOnly = false, allowTempPassword = false, allowBlocked = false }: { children: React.ReactNode; adminOnly?: boolean; allowTempPassword?: boolean; allowBlocked?: boolean }) {
  const { user, isAdmin, loading, tempPassword, blocked } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (blocked && !allowBlocked) return <Navigate to="/conta-bloqueada" replace />;
  if (tempPassword && !allowTempPassword) return <Navigate to="/alterar-senha" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route
        path="/conta-bloqueada"
        element={
          <ProtectedRoute allowBlocked>
            <ContaBloqueada />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alterar-senha"
        element={
          <ProtectedRoute allowTempPassword>
            <AlterarSenha />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/fichas-tecnicas"
        element={
          <ProtectedRoute>
            <AppLayout>
              <FichasTecnicas />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/produtos"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Produtos />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/fornecedores"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Fornecedores />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/saida-pratos"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SaidaPratos />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/movimentacoes"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Movimentacoes />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/relatorio"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RelatorioMovimentacoes />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/nao-conformidades"
        element={
          <ProtectedRoute>
            <AppLayout>
              <NaoConformidadesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/funcionarios"
        element={
          <ProtectedRoute adminOnly>
            <AppLayout>
              <Funcionarios />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manual"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Manual />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/demo" element={<Navigate to="/login" replace />} />
      <Route path="/fichas-tecnicas-info" element={<FichasTecnicasInfo />} />
      <Route path="/manual2" element={<Manual2 />} />
      <Route path="/script-venda" element={<ScriptVenda />} />
      <Route path="/banners" element={<Banners />} />
      <Route path="/proposta" element={<Proposta />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
