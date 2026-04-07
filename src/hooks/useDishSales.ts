import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DishSale {
  id: string;
  recipe_id: string;
  quantity: number;
  date: string;
  user_id: string;
  created_at: string;
}

export function useDishSales() {
  const [sales, setSales] = useState<DishSale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("dish_sales")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Erro ao buscar vendas:", error);
      toast.error("Erro ao carregar vendas");
    } else {
      setSales(data as DishSale[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const addSale = async (recipeId: string, quantity: number, date?: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) {
      toast.error("Você precisa estar logado");
      return false;
    }

    const { error } = await supabase.from("dish_sales").insert({
      recipe_id: recipeId,
      quantity,
      date: date || new Date().toISOString().split("T")[0],
      user_id: userData.user.id,
    });

    if (error) {
      console.error("Erro ao registrar venda:", error);
      toast.error("Erro ao registrar venda");
      return false;
    }

    toast.success("Venda registrada!");
    await fetchSales();
    return true;
  };

  const deleteSale = async (id: string) => {
    const { error } = await supabase.from("dish_sales").delete().eq("id", id);
    if (error) {
      console.error("Erro ao remover venda:", error);
      toast.error("Erro ao remover venda");
      return false;
    }
    toast.success("Venda removida!");
    await fetchSales();
    return true;
  };

  return { sales, loading, addSale, deleteSale, fetchSales };
}
