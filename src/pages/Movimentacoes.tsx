import { useState } from "react";
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Plus } from "lucide-react";
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

const Movimentacoes = () => {
  const [items, setItems] = useState<Movement[]>(mockMovements);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    ingredient_id: ingredients[0]?.id || "",
    type: "in" as "in" | "out",
    quantity: 0,
  });

  const handleSave = () => {
    if (form.quantity <= 0) { toast.error("Quantidade deve ser maior que zero"); return; }
    const newMov: Movement = {
      id: `m${Date.now()}`,
      ingredient_id: form.ingredient_id,
      type: form.type,
      quantity: form.quantity,
      date: new Date().toISOString(),
      user_id: "u1",
    };
    setItems((prev) => [newMov, ...prev]);
    toast.success(form.type === "in" ? "Entrada registrada!" : "Saída registrada!");
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
          setForm({ ingredient_id: ingredients[0]?.id || "", type: "in", quantity: 0 });
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
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((mov) => {
                  const ing = ingredients.find((i) => i.id === mov.ingredient_id);
                  return (
                    <TableRow key={mov.id}>
                      <TableCell>
                        <Badge
                          variant={mov.type === "in" ? "default" : "destructive"}
                          className={mov.type === "in" ? "gap-1 bg-success/10 text-success" : "gap-1"}
                        >
                          {mov.type === "in" ? (
                            <><ArrowUpRight className="h-3 w-3" />Entrada</>
                          ) : (
                            <><ArrowDownRight className="h-3 w-3" />Saída</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{ing?.name || "—"}</TableCell>
                      <TableCell>
                        {mov.quantity} {ing?.unit || ""}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(mov.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
