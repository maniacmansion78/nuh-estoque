import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Truck,
  ArrowLeftRight,
  Menu,
  X,
  Users,
  LogOut,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logoNuh from "@/assets/logo-nuh.jpeg";

const baseNavItems = [
  { to: "/dashboard", label: "Tela Inicial", icon: LayoutDashboard },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/movimentacoes", label: "Movimentações", icon: ArrowLeftRight },
  { to: "/fornecedores", label: "Fornecedores", icon: Truck },
  { to: "/nao-conformidades", label: "Não Conformidades", icon: AlertTriangle },
  { to: "/relatorio", label: "Relatório Mensal", icon: FileText },
];

const adminNavItems = [
  { to: "/funcionarios", label: "Funcionários", icon: Users },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { isAdmin, displayName, signOut } = useAuth();

  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  return (
    <div className="flex h-[100dvh] w-full max-w-full overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <img src={logoNuh} alt="NUH Logo" className="h-9 w-9 rounded-lg object-cover" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">NUH</h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/50">
              Controle de Estoque
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-sidebar-foreground lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4 space-y-2">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {displayName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{displayName || "Usuário"}</p>
              <p className="text-xs text-sidebar-foreground/50">{isAdmin ? "Admin" : "Funcionário"}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sidebar-foreground/70"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-4 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 lg:hidden">
            <img src={logoNuh} alt="NUH" className="h-7 w-7 rounded-md object-cover" />
            <span className="font-bold">NUH</span>
          </div>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-3 pb-20 sm:p-4 sm:pb-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
