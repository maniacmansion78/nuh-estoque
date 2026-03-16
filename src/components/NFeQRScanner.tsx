import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
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
import { QrCode, Loader2, Trash2, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ParsedItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  selected: boolean;
}

interface NFeQRScannerProps {
  allProducts: { id: string; name: string; unit: string }[];
  onItemsConfirmed: (items: { name: string; quantity: number; unit: string; price: number }[]) => Promise<void>;
  buttonClassName?: string;
}

const NFeQRScanner = ({ allProducts, onItemsConfirmed, buttonClassName }: NFeQRScannerProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"scan" | "loading" | "review">("scan");
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [scannedUrl, setScannedUrl] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerId = "nfe-qr-reader";

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
  };

  const reset = () => {
    setStep("scan");
    setItems([]);
    setScannedUrl("");
    setManualUrl("");
  };

  const handleClose = () => {
    setOpen(false);
    stopScanner();
    setTimeout(reset, 300);
  };

  const fetchNFeData = async (url: string) => {
    setStep("loading");
    setScannedUrl(url);

    try {
      const { data, error } = await supabase.functions.invoke("parse-nfe-url", {
        body: { url },
      });

      if (error) throw error;

      if (data?.items && data.items.length > 0) {
        setItems(data.items.map((item: any) => ({ ...item, selected: true })));
        setStep("review");
        toast.success(`${data.items.length} produtos encontrados na NF-e!`);
      } else {
        console.log("NF-e parse result:", JSON.stringify(data));
        setStep("scan");
        toast.error(
          "Não consegui extrair os itens dessa nota automaticamente. Tente novamente ou use o XML da NF-e.",
          { duration: 5000 }
        );
      }
    } catch (err: any) {
      console.error("Parse NF-e error:", err);
      setStep("scan");
      toast.error("Erro ao consultar a nota fiscal. Tente novamente.");
    }
  };

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode(readerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await stopScanner();

          if (decodedText.startsWith("http")) {
            await fetchNFeData(decodedText);
          } else {
            toast.error("QR Code não contém um link válido da SEFAZ.");
          }
        },
        () => {}
      );
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Não foi possível acessar a câmera.");
    }
  };

  useEffect(() => {
    if (open && step === "scan") {
      setTimeout(() => startScanner(), 300);
    }
    return () => { stopScanner(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  const toggleItem = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const updateItem = (index: number, field: keyof ParsedItem, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    const selected = items.filter((i) => i.selected);
    if (selected.length === 0) {
      toast.error("Selecione pelo menos um item");
      return;
    }
    await onItemsConfirmed(
      selected.map(({ name, quantity, unit, price }) => ({ name, quantity, unit, price }))
    );
    handleClose();
  };

  const selectedTotal = items.filter((i) => i.selected).reduce((sum, i) => sum + i.total, 0);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} type="button" className="gap-1.5">
        <QrCode className="h-4 w-4" />
        <span className="text-xs sm:text-sm">Consultar NF-e</span>
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (step !== "loading") { if (!v) handleClose(); else setOpen(true); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {step === "scan" && "Escanear QR Code da NF-e"}
              {step === "loading" && "Consultando NF-e..."}
              {step === "review" && "Produtos da NF-e"}
            </DialogTitle>
            <DialogDescription>
              {step === "scan" && "Aponte a câmera para o QR Code da nota fiscal"}
              {step === "loading" && "Buscando dados dos produtos na SEFAZ..."}
              {step === "review" && `${items.length} produtos encontrados — confirme para dar entrada`}
            </DialogDescription>
          </DialogHeader>

          {step === "scan" && (
            <div className="space-y-3">
              <div className="w-full aspect-square max-h-[300px] overflow-hidden rounded-lg bg-muted">
                <div id={readerId} className="w-full h-full" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Ou cole o link da NF-e:</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://www.sefaz..."
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    disabled={!manualUrl.startsWith("http")}
                    onClick={async () => {
                      await stopScanner();
                      await fetchNFeData(manualUrl.trim());
                    }}
                  >
                    Buscar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === "loading" && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Extraindo produtos da nota...</p>
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
                          {matched ? (
                            <span className="shrink-0 text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              ✓ Cadastrado
                            </span>
                          ) : (
                            <span className="shrink-0 text-[9px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                              Não cadastrado
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
                <span className="font-semibold">Total: R$ {selectedTotal.toFixed(2)}</span>
              </div>

              {scannedUrl && (
                <Button
                  variant="link"
                  size="sm"
                  className="gap-1 text-xs p-0 h-auto"
                  onClick={() => window.open(scannedUrl, "_blank")}
                >
                  <ExternalLink className="h-3 w-3" />
                  Ver nota na SEFAZ
                </Button>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {step === "review" && (
              <Button variant="outline" onClick={reset} className="mr-auto">
                Novo QR Code
              </Button>
            )}
            <Button variant="outline" onClick={handleClose} disabled={step === "loading"}>
              Cancelar
            </Button>
            {step === "review" && (
              <Button onClick={handleConfirm} className="gap-1.5">
                <Check className="h-4 w-4" />
                Dar Entrada
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NFeQRScanner;
