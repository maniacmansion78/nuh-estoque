import { useState } from "react";
import { useRecipes, RecipeIngredient } from "@/hooks/useRecipes";
import { useDishSales, DishSale } from "@/hooks/useDishSales";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  UtensilsCrossed,
  Plus,
  Minus,
  ChefHat,
  CalendarDays,
  Trash2,
  ShoppingBasket,
  ChevronDown,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, subDays } from "date-fns";
import { useEffect } from "react";

type IngredientConsumption = { name: string; totalWeight: number; unit: string };

const SaidaPratos = () => {
  const { recipes, loading: recipesLoading } = useRecipes();
  const { sales, loading: salesLoading, addSale, deleteSale } = useDishSales();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [allIngredients, setAllIngredients] = useState<Record<string, RecipeIngredient[]>>({});
  const [loadingIngredients, setLoadingIngredients] = useState(true);

  useEffect(() => {
    const loadIngredients = async () => {
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
    loadIngredients();
  }, []);

  const updateQty = (recipeId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [recipeId]: Math.max(0, (prev[recipeId] || 0) + delta),
    }));
  };

  const handleRegisterSales = async () => {
    const entries = Object.entries(quantities).filter(([, qty]) => qty > 0);
    if (entries.length === 0) {
      toast.error("Selecione ao menos um prato");
      return;
    }
    let success = true;
    for (const [recipeId, qty] of entries) {
      const result = await addSale(recipeId, qty, selectedDate);
      if (!result) success = false;
    }
    if (success) {
      setQuantities({});
      toast.success("Todas as vendas registradas!");
    }
  };

  // Calculate consumption per recipe
  const calculatePerRecipe = (periodSales: DishSale[]) => {
    const perRecipe: Record<string, { recipeName: string; totalQty: number; ingredients: Record<string, IngredientConsumption> }> = {};

    for (const sale of periodSales) {
      const recipe = recipes.find((r) => r.id === sale.recipe_id);
      if (!perRecipe[sale.recipe_id]) {
        perRecipe[sale.recipe_id] = {
          recipeName: recipe?.name || "—",
          totalQty: 0,
          ingredients: {},
        };
      }
      perRecipe[sale.recipe_id].totalQty += sale.quantity;

      const ings = allIngredients[sale.recipe_id] || [];
      for (const ing of ings) {
        const key = ing.ingredient_name.toLowerCase();
        if (!perRecipe[sale.recipe_id].ingredients[key]) {
          perRecipe[sale.recipe_id].ingredients[key] = { name: ing.ingredient_name, totalWeight: 0, unit: ing.unit };
        }
        perRecipe[sale.recipe_id].ingredients[key].totalWeight += ing.gross_weight * sale.quantity;
      }
    }

    return perRecipe;
  };

  // Calculate total consumption across all recipes
  const calculateTotal = (periodSales: DishSale[]) => {
    const consumption: Record<string, IngredientConsumption> = {};
    for (const sale of periodSales) {
      const ings = allIngredients[sale.recipe_id] || [];
      for (const ing of ings) {
        const key = ing.ingredient_name.toLowerCase();
        if (!consumption[key]) {
          consumption[key] = { name: ing.ingredient_name, totalWeight: 0, unit: ing.unit };
        }
        consumption[key].totalWeight += ing.gross_weight * sale.quantity;
      }
    }
    return Object.values(consumption).sort((a, b) => a.name.localeCompare(b.name));
  };

  const today = new Date();
  const todaySales = sales.filter((s) => s.date === selectedDate);
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

  const loading = recipesLoading || salesLoading || loadingIngredients;
  const getRecipeName = (id: string) => recipes.find((r) => r.id === id)?.name || "—";

  const mergedTodaySales = todaySales.reduce<DishSale[]>((acc, sale) => {
    const existing = acc.find((item) => item.recipe_id === sale.recipe_id);
    if (existing) {
      existing.quantity += sale.quantity;
      if (sale.created_at > existing.created_at) {
        existing.created_at = sale.created_at;
        existing.id = sale.id;
      }
      return acc;
    }
    acc.push({ ...sale });
    return acc;
  }, []).sort((a, b) => getRecipeName(a.recipe_id).localeCompare(getRecipeName(b.recipe_id)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Saída de Pratos</h1>
          <p className="text-sm text-muted-foreground">Registre os pratos vendidos e acompanhe o consumo de insumos</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-40" />
        </div>
      </div>

      {/* Register dish sales */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            Registrar Vendas do Dia
          </h2>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : recipes.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma receita cadastrada.</p>
          ) : (
            <div className="space-y-3">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm leading-snug break-words">{recipe.name}</p>
                    <Badge variant="secondary" className="text-xs mt-0.5">{recipe.category}</Badge>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="icon" variant="outline" className="h-7 w-7 rounded-md" onClick={() => updateQty(recipe.id, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-7 text-center font-bold text-sm">{quantities[recipe.id] || 0}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7 rounded-md" onClick={() => updateQty(recipe.id, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button className="w-full mt-4 gap-2" onClick={handleRegisterSales} disabled={Object.values(quantities).every((q) => q === 0)}>
                <UtensilsCrossed className="h-4 w-4" />
                Registrar Vendas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales history for selected date */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Vendas em {format(parseISO(selectedDate), "dd/MM/yyyy")}</h2>
          {mergedTodaySales.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma venda registrada nesta data.</p>
          ) : (
            <div className="space-y-2">
              {mergedTodaySales.map((sale) => (
                <div key={sale.recipe_id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium text-sm">{getRecipeName(sale.recipe_id)}</p>
                    <p className="text-xs text-muted-foreground">Qtd: {sale.quantity} — {format(parseISO(sale.created_at), "HH:mm")}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deleteSale(sale.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ingredient consumption tabs */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShoppingBasket className="h-5 w-5 text-primary" />
            Consumo de Insumos
          </h2>
          <Tabs defaultValue="day">
            <TabsList className="w-full">
              <TabsTrigger value="day" className="flex-1">Hoje</TabsTrigger>
              <TabsTrigger value="week" className="flex-1">Semana</TabsTrigger>
              <TabsTrigger value="month" className="flex-1">Mês</TabsTrigger>
            </TabsList>
            <TabsContent value="day">
              <ConsumptionBreakdown perRecipe={calculatePerRecipe(todaySales)} total={calculateTotal(todaySales)} />
            </TabsContent>
            <TabsContent value="week">
              <ConsumptionBreakdown perRecipe={calculatePerRecipe(weekSales)} total={calculateTotal(weekSales)} />
            </TabsContent>
            <TabsContent value="month">
              <ConsumptionBreakdown perRecipe={calculatePerRecipe(monthSales)} total={calculateTotal(monthSales)} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

function ConsumptionBreakdown({
  perRecipe,
  total,
}: {
  perRecipe: Record<string, { recipeName: string; totalQty: number; ingredients: Record<string, IngredientConsumption> }>;
  total: IngredientConsumption[];
}) {
  const recipeEntries = Object.entries(perRecipe).sort((a, b) => a[1].recipeName.localeCompare(b[1].recipeName));

  if (recipeEntries.length === 0) {
    return <p className="text-muted-foreground text-sm py-4">Nenhum consumo registrado no período.</p>;
  }

  return (
    <div className="mt-3 space-y-4">
      {/* Per-recipe breakdown */}
      <Accordion type="multiple" className="space-y-2">
        {recipeEntries.map(([recipeId, data]) => (
          <AccordionItem key={recipeId} value={recipeId} className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <ChefHat className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{data.recipeName}</p>
                  <p className="text-xs text-muted-foreground">{data.totalQty} porções vendidas</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="space-y-1.5">
                {Object.values(data.ingredients)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((ing) => (
                    <div key={ing.name} className="flex items-center justify-between rounded bg-muted/30 px-3 py-1.5">
                      <span className="text-xs">{ing.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {formatWeight(ing.totalWeight, ing.unit)}
                      </Badge>
                    </div>
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* General total */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <ShoppingBasket className="h-4 w-4 text-primary" />
          Total Geral de Insumos
        </h3>
        <div className="space-y-1.5">
          {total.map((item) => (
            <div key={item.name} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-2">
              <span className="text-sm font-medium">{item.name}</span>
              <Badge variant="outline">
                {formatWeight(item.totalWeight, item.unit)}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatWeight(weight: number, unit: string) {
  if (unit === "un") return `${weight.toFixed(0)} un`;
  if (unit === "ml" && weight >= 1000) return `${(weight / 1000).toFixed(2)} L`;
  if (unit === "g" && weight >= 1000) return `${(weight / 1000).toFixed(2)} kg`;
  return `${weight.toFixed(1)} ${unit}`;
}

export default SaidaPratos;
