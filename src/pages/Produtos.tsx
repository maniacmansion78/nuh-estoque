 import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Package,
  Edit,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
 import { useProducts, type Product, type ProductForm } from "@/hooks/useProducts";
 import { useDebounce } from "@/hooks/useDebounce";

import { useAuth } from "@/contexts/AuthContext";

const emptyForm: ProductForm = {
  name: "",
  category: "",
  quantity: 0,
  unit: "kg",
  min_quantity: 0,
  price: 0,
  expiry_date: new Date().toISOString().split("T")[0],
  supplier_id: "s1",
  alert_days: 3,
  lote: "",
  price_per_kg: 0,
  price_per_liter: 0,
  correction_factor_enabled: false,
  correction_factor_percent: 0,
  correction_factor_type: "weight",
  correction_factor_note: "",
};

const Produtos = () => {
  const [search, setSearch] = useState("");
   const debouncedSearch = useDebounce(search, 300);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | null>(null);
  const [deletingItem, setDeletingItem] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
   const { isAdmin } = useAuth();
  const { items, loading, addProduct, updateProduct, deleteProduct } = useProducts();

  const filtered = useMemo(() => {
    return items
       .filter((i) => i.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
   }, [items, debouncedSearch]);

   const openAdd = useCallback(() => {
    setEditingItem(null);
    setForm({ ...emptyForm, expiry_date: new Date().toISOString().split("T")[0] });
    setDialogOpen(true);
   }, []);

   const openEdit = useCallback((item: Product) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit as "kg" | "L" | "un",
      min_quantity: item.min_quantity,
      price: item.price,
      expiry_date: item.expiry_date.split("T")[0],
      supplier_id: item.supplier_id,
      alert_days: item.alert_days,
      lote: item.lote,
      price_per_kg: item.price_per_kg ?? 0,
      price_per_liter: item.price_per_liter ?? 0,
      correction_factor_enabled: item.correction_factor_enabled ?? false,
      correction_factor_percent: item.correction_factor_percent ?? 0,
      correction_factor_type: (item.correction_factor_type as "weight" | "price") ?? "weight",
      correction_factor_note: item.correction_factor_note ?? "",
    });
    setDialogOpen(true);
   }, []);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      let success: boolean;
      if (editingItem) {
        success = await updateProduct(editingItem.id, form);
      } else {
        success = await addProduct(form);
      }
      if (success) setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setSaving(true);
    try {
      const success = await deleteProduct(deletingItem.id);
      if (success) {
        setDeleteDialogOpen(false);
        setDeletingItem(null);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando insumos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Insumos <span className="text-lg font-normal text-muted-foreground">({items.length})</span>
          </h1>
          <p className="text-muted-foreground">Gerencie todos os insumos do estoque</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Novo Produto</span>
          </Button>
        </div>
      </div>

       <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
         <Input 
           placeholder="Buscar produto..." 
           className="pl-10" 
           value={search} 
            onChange={(e) => setSearch(e.target.value)}
         />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum produto encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground/70">Tente ajustar a busca ou adicione um novo produto</p>
          </CardContent>
        </Card>
      ) : (
         <div className="w-full space-y-4">
          <div className="space-y-2">
            {filtered.map((item) => (
              <Card key={item.id} className="w-full max-w-none group transition-shadow hover:shadow-md">
                <CardContent className="px-3 py-2 sm:px-4 sm:py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{item.unit}</span>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(item)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => { setDeletingItem(item); setDeleteDialogOpen(true); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
           </div>
         </div>
       )}

      {/* Add/Edit Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85dvh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Atualize as informações do produto." : "Preencha os dados do novo produto."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Unidade</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v as "kg" | "L" | "un" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="un">un</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Preço por KG (R$)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.price_per_kg || ""}
                onChange={(e) => setForm({ ...form, price_per_kg: Number(e.target.value) || 0 })}
                placeholder="Ex: 50.00"
              />
              <p className="text-xs text-muted-foreground">
                Usado para calcular automaticamente o custo nas receitas com base nas gramas.
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Preço por Litro (R$)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.price_per_liter || ""}
                onChange={(e) => setForm({ ...form, price_per_liter: Number(e.target.value) || 0 })}
                placeholder="Ex: 12.00"
              />
              <p className="text-xs text-muted-foreground">
                Usado para calcular automaticamente o custo de líquidos nas receitas (ml ou L).
              </p>
            </div>

            {/* Fator de Correção */}
            <div className="grid gap-2 rounded-lg border-2 border-dashed border-orange-300 bg-orange-50/40 p-3 dark:bg-orange-950/10">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.correction_factor_enabled}
                  onChange={(e) => setForm({ ...form, correction_factor_enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-primary"
                />
                <span className="text-sm font-semibold">Aplicar Fator de Correção</span>
              </label>
              <p className="text-xs text-muted-foreground">
                Use quando o insumo perde peso ou valor após preparo (descongelar, limpar, cozinhar).
              </p>

              {form.correction_factor_enabled && (
                <div className="space-y-2 pt-2">
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="cf-type"
                        checked={form.correction_factor_type === "weight"}
                        onChange={() => setForm({ ...form, correction_factor_type: "weight" })}
                      />
                      Peso (perda)
                    </label>
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="cf-type"
                        checked={form.correction_factor_type === "price"}
                        onChange={() => setForm({ ...form, correction_factor_type: "price" })}
                      />
                      Preço (acréscimo)
                    </label>
                  </div>

                  <div className="grid gap-1">
                    <Label className="text-xs">Percentual (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={form.correction_factor_percent || ""}
                      onChange={(e) => setForm({ ...form, correction_factor_percent: Number(e.target.value) || 0 })}
                      placeholder="Ex: 6"
                    />
                  </div>

                  <div className="grid gap-1">
                    <Label className="text-xs">Observação</Label>
                    <Input
                      value={form.correction_factor_note}
                      onChange={(e) => setForm({ ...form, correction_factor_note: e.target.value })}
                      placeholder="Ex: Perda por descongelamento"
                    />
                  </div>

                  {form.correction_factor_percent > 0 && form.price_per_kg > 0 && (
                    <div className="rounded-md bg-orange-100/60 dark:bg-orange-900/20 px-2 py-1.5 text-xs space-y-0.5">
                      {form.correction_factor_type === "weight" ? (
                        <>
                          <p>Com {form.correction_factor_percent}% de perda: <strong>1kg comprado = {(1000 * (1 - form.correction_factor_percent / 100)).toFixed(0)}g úteis</strong></p>
                          <p>Custo real por grama: <strong>R$ {(form.price_per_kg / 1000 / (1 - form.correction_factor_percent / 100)).toFixed(4)}</strong> (antes: R$ {(form.price_per_kg / 1000).toFixed(4)})</p>
                        </>
                      ) : (
                        <p>Preço ajustado: <strong>R$ {(form.price_per_kg * (1 + form.correction_factor_percent / 100)).toFixed(2)}/kg</strong> (antes: R$ {form.price_per_kg.toFixed(2)})</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : editingItem ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover <strong>{deletingItem?.name}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>{saving ? "Excluindo..." : "Excluir"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Produtos;
