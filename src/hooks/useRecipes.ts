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

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  return { recipes, loading, fetchRecipes, fetchRecipeWithIngredients };
}
