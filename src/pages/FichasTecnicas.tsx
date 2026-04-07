import { useEffect, useState } from "react";
import { ChefHat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRecipes, RecipeIngredient } from "@/hooks/useRecipes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FichasTecnicas = () => {
  const { recipes, loading: recipesLoading } = useRecipes();
  const [allIngredients, setAllIngredients] = useState<Record<string, RecipeIngredient[]>>({});
  const [loadingIngredients, setLoadingIngredients] = useState(true);

  useEffect(() => {
    const loadIngredients = async () => {
      setLoadingIngredients(true);
      const { data, error } = await supabase.from("recipe_ingredients").select("*");

      if (!error && data) {
        const grouped: Record<string, RecipeIngredient[]> = {};
        for (const ingredient of data as RecipeIngredient[]) {
          if (!grouped[ingredient.recipe_id]) grouped[ingredient.recipe_id] = [];
          grouped[ingredient.recipe_id].push(ingredient);
        }
        setAllIngredients(grouped);
      }

      setLoadingIngredients(false);
    };

    loadIngredients();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Fichas Técnicas</h1>
        <p className="text-sm text-muted-foreground sm:text-base">Consulte os ingredientes e custos de cada prato em uma tela própria.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Pratos cadastrados</h2>
          </div>

          {recipesLoading || loadingIngredients ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recipes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma ficha técnica cadastrada.</p>
          ) : (
            <Accordion key={recipes[0]?.id ?? "recipes"} type="multiple" defaultValue={recipes[0] ? [recipes[0].id] : []} className="space-y-2">
              {recipes.map((recipe) => {
                const ingredients = (allIngredients[recipe.id] || []).sort((a, b) =>
                  a.ingredient_name.localeCompare(b.ingredient_name)
                );

                return (
                  <AccordionItem key={recipe.id} value={recipe.id} className="overflow-hidden rounded-lg border border-border">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex w-full min-w-0 items-center justify-between gap-2 pr-2 text-left">
                        <div className="min-w-0 flex-1 overflow-hidden">
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
                          <div className="grid grid-cols-4 gap-2 px-2 pb-1 text-[10px] font-semibold text-muted-foreground">
                            <span>Ingrediente</span>
                            <span className="text-right">Bruto</span>
                            <span className="text-right">Líquido</span>
                            <span className="text-right">Custo</span>
                          </div>
                          {ingredients.map((ingredient) => (
                            <div key={ingredient.id} className="grid grid-cols-4 gap-2 rounded bg-muted/30 px-2 py-1.5 text-xs">
                              <span className="truncate font-medium">{ingredient.ingredient_name}</span>
                              <span className="text-right">{ingredient.gross_weight}{ingredient.unit}</span>
                              <span className="text-right">{ingredient.net_weight}{ingredient.unit}</span>
                              <span className="text-right">R$ {ingredient.ingredient_cost.toFixed(2)}</span>
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
    </div>
  );
};

export default FichasTecnicas;
