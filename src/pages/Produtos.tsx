import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Filter,
  Package,
  Clock,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
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
import {
  suppliers,
  getIngredientStatus,
  getExpiryStatus,
  getDaysUntilExpiry,
  type Category,
} from "@/data/mockData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useMovements } from "@/hooks/useMovements";
import { useProducts, type Product, type ProductForm } from "@/hooks/useProducts";

const categories: Category[] = ["Bebidas", "Importados", "Proteínas", "Temperos", "Vegetais"];
const sortedSuppliers = [...suppliers].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

const emptyForm: ProductForm = {
  name: "",
  category: "Vegetais",
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

  const { items, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const { items: dbMovements } = useMovements();

  const lotesPerProduct = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const mov of dbMovements) {
      if (mov.lote && mov.lote.trim()) {
        if (!map[mov.product_id]) map[mov.product_id] = [];
        if (!map[mov.product_id].includes(mov.lote.trim())) {
          map[mov.product_id].push(mov.lote.trim());
        }
      }
    }
    return map;
  }, [dbMovements]);

  const latestExpiryPerProduct = useMemo(() => {
    const map: Record<string, string> = {};
    for (const mov of dbMovements) {
      if (mov.type === "in" && mov.expiry_date) {
        if (!map[mov.product_id] || new Date(mov.date) > new Date(map[mov.product_id] ? dbMovements.find(m => m.product_id === mov.product_id && m.expiry_date === map[mov.product_id])?.date || "" : "")) {
          map[mov.product_id] = mov.expiry_date;
        }
      }
    }
    return map;
  }, [dbMovements]);

  const filtered = useMemo(() => {
    const base = items.filter((i) => {
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "all" || i.category === categoryFilter;
      return matchSearch && matchCat;
    });

    // Sort: alphabetical when filtering by category, otherwise by recent movements
    if (categoryFilter !== "all") {
      return base.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    }
    return base.sort((a, b) => {
      const lastA = dbMovements.find((m) => m.product_id === a.id);
      const lastB = dbMovements.find((m) => m.product_id === b.id);
      const dateA = lastA ? new Date(lastA.date).getTime() : 0;
      const dateB = lastB ? new Date(lastB.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [items, search, categoryFilter, dbMovements]);

  const openAdd = () => {
    setEditingItem(null);
    setForm({ ...emptyForm, expiry_date: new Date().toISOString().split("T")[0] });
    setDialogOpen(true);
  };

  const openEdit = (item: Product) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category as Category,
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

  const statusBadge = (item: Product) => {
    const ingredient = { ...item, quantity: Number(item.quantity), min_quantity: Number(item.min_quantity) };
    const status = getIngredientStatus(ingredient as any);
    const expiryStatus = getExpiryStatus(item.expiry_date, item.alert_days);
    const days = getDaysUntilExpiry(item.expiry_date);
    const worst = status === "critical" || expiryStatus === "critical" ? "critical" : status === "warning" || expiryStatus === "warning" ? "warning" : "ok";

    return (
      <div className="flex flex-wrap gap-1">
        <Badge
          variant={worst === "ok" ? "default" : "destructive"}
          className={cn(worst === "ok" && "border-success/30 bg-success/10 text-success")}
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando produtos...</p>
      </div>
    );
  }

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
            {categories.map((c) => (
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
        <div className="w-full space-y-4">
          {filtered.map((item) => {
            const supplier = suppliers.find((s) => s.id === item.supplier_id);
            const productMovements = dbMovements.filter((m) => m.product_id === item.id)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return (
              <Card key={item.id} className="w-full max-w-none group transition-shadow hover:shadow-md overflow-hidden">
                <CardContent className="px-3 py-2 sm:px-4 sm:py-2.5">
                  <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-6">
                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="truncate text-[11px] sm:text-sm font-semibold">{item.name}</p>
                        <Badge variant="outline" className="shrink-0 text-[8px] sm:text-[10px] px-1 py-0">{item.category}</Badge>
                      </div>
                      <div className="flex gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 shrink-0">
                        <Button size="icon" variant="ghost" className="h-5 w-5 sm:h-6 sm:w-6" onClick={() => openEdit(item)}>
                          <Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" onClick={() => { setDeletingItem(item); setDeleteDialogOpen(true); }}>
                          <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 text-[10px] sm:text-xs sm:flex sm:flex-wrap sm:gap-4 lg:flex-1">
                      <span><span className="text-muted-foreground">Lotes:</span> <strong className="break-all">{(lotesPerProduct[item.id] || []).length > 0 ? (lotesPerProduct[item.id]).join(", ") : "—"}</strong></span>
                      <span><span className="text-muted-foreground">Qtd:</span> <strong>{item.quantity} {item.unit}</strong></span>
                      <span><span className="text-muted-foreground">Mín:</span> <strong>{item.min_quantity} {item.unit}</strong></span>
                      
                      <span><span className="text-muted-foreground">Val:</span> <strong>{format(new Date(item.expiry_date), "dd/MM/yy")}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 lg:shrink-0">
                      {statusBadge(item)}
                    </div>
                  </div>

                  {productMovements.length > 0 && (
                    <div className="mt-1.5 border-t pt-1.5 space-y-1">
                      {productMovements.map((mov) => (
                        <div key={mov.id} className="grid grid-cols-[auto_1fr_1fr_1fr] gap-x-2 gap-y-0.5 items-center text-[10px] sm:text-xs py-1 px-1.5 sm:px-2 rounded bg-muted/30">
                          <Badge className={cn("gap-0.5 text-[8px] sm:text-[10px] px-1 py-0 shrink-0", mov.type === "in" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                            {mov.type === "in" ? <><ArrowUpRight className="h-2.5 w-2.5" />Ent</> : <><ArrowDownRight className="h-2.5 w-2.5" />Saí</>}
                          </Badge>
                          <span><span className="text-muted-foreground">Qtd:</span> <strong>{mov.quantity}</strong></span>
                          <span><span className="text-muted-foreground">Data:</span> <strong>{format(new Date(mov.date), "dd/MM HH:mm")}</strong></span>
                          <span><span className="text-muted-foreground">Val:</span> <strong>{mov.expiry_date ? format(new Date(mov.expiry_date), "dd/MM/yy") : "—"}</strong></span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
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
            <div className="grid gap-2">
              <Label>Qtd. Mínima</Label>
              <Input type="number" value={form.min_quantity || ""} onChange={(e) => setForm({ ...form, min_quantity: Number(e.target.value) })} placeholder="0" />
            </div>
            <div className="grid gap-2">
              <Label>Fornecedor</Label>
              <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sortedSuppliers.map((s) => (
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
                onChange={(e) => setForm({ ...form, alert_days: Number(e.target.value) || 0 })}
                value={form.alert_days || ""}
                placeholder="Ex: 3 dias"
              />
              <p className="text-xs text-muted-foreground">Alerta será exibido quando faltar esse número de dias para vencer</p>
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
