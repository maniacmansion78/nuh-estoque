import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Filter,
  Package,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useProducts, type Product, type ProductForm } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";

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
};

const Produtos = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | null>(null);
  const [deletingItem, setDeletingItem] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  // Category management state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  const { isAdmin } = useAuth();
  const { items, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const { categories, addCategory, deleteCategory } = useCategories();

  const categoryNames = useMemo(() => categories.map((c) => c.name).sort((a, b) => a.localeCompare(b, "pt-BR")), [categories]);

  const filtered = useMemo(() => {
    return items
      .filter((i) => {
        const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
        const matchCat = categoryFilter === "all" || i.category === categoryFilter;
        return matchSearch && matchCat;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [items, search, categoryFilter]);

  const openAdd = () => {
    setEditingItem(null);
    setForm({ ...emptyForm, category: categoryNames[0] || "", expiry_date: new Date().toISOString().split("T")[0] });
    setDialogOpen(true);
  };

  const openEdit = (item: Product) => {
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
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      const { toast } = await import("sonner");
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

  const handleAddCategory = async () => {
    const success = await addCategory(newCategoryName);
    if (success) {
      setNewCategoryName("");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setDeletingCategoryId(id);
    const success = await deleteCategory(id);
    setDeletingCategoryId(null);
    return success;
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar produto..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categoryNames.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum produto encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground/70">Tente ajustar os filtros ou adicione um novo produto</p>
          </CardContent>
        </Card>
      ) : (
        <div className="w-full space-y-2">
          {filtered.map((item) => (
              <Card key={item.id} className="w-full max-w-none group transition-shadow hover:shadow-md">
                <CardContent className="px-3 py-2 sm:px-4 sm:py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">{item.category}</Badge>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Categoria</Label>
                  <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setCategoryDialogOpen(true)}>
                    Gerenciar
                  </Button>
                </div>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categoryNames.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : editingItem ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Management Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
            <DialogDescription>Adicione ou remova categorias de produtos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Input
                placeholder="Nova categoria..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
              <Button size="sm" onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria cadastrada</p>
              )}
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-sm">{cat.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    disabled={deletingCategoryId === cat.id}
                    onClick={() => handleDeleteCategory(cat.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
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
