import { useState, useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Plus, CalendarIcon, Package, Trash2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";
import { useMovements } from "@/hooks/useMovements";
import { useAuth } from "@/contexts/AuthContext";
import BarcodeScanner from "@/components/BarcodeScanner";
import ReceiptScanner from "@/components/ReceiptScanner";
import NFeQRScanner from "@/components/NFeQRScanner";
import NFeImporter from "@/components/NFeImporter";

interface BatchInfo {
  expiry_date: string;
  remaining: number;
  label: string;
}

const Movimentacoes = () => {
  const { items: dbProducts, loading: productsLoading, fetchProducts } = useProducts();
  const { items: dbMovements, loading: movementsLoading, addMovement, deleteMovement } = useMovements();
  const { isAdmin, movementPermission } = useAuth();

  const allProducts = useMemo(() => {
    return dbProducts.map((p) => ({
      id: p.id,
      name: p.name,
      quantity: Number(p.quantity),
      unit: p.unit,
      price: Number(p.price),
      expiry_date: p.expiry_date,
      lote: p.lote,
    })).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [dbProducts]);

  const canDoEntries = isAdmin || movementPermission === "all";
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    product_id: "",
    type: (canDoEntries ? "in" : "out") as "in" | "out",
    quantity: 0,
    expiry_date: undefined as Date | undefined,
    selected_batch: "" as string,
    lote: "" as string,
  });

  // Calculate available batches per product (in qty - out qty grouped by expiry_date)
  const batchesForProduct = useMemo(() => {
    if (!form.product_id || form.type !== "out") return [] as BatchInfo[];

    const productMovements = dbMovements.filter((m) => m.product_id === form.product_id);
    const batchMap: Record<string, number> = {};

    for (const mov of productMovements) {
      const key = mov.expiry_date || "sem-validade";
      if (!batchMap[key]) batchMap[key] = 0;
      if (mov.type === "in") {
        batchMap[key] += Number(mov.quantity);
      } else {
        batchMap[key] -= Number(mov.quantity);
      }
    }

    return Object.entries(batchMap)
      .filter(([, qty]) => qty > 0)
      .map(([expiry, qty]) => ({
        expiry_date: expiry,
        remaining: Math.round(qty * 100) / 100,
        label:
          expiry === "sem-validade"
            ? `Sem validade (${Math.round(qty * 100) / 100} disponível)`
            : `Val: ${format(new Date(expiry), "dd/MM/yyyy", { locale: ptBR })} (${Math.round(qty * 100) / 100} disponível)`,
      })) as BatchInfo[];
  }, [form.product_id, form.type, dbMovements]);

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

  const normalizeImportedName = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const mapImportedUnit = (unit: string): "kg" | "L" | "un" => {
    const normalized = unit.trim().toLowerCase();
    if (["kg", "g", "gr"].includes(normalized)) return "kg";
    if (["l", "lt", "ml"].includes(normalized)) return "L";
    return "un";
  };

  const ensureProductForEntry = async (item: {
    name: string;
    quantity: number;
    unit: string;
    price: number;
  }) => {
    const normalizedName = normalizeImportedName(item.name);
    const existingFromState = allProducts.find(
      (product) => normalizeImportedName(product.name) === normalizedName
    );

    if (existingFromState) {
      return { product: existingFromState, created: false };
    }

    const { data: existingFromDb, error: lookupError } = await supabase
      .from("products")
      .select("id, name, unit, quantity, price, expiry_date, lote")
      .ilike("name", item.name.trim())
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      console.error("Erro ao buscar produto importado:", lookupError);
    }

    if (existingFromDb) {
      return {
        product: {
          ...existingFromDb,
          quantity: Number(existingFromDb.quantity),
          price: Number(existingFromDb.price),
        },
        created: false,
      };
    }

    const { data: userData } = await supabase.auth.getUser();
    const { data: createdProduct, error: createError } = await supabase
      .from("products")
      .insert({
        name: item.name.trim(),
        category: "Outros",
        quantity: 0,
        unit: mapImportedUnit(item.unit),
        min_quantity: 0,
        price: item.price || 0,
        expiry_date: new Date().toISOString(),
        supplier_id: "",
        alert_days: 3,
        lote: "",
        created_by: userData.user?.id ?? null,
      })
      .select("id, name, unit, quantity, price, expiry_date, lote")
      .single();

    if (createError) {
      console.error("Erro ao cadastrar produto automaticamente:", createError);
      toast.error(`Não consegui cadastrar o produto ${item.name}.`);
      return { product: null, created: false };
    }

    return {
      product: {
        ...createdProduct,
        quantity: Number(createdProduct.quantity),
        price: Number(createdProduct.price),
      },
      created: true,
    };
  };

  const handleImportedEntries = async (
    confirmedItems: { name: string; quantity: number; unit: string; price: number }[],
    sourceLabel: string
  ) => {
    let successCount = 0;
    let createdCount = 0;

    for (const item of confirmedItems) {
      const { product, created } = await ensureProductForEntry(item);
      if (!product) continue;
      if (created) createdCount++;

      const success = await addMovement({
        product_id: product.id,
        type: "in",
        quantity: item.quantity,
        expiry_date: null,
        lote: "",
      });

      if (success) successCount++;
    }

    await fetchProducts();

    if (createdCount > 0) {
      toast.success(`${createdCount} produtos foram cadastrados automaticamente.`);
    }

    if (successCount > 0) {
      toast.success(`${successCount} entradas registradas via ${sourceLabel}.`);
      return;
    }

    toast.error(`Não foi possível registrar entradas via ${sourceLabel}.`);
  };

  const handleSave = async () => {
    if (form.quantity <= 0) { toast.error("Quantidade deve ser maior que zero"); return; }
    if (form.type === "in" && !form.expiry_date) { toast.error("Informe a data de validade"); return; }

    const product = allProducts.find((i) => i.id === form.product_id);
    if (!product) { toast.error("Produto não encontrado"); return; }

    if (form.type === "out") {
      if (!form.selected_batch) { toast.error("Selecione o lote/validade de saída"); return; }
      const batch = batchesForProduct.find((b) => b.expiry_date === form.selected_batch);
      if (!batch) { toast.error("Lote não encontrado"); return; }
      if (batch.remaining < form.quantity) {
        toast.error(`Estoque insuficiente neste lote. Disponível: ${batch.remaining} ${product.unit}`);
        return;
      }
    }

    setSaving(true);
    try {
      const expiryToSend =
        form.type === "in" && form.expiry_date
          ? form.expiry_date.toISOString()
          : form.type === "out" && form.selected_batch && form.selected_batch !== "sem-validade"
            ? form.selected_batch
            : null;

      const success = await addMovement({
        product_id: form.product_id,
        type: form.type,
        quantity: form.quantity,
        expiry_date: expiryToSend,
        lote: form.lote.trim(),
      });

      if (success) {
        // Update lote on product if admin provided one
        if (form.type === "in" && form.lote.trim() && isAdmin) {
          const { supabase } = await import("@/integrations/supabase/client");
          await supabase
            .from("products")
            .update({ lote: form.lote.trim() })
            .eq("id", form.product_id);
        }
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
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-center sm:text-left">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Movimentações</h1>
          <p className="text-sm text-muted-foreground">Histórico de entradas e saídas</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
          {canDoEntries && (
            <ReceiptScanner
              allProducts={allProducts.map((p) => ({ id: p.id, name: p.name, unit: p.unit }))}
              onItemsConfirmed={(confirmedItems) => handleImportedEntries(confirmedItems, "leitura da nota")}
              buttonClassName="w-full justify-center sm:w-auto"
            />
          )}
          {canDoEntries && (
            <NFeImporter
              existingProducts={allProducts.map((p) => ({ id: p.id, name: p.name }))}
              confirmLabel="Dar Entrada"
              onItemsConfirmed={(confirmedItems) => handleImportedEntries(confirmedItems, "NF-e XML")}
              buttonClassName="w-full justify-center sm:w-auto"
            />
          )}
          <NFeQRScanner
            allProducts={allProducts.map((p) => ({ id: p.id, name: p.name, unit: p.unit }))}
            onItemsConfirmed={(confirmedItems) => handleImportedEntries(confirmedItems, "QR Code NF-e")}
            buttonClassName="w-full justify-center sm:w-auto"
          />
          <BarcodeScanner
            buttonLabel="Escanear"
            buttonVariant="outline"
            buttonSize="sm"
            className="w-full justify-center sm:w-auto"
            onProductFound={(product) => {
              const match = allProducts.find(
                (p) => p.name.toLowerCase() === product.name.toLowerCase()
              );
              setForm({
                product_id: match?.id || allProducts[0]?.id || "",
                type: "in",
                quantity: 0,
                expiry_date: undefined,
                selected_batch: "",
                lote: "",
              });
              setDialogOpen(true);
              if (match) {
                toast.success(`Produto identificado: ${match.name}`);
              } else if (product.name) {
                toast.info(`Produto "${product.name}" não cadastrado. Cadastre primeiro em Produtos.`);
              }
            }}
          />
          <Button
            size="sm"
            className="col-span-2 gap-1.5 sm:col-span-1 sm:w-auto"
            onClick={() => {
              setForm({ product_id: allProducts[0]?.id || "", type: "in", quantity: 0, expiry_date: undefined, selected_batch: "", lote: "" });
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Nova Movimentação</span>
          </Button>
        </div>
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
                <div className="flex flex-col items-center gap-1 mb-2 sm:flex-row sm:items-center sm:gap-2">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-primary shrink-0" />
                    <h3 className="text-xs font-semibold sm:text-sm truncate">{ing.name}</h3>
                  </div>
                  <span className="text-[10px] text-muted-foreground sm:text-xs">
                    {ing.quantity} {ing.unit} · R$ {ing.price.toFixed(2)}/{ing.unit}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {newEntries.map((mov) => (
                    <Card key={mov.id} className={cn("w-full", mov.type === "in" ? "border-success/30" : "border-destructive/30")}>
                      <CardContent className="px-3 py-2">
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <div className="flex items-center gap-1.5">
                            <Badge className={cn("gap-0.5 text-[9px] px-1 py-0.5 sm:text-[10px] sm:px-1.5", mov.type === "in" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                              {mov.type === "in" ? <><ArrowUpRight className="h-2.5 w-2.5" />Entrada</> : <><ArrowDownRight className="h-2.5 w-2.5" />Saída</>}
                            </Badge>
                            <span className="text-[9px] text-muted-foreground sm:text-[10px]">
                              {format(new Date(mov.date), "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          {isAdmin && (
                            <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive shrink-0" onClick={() => deleteMovement(mov.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs">
                          <span><span className="text-muted-foreground">Qtd:</span> <strong>{mov.quantity} {ing.unit}</strong></span>
                          <span><span className="text-muted-foreground">Val:</span> <strong>{mov.expiry_date ? format(new Date(mov.expiry_date), "dd/MM/yy", { locale: ptBR }) : "—"}</strong></span>
                          <span><span className="text-muted-foreground">Lote:</span> <strong>{mov.lote || "—"}</strong></span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {previousEntries.map((mov) => (
                    <Card key={mov.id} className="w-full">
                      <CardContent className="px-3 py-2">
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant={mov.type === "in" ? "default" : "destructive"}
                              className={cn("gap-0.5 text-[9px] px-1 py-0.5 sm:text-[10px] sm:px-1.5", mov.type === "in" && "bg-success/10 text-success")}
                            >
                              {mov.type === "in" ? <><ArrowUpRight className="h-2.5 w-2.5" />Ent</> : <><ArrowDownRight className="h-2.5 w-2.5" />Saí</>}
                            </Badge>
                            <span className="text-[9px] text-muted-foreground sm:text-[10px]">
                              {format(new Date(mov.date), "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          {isAdmin && (
                            <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive shrink-0" onClick={() => deleteMovement(mov.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs">
                          <span><span className="text-muted-foreground">Qtd:</span> <strong>{mov.quantity} {ing.unit}</strong></span>
                          <span><span className="text-muted-foreground">Val:</span> <strong>{mov.expiry_date ? format(new Date(mov.expiry_date), "dd/MM/yy", { locale: ptBR }) : "—"}</strong></span>
                          <span><span className="text-muted-foreground">Lote:</span> <strong>{mov.lote || "—"}</strong></span>
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
              {canDoEntries ? (
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "in" | "out", selected_batch: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Entrada</SelectItem>
                    <SelectItem value="out">Saída</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm text-muted-foreground">
                  Saída (apenas)
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Produto</Label>
              <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v, selected_batch: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent position="popper" side="bottom" className="max-h-[200px] overflow-y-auto">
                  {allProducts.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Batch selection for "out" type */}
            {form.type === "out" && form.product_id && (
              <div className="grid gap-2">
                <Label>Lote / Validade de saída</Label>
                {batchesForProduct.length === 0 ? (
                  <p className="text-sm text-destructive">Nenhum lote com estoque disponível para este produto.</p>
                ) : (
                  <Select value={form.selected_batch} onValueChange={(v) => setForm({ ...form, selected_batch: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione o lote" /></SelectTrigger>
                    <SelectContent position="popper" side="bottom" className="max-h-[200px] overflow-y-auto">
                      {batchesForProduct.map((batch) => (
                        <SelectItem key={batch.expiry_date} value={batch.expiry_date}>
                          {batch.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label>Quantidade</Label>
              <Input type="number" step="0.1" value={form.quantity || ""} placeholder="0" onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            </div>
            {form.type === "in" && isAdmin && (
              <div className="grid gap-2">
                <Label>Lote</Label>
                <Input
                  type="text"
                  placeholder="Ex: L2024-001"
                  value={form.lote}
                  onChange={(e) => setForm({ ...form, lote: e.target.value })}
                />
              </div>
            )}
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
