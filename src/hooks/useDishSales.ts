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

   const fetchSales = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
     try {
       const { data, error } = await supabase
         .from("dish_sales")
         .select("*")
         .order("date", { ascending: false })
         .abortSignal(signal || new AbortController().signal);
 
       if (error) {
         if (error.code !== 'ABORT_ERROR') {
           console.error("Erro ao buscar vendas:", error);
           toast.error("Erro ao carregar vendas");
         }
       } else {
         setSales(data as DishSale[]);
       }
     } finally {
       setLoading(false);
     }
  }, []);

  useEffect(() => {
     const controller = new AbortController();
     fetchSales(controller.signal);
     return () => controller.abort();
  }, [fetchSales]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("dish_sales-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dish_sales" },
        () => {
          fetchSales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSales]);

  const addSale = async (recipeId: string, quantity: number, date?: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) {
      toast.error("Você precisa estar logado");
      return false;
    }

    const saleDate = date || (() => { const n = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`; })();

    const { data, error } = await supabase
      .from("dish_sales")
      .insert({
        recipe_id: recipeId,
        quantity,
        date: saleDate,
        user_id: userData.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao registrar venda:", error);
      toast.error("Erro ao registrar venda");
      return false;
    }

    if (data) {
      setSales((prev) => [data as DishSale, ...prev]);
    }

    toast.success("Venda registrada!");
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
    return true;
  };

  return { sales, loading, addSale, deleteSale, fetchSales };
}
