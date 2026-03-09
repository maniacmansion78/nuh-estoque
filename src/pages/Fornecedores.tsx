import { useState } from "react";
import { Plus, Edit, Trash2, Truck, ShoppingCart, Mail, Phone, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSuppliers, type SupplierForm } from "@/hooks/useSuppliers";
import { useProducts, type Product } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Fornecedores = () => {
  const { items, loading, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const { items: products, fetchProducts } = useProducts();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SupplierForm>({ name: "", contact: "", email: "" });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: "", contact: "", email: "" });
    setSelectedProductIds([]);
    setDialogOpen(true);
  };

  const openEdit = (s: { id: string; name: string; contact: string; email: string }) => {
    setEditingId(s.id);
    setForm({ name: s.name, contact: s.contact, email: s.email });
    const supplierProducts = products.filter((p) => p.supplier_id === s.id);
    setSelectedProductIds(supplierProducts.map((p) => p.id));
    setDialogOpen(true);
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setSaving(true);
    try {
      let supplierId: string | null;

      if (editingId) {
        const ok = await updateSupplier(editingId, form);
        supplierId = ok ? editingId : null;
      } else {
        supplierId = await addSupplier(form);
      }

      if (!supplierId) return;

      // Update product-supplier links
      const previousProducts = products.filter((p) => p.supplier_id === supplierId);
      const previousIds = previousProducts.map((p) => p.id);
      const toAssign = selectedProductIds.filter((id) => !previousIds.includes(id));
      const toUnassign = previousIds.filter((id) => !selectedProductIds.includes(id));

      for (const pid of toAssign) {
        await supabase.from("products").update({ supplier_id: supplierId }).eq("id", pid);
      }
      for (const pid of toUnassign) {
        await supabase.from("products").update({ supplier_id: "" }).eq("id", pid);
      }

      if (toAssign.length > 0 || toUnassign.length > 0) {
        await fetchProducts();
      }

      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteSupplier(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando fornecedores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Fornecedores</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Gerencie seus fornecedores e faça pedidos</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button size="sm" className="gap-1.5 text-xs sm:size-default sm:gap-2 sm:text-sm" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Novo Fornecedor
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Truck className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum fornecedor cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => {
            const supplierProducts = products.filter((p) => p.supplier_id === s.id);
            return (
              <Card key={s.id} className="group transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
                        <Truck className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {supplierProducts.length} itens
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(s)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {s.contact}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {s.email}
                    </div>
                  </div>
                  {supplierProducts.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {supplierProducts.slice(0, 3).map((p) => (
                        <Badge key={p.id} variant="secondary" className="text-xs">{p.name}</Badge>
                      ))}
                      {supplierProducts.length > 3 && (
                        <Badge variant="secondary" className="text-xs">+{supplierProducts.length - 3}</Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
            <DialogDescription>Preencha os dados do fornecedor.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Telefone</Label>
              <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produtos deste fornecedor
              </Label>
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum produto cadastrado ainda.</p>
              ) : (
                <ScrollArea className="h-[180px] rounded-md border border-border p-3">
                  <div className="space-y-2">
                    {products.map((product) => (
                      <label key={product.id} className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/50">
                        <Checkbox checked={selectedProductIds.includes(product.id)} onCheckedChange={() => toggleProduct(product.id)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category} · {product.quantity} {product.unit}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              )}
              {selectedProductIds.length > 0 && (
                <p className="text-xs text-muted-foreground">{selectedProductIds.length} produto(s) selecionado(s)</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : editingId ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Fornecedores;
