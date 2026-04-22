import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const { data: items = [], isLoading: loading, refetch: fetchMovements } = useQuery({
    queryKey: ["movements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movements")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      return data as DbMovement[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (movement: {
      product_id: string;
      type: "in" | "out";
      quantity: number;
      expiry_date?: string | null;
      lote?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error("Not logged in");

      const { error } = await supabase.from("movements").insert({
        product_id: movement.product_id,
        type: movement.type,
        quantity: movement.quantity,
        expiry_date: movement.expiry_date || null,
        lote: movement.lote || "",
        user_id: userData.user.id,
      });

      if (error) throw error;

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

        const finalQty = Math.max(0, newQty);
        const { error: updError } = await supabase
          .from("products")
          .update({ quantity: finalQty })
          .eq("id", movement.product_id);

        if (updError) console.error("Erro ao atualizar quantidade:", updError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("Erro ao registrar movimentação:", error);
      toast.error("Erro ao registrar movimentação");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase.from("movements").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Movimentação atualizada!");
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar movimentação:", error);
      toast.error("Erro ao atualizar movimentação");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("movements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Movimentação removida!");
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (error) => {
      console.error("Erro ao remover movimentação:", error);
      toast.error("Erro ao remover movimentação");
    },
  });

  const addMovement = async (m: any) => {
    try {
      await addMutation.mutateAsync(m);
      return true;
    } catch {
      return false;
    }
  };

  const updateMovement = async (id: string, updates: any) => {
    try {
      await updateMutation.mutateAsync({ id, updates });
      return true;
    } catch {
      return false;
    }
  };

  const deleteMovement = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  return { items, loading, addMovement, updateMovement, deleteMovement, fetchMovements };
}
