import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Receipt, Loader2, Camera, Upload, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  selected: boolean;
}

interface ReceiptScannerProps {
  allProducts: { id: string; name: string; unit: string }[];
  onItemsConfirmed: (items: { name: string; quantity: number; unit: string; price: number }[]) => void;
}

const ReceiptScanner = ({ allProducts, onItemsConfirmed }: ReceiptScannerProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"capture" | "review">("capture");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [storeName, setStoreName] = useState("");
  const [receiptTotal, setReceiptTotal] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("capture");
    setItems([]);
    setStoreName("");
    setReceiptTotal(null);
    setPreview(null);
    setLoading(false);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(reset, 300);
  };

  const processImage = async (file: File) => {
    setLoading(true);
    setPreview(URL.createObjectURL(file));

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("scan-receipt", {
        body: { image_base64: base64 },
      });

      if (error) throw error;

      if (!data?.items || data.items.length === 0) {
        toast.error("Nenhum item encontrado na nota. Tente com outra foto.");
        setLoading(false);
        return;
      }

      setItems(
        data.items.map((item: any) => ({
          ...item,
          selected: true,
        }))
      );
      setStoreName(data.store_name || "");
      setReceiptTotal(data.total || null);
      setStep("review");
      toast.success(`${data.items.length} itens encontrados!`);
    } catch (err: any) {
      console.error("Receipt scan error:", err);
      toast.error(err.message || "Erro ao escanear nota. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
    e.target.value = "";
  };

  const toggleItem = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const updateItem = (index: number, field: keyof ExtractedItem, value: any) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    const selected = items.filter((i) => i.selected);
    if (selected.length === 0) {
      toast.error("Selecione pelo menos um item");
      return;
    }
    onItemsConfirmed(
      selected.map(({ name, quantity, unit, price }) => ({ name, quantity, unit, price }))
    );
    handleClose();
    // Toast is handled by the parent onItemsConfirmed callback
  };

  const selectedTotal = items
    .filter((i) => i.selected)
    .reduce((sum, i) => sum + i.total, 0);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Receipt className="h-4 w-4" />
        <span className="text-xs sm:text-sm">Escanear Nota</span>
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!loading) { if (!v) handleClose(); else setOpen(true); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {step === "capture" ? "Escanear Nota Fiscal" : "Revisar Itens da Nota"}
            </DialogTitle>
            <DialogDescription>
              {step === "capture"
                ? "Envie uma imagem da nota fiscal"
                : `${storeName ? storeName + " — " : ""}${items.length} itens encontrados`}
            </DialogDescription>
          </DialogHeader>

          {step === "capture" && (
            <div className="space-y-4">
              {preview && (
                <div className="relative w-full max-h-[300px] overflow-hidden rounded-lg border">
                  <img src={preview} alt="Nota fiscal" className="w-full object-contain" />
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Analisando nota fiscal com IA...</p>
                  <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Button
                    variant="outline"
                    className="h-24 w-full flex-col gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-primary" />
                    <span className="text-xs">Enviar Imagem</span>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Envie uma foto da nota fiscal para análise por IA
                  </p>
                </div>
              )}

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {step === "review" && (
            <div className="space-y-3">
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {items.map((item, index) => {
                  const matched = allProducts.find(
                    (p) => p.name.toLowerCase() === item.name.toLowerCase()
                  );
                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-2 p-2.5 rounded-lg border transition-colors ${
                        item.selected
                          ? "bg-primary/5 border-primary/20"
                          : "bg-muted/30 border-transparent opacity-60"
                      }`}
                    >
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => toggleItem(index)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(index, "name", e.target.value)}
                            className="h-7 text-xs font-medium"
                          />
                          {matched && (
                            <span className="shrink-0 text-[9px] bg-success/10 text-success px-1.5 py-0.5 rounded">
                              ✓ Cadastrado
                            </span>
                          )}
                          {!matched && (
                            <span className="shrink-0 text-[9px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded">
                              Novo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <div className="flex items-center gap-1">
                            <Label className="text-[10px] text-muted-foreground">Qtd:</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                              className="h-6 w-16 text-[10px]"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <Label className="text-[10px] text-muted-foreground">Un:</Label>
                            <Input
                              value={item.unit}
                              onChange={(e) => updateItem(index, "unit", e.target.value)}
                              className="h-6 w-12 text-[10px]"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <Label className="text-[10px] text-muted-foreground">R$:</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateItem(index, "price", Number(e.target.value))}
                              className="h-6 w-20 text-[10px]"
                            />
                          </div>
                          <span className="text-muted-foreground ml-auto">
                            = R$ {item.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive shrink-0"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground">
                  {items.filter((i) => i.selected).length} de {items.length} selecionados
                </span>
                <span className="font-semibold">
                  Total: R$ {selectedTotal.toFixed(2)}
                  {receiptTotal && receiptTotal !== selectedTotal && (
                    <span className="text-xs text-muted-foreground ml-1">(nota: R$ {receiptTotal.toFixed(2)})</span>
                  )}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {step === "review" && (
              <Button variant="outline" onClick={reset} className="mr-auto">
                Nova foto
              </Button>
            )}
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            {step === "review" && (
              <Button onClick={handleConfirm} className="gap-1.5">
                <Check className="h-4 w-4" />
                Confirmar Entrada
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReceiptScanner;
