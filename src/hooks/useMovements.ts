import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DbMovement {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  date: string;
  expiry_date: string | null;
  user_id: string;
  created_at: string;
  lote: string;
}

export function useMovements() {
  const [items, setItems] = useState<DbMovement[]>([]);
  const [loading, setLoading] = useState(true);

   const fetchMovements = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
     try {
       const { data, error } = await supabase
         .from("movements")
         .select("*")
         .order("date", { ascending: false })
         .abortSignal(signal || new AbortController().signal);
 
       if (error) {
         if (error.code !== 'ABORT_ERROR') {
           console.error("Erro ao buscar movimentações:", error);
           toast.error("Erro ao carregar movimentações");
         }
       } else {
         setItems(data as DbMovement[]);
       }
     } finally {
       setLoading(false);
     }
  }, []);

  useEffect(() => {
     const controller = new AbortController();
     fetchMovements(controller.signal);
     return () => controller.abort();
  }, [fetchMovements]);

  const addMovement = async (movement: {
    product_id: string;
    type: "in" | "out";
    quantity: number;
    expiry_date?: string | null;
    lote?: string;
  }) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) {
      toast.error("Você precisa estar logado");
      return false;
    }

    const { error } = await supabase.from("movements").insert({
      product_id: movement.product_id,
      type: movement.type,
      quantity: movement.quantity,
      expiry_date: movement.expiry_date || null,
      lote: movement.lote || "",
      user_id: userData.user.id,
    });

    if (error) {
      console.error("Erro ao registrar movimentação:", error);
      toast.error("Erro ao registrar movimentação");
      return false;
    }

    // Update product quantity
    const { data: product } = await supabase
      .from("products")
      .select("quantity")
      .eq("id", movement.product_id)
      .single();

    if (product) {
      const currentQty = Number(product.quantity);
      const newQty = movement.type === "in"
        ? Math.round((currentQty + movement.quantity) * 100) / 100
        : Math.round((currentQty - movement.quantity) * 100) / 100;

      {
        const finalQty = Math.max(0, newQty);
        const { error: updError } = await supabase
          .from("products")
          .update({ quantity: finalQty })
          .eq("id", movement.product_id);

        if (updError) {
          console.error("Erro ao atualizar quantidade:", updError);
        }
      }
    }
    await fetchMovements();
    return true;
  };

  const updateMovement = async (
    id: string,
    updates: { quantity?: number; expiry_date?: string | null; lote?: string }
  ) => {
    const { error } = await supabase
      .from("movements")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar movimentação:", error);
      toast.error("Erro ao atualizar movimentação");
      return false;
    }
    toast.success("Movimentação atualizada!");
    await fetchMovements();
    return true;
  };

  const deleteMovement = async (id: string) => {
    const { error } = await supabase.from("movements").delete().eq("id", id);
    if (error) {
      console.error("Erro ao remover movimentação:", error);
      toast.error("Erro ao remover movimentação");
      return false;
    }
    toast.success("Movimentação removida!");
    await fetchMovements();
    return true;
  };

  return { items, loading, addMovement, updateMovement, deleteMovement, fetchMovements };
}
