import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Category } from "@/data/mockData";

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
}

export interface ProductForm {
  name: string;
  category: Category;
  quantity: number;
  unit: "kg" | "L" | "un";
  min_quantity: number;
  price: number;
  expiry_date: string;
  supplier_id: string;
  alert_days: number;
  lote: string;
}

export function useProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar produtos:", error);
      toast.error("Erro ao carregar produtos");
    } else {
      setItems(data as Product[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (form: ProductForm) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;

    const { data: inserted, error } = await supabase.from("products").insert({
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
      created_by: userId,
    }).select("id").single();

    if (error || !inserted) {
      console.error("Erro ao adicionar produto:", error);
      toast.error("Erro ao adicionar produto");
      return false;
    }

    // Register initial "in" movement so batch tracking works
    if (form.quantity > 0 && userId) {
      await supabase.from("movements").insert({
        product_id: inserted.id,
        type: "in",
        quantity: form.quantity,
        expiry_date: new Date(form.expiry_date).toISOString(),
        user_id: userId,
      });
    }

    toast.success("Produto adicionado!");
    await fetchProducts();
    return true;
  };

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
      })
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
