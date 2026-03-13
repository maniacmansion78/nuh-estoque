import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CategoryRow {
  id: string;
  name: string;
  created_at: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Erro ao buscar categorias:", error);
      toast.error("Erro ao carregar categorias");
    } else {
      setCategories(data as CategoryRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Nome da categoria é obrigatório");
      return false;
    }
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Essa categoria já existe");
      return false;
    }
    const { error } = await supabase.from("categories").insert({ name: trimmed });
    if (error) {
      console.error("Erro ao adicionar categoria:", error);
      toast.error("Erro ao adicionar categoria");
      return false;
    }
    toast.success("Categoria adicionada!");
    await fetchCategories();
    return true;
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      console.error("Erro ao remover categoria:", error);
      toast.error("Erro ao remover categoria");
      return false;
    }
    toast.success("Categoria removida!");
    await fetchCategories();
    return true;
  };

  return { categories, loading, addCategory, deleteCategory, fetchCategories };
}
