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
import { FileText, Trash2, Check, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NFeItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  ncm: string;
  selected: boolean;
}

interface NFeImporterProps {
  existingProducts: { id: string; name: string }[];
  onItemsConfirmed: (items: { name: string; quantity: number; unit: string; price: number }[]) => void;
  confirmLabel?: string;
  buttonClassName?: string;
}

function parseNFeXml(xmlText: string): { items: NFeItem[]; emitente: string; numero: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) throw new Error("Arquivo XML inválido");

  const ns = "http://www.portalfiscal.inf.br/nfe";

  const getEl = (parent: Element, tag: string): Element | null => {
    return parent.getElementsByTagNameNS(ns, tag)[0] || parent.getElementsByTagName(tag)[0] || null;
  };

  const getText = (parent: Element, tag: string): string => {
    const el = getEl(parent, tag);
    return el?.textContent?.trim() || "";
  };

  const emit = getEl(doc.documentElement, "emit");
  const emitente = emit ? (getText(emit, "xFant") || getText(emit, "xNome")) : "";

  const ide = getEl(doc.documentElement, "ide");
  const numero = ide ? getText(ide, "nNF") : "";

  const detElements = doc.getElementsByTagNameNS(ns, "det");
  const detFallback = detElements.length > 0 ? detElements : doc.getElementsByTagName("det");

  const items: NFeItem[] = [];

  for (let i = 0; i < detFallback.length; i++) {
    const det = detFallback[i];
    const prod = getEl(det, "prod");
    if (!prod) continue;

    const name = getText(prod, "xProd");
    const quantity = parseFloat(getText(prod, "qCom") || getText(prod, "qTrib")) || 1;
    const unit = getText(prod, "uCom") || getText(prod, "uTrib") || "un";
    const price = parseFloat(getText(prod, "vUnCom") || getText(prod, "vUnTrib")) || 0;
    const total = parseFloat(getText(prod, "vProd")) || quantity * price;
    const ncm = getText(prod, "NCM");

    if (name) {
      items.push({ name, quantity, unit: unit.toLowerCase(), price, total, ncm, selected: true });
    }
  }

  return { items, emitente, numero };
}

const NFeImporter = ({
  existingProducts,
  onItemsConfirmed,
  confirmLabel = "Cadastrar Produtos",
  buttonClassName,
}: NFeImporterProps) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NFeItem[]>([]);
  const [emitente, setEmitente] = useState("");
  const [numero, setNumero] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setItems([]);
    setEmitente("");
    setNumero("");
    setLoading(false);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(reset, 300);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.name.toLowerCase().endsWith(".xml")) {
      toast.error("Selecione um arquivo XML de NF-e");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = parseNFeXml(reader.result as string);
        if (result.items.length === 0) {
          toast.error("Nenhum produto encontrado no XML");
          return;
        }

        setEmitente(result.emitente);
        setNumero(result.numero);
        setLoading(true);

        toast.success(`${result.items.length} produtos encontrados! Registrando entradas...`);

        // Auto-register all items immediately
        const allItems = result.items.map(({ name, quantity, unit, price }) => ({ name, quantity, unit, price }));
        await onItemsConfirmed(allItems);

        handleClose();
      } catch (err: any) {
        toast.error(err.message || "Erro ao ler o XML");
        setLoading(false);
      }
    };
    reader.onerror = () => toast.error("Erro ao ler o arquivo");
    reader.readAsText(file);
  };

  const toggleItem = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const updateItem = (index: number, field: keyof NFeItem, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
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
  };

  const selectedTotal = items.filter((i) => i.selected).reduce((sum, i) => sum + i.total, 0);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1.5", buttonClassName)}
        onClick={() => setOpen(true)}
        type="button"
      >
        <FileText className="h-4 w-4" />
        <span className="text-xs sm:hidden">XML</span>
        <span className="hidden text-sm sm:inline">Importar NF-e</span>
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
        <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {items.length === 0 ? "Importar NF-e (XML)" : "Revisar Produtos da NF-e"}
            </DialogTitle>
            <DialogDescription>
              {items.length === 0
                ? "Envie o arquivo XML da Nota Fiscal Eletrônica"
                : `${emitente ? emitente + " — " : ""}${numero ? `NF ${numero} — ` : ""}${items.length} produtos`}
            </DialogDescription>
          </DialogHeader>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Button
                variant="outline"
                className="h-24 w-full flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-primary" />
                <span className="text-xs">Selecionar arquivo XML</span>
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Aceita arquivos XML de NF-e (modelo 55) e NFC-e (modelo 65)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml"
                className="hidden"
                onChange={handleFile}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {items.map((item, index) => {
                  const exists = existingProducts.find(
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
                          {exists ? (
                            <span className="shrink-0 text-[9px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded">
                              Já existe
                            </span>
                          ) : (
                            <span className="shrink-0 text-[9px] bg-success/10 text-success px-1.5 py-0.5 rounded">
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
                <span className="font-semibold">Total: R$ {selectedTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {items.length > 0 && (
              <Button variant="outline" onClick={reset} className="mr-auto">
                Outro XML
              </Button>
            )}
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            {items.length > 0 && (
              <Button onClick={handleConfirm} className="gap-1.5">
                <Check className="h-4 w-4" />
                {confirmLabel}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NFeImporter;
