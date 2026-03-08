import { useState, useEffect } from "react";
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
import {
  suppliers as mockSuppliers,
  ingredients,
  getIngredientStatus,
  type Supplier,
} from "@/data/mockData";
import { useProducts, type Product } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Fornecedores = () => {
  const [items, setItems] = useState<Supplier[]>(mockSuppliers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: "", contact: "", email: "" });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const { items: products, fetchProducts } = useProducts();

  const lowStockItems = ingredients.filter((i) => getIngredientStatus(i) !== "ok");

  const openAdd = () => {
    setEditingItem(null);
    setForm({ name: "", contact: "", email: "" });
    setSelectedProductIds([]);
    setDialogOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingItem(s);
    setForm({ name: s.name, contact: s.contact, email: s.email });
    // Pre-select products that already belong to this supplier
    const supplierProducts = products.filter((p) => p.supplier_id === s.id);
    setSelectedProductIds(supplierProducts.map((p) => p.id));
    setDialogOpen(true);
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    let supplierId: string;

    if (editingItem) {
      supplierId = editingItem.id;
      setItems((prev) => prev.map((i) => (i.id === editingItem.id ? { ...i, ...form } : i)));
      toast.success("Fornecedor atualizado!");
    } else {
      supplierId = `s${Date.now()}`;
      setItems((prev) => [...prev, { id: supplierId, ...form }]);
      toast.success("Fornecedor adicionado!");
    }

    // Update products: set supplier_id for selected, clear for unselected
    const previousProducts = products.filter((p) => p.supplier_id === supplierId);
    const previousIds = previousProducts.map((p) => p.id);

    // Products to assign to this supplier
    const toAssign = selectedProductIds.filter((id) => !previousIds.includes(id));
    // Products to unassign from this supplier
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
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Fornecedor removido!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Fornecedores</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Gerencie seus fornecedores e faça pedidos</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:gap-3">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs sm:size-default sm:gap-2 sm:text-sm" onClick={() => setReorderOpen(true)}>
            <ShoppingCart className="h-4 w-4" />
            Reposição
          </Button>
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
            const totalItems = supplierProducts.length;
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
                          {totalItems} itens
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
                        <Badge key={p.id} variant="secondary" className="text-xs">
                          {p.name}
                        </Badge>
                      ))}
                      {supplierProducts.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{supplierProducts.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
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
                      <label
                        key={product.id}
                        className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedProductIds.includes(product.id)}
                          onCheckedChange={() => toggleProduct(product.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.category} · {product.quantity} {product.unit}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              )}
              {selectedProductIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedProductIds.length} produto(s) selecionado(s)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingItem ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reorder list */}
      <Dialog open={reorderOpen} onOpenChange={setReorderOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Lista de Reposição</DialogTitle>
            <DialogDescription>Itens com estoque abaixo do mínimo que precisam ser repostos.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] space-y-3 overflow-y-auto py-4">
            {lowStockItems.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">Todos os itens estão com estoque adequado! 🎉</p>
            ) : (
              lowStockItems.map((item) => {
                const supplier = mockSuppliers.find((s) => s.id === item.supplier_id);
                const needed = item.min_quantity - item.quantity;
                return (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{supplier?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-destructive">
                        Faltam {needed.toFixed(1)} {item.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Atual: {item.quantity} / Min: {item.min_quantity}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReorderOpen(false)}>Fechar</Button>
            <Button onClick={() => { toast.success("Lista de reposição copiada!"); setReorderOpen(false); }}>
              Copiar Lista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Fornecedores;
