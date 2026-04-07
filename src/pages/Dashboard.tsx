import { useProducts } from "@/hooks/useProducts";
import { useRecipes } from "@/hooks/useRecipes";
import { useDishSales } from "@/hooks/useDishSales";
import { NaoConformidades } from "@/components/NaoConformidades";
import { Package, TrendingDown, Clock, UtensilsCrossed } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

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
  const { items, loading } = useProducts();
  const { recipes, loading: recipesLoading } = useRecipes();
  const { sales, loading: salesLoading } = useDishSales();

  const totalItems = items.length;
  const lowStock = items.filter((item) => getProductStatus(item) !== "ok").length;

  const alertItems = items.filter(
    (item) => getProductStatus(item) !== "ok" || getExpiryStatus(item.expiry_date, item.alert_days) !== "ok"
  );

  const sumQty = (arr: typeof sales) => arr.reduce((sum, sale) => sum + sale.quantity, 0);

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const todaySales = sales.filter((sale) => sale.date === todayStr);
  const weekSales = sales.filter((sale) => {
    try {
      return isWithinInterval(parseISO(sale.date), {
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 }),
      });
    } catch {
      return false;
    }
  });
  const monthSales = sales.filter((sale) => {
    try {
      return isWithinInterval(parseISO(sale.date), {
        start: startOfMonth(today),
        end: endOfMonth(today),
      });
    } catch {
      return false;
    }
  });

  const statsCards = [
    { title: "Total de Pratos", value: recipes.length, icon: UtensilsCrossed, color: "text-primary", bg: "bg-accent" },
    { title: "Total de Produtos", value: totalItems, icon: Package, color: "text-primary", bg: "bg-accent" },
    { title: "Estoque Baixo", value: lowStock, icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  const todayByRecipe: Record<string, { name: string; qty: number }> = {};
  for (const sale of todaySales) {
    if (!todayByRecipe[sale.recipe_id]) {
      todayByRecipe[sale.recipe_id] = {
        name: recipes.find((recipe) => recipe.id === sale.recipe_id)?.name || "—",
        qty: 0,
      };
    }
    todayByRecipe[sale.recipe_id].qty += sale.quantity;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Tela Inicial</h1>
        <p className="text-sm text-muted-foreground sm:text-base">Visão geral do NUH Asian Food</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                {loading || recipesLoading ? <Skeleton className="mt-1 h-8 w-12" /> : <p className="text-2xl font-bold">{stat.value}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            Saída de Pratos
          </h2>
          {salesLoading || recipesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Hoje", value: sumQty(todaySales) },
                  { label: "Semana", value: sumQty(weekSales) },
                  { label: "Mês", value: sumQty(monthSales) },
                ].map((period) => (
                  <div key={period.label} className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                    <p className="text-xs text-muted-foreground">{period.label}</p>
                    <p className="text-2xl font-bold">{period.value}</p>
                    <p className="text-xs text-muted-foreground">pratos</p>
                  </div>
                ))}
              </div>
              {Object.keys(todayByRecipe).length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Vendas de Hoje</h3>
                  {Object.entries(todayByRecipe).map(([id, data]) => (
                    <div key={id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-2">
                      <span className="text-sm font-medium">{data.name}</span>
                      <Badge variant="outline">{data.qty} porções</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma venda registrada hoje.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Alertas</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : alertItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p>
          ) : (
            <div className="space-y-3">
              {alertItems.map((item) => {
                const stockStatus = getProductStatus(item);
                const expiryStatus = getExpiryStatus(item.expiry_date, item.alert_days);
                const days = getDaysUntilExpiry(item.expiry_date);

                return (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2.5 sm:p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium sm:text-sm">{item.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {stockStatus !== "ok" && (
                          <Badge
                            variant={stockStatus === "critical" ? "destructive" : "secondary"}
                            className={cn(stockStatus === "warning" && "border-warning/30 bg-warning/10 text-warning-foreground")}
                          >
                            <TrendingDown className="mr-1 h-3 w-3" />
                            {item.quantity}
                            {item.unit}
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
