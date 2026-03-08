import { useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { NaoConformidades } from "@/components/NaoConformidades";
import {
  Package,
  AlertTriangle,
  Clock,
  TrendingDown,
  Plus,
  Minus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

function getProductStatus(p: { quantity: number; min_quantity: number }) {
  if (p.quantity <= p.min_quantity * 0.5) return "critical";
  if (p.quantity <= p.min_quantity) return "warning";
  return "ok";
}

function getExpiryStatus(expiryDate: string, alertDays: number) {
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= Math.ceil(alertDays * 0.3)) return "critical";
  if (days <= alertDays) return "warning";
  return "ok";
}

function getDaysUntilExpiry(expiryDate: string) {
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { items, loading } = useProducts();

  const totalItems = items.length;
  const lowStock = items.filter((i) => getProductStatus(i) !== "ok").length;
  const expiringSoon = items.filter((i) => getExpiryStatus(i.expiry_date, i.alert_days) !== "ok").length;
  const criticalExpiry = items.filter(
    (i) => getExpiryStatus(i.expiry_date, i.alert_days) === "critical"
  );

  const alertItems = items.filter(
    (i) => getProductStatus(i) !== "ok" || getExpiryStatus(i.expiry_date, i.alert_days) !== "ok"
  );

  const statsCards = [
    { title: "Total de Produtos", value: totalItems, icon: Package, color: "text-primary", bg: "bg-accent" },
    { title: "Estoque Baixo", value: lowStock, icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10" },
    { title: "Validade Próxima", value: expiringSoon, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { title: "Validade Crítica", value: criticalExpiry.length, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Tela Inicial</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Visão geral do estoque do NUH Asian Food</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:gap-3">
          <Button size="sm" className="gap-1.5 text-xs sm:size-default sm:gap-2 sm:text-sm" onClick={() => navigate("/movimentacoes")}>
            <Plus className="h-4 w-4" /> Nova Entrada
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs sm:size-default sm:gap-2 sm:text-sm" onClick={() => navigate("/movimentacoes")}>
            <Minus className="h-4 w-4" /> Nova Saída
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                {loading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{stat.value}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertas */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Alertas</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : alertItems.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum alerta no momento.</p>
          ) : (
            <div className="space-y-3">
              {alertItems.map((item) => {
                const stockStatus = getProductStatus(item);
                const expiryStatus = getExpiryStatus(item.expiry_date, item.alert_days);
                const days = getDaysUntilExpiry(item.expiry_date);
                return (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2.5 sm:p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs sm:text-sm font-medium">{item.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {stockStatus !== "ok" && (
                          <Badge
                            variant={stockStatus === "critical" ? "destructive" : "secondary"}
                            className={cn(stockStatus === "warning" && "border-warning/30 bg-warning/10 text-warning-foreground")}
                          >
                            <TrendingDown className="mr-1 h-3 w-3" />
                            {item.quantity}{item.unit}
                          </Badge>
                        )}
                        {expiryStatus !== "ok" && (
                          <Badge
                            variant={expiryStatus === "critical" ? "destructive" : "secondary"}
                            className={cn(expiryStatus === "warning" && "border-warning/30 bg-warning/10 text-warning-foreground")}
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            {days}d
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <NaoConformidades />
    </div>
  );
};

export default Dashboard;
