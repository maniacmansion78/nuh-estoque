import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  created_by: string | null;
  created_at: string;
}

export interface SupplierForm {
  name: string;
  contact: string;
  email: string;
}

export function useSuppliers() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("suppliers" as any)
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Erro ao buscar fornecedores:", error);
      toast.error("Erro ao carregar fornecedores");
    } else {
      setItems((data as unknown) as Supplier[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const addSupplier = async (form: SupplierForm): Promise<string | null> => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;

    const { data, error } = await supabase
      .from("suppliers" as any)
      .insert({ name: form.name, contact: form.contact, email: form.email, created_by: userId })
      .select("id")
      .single();

    if (error) {
      console.error("Erro ao adicionar fornecedor:", error);
      toast.error("Erro ao adicionar fornecedor");
      return null;
    }

    toast.success("Fornecedor adicionado!");
    await fetchSuppliers();
    return (data as any).id;
  };

  const updateSupplier = async (id: string, form: SupplierForm): Promise<boolean> => {
    const { error } = await supabase
      .from("suppliers" as any)
      .update({ name: form.name, contact: form.contact, email: form.email })
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar fornecedor:", error);
      toast.error("Erro ao atualizar fornecedor");
      return false;
    }

    toast.success("Fornecedor atualizado!");
    await fetchSuppliers();
    return true;
  };

  const deleteSupplier = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("suppliers" as any).delete().eq("id", id);

    if (error) {
      console.error("Erro ao remover fornecedor:", error);
      toast.error("Erro ao remover fornecedor");
      return false;
    }

    toast.success("Fornecedor removido!");
    await fetchSuppliers();
    return true;
  };

  return { items, loading, fetchSuppliers, addSupplier, updateSupplier, deleteSupplier };
}
