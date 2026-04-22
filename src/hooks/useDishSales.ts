 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
   const queryClient = useQueryClient();
 
   const { data: sales = [], isLoading: loading, refetch: fetchSales } = useQuery({
     queryKey: ["dish_sales"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("dish_sales")
         .select("*")
         .order("date", { ascending: false });
 
       if (error) throw error;
       return data as DishSale[];
     },
   });

   const addMutation = useMutation({
     mutationFn: async ({ recipeId, quantity, date }: { recipeId: string; quantity: number; date?: string }) => {
       const { data: userData } = await supabase.auth.getUser();
       if (!userData?.user?.id) throw new Error("Not logged in");
 
       const saleDate = date || (() => { const n = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`; })();
 
       const { error } = await supabase.from("dish_sales").insert({
         recipe_id: recipeId,
         quantity,
         date: saleDate,
         user_id: userData.user.id,
       });
 
       if (error) throw error;
     },
     onSuccess: () => {
       toast.success("Venda registrada!");
       queryClient.invalidateQueries({ queryKey: ["dish_sales"] });
     },
     onError: (error) => {
       console.error("Erro ao registrar venda:", error);
       toast.error("Erro ao registrar venda");
     },
   });
 
   const deleteMutation = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase.from("dish_sales").delete().eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       toast.success("Venda removida!");
       queryClient.invalidateQueries({ queryKey: ["dish_sales"] });
     },
     onError: (error) => {
       console.error("Erro ao remover venda:", error);
       toast.error("Erro ao remover venda");
     },
   });
 
   const addSale = async (recipeId: string, quantity: number, date?: string) => {
     try {
       await addMutation.mutateAsync({ recipeId, quantity, date });
       return true;
     } catch {
       return false;
     }
   };
 
   const deleteSale = async (id: string) => {
     try {
       await deleteMutation.mutateAsync(id);
       return true;
     } catch {
       return false;
     }
   };
 
   return { sales, loading, addSale, deleteSale, fetchSales };
}
