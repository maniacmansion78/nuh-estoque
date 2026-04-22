 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";


export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  price: number;
  expiry_date: string;
  supplier_id: string;
  alert_days: number;
  lote: string;
  created_by: string | null;
  created_at: string;
  price_per_kg?: number;
  price_per_liter?: number;
  correction_factor_enabled?: boolean;
  correction_factor_percent?: number | null;
  correction_factor_type?: "weight" | "price" | null;
  correction_factor_note?: string | null;
}

export interface ProductForm {
  name: string;
  category: string;
  quantity: number;
  unit: "kg" | "L" | "un";
  min_quantity: number;
  price: number;
  expiry_date: string;
  supplier_id: string;
  alert_days: number;
  lote: string;
  price_per_kg: number;
  price_per_liter: number;
  correction_factor_enabled: boolean;
  correction_factor_percent: number;
  correction_factor_type: "weight" | "price";
  correction_factor_note: string;
}

 export function useProducts() {
   const queryClient = useQueryClient();
 
   const { data: items = [], isLoading: loading, refetch: fetchProducts } = useQuery({
     queryKey: ["products"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("products")
         .select("*")
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       return data as Product[];
     },
   });

  const buildPayload = (form: ProductForm) => ({
    price_per_kg: form.price_per_kg ?? 0,
    price_per_liter: form.price_per_liter ?? 0,
    correction_factor_enabled: !!form.correction_factor_enabled,
    correction_factor_percent: form.correction_factor_enabled ? Number(form.correction_factor_percent) || 0 : null,
    correction_factor_type: form.correction_factor_enabled ? form.correction_factor_type : null,
    correction_factor_note: form.correction_factor_enabled ? (form.correction_factor_note || null) : null,
  });

   const addMutation = useMutation({
     mutationFn: async (form: ProductForm) => {
       const { data: userData } = await supabase.auth.getUser();
       const userId = userData?.user?.id || null;
 
       const { error } = await supabase.from("products").insert({
         name: form.name,
         category: form.category,
         unit: form.unit,
         min_quantity: form.min_quantity,
         supplier_id: form.supplier_id,
         alert_days: form.alert_days,
         created_by: userId,
         ...buildPayload(form),
       } as never);
 
       if (error) throw error;
     },
     onSuccess: () => {
       toast.success("Produto adicionado!");
       queryClient.invalidateQueries({ queryKey: ["products"] });
     },
     onError: (error) => {
       console.error("Erro ao adicionar produto:", error);
       toast.error("Erro ao adicionar produto");
     },
   });
 
   const addProduct = (form: ProductForm) => addMutation.mutateAsync(form);

  const updateProduct = async (id: string, form: ProductForm) => {
    const { error } = await supabase
      .from("products")
      .update({
        name: form.name,
        category: form.category,
        quantity: form.quantity,
        unit: form.unit,
        min_quantity: form.min_quantity,
        price: form.price,
        expiry_date: new Date(form.expiry_date).toISOString(),
        supplier_id: form.supplier_id,
        alert_days: form.alert_days,
        lote: form.lote,
        ...buildPayload(form),
      } as never)
      .eq("id", id);
    if (error) {
      console.error("Erro ao atualizar produto:", error);
      toast.error("Erro ao atualizar produto");
      return false;
    }
    toast.success("Produto atualizado!");
    await fetchProducts();
    return true;
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error("Erro ao remover produto:", error);
      toast.error("Erro ao remover produto");
      return false;
    }
    toast.success("Produto removido!");
    await fetchProducts();
    return true;
  };

  return { items, loading, addProduct, updateProduct, deleteProduct, fetchProducts };
}
