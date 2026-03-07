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
}

export function useMovements() {
  const [items, setItems] = useState<DbMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("movements")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Erro ao buscar movimentações:", error);
      toast.error("Erro ao carregar movimentações");
    } else {
      setItems(data as DbMovement[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const addMovement = async (movement: {
    product_id: string;
    type: "in" | "out";
    quantity: number;
    expiry_date?: string | null;
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

      if (newQty <= 0) {
        await supabase
          .from("products")
          .delete()
          .eq("id", movement.product_id);
      } else {
        await supabase
          .from("products")
          .update({ quantity: newQty })
          .eq("id", movement.product_id);
      }
    }

    await fetchMovements();
    return true;
  };

  return { items, loading, addMovement, fetchMovements };
}
