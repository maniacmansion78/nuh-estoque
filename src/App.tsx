import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import FichasTecnicas from "@/pages/FichasTecnicas";
import AlterarSenha from "@/pages/AlterarSenha";
import ContaBloqueada from "@/pages/ContaBloqueada";
import Produtos from "@/pages/Produtos";
import Fornecedores from "@/pages/Fornecedores";
import Movimentacoes from "@/pages/Movimentacoes";
import SaidaPratos from "@/pages/SaidaPratos";
import RelatorioMovimentacoes from "@/pages/RelatorioMovimentacoes";
import Funcionarios from "@/pages/Funcionarios";
import NaoConformidadesPage from "@/pages/NaoConformidades";
import Manual from "@/pages/Manual";
import Login from "@/pages/Login";
import ScriptVenda from "@/pages/ScriptVenda";

import Banners from "@/pages/Banners";
import FichasTecnicasInfo from "@/pages/FichasTecnicasInfo";
import Manual2 from "@/pages/Manual2";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false, allowTempPassword = false, allowBlocked = false }: { children: React.ReactNode; adminOnly?: boolean; allowTempPassword?: boolean; allowBlocked?: boolean }) {
  const { user, isAdmin, loading, tempPassword, blocked } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
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
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
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
