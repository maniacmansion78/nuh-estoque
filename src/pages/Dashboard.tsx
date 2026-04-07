import { useProducts } from "@/hooks/useProducts";
import { useRecipes, RecipeIngredient } from "@/hooks/useRecipes";
import { useDishSales } from "@/hooks/useDishSales";
import { NaoConformidades } from "@/components/NaoConformidades";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Package,
  AlertTriangle,
  Clock,
  TrendingDown,
  ChefHat,
  UtensilsCrossed,
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

function formatAmount(value: number, unit: string) {
  return `${value}${unit}`;
}

const Dashboard = () => {
  const { items, loading } = useProducts();
  const { recipes, loading: recipesLoading } = useRecipes();
  const { sales, loading: salesLoading } = useDishSales();
  const [allIngredients, setAllIngredients] = useState<Record<string, RecipeIngredient[]>>({});
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [openRecipeItems, setOpenRecipeItems] = useState<string[]>([]);

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

  useEffect(() => {
    if (recipes.length > 0 && openRecipeItems.length === 0) {
      setOpenRecipeItems([recipes[0].id]);
    }
  }, [recipes, openRecipeItems.length]);

  const totalItems = items.length;
  const lowStock = items.filter((i) => getProductStatus(i) !== "ok").length;
  const expiringSoon = items.filter((i) => getExpiryStatus(i.expiry_date, i.alert_days) !== "ok").length;
  const criticalExpiry = items.filter(
    (i) => getExpiryStatus(i.expiry_date, i.alert_days) === "critical"
  );

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
    } catch {
      return false;
    }
  });
  const monthSales = sales.filter((s) => {
    try {
      return isWithinInterval(parseISO(s.date), {
        start: startOfMonth(today),
        end: endOfMonth(today),
      });
    } catch {
      return false;
    }
  });

  const totalDishes = sumQty(sales);

  const statsCards = [
    { title: "Total de Pratos", value: totalDishes, icon: UtensilsCrossed, color: "text-primary", bg: "bg-accent" },
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Tela Inicial</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Visão geral do estoque do NUH Asian Food</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                {loading ? <Skeleton className="mt-1 h-8 w-12" /> : <p className="text-2xl font-bold">{stat.value}</p>}
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
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Hoje</p>
                  <p className="text-2xl font-bold">{sumQty(todaySales)}</p>
                  <p className="text-xs text-muted-foreground">pratos</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Semana</p>
                  <p className="text-2xl font-bold">{sumQty(weekSales)}</p>
                  <p className="text-xs text-muted-foreground">pratos</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Mês</p>
                  <p className="text-2xl font-bold">{sumQty(monthSales)}</p>
                  <p className="text-xs text-muted-foreground">pratos</p>
                </div>
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
          <div className="mb-4 flex items-start gap-2">
            <ChefHat className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Fichas Técnicas</h2>
              <p className="text-sm text-muted-foreground">Cada prato aparece aqui com seus ingredientes logo no Dashboard.</p>
            </div>
          </div>

          {recipesLoading || loadingIngredients ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : recipes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma ficha técnica cadastrada.</p>
          ) : (
            <Accordion type="multiple" value={openRecipeItems} onValueChange={setOpenRecipeItems} className="space-y-2">
              {recipes.map((recipe) => {
                const ingredients = (allIngredients[recipe.id] || []).sort((a, b) =>
                  a.ingredient_name.localeCompare(b.ingredient_name)
                );

                return (
                  <AccordionItem key={recipe.id} value={recipe.id} className="rounded-lg border border-border px-4">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex w-full min-w-0 flex-col items-start gap-2 pr-4 text-left sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{recipe.name}</p>
                          <p className="text-xs text-muted-foreground">{ingredients.length} ingredientes cadastrados</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">{recipe.category}</Badge>
                          <Badge variant="outline" className="text-xs">{recipe.portions} porções</Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      {ingredients.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nenhum ingrediente cadastrado.</p>
                      ) : (
                        <div className="space-y-2">
                          {ingredients.map((ingredient) => (
                            <div key={ingredient.id} className="rounded-lg bg-muted/30 p-3">
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <span className="text-sm font-medium">{ingredient.ingredient_name}</span>
                                <Badge variant="outline" className="text-[11px]">R$ {ingredient.ingredient_cost.toFixed(2)}</Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                                <div className="rounded-md bg-background/70 p-2">
                                  <p className="text-muted-foreground">Peso bruto</p>
                                  <p className="font-medium">{formatAmount(ingredient.gross_weight, ingredient.unit)}</p>
                                </div>
                                <div className="rounded-md bg-background/70 p-2">
                                  <p className="text-muted-foreground">Peso líquido</p>
                                  <p className="font-medium">{formatAmount(ingredient.net_weight, ingredient.unit)}</p>
                                </div>
                                <div className="rounded-md bg-background/70 p-2 col-span-2 sm:col-span-1">
                                  <p className="text-muted-foreground">Fator correção</p>
                                  <p className="font-medium">{ingredient.correction_factor.toFixed(2)}</p>
                                </div>
                              </div>
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
