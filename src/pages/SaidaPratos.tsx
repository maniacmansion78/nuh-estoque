import { useState, useMemo } from "react";
import { useRecipes, RecipeIngredient } from "@/hooks/useRecipes";
import { useDishSales } from "@/hooks/useDishSales";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect } from "react";

const SaidaPratos = () => {
  const { recipes, loading: recipesLoading } = useRecipes();
  const { sales, loading: salesLoading, addSale, deleteSale, fetchSales } = useDishSales();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [allIngredients, setAllIngredients] = useState<Record<string, RecipeIngredient[]>>({});
  const [loadingIngredients, setLoadingIngredients] = useState(true);

  // Load all recipe ingredients
  useEffect(() => {
    const loadIngredients = async () => {
      setLoadingIngredients(true);
      const { data, error } = await supabase
        .from("recipe_ingredients")
        .select("*");
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

  // Calculate ingredient consumption for a period
  const calculateConsumption = (periodSales: typeof sales) => {
    const consumption: Record<string, { name: string; totalWeight: number; unit: string }> = {};

    for (const sale of periodSales) {
      const ingredients = allIngredients[sale.recipe_id] || [];
      for (const ing of ingredients) {
        const key = ing.ingredient_name.toLowerCase();
        if (!consumption[key]) {
          consumption[key] = { name: ing.ingredient_name, totalWeight: 0, unit: ing.unit };
        }
        consumption[key].totalWeight += ing.net_weight * sale.quantity;
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

  const todayConsumption = calculateConsumption(todaySales);
  const weekConsumption = calculateConsumption(weekSales);
  const monthConsumption = calculateConsumption(monthSales);

  const loading = recipesLoading || salesLoading || loadingIngredients;

  const getRecipeName = (id: string) => recipes.find((r) => r.id === id)?.name || "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
            Saída de Pratos
          </h1>
          <p className="text-sm text-muted-foreground">
            Registre os pratos vendidos e acompanhe o consumo de insumos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
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
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : recipes.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma receita cadastrada.</p>
          ) : (
            <div className="space-y-3">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base truncate">{recipe.name}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {recipe.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => updateQty(recipe.id, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-bold text-lg">
                      {quantities[recipe.id] || 0}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => updateQty(recipe.id, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                className="w-full mt-4 gap-2"
                onClick={handleRegisterSales}
                disabled={Object.values(quantities).every((q) => q === 0)}
              >
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
          <h2 className="text-lg font-semibold mb-4">
            Vendas em {format(parseISO(selectedDate), "dd/MM/yyyy")}
          </h2>
          {todaySales.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma venda registrada nesta data.</p>
          ) : (
            <div className="space-y-2">
              {todaySales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{getRecipeName(sale.recipe_id)}</p>
                    <p className="text-xs text-muted-foreground">
                      Qtd: {sale.quantity} — {format(parseISO(sale.created_at), "HH:mm")}
                    </p>
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
              <ConsumptionTable data={todayConsumption} />
            </TabsContent>
            <TabsContent value="week">
              <ConsumptionTable data={weekConsumption} />
            </TabsContent>
            <TabsContent value="month">
              <ConsumptionTable data={monthConsumption} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

function ConsumptionTable({ data }: { data: { name: string; totalWeight: number; unit: string }[] }) {
  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm py-4">Nenhum consumo registrado no período.</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      {data.map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-2"
        >
          <span className="text-sm font-medium">{item.name}</span>
          <Badge variant="outline">
            {item.totalWeight >= 1000
              ? `${(item.totalWeight / 1000).toFixed(2)} kg`
              : `${item.totalWeight.toFixed(1)} ${item.unit}`}
          </Badge>
        </div>
      ))}
    </div>
  );
}

export default SaidaPratos;
