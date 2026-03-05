import { useState, useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Plus, CalendarIcon, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  movements as mockMovements,
  ingredients,
  type Movement,
} from "@/data/mockData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Movimentacoes = () => {
  const [items, setItems] = useState<Movement[]>(mockMovements);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    ingredient_id: ingredients[0]?.id || "",
    type: "in" as "in" | "out",
    quantity: 0,
    expiry_date: undefined as Date | undefined,
  });

  // Group movements by product
  const groupedByProduct = useMemo(() => {
    const groups: Record<string, Movement[]> = {};
    for (const mov of items) {
      if (!groups[mov.ingredient_id]) groups[mov.ingredient_id] = [];
      groups[mov.ingredient_id].push(mov);
    }
    // Sort each group by date descending
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return groups;
  }, [items]);

  const handleSave = () => {
    if (form.quantity <= 0) { toast.error("Quantidade deve ser maior que zero"); return; }
    if (form.type === "in" && !form.expiry_date) { toast.error("Informe a data de validade"); return; }

    const product = ingredients.find((i) => i.id === form.ingredient_id);
    if (!product) { toast.error("Produto não encontrado"); return; }

    if (form.type === "out" && product.quantity < form.quantity) {
      toast.error(`Estoque insuficiente. Disponível: ${product.quantity} ${product.unit}`);
      return;
    }

    if (form.type === "in") {
      product.quantity = Math.round((product.quantity + form.quantity) * 100) / 100;
      if (form.expiry_date) {
        product.expiry_date = form.expiry_date.toISOString();
      }
    } else {
      product.quantity = Math.round((product.quantity - form.quantity) * 100) / 100;
    }

    const newMov: Movement = {
      id: `m${Date.now()}`,
      ingredient_id: form.ingredient_id,
      type: form.type,
      quantity: form.quantity,
      date: new Date().toISOString(),
      user_id: "u1",
      expiry_date: form.type === "in" && form.expiry_date ? form.expiry_date.toISOString() : undefined,
    };
    setItems((prev) => [newMov, ...prev]);
    toast.success(
      form.type === "in"
        ? `Entrada registrada! ${product.name}: ${product.quantity} ${product.unit}`
        : `Saída registrada! ${product.name}: ${product.quantity} ${product.unit}`
    );
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Movimentações</h1>
          <p className="text-muted-foreground">Histórico de entradas e saídas do estoque</p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => {
          setForm({ ingredient_id: ingredients[0]?.id || "", type: "in", quantity: 0, expiry_date: undefined });
          setDialogOpen(true);
        }}>
          <Plus className="h-5 w-5" />
          Nova Movimentação
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ArrowLeftRight className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">Nenhuma movimentação registrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(groupedByProduct).map(([ingredientId, movs]) => {
            const ing = ingredients.find((i) => i.id === ingredientId);
            if (!ing) return null;

            // Separate new entries (today) from previous
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const newEntries = movs.filter((m) => new Date(m.date) >= today);
            const previousEntries = movs.filter((m) => new Date(m.date) < today);

            return (
              <Card key={ingredientId} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">{ing.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Estoque: {ing.quantity} {ing.unit}</span>
                    <span>·</span>
                    <span>R$ {ing.price.toFixed(2)}/{ing.unit}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {newEntries.length > 0 && (
                    <>
                      <div className="px-4 py-1.5 bg-success/10">
                        <span className="text-xs font-semibold text-success">Novas Entradas — Hoje</span>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs h-8">Tipo</TableHead>
                            <TableHead className="text-xs h-8">Qtd</TableHead>
                            <TableHead className="text-xs h-8">Entrada</TableHead>
                            <TableHead className="text-xs h-8">Validade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {newEntries.map((mov) => (
                            <TableRow key={mov.id}>
                              <TableCell className="py-1.5">
                                <Badge
                                  variant={mov.type === "in" ? "default" : "destructive"}
                                  className={cn("gap-1 text-[10px] px-1.5 py-0.5", mov.type === "in" && "bg-success/10 text-success")}
                                >
                                  {mov.type === "in" ? <><ArrowUpRight className="h-3 w-3" />Ent</> : <><ArrowDownRight className="h-3 w-3" />Saí</>}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-1.5 text-xs font-medium">{mov.quantity} {ing.unit}</TableCell>
                              <TableCell className="py-1.5 text-xs text-muted-foreground">
                                {format(new Date(mov.date), "dd/MM HH:mm", { locale: ptBR })}
                              </TableCell>
                              <TableCell className="py-1.5 text-xs text-muted-foreground">
                                {mov.expiry_date ? format(new Date(mov.expiry_date), "dd/MM/yy", { locale: ptBR }) : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}

                  {previousEntries.length > 0 && (
                    <>
                      <div className="px-4 py-1.5 bg-muted/50 border-t">
                        <span className="text-xs font-semibold text-muted-foreground">Anteriores</span>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs h-8">Tipo</TableHead>
                            <TableHead className="text-xs h-8">Qtd</TableHead>
                            <TableHead className="text-xs h-8">Entrada</TableHead>
                            <TableHead className="text-xs h-8">Validade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previousEntries.map((mov) => (
                            <TableRow key={mov.id}>
                              <TableCell className="py-1.5">
                                <Badge
                                  variant={mov.type === "in" ? "default" : "destructive"}
                                  className={cn("gap-1 text-[10px] px-1.5 py-0.5", mov.type === "in" && "bg-success/10 text-success")}
                                >
                                  {mov.type === "in" ? <><ArrowUpRight className="h-3 w-3" />Ent</> : <><ArrowDownRight className="h-3 w-3" />Saí</>}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-1.5 text-xs font-medium">{mov.quantity} {ing.unit}</TableCell>
                              <TableCell className="py-1.5 text-xs text-muted-foreground">
                                {format(new Date(mov.date), "dd/MM HH:mm", { locale: ptBR })}
                              </TableCell>
                              <TableCell className="py-1.5 text-xs text-muted-foreground">
                                {mov.expiry_date ? format(new Date(mov.expiry_date), "dd/MM/yy", { locale: ptBR }) : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </CardContent>
              </Card>
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
              <Select value={form.ingredient_id} onValueChange={(v) => setForm({ ...form, ingredient_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent position="popper" side="bottom" className="max-h-[200px] overflow-y-auto">
                  {ingredients.map((i) => (
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Movimentacoes;
