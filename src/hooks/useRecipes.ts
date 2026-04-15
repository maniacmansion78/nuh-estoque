import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_name: string;
  gross_weight: number;
  correction_factor: number;
  net_weight: number;
  unit_cost: number;
  ingredient_cost: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  portions: number;
  total_cost: number;
  created_by: string | null;
  created_at: string;
  ingredients?: RecipeIngredient[];
}

export interface NewIngredient {
  ingredient_name: string;
  gross_weight: number;
  correction_factor: number;
  unit_cost: number;
  unit: string;
}

export interface RecipeForm {
  name: string;
  category: string;
  portions: number;
  ingredients: NewIngredient[];
}

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("name");

    if (error) {
      console.error("Erro ao buscar receitas:", error);
      toast.error("Erro ao carregar receitas");
    } else {
      setRecipes(data as Recipe[]);
    }
    setLoading(false);
  }, []);

  const fetchRecipeWithIngredients = useCallback(async (recipeId: string) => {
    const { data: ingredients, error } = await supabase
      .from("recipe_ingredients")
      .select("*")
      .eq("recipe_id", recipeId);

    if (error) {
      console.error("Erro ao buscar ingredientes:", error);
      return [];
    }
    return ingredients as RecipeIngredient[];
  }, []);

  const addRecipe = async (form: RecipeForm) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;

    const ingredients = form.ingredients.map((ing) => {
      const netWeight = ing.gross_weight / (ing.correction_factor || 1);
      const ingredientCost = netWeight * ing.unit_cost;
      return { ...ing, net_weight: netWeight, ingredient_cost: ingredientCost };
    });

    const totalCost = ingredients.reduce((sum, ing) => sum + ing.ingredient_cost, 0);

    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        name: form.name.trim(),
        category: form.category,
        portions: form.portions,
        total_cost: totalCost,
        created_by: userId,
      })
      .select()
      .single();

    if (recipeError || !recipe) {
      console.error("Erro ao criar receita:", recipeError);
      toast.error("Erro ao criar receita");
      return false;
    }

    if (ingredients.length > 0) {
      const rows = ingredients.map((ing) => ({
        recipe_id: recipe.id,
        ingredient_name: ing.ingredient_name.trim(),
        gross_weight: ing.gross_weight,
        correction_factor: ing.correction_factor,
        net_weight: ing.net_weight,
        unit_cost: ing.unit_cost,
        ingredient_cost: ing.ingredient_cost,
        unit: ing.unit,
      }));

      const { error: ingError } = await supabase.from("recipe_ingredients").insert(rows);
      if (ingError) {
        console.error("Erro ao inserir ingredientes:", ingError);
        toast.error("Receita criada, mas houve erro ao salvar ingredientes");
        await fetchRecipes();
        return false;
      }
    }

    toast.success("Receita cadastrada com sucesso!");
    await fetchRecipes();
    return true;
  };

  const updateRecipe = async (id: string, form: RecipeForm) => {
    const ingredients = form.ingredients.map((ing) => {
      const netWeight = ing.gross_weight / (ing.correction_factor || 1);
      const ingredientCost = netWeight * ing.unit_cost;
      return { ...ing, net_weight: netWeight, ingredient_cost: ingredientCost };
    });

    const totalCost = ingredients.reduce((sum, ing) => sum + ing.ingredient_cost, 0);

    const { error: recipeError } = await supabase
      .from("recipes")
      .update({
        name: form.name.trim(),
        category: form.category,
        portions: form.portions,
        total_cost: totalCost,
      })
      .eq("id", id);

    if (recipeError) {
      console.error("Erro ao atualizar receita:", recipeError);
      toast.error("Erro ao atualizar receita");
      return false;
    }

    // Delete old ingredients and re-insert
    const { error: delError } = await supabase
      .from("recipe_ingredients")
      .delete()
      .eq("recipe_id", id);

    if (delError) {
      console.error("Erro ao remover ingredientes antigos:", delError);
    }

    if (ingredients.length > 0) {
      const rows = ingredients.map((ing) => ({
        recipe_id: id,
        ingredient_name: ing.ingredient_name.trim(),
        gross_weight: ing.gross_weight,
        correction_factor: ing.correction_factor,
        net_weight: ing.net_weight,
        unit_cost: ing.unit_cost,
        ingredient_cost: ing.ingredient_cost,
        unit: ing.unit,
      }));

      const { error: ingError } = await supabase.from("recipe_ingredients").insert(rows);
      if (ingError) {
        console.error("Erro ao inserir ingredientes:", ingError);
        toast.error("Receita atualizada, mas houve erro ao salvar ingredientes");
      }
    }

    toast.success("Receita atualizada!");
    await fetchRecipes();
    return true;
  };

  const deleteRecipe = async (id: string) => {
    // ingredients cascade via FK? Let's delete manually to be safe
    await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (error) {
      console.error("Erro ao excluir receita:", error);
      toast.error("Erro ao excluir receita");
      return false;
    }
    toast.success("Receita excluída!");
    await fetchRecipes();
    return true;
  };

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  return {
    recipes,
    loading,
    fetchRecipes,
    fetchRecipeWithIngredients,
    addRecipe,
    updateRecipe,
    deleteRecipe,
  };
}
