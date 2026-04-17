import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Trash2, Info } from "lucide-react";
import type { NewIngredient, RecipeForm } from "@/hooks/useRecipes";
import { useProducts } from "@/hooks/useProducts";

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

// Convert quantity+unit into grams (for price/kg)
const toGrams = (qty: number, unit: string) => {
  if (unit === "kg") return qty * 1000;
  if (unit === "g") return qty;
  return 0;
};

// Convert quantity+unit into milliliters (for price/L)
const toMl = (qty: number, unit: string) => {
  if (unit === "L") return qty * 1000;
  if (unit === "ml") return qty;
  return 0;
};

export default function RecipeFormDialog({ open, onOpenChange, onSave, initialData, title }: Props) {
  const { items: products } = useProducts();
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
        initialData.ingredients.length > 0 ? initialData.ingredients : [emptyIngredient()]
      );
    } else if (open) {
      setName("");
      setCategory("Prato Principal");
      setPortions(1);
      setIngredients([emptyIngredient()]);
    }
  }, [open, initialData]);

  // Lookup price + correction factor by name (case-insensitive)
  const productByName = useMemo(() => {
    const map = new Map<string, {
      kg: number;
      liter: number;
      cfEnabled: boolean;
      cfPercent: number;
      cfType: "weight" | "price" | null;
      cfNote: string;
    }>();
    products.forEach((p) => {
      map.set(p.name.trim().toLowerCase(), {
        kg: p.price_per_kg ?? 0,
        liter: p.price_per_liter ?? 0,
        cfEnabled: !!p.correction_factor_enabled,
        cfPercent: Number(p.correction_factor_percent ?? 0),
        cfType: (p.correction_factor_type as "weight" | "price" | null) ?? null,
        cfNote: p.correction_factor_note ?? "",
      });
    });
    return map;
  }, [products]);

  const getProductInfo = (ingName: string) =>
    productByName.get(ingName.trim().toLowerCase()) ?? {
      kg: 0, liter: 0, cfEnabled: false, cfPercent: 0, cfType: null as "weight" | "price" | null, cfNote: "",
    };

  const computeAutoCost = (ing: NewIngredient): number => {
    const { kg, liter, cfEnabled, cfPercent, cfType } = getProductInfo(ing.ingredient_name);
    const applyCf = cfEnabled && cfPercent > 0;

    if ((ing.unit === "ml" || ing.unit === "L") && liter > 0) {
      const ml = toMl(ing.gross_weight, ing.unit);
      let priceL = liter;
      let mlComprado = ml;
      if (applyCf && cfType === "price") priceL = liter * (1 + cfPercent / 100);
      if (applyCf && cfType === "weight") mlComprado = ml / (1 - cfPercent / 100);
      return Number(((mlComprado / 1000) * priceL).toFixed(2));
    }
    if ((ing.unit === "g" || ing.unit === "kg") && kg > 0) {
      const grams = toGrams(ing.gross_weight, ing.unit);
      let priceKg = kg;
      let gramsComprado = grams;
      if (applyCf && cfType === "price") priceKg = kg * (1 + cfPercent / 100);
      if (applyCf && cfType === "weight") gramsComprado = grams / (1 - cfPercent / 100);
      return Number(((gramsComprado / 1000) * priceKg).toFixed(2));
    }
    return ing.unit_cost;
  };

  const updateIngredient = (index: number, field: keyof NewIngredient, value: string | number) => {
    setIngredients((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === "ingredient_name" || field === "gross_weight" || field === "unit") {
        copy[index].unit_cost = computeAutoCost(copy[index]);
      }
      return copy;
    });
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const totalCost = ingredients.reduce((sum, ing) => sum + ing.unit_cost, 0);

  const handleSave = async () => {
    if (!name.trim()) return;
    const validIngredients = ingredients.filter((ing) => ing.ingredient_name.trim());
    setSaving(true);
    const ok = await onSave({ name, category, portions, ingredients: validIngredients });
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

            <datalist id="ingredient-products">
              {products.map((p) => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>

            <div className="space-y-3">
              {ingredients.map((ing, i) => {
                const info = getProductInfo(ing.ingredient_name);
                const { kg: pricePerKg, liter: pricePerLiter, cfEnabled, cfPercent, cfType, cfNote } = info;
                const isLiquid = ing.unit === "ml" || ing.unit === "L";
                const isSolid = ing.unit === "g" || ing.unit === "kg";
                const grams = toGrams(ing.gross_weight, ing.unit);
                const ml = toMl(ing.gross_weight, ing.unit);
                const autoCalc = (isSolid && pricePerKg > 0) || (isLiquid && pricePerLiter > 0);
                const cfActive = cfEnabled && cfPercent > 0 && autoCalc;
                const percent = autoCalc
                  ? isLiquid
                    ? (ml / 1000) * 100
                    : (grams / 1000) * 100
                  : 0;
                const gramsComprado = cfActive && cfType === "weight" && grams > 0
                  ? grams / (1 - cfPercent / 100)
                  : grams;
                const mlComprado = cfActive && cfType === "weight" && ml > 0
                  ? ml / (1 - cfPercent / 100)
                  : ml;

                return (
                  <div key={i} className={`rounded-lg border p-3 ${cfActive ? "border-orange-400 bg-orange-50/30 dark:bg-orange-950/10" : "bg-muted/30"}`}>
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <div className="grid gap-2 sm:grid-cols-4">
                        <div>
                          <Label className="text-xs flex items-center gap-1">
                            Ingrediente
                            {cfActive && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-orange-500 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p className="text-xs">
                                      <strong>Fator de Correção: {cfPercent}% ({cfType === "weight" ? "perda de peso" : "acréscimo de preço"})</strong>
                                      {cfNote && <><br />{cfNote}</>}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </Label>
                          <Input
                            list="ingredient-products"
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
                          <Label className="text-xs">Custo (R$)</Label>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={ing.unit_cost || ""}
                            onChange={(e) => updateIngredient(i, "unit_cost", Number(e.target.value))}
                            disabled={autoCalc}
                            className={autoCalc ? "bg-muted" : ""}
                          />
                        </div>
                      </div>
                      <div className="flex items-end">
                        <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => removeIngredient(i)} disabled={ingredients.length <= 1}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {autoCalc && isSolid && (
                      <div className="mt-2 rounded-md bg-primary/5 px-2 py-1.5 text-xs text-muted-foreground space-y-0.5">
                        <div>
                          <span className="font-medium text-foreground">Preço KG:</span> R$ {pricePerKg.toFixed(2)}
                          {grams > 0 && (
                            <>
                              {" • "}
                              <span className="font-medium text-foreground">{grams}g</span> ({percent.toFixed(1)}% de 1kg)
                              {" = "}
                              <span className="font-semibold text-primary">R$ {ing.unit_cost.toFixed(2)}</span>
                            </>
                          )}
                        </div>
                        {cfActive && grams > 0 && (
                          <div className="text-orange-700 dark:text-orange-400">
                            ⚙️ Fator {cfPercent}% ({cfType === "weight" ? "peso" : "preço"}):
                            {cfType === "weight"
                              ? <> use {grams}g úteis = compre <strong>{gramsComprado.toFixed(1)}g</strong></>
                              : <> preço ajustado <strong>R$ {(pricePerKg * (1 + cfPercent / 100)).toFixed(2)}/kg</strong></>}
                          </div>
                        )}
                      </div>
                    )}
                    {autoCalc && isLiquid && (
                      <div className="mt-2 rounded-md bg-primary/5 px-2 py-1.5 text-xs text-muted-foreground space-y-0.5">
                        <div>
                          <span className="font-medium text-foreground">Preço L:</span> R$ {pricePerLiter.toFixed(2)}
                          {ml > 0 && (
                            <>
                              {" • "}
                              <span className="font-medium text-foreground">{ml}ml</span> ({percent.toFixed(1)}% de 1L)
                              {" = "}
                              <span className="font-semibold text-primary">R$ {ing.unit_cost.toFixed(2)}</span>
                            </>
                          )}
                        </div>
                        {cfActive && ml > 0 && (
                          <div className="text-orange-700 dark:text-orange-400">
                            ⚙️ Fator {cfPercent}% ({cfType === "weight" ? "volume" : "preço"}):
                            {cfType === "weight"
                              ? <> use {ml}ml úteis = compre <strong>{mlComprado.toFixed(1)}ml</strong></>
                              : <> preço ajustado <strong>R$ {(pricePerLiter * (1 + cfPercent / 100)).toFixed(2)}/L</strong></>}
                          </div>
                        )}
                      </div>
                    )}
                    {!autoCalc && ing.ingredient_name.trim() && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        💡 Cadastre o <strong>Preço por KG</strong> ou <strong>Preço por Litro</strong> deste insumo em "Insumos" para cálculo automático.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
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
