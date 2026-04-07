import { useProducts } from "@/hooks/useProducts";
import { useRecipes, RecipeIngredient } from "@/hooks/useRecipes";
import { useDishSales } from "@/hooks/useDishSales";
import { NaoConformidades } from "@/components/NaoConformidades";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, TrendingDown, UtensilsCrossed, ChefHat } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, isWithinInterval, parseISO } from "date-fns";

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
  const lowStock = items.filter((item) => {
    if (item.quantity <= item.min_quantity * 0.5) return true;
    if (item.quantity <= item.min_quantity) return true;
    return false;
  }).length;

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
    } catch { return false; }
  });
  const biweeklySales = sales.filter((sale) => {
    try {
      const d = parseISO(sale.date);
      return d >= subDays(today, 15) && d <= today;
    } catch { return false; }
  });
  const monthSales = sales.filter((sale) => {
    try {
      return isWithinInterval(parseISO(sale.date), {
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
        name: recipes.find((recipe) => recipe.id === sale.recipe_id)?.name || "—",
        qty: 0,
      };
    }
    todayByRecipe[sale.recipe_id].qty += sale.quantity;
  }

  const fichasLoading = recipesLoading || loadingIngredients;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Tela Inicial</h1>
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
              <div className="mb-4 grid gap-3 grid-cols-2 sm:grid-cols-4">
                {[
                  { label: "Hoje", value: sumQty(todaySales) },
                  { label: "Semana", value: sumQty(weekSales) },
                  { label: "Quinzena", value: sumQty(biweeklySales) },
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
                    <div key={id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2">
                      <span className="min-w-0 flex-1 break-words text-sm font-medium leading-snug">{data.name}</span>
                      <Badge variant="outline" className="shrink-0">{data.qty} porções</Badge>
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

      {/* ===== FICHAS TÉCNICAS ===== */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <ChefHat className="h-5 w-5 text-primary" />
            Fichas Técnicas
          </h2>
          {fichasLoading ? (
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
                      <div className="flex w-full min-w-0 flex-col gap-2 pr-2 text-left sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-semibold leading-snug">{recipe.name}</p>
                          <p className="text-xs text-muted-foreground">{ingredients.length} ingredientes</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-1.5 sm:justify-end">
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
                          <div className="grid grid-cols-[minmax(0,1.8fr)_repeat(3,minmax(0,0.8fr))] gap-2 px-2 pb-1 text-[10px] font-semibold text-muted-foreground">
                            <span>Ingrediente</span>
                            <span className="text-right">Bruto</span>
                            <span className="text-right">Líquido</span>
                            <span className="text-right">Custo</span>
                          </div>
                          {ingredients.map((ing) => (
                            <div key={ing.id} className="grid grid-cols-[minmax(0,1.8fr)_repeat(3,minmax(0,0.8fr))] items-start gap-2 rounded bg-muted/30 px-2 py-1.5 text-xs">
                              <span className="break-words font-medium leading-snug">{ing.ingredient_name}</span>
                              <span className="text-right whitespace-nowrap">{ing.gross_weight}{ing.unit}</span>
                              <span className="text-right whitespace-nowrap">{ing.net_weight}{ing.unit}</span>
                              <span className="text-right whitespace-nowrap">R$ {ing.ingredient_cost.toFixed(2)}</span>
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

      <NaoConformidades />
    </div>
  );
};

export default Dashboard;
