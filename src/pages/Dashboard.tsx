import { useProducts } from "@/hooks/useProducts";
import { useRecipes, RecipeIngredient } from "@/hooks/useRecipes";
import { useDishSales } from "@/hooks/useDishSales";
import { NaoConformidades } from "@/components/NaoConformidades";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Package,
  TrendingDown,
  ChefHat,
  UtensilsCrossed,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  const [allIngredients, setAllIngredients] = useState<Record<string, RecipeIngredient[]>>({});
  const [loadingIngredients, setLoadingIngredients] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoadingIngredients(true);
      const { data, error } = await supabase.from("recipe_ingredients").select("*");
      if (!error && data) {
        const grouped: Record<string, RecipeIngredient[]> = {};
        for (const ing of data as RecipeIngredient[]) {
          if (!grouped[ing.recipe_id]) grouped[ing.recipe_id] = [];
          grouped[ing.recipe_id].push(ing);
        }
        setAllIngredients(grouped);
      }
      setLoadingIngredients(false);
    };
    load();
  }, []);

  const totalItems = items.length;
  const lowStock = items.filter((i) => getProductStatus(i) !== "ok").length;

  const alertItems = items.filter(
    (i) => getProductStatus(i) !== "ok" || getExpiryStatus(i.expiry_date, i.alert_days) !== "ok"
  );

  const sumQty = (arr: typeof sales) => arr.reduce((sum, s) => sum + s.quantity, 0);

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const todaySales = sales.filter((s) => s.date === todayStr);
  const weekSales = sales.filter((s) => {
    try {
      return isWithinInterval(parseISO(s.date), {
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 }),
      });
    } catch { return false; }
  });
  const monthSales = sales.filter((s) => {
    try {
      return isWithinInterval(parseISO(s.date), {
        start: startOfMonth(today),
        end: endOfMonth(today),
      });
    } catch { return false; }
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
        name: recipes.find((r) => r.id === sale.recipe_id)?.name || "—",
        qty: 0,
      };
    }
    todayByRecipe[sale.recipe_id].qty += sale.quantity;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground sm:text-base">Visão geral do NUH Asian Food</p>
      </div>

      {/* Stats Cards */}
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

      {/* FICHAS TÉCNICAS — seção principal */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <ChefHat className="h-5 w-5 text-primary" />
            Fichas Técnicas
          </h2>

          {recipesLoading || loadingIngredients ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : recipes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma ficha técnica cadastrada.</p>
          ) : (
            <Accordion type="multiple" defaultValue={[recipes[0].id]} className="space-y-2">
              {recipes.map((recipe) => {
                const ingredients = (allIngredients[recipe.id] || []).sort((a, b) =>
                  a.ingredient_name.localeCompare(b.ingredient_name)
                );
                return (
                  <AccordionItem key={recipe.id} value={recipe.id} className="overflow-hidden rounded-lg border border-border">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex w-full min-w-0 items-center justify-between gap-2 pr-2 text-left">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{recipe.name}</p>
                          <p className="text-xs text-muted-foreground">{ingredients.length} ingredientes</p>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          <Badge variant="secondary" className="text-[10px]">{recipe.category}</Badge>
                          <Badge variant="outline" className="text-[10px]">{recipe.portions}p</Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {ingredients.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nenhum ingrediente cadastrado.</p>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-4 gap-2 text-[10px] font-semibold text-muted-foreground px-2 pb-1">
                            <span className="col-span-1">Ingrediente</span>
                            <span className="text-right">Bruto</span>
                            <span className="text-right">Líquido</span>
                            <span className="text-right">Custo</span>
                          </div>
                          {ingredients.map((ing) => (
                            <div key={ing.id} className="grid grid-cols-4 gap-2 rounded bg-muted/30 px-2 py-1.5 text-xs">
                              <span className="col-span-1 truncate font-medium">{ing.ingredient_name}</span>
                              <span className="text-right">{ing.gross_weight}{ing.unit}</span>
                              <span className="text-right">{ing.net_weight}{ing.unit}</span>
                              <span className="text-right">R$ {ing.ingredient_cost.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Saída de Pratos */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            Saída de Pratos
          </h2>
          {salesLoading || recipesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <>
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Hoje", value: sumQty(todaySales) },
                  { label: "Semana", value: sumQty(weekSales) },
                  { label: "Mês", value: sumQty(monthSales) },
                ].map((p) => (
                  <div key={p.label} className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                    <p className="text-xs text-muted-foreground">{p.label}</p>
                    <p className="text-2xl font-bold">{p.value}</p>
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

      {/* Alertas */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Alertas</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
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
