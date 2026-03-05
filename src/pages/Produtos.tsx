import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Filter,
  Package,
  Clock,
  TrendingDown,
  Edit,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  ingredients as mockIngredients,
  suppliers,
  getIngredientStatus,
  getExpiryStatus,
  getDaysUntilExpiry,
  type Ingredient,
  type Category,
} from "@/data/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

const categories: Category[] = ["Vegetais", "Proteínas", "Temperos", "Bebidas"];

const Produtos = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [items, setItems] = useState<Ingredient[]>(mockIngredients);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [deletingItem, setDeletingItem] = useState<Ingredient | null>(null);

  const [form, setForm] = useState({
    name: "",
    category: "Vegetais" as Category,
    quantity: 0,
    unit: "kg" as "kg" | "L" | "un",
    min_quantity: 0,
    price: 0,
    expiry_date: "",
    supplier_id: "s1",
    alert_days: 3,
  });

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "all" || i.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [items, search, categoryFilter]);

  const openAdd = () => {
    setEditingItem(null);
    setForm({
      name: "",
      category: "Vegetais",
      quantity: 0,
      unit: "kg",
      min_quantity: 0,
      price: 0,
      expiry_date: new Date().toISOString().split("T")[0],
      supplier_id: "s1",
      alert_days: 3,
    });
    setDialogOpen(true);
  };

  const openEdit = (item: Ingredient) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      min_quantity: item.min_quantity,
      price: item.price,
      expiry_date: item.expiry_date.split("T")[0],
      supplier_id: item.supplier_id,
      alert_days: item.alert_days,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (editingItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? { ...i, ...form, expiry_date: new Date(form.expiry_date).toISOString() }
            : i
        )
      );
      toast.success("Produto atualizado!");
    } else {
      const newItem: Ingredient = {
        id: `i${Date.now()}`,
        ...form,
        expiry_date: new Date(form.expiry_date).toISOString(),
        alert_days: form.alert_days,
      };
      setItems((prev) => [...prev, newItem]);
      toast.success("Produto adicionado!");
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deletingItem) return;
    setItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
    toast.success("Produto removido!");
    setDeleteDialogOpen(false);
    setDeletingItem(null);
  };

  const statusBadge = (item: Ingredient) => {
    const status = getIngredientStatus(item);
    const expiryStatus = getExpiryStatus(item.expiry_date, item.alert_days);
    const days = getDaysUntilExpiry(item.expiry_date);
    const worst = status === "critical" || expiryStatus === "critical" ? "critical" : status === "warning" || expiryStatus === "warning" ? "warning" : "ok";

    return (
      <div className="flex flex-wrap gap-1">
        <Badge
          variant={worst === "ok" ? "default" : "destructive"}
          className={cn(
            worst === "ok" && "border-success/30 bg-success/10 text-success"
          )}
        >
          {worst === "ok" ? "OK" : worst === "warning" ? "Alerta" : "Crítico"}
        </Badge>
        {expiryStatus !== "ok" && (
          <Badge variant="outline" className="gap-1 text-xs">
            <Clock className="h-3 w-3" /> {days}d
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Produtos</h1>
          <p className="text-muted-foreground">Gerencie todos os produtos do estoque</p>
        </div>
        <Button size="lg" className="gap-2" onClick={openAdd}>
          <Plus className="h-5 w-5" />
          Novo Produto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum produto encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              Tente ajustar os filtros ou adicione um novo produto
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="w-full space-y-4">
          {filtered.map((item) => {
            const supplier = suppliers.find((s) => s.id === item.supplier_id);
            return (
              <Card key={item.id} className="w-full max-w-none group transition-shadow hover:shadow-md">
                <CardContent className="px-4 py-2.5">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-6">
                    {/* Nome + categoria inline */}
                    <div className="flex items-center gap-2 min-w-0 lg:w-44 lg:shrink-0">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <Badge variant="outline" className="shrink-0 text-[10px]">{item.category}</Badge>
                    </div>

                    {/* Infos inline */}
                    <div className="flex flex-wrap items-center gap-4 text-xs lg:flex-1">
                      <span><span className="text-muted-foreground">Qtd:</span> <strong>{item.quantity} {item.unit}</strong></span>
                      <span><span className="text-muted-foreground">Mín:</span> <strong>{item.min_quantity} {item.unit}</strong></span>
                      <span><span className="text-muted-foreground">Preço:</span> <strong>R$ {item.price.toFixed(2)}</strong></span>
                      <span><span className="text-muted-foreground">Val:</span> <strong>{format(new Date(item.expiry_date), "dd/MM/yy")}</strong></span>
                    </div>

                    {/* Status + fornecedor + ações */}
                    <div className="flex items-center gap-2 lg:shrink-0">
                      {statusBadge(item)}
                      {supplier && (
                        <span className="truncate text-[11px] text-muted-foreground max-w-[100px]">{supplier.name}</span>
                      )}
                      <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(item)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => { setDeletingItem(item); setDeleteDialogOpen(true); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85dvh] overflow-y-auto">
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
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantidade</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label>Qtd. Mínima</Label>
                <Input type="number" value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Preço Médio (R$)</Label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label>Validade</Label>
                <Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Fornecedor</Label>
              <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Dias de alerta antes do vencimento</Label>
              <Input
                type="number"
                min={1}
                value={form.alert_days}
                onChange={(e) => setForm({ ...form, alert_days: Number(e.target.value) })}
                placeholder="Ex: 3 dias"
              />
              <p className="text-xs text-muted-foreground">
                Alerta será exibido quando faltar esse número de dias para vencer
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingItem ? "Salvar" : "Adicionar"}</Button>
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
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Produtos;
