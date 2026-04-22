import { useProducts } from "@/hooks/useProducts";
import { useRecipes, RecipeIngredient } from "@/hooks/useRecipes";
import { useDishSales } from "@/hooks/useDishSales";
import { NaoConformidades } from "@/components/NaoConformidades";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, UtensilsCrossed, ChefHat, BarChart3, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";


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

   const nowBrasilia = useMemo(() => new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })), []);
   const todayStr = useMemo(() => `${nowBrasilia.getFullYear()}-${String(nowBrasilia.getMonth() + 1).padStart(2, "0")}-${String(nowBrasilia.getDate()).padStart(2, "0")}`, [nowBrasilia]);
 
   const reportPeriods = useMemo(() => {
     const pad = (n: number) => String(n).padStart(2, "0");
     const dateToStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
 
     const dayOfWeek = nowBrasilia.getDay();
     const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
     const weekStart = new Date(nowBrasilia);
     weekStart.setDate(weekStart.getDate() - diffToMonday);
     const weekStartStr = dateToStr(weekStart);
 
     const biweeklyStart = new Date(nowBrasilia);
     biweeklyStart.setDate(biweeklyStart.getDate() - 14);
     const biweeklyStartStr = dateToStr(biweeklyStart);
 
     const monthStartStr = `${nowBrasilia.getFullYear()}-${pad(nowBrasilia.getMonth() + 1)}-01`;
 
     const filterByDateRange = (startDate: string, endDate: string) =>
       sales.filter((sale) => sale.date >= startDate && sale.date <= endDate);
 
     const todaySales = sales.filter((sale) => sale.date === todayStr);
     const weekSales = filterByDateRange(weekStartStr, todayStr);
     const biweeklySales = filterByDateRange(biweeklyStartStr, todayStr);
     const monthSales = filterByDateRange(monthStartStr, todayStr);
 
     const sumQty = (arr: typeof sales) => arr.reduce((sum, sale) => sum + sale.quantity, 0);
 
     const buildByRecipe = (filtered: typeof sales) => {
       const map: Record<string, { name: string; qty: number }> = {};
       for (const sale of filtered) {
         if (!map[sale.recipe_id]) {
           map[sale.recipe_id] = {
             name: recipes.find((r) => r.id === sale.recipe_id)?.name || "—",
             qty: 0,
           };
         }
         map[sale.recipe_id].qty += sale.quantity;
       }
       return Object.entries(map).sort((a, b) => b[1].qty - a[1].qty);
     };
 
     const buildIngredientConsumption = (filtered: typeof sales) => {
       const map: Record<string, { name: string; unit: string; total: number }> = {};
       for (const sale of filtered) {
         const ings = allIngredients[sale.recipe_id] || [];
         for (const ing of ings) {
           const key = ing.ingredient_name;
           if (!map[key]) {
             map[key] = { name: ing.ingredient_name, unit: ing.unit, total: 0 };
           }
           map[key].total += ing.gross_weight * sale.quantity;
         }
       }
       return Object.values(map)
         .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
         .map((i) => ({ ...i, total: Math.round(i.total * 100) / 100 }));
     };
 
     return [
       { label: "Hoje", dishes: buildByRecipe(todaySales), ingredients: buildIngredientConsumption(todaySales), total: sumQty(todaySales) },
       { label: "Semana", dishes: buildByRecipe(weekSales), ingredients: buildIngredientConsumption(weekSales), total: sumQty(weekSales) },
       { label: "Quinzena", dishes: buildByRecipe(biweeklySales), ingredients: buildIngredientConsumption(biweeklySales), total: sumQty(biweeklySales) },
       { label: format(nowBrasilia, "MMMM", { locale: ptBR }), dishes: buildByRecipe(monthSales), ingredients: buildIngredientConsumption(monthSales), total: sumQty(monthSales) },
     ];
   }, [sales, recipes, allIngredients, nowBrasilia, todayStr]);
 
   const statsCards = useMemo(() => {
     const totalItems = items.length;
     const monthTotal = reportPeriods[3]?.total || 0;
     return [
       { title: "Pratos Vendidos (Mês)", value: monthTotal, icon: UtensilsCrossed, color: "text-primary", bg: "bg-accent" },
       { title: "Fichas Técnicas", value: recipes.length, icon: ChefHat, color: "text-primary", bg: "bg-accent" },
       { title: "Total de Insumos", value: totalItems, icon: Package, color: "text-primary", bg: "bg-accent" },
     ];
   }, [items.length, recipes.length, reportPeriods]);
    { label: "Hoje", dishes: buildByRecipe(todaySales), ingredients: buildIngredientConsumption(todaySales), total: sumQty(todaySales) },
    { label: "Semana", dishes: buildByRecipe(weekSales), ingredients: buildIngredientConsumption(weekSales), total: sumQty(weekSales) },
    { label: "Quinzena", dishes: buildByRecipe(biweeklySales), ingredients: buildIngredientConsumption(biweeklySales), total: sumQty(biweeklySales) },
    { label: format(nowBrasilia, "MMMM", { locale: ptBR }), dishes: buildByRecipe(monthSales), ingredients: buildIngredientConsumption(monthSales), total: sumQty(monthSales) },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [sales, recipes, allIngredients]);

  // Build daily logs: group sales by date, showing each dish sold that day
  const dailyLogs = useMemo(() => {
    const byDate: Record<string, { recipe_id: string; name: string; qty: number }[]> = {};
    for (const sale of sales) {
      if (!byDate[sale.date]) byDate[sale.date] = [];
      const existing = byDate[sale.date].find((d) => d.recipe_id === sale.recipe_id);
      if (existing) {
        existing.qty += sale.quantity;
      } else {
        byDate[sale.date].push({
          recipe_id: sale.recipe_id,
          name: recipes.find((r) => r.id === sale.recipe_id)?.name || "—",
          qty: sale.quantity,
        });
      }
    }
    return Object.entries(byDate)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 30)
      .map(([date, dishes]) => ({
        date,
        dateFormatted: format(new Date(`${date}T12:00:00`), "dd/MM/yyyy (EEEE)", { locale: ptBR }),
        dishes: dishes.sort((a, b) => b.qty - a.qty),
        total: dishes.reduce((s, d) => s + d.qty, 0),
      }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales, recipes]);

  

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Tela Inicial</h1>
        <p className="text-sm text-muted-foreground sm:text-base">Visão geral do NUH Asian Food</p>
      </div>

      {/* Saída de Pratos - summary (FIRST visible section) */}
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
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              {reportPeriods.map((period) => (
                <div key={period.label} className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                  <p className="text-xs text-muted-foreground capitalize">{period.label}</p>
                  <p className="text-2xl font-bold">{period.total}</p>
                  <p className="text-xs text-muted-foreground">pratos</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
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

      {/* ===== LOGS DE SAÍDA POR DIA ===== */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <ClipboardList className="h-5 w-5 text-primary" />
            Logs de Saída por Dia
          </h2>
          {salesLoading || recipesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : dailyLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro de saída.</p>
          ) : (
            <Accordion type="multiple" defaultValue={dailyLogs[0] ? [dailyLogs[0].date] : []} className="space-y-2">
              {dailyLogs.map((day) => (
                <AccordionItem key={day.date} value={day.date} className="overflow-hidden rounded-lg border border-border">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex w-full items-center justify-between pr-2">
                      <span className="text-sm font-semibold capitalize">{day.dateFormatted}</span>
                      <Badge variant="secondary" className="whitespace-nowrap">{day.total} pratos</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 pb-0">
                    <div className="divide-y">
                      {day.dishes.map((d) => (
                        <div key={d.recipe_id} className="flex items-center justify-between gap-3 px-4 py-2">
                          <span className="min-w-0 flex-1 text-xs font-medium leading-snug break-words">{d.name}</span>
                          <span className="shrink-0 text-xs font-semibold tabular-nums">{d.qty}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between gap-3 bg-muted/30 px-4 py-2">
                        <span className="text-xs font-bold">Total</span>
                        <span className="text-xs font-bold tabular-nums">{day.total}</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Relatório Mensal de Saída de Pratos */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <BarChart3 className="h-5 w-5 text-primary" />
            Relatório de Saída de Pratos
          </h2>
          {salesLoading || recipesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={[reportPeriods[0]?.label]} className="space-y-2">
              {reportPeriods.map((period) => (
                <AccordionItem key={period.label} value={period.label} className="overflow-hidden rounded-lg border border-border">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex w-full items-center justify-between pr-2">
                      <span className="text-sm font-semibold capitalize">{period.label}</span>
                      <Badge variant="secondary">{period.total} pratos</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 pb-0">
                    {period.dishes.length === 0 ? (
                      <p className="px-4 pb-4 text-sm text-muted-foreground">Nenhuma venda neste período.</p>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <p className="px-4 pt-2 text-xs font-semibold text-muted-foreground uppercase">Pratos</p>
                          <div className="divide-y">
                            {period.dishes.map(([id, d]) => (
                              <div key={id} className="flex items-center justify-between gap-3 px-4 py-2">
                                <span className="min-w-0 flex-1 text-xs font-medium leading-snug break-words">{d.name}</span>
                                <span className="shrink-0 text-xs font-semibold tabular-nums">{d.qty}</span>
                              </div>
                            ))}
                            <div className="flex items-center justify-between gap-3 bg-muted/30 px-4 py-2">
                              <span className="text-xs font-bold">Total</span>
                              <span className="text-xs font-bold tabular-nums">{period.total}</span>
                            </div>
                          </div>
                        </div>
                        {period.ingredients.length > 0 && (
                          <div>
                            <p className="px-4 text-xs font-semibold text-muted-foreground uppercase">Total de Insumos Consumidos</p>
                            <div className="divide-y">
                              {period.ingredients.map((ing) => (
                                <div key={ing.name} className="flex items-center justify-between gap-3 px-4 py-2">
                                  <span className="min-w-0 flex-1 text-xs font-medium leading-snug break-words">{ing.name}</span>
                                  <span className="shrink-0 text-xs font-semibold tabular-nums whitespace-nowrap">{ing.total} {ing.unit}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>


      <NaoConformidades />
    </div>
  );
};

export default Dashboard;
