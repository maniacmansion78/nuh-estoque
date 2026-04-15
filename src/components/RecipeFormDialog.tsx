import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { NewIngredient, RecipeForm } from "@/hooks/useRecipes";

const CATEGORIES = ["Entrada", "Prato Principal", "Massa", "Arroz", "Sobremesa"];
const UNITS = ["g", "kg", "ml", "L", "un"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (form: RecipeForm) => Promise<boolean>;
  initialData?: {
    name: string;
    category: string;
    portions: number;
    ingredients: NewIngredient[];
  } | null;
  title: string;
}

const emptyIngredient = (): NewIngredient => ({
  ingredient_name: "",
  gross_weight: 0,
  unit: "g",
  unit_cost: 0,
});

export default function RecipeFormDialog({ open, onOpenChange, onSave, initialData, title }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Prato Principal");
  const [portions, setPortions] = useState(1);
  const [ingredients, setIngredients] = useState<NewIngredient[]>([emptyIngredient()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name);
      setCategory(initialData.category);
      setPortions(initialData.portions);
      setIngredients(
        initialData.ingredients.length > 0
          ? initialData.ingredients
          : [emptyIngredient()]
      );
    } else if (open) {
      setName("");
      setCategory("Prato Principal");
      setPortions(1);
      setIngredients([emptyIngredient()]);
    }
  }, [open, initialData]);

  const updateIngredient = (index: number, field: keyof NewIngredient, value: string | number) => {
    setIngredients((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const totalCost = ingredients.reduce((sum, ing) => sum + (ing.gross_weight * ing.unit_cost), 0);

  const handleSave = async () => {
    if (!name.trim()) return;
    const validIngredients = ingredients.filter((ing) => ing.ingredient_name.trim());
    setSaving(true);
    const ok = await onSave({
      name,
      category,
      portions,
      ingredients: validIngredients,
    });
    setSaving(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <Label>Nome do Prato</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Yakisoba de Frango" />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Porções</Label>
              <Input type="number" min={1} value={portions} onChange={(e) => setPortions(Number(e.target.value) || 1)} />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-base font-semibold">Ingredientes</Label>
              <Button type="button" size="sm" variant="outline" onClick={() => setIngredients((prev) => [...prev, emptyIngredient()])}>
                <Plus className="mr-1 h-4 w-4" /> Adicionar
              </Button>
            </div>

            <div className="space-y-3">
              {ingredients.map((ing, i) => (
                <div key={i} className="rounded-lg border bg-muted/30 p-3">
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <div className="grid gap-2 sm:grid-cols-4">
                      <div>
                        <Label className="text-xs">Ingrediente</Label>
                        <Input
                          value={ing.ingredient_name}
                          onChange={(e) => updateIngredient(i, "ingredient_name", e.target.value)}
                          placeholder="Nome"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Quantidade</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={ing.gross_weight || ""}
                          onChange={(e) => updateIngredient(i, "gross_weight", Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unidade</Label>
                        <Select value={ing.unit} onValueChange={(v) => updateIngredient(i, "unit", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {UNITS.map((u) => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Custo Unit. (R$)</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={ing.unit_cost || ""}
                          onChange={(e) => updateIngredient(i, "unit_cost", Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => removeIngredient(i)} disabled={ingredients.length <= 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {ing.gross_weight > 0 && ing.unit_cost > 0 && (
                    <p className="mt-1 text-right text-xs text-muted-foreground">
                      Subtotal: R$ {(ing.gross_weight * ing.unit_cost).toFixed(2)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              Custo Total: <span className="text-primary">R$ {totalCost.toFixed(2)}</span>
            </p>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? "Salvando..." : "Salvar Receita"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
