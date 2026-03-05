import { useState, useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Plus, CalendarIcon, Package } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useProducts } from "@/hooks/useProducts";
import { useMovements } from "@/hooks/useMovements";

const Movimentacoes = () => {
  const { items: dbProducts, loading: productsLoading } = useProducts();
  const { items: dbMovements, loading: movementsLoading, addMovement } = useMovements();

  const allProducts = useMemo(() => {
    return dbProducts.map((p) => ({
      id: p.id,
      name: p.name,
      quantity: Number(p.quantity),
      unit: p.unit,
      price: Number(p.price),
      expiry_date: p.expiry_date,
    }));
  }, [dbProducts]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    product_id: "",
    type: "in" as "in" | "out",
    quantity: 0,
    expiry_date: undefined as Date | undefined,
  });

  // Group movements by product, newest first
  const groupedByProduct = useMemo(() => {
    const groups: Record<string, typeof dbMovements> = {};
    for (const mov of dbMovements) {
      if (!groups[mov.product_id]) groups[mov.product_id] = [];
      groups[mov.product_id].push(mov);
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return groups;
  }, [dbMovements]);

  const handleSave = async () => {
    if (form.quantity <= 0) { toast.error("Quantidade deve ser maior que zero"); return; }
    if (form.type === "in" && !form.expiry_date) { toast.error("Informe a data de validade"); return; }

    const product = allProducts.find((i) => i.id === form.product_id);
    if (!product) { toast.error("Produto não encontrado"); return; }

    if (form.type === "out" && product.quantity < form.quantity) {
      toast.error(`Estoque insuficiente. Disponível: ${product.quantity} ${product.unit}`);
      return;
    }

    setSaving(true);
    try {
      const success = await addMovement({
        product_id: form.product_id,
        type: form.type,
        quantity: form.quantity,
        expiry_date: form.type === "in" && form.expiry_date ? form.expiry_date.toISOString() : null,
      });

      if (success) {
        toast.success(
          form.type === "in"
            ? `Entrada registrada! ${product.name}`
            : `Saída registrada! ${product.name}`
        );
        setDialogOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  if (productsLoading || movementsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando movimentações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Movimentações</h1>
          <p className="text-muted-foreground">Histórico de entradas e saídas do estoque</p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => {
          setForm({ product_id: allProducts[0]?.id || "", type: "in", quantity: 0, expiry_date: undefined });
          setDialogOpen(true);
        }}>
          <Plus className="h-5 w-5" />
          Nova Movimentação
        </Button>
      </div>

      {dbMovements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ArrowLeftRight className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">Nenhuma movimentação registrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="w-full space-y-6">
          {Object.entries(groupedByProduct).map(([productId, movs]) => {
            const ing = allProducts.find((i) => i.id === productId);
            if (!ing) return null;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const newEntries = movs.filter((m) => new Date(m.date) >= today);
            const previousEntries = movs.filter((m) => new Date(m.date) < today);

            return (
              <div key={productId}>
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">{ing.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    Estoque: {ing.quantity} {ing.unit} · R$ {ing.price.toFixed(2)}/{ing.unit}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {newEntries.map((mov) => (
                    <Card key={mov.id} className="min-w-[200px] flex-1 max-w-xs border-success/30">
                      <CardContent className="px-4 py-2.5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge className="gap-1 text-[10px] px-1.5 py-0.5 bg-success/10 text-success">
                            <ArrowUpRight className="h-3 w-3" />Nova
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(mov.date), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span><span className="text-muted-foreground">Qtd:</span> <strong>{mov.quantity} {ing.unit}</strong></span>
                          <span><span className="text-muted-foreground">Val:</span> <strong>{mov.expiry_date ? format(new Date(mov.expiry_date), "dd/MM/yy", { locale: ptBR }) : "—"}</strong></span>
                          <span><span className="text-muted-foreground">R$:</span> <strong>{ing.price.toFixed(2)}</strong></span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {previousEntries.map((mov) => (
                    <Card key={mov.id} className="min-w-[200px] flex-1 max-w-xs">
                      <CardContent className="px-4 py-2.5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge
                            variant={mov.type === "in" ? "default" : "destructive"}
                            className={cn("gap-1 text-[10px] px-1.5 py-0.5", mov.type === "in" && "bg-success/10 text-success")}
                          >
                            {mov.type === "in" ? <><ArrowUpRight className="h-3 w-3" />Ent</> : <><ArrowDownRight className="h-3 w-3" />Saí</>}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(mov.date), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span><span className="text-muted-foreground">Qtd:</span> <strong>{mov.quantity} {ing.unit}</strong></span>
                          <span><span className="text-muted-foreground">Val:</span> <strong>{mov.expiry_date ? format(new Date(mov.expiry_date), "dd/MM/yy", { locale: ptBR }) : "—"}</strong></span>
                          <span><span className="text-muted-foreground">R$:</span> <strong>{ing.price.toFixed(2)}</strong></span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Movimentação</DialogTitle>
            <DialogDescription>Registre uma entrada ou saída de estoque.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "in" | "out" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Entrada</SelectItem>
                  <SelectItem value="out">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Produto</Label>
              <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent position="popper" side="bottom" className="max-h-[200px] overflow-y-auto">
                  {allProducts.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Quantidade</Label>
              <Input type="number" step="0.1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            </div>
            {form.type === "in" && (
              <div className="grid gap-2">
                <Label>Data de Validade</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.expiry_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.expiry_date ? format(form.expiry_date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a validade"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.expiry_date}
                      onSelect={(date) => setForm({ ...form, expiry_date: date })}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Registrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Movimentacoes;
