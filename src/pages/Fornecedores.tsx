import { useState } from "react";
import { Plus, Edit, Trash2, Truck, ShoppingCart, Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";

const Fornecedores = () => {
  const [items, setItems] = useState<Supplier[]>(mockSuppliers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: "", contact: "", email: "" });

  const lowStockItems = ingredients.filter((i) => getIngredientStatus(i) !== "ok");

  const openAdd = () => {
    setEditingItem(null);
    setForm({ name: "", contact: "", email: "" });
    setDialogOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingItem(s);
    setForm({ name: s.name, contact: s.contact, email: s.email });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    if (editingItem) {
      setItems((prev) => prev.map((i) => (i.id === editingItem.id ? { ...i, ...form } : i)));
      toast.success("Fornecedor atualizado!");
    } else {
      setItems((prev) => [...prev, { id: `s${Date.now()}`, ...form }]);
      toast.success("Fornecedor adicionado!");
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
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Fornecedores</h1>
          <p className="text-muted-foreground">Gerencie seus fornecedores e faça pedidos</p>
        </div>
        <div className="flex gap-3">
          <Button size="lg" variant="outline" className="gap-2" onClick={() => setReorderOpen(true)}>
            <ShoppingCart className="h-5 w-5" />
            Pedir Reposição
          </Button>
          <Button size="lg" className="gap-2" onClick={openAdd}>
            <Plus className="h-5 w-5" />
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
            const supplierIngredients = ingredients.filter((i) => i.supplier_id === s.id);
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
                          {supplierIngredients.length} itens
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
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
