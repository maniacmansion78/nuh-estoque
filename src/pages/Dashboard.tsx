import { useProducts } from "@/hooks/useProducts";
import { useRecipes, RecipeIngredient } from "@/hooks/useRecipes";
import { NaoConformidades } from "@/components/NaoConformidades";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Package,
  AlertTriangle,
  Clock,
  TrendingDown,
  ChefHat,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

      {/* Fichas Técnicas */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            Fichas Técnicas
          </h2>
          {recipesLoading || loadingIngredients ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : recipes.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma ficha técnica cadastrada.</p>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {recipes.map((recipe) => {
                const ings = (allIngredients[recipe.id] || []).sort((a, b) => a.ingredient_name.localeCompare(b.ingredient_name));
                return (
                  <AccordionItem key={recipe.id} value={recipe.id} className="border rounded-lg">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-3 text-left w-full">
                        <ChefHat className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{recipe.name}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">{recipe.category}</Badge>
                            <Badge variant="outline" className="text-xs">{recipe.portions} porções</Badge>
                            <Badge variant="outline" className="text-xs">R$ {recipe.total_cost.toFixed(2)}</Badge>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3">
                      {ings.length === 0 ? (
                        <p className="text-muted-foreground text-xs">Nenhum ingrediente cadastrado.</p>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-muted-foreground px-3 pb-1">
                            <span className="col-span-2">Ingrediente</span>
                            <span className="text-right">Bruto</span>
                            <span className="text-right">Líquido</span>
                            <span className="text-right">Custo</span>
                          </div>
                          {ings.map((ing) => (
                            <div key={ing.id} className="grid grid-cols-5 gap-2 rounded bg-muted/30 px-3 py-1.5 text-xs">
                              <span className="col-span-2 truncate">{ing.ingredient_name}</span>
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

      <NaoConformidades />
    </div>
  );
};

export default Dashboard;
