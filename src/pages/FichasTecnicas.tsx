import { useEffect, useState } from "react";
import { ChefHat, Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRecipes, RecipeIngredient, NewIngredient } from "@/hooks/useRecipes";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import RecipeFormDialog from "@/components/RecipeFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const FichasTecnicas = () => {
  const { recipes, loading: recipesLoading, addRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const { isAdmin } = useAuth();
  const [allIngredients, setAllIngredients] = useState<Record<string, RecipeIngredient[]>>({});
  const [loadingIngredients, setLoadingIngredients] = useState(true);

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<{ id: string; name: string; category: string; portions: number; ingredients: NewIngredient[] } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
  }, [recipes]);

  const handleCreate = () => {
    setEditingRecipe(null);
    setFormOpen(true);
  };

  const handleEdit = (recipe: typeof recipes[0]) => {
    const ings = (allIngredients[recipe.id] || []).map((ing) => ({
      ingredient_name: ing.ingredient_name,
      gross_weight: ing.gross_weight,
      correction_factor: ing.correction_factor,
      unit_cost: ing.unit_cost,
      unit: ing.unit,
    }));
    setEditingRecipe({ id: recipe.id, name: recipe.name, category: recipe.category, portions: recipe.portions, ingredients: ings });
    setFormOpen(true);
  };

  const handleSave = async (form: Parameters<typeof addRecipe>[0]) => {
    if (editingRecipe) {
      return updateRecipe(editingRecipe.id, form);
    }
    return addRecipe(form);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteRecipe(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Fichas Técnicas</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Cadastre e consulte os ingredientes e custos de cada prato.</p>
        </div>
        <Button onClick={handleCreate} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> Nova Receita
        </Button>
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
                      <div className="flex w-full min-w-0 flex-col gap-2 pr-2 text-left sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-semibold leading-snug">{recipe.name}</p>
                          <p className="text-xs text-muted-foreground">{ingredients.length} ingredientes · R$ {recipe.total_cost.toFixed(2)}</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-1.5 sm:justify-end">
                          <Badge variant="secondary" className="text-[10px]">{recipe.category}</Badge>
                          <Badge variant="outline" className="text-[10px]">{recipe.portions}p</Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {/* Action buttons */}
                      <div className="mb-3 flex gap-2">
                        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleEdit(recipe)}>
                          <Pencil className="h-3 w-3" /> Editar
                        </Button>
                        {isAdmin && (
                          <Button size="sm" variant="outline" className="gap-1 text-xs text-destructive hover:text-destructive" onClick={() => setDeleteId(recipe.id)}>
                            <Trash2 className="h-3 w-3" /> Excluir
                          </Button>
                        )}
                      </div>

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
                          {ingredients.map((ingredient) => (
                            <div key={ingredient.id} className="grid grid-cols-[minmax(0,1.8fr)_repeat(3,minmax(0,0.8fr))] items-start gap-2 rounded bg-muted/30 px-2 py-1.5 text-xs">
                              <span className="break-words font-medium leading-snug">{ingredient.ingredient_name}</span>
                              <span className="text-right whitespace-nowrap">{ingredient.gross_weight}{ingredient.unit}</span>
                              <span className="text-right whitespace-nowrap">{ingredient.net_weight}{ingredient.unit}</span>
                              <span className="text-right whitespace-nowrap">R$ {ingredient.ingredient_cost.toFixed(2)}</span>
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

      {/* Recipe Form Dialog */}
      <RecipeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleSave}
        initialData={editingRecipe}
        title={editingRecipe ? "Editar Receita" : "Nova Receita"}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir receita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A receita e todos os seus ingredientes serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FichasTecnicas;
