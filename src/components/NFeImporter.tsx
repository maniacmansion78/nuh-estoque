import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FileText, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NFeItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

interface NFeImporterProps {
  existingProducts: { id: string; name: string }[];
  onItemsConfirmed: (items: { name: string; quantity: number; unit: string; price: number }[]) => void | Promise<void>;
  confirmLabel?: string;
  buttonClassName?: string;
}

function parseNFeXml(xmlText: string): { items: NFeItem[]; emitente: string; numero: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) throw new Error("Arquivo XML inválido");

  const ns = "http://www.portalfiscal.inf.br/nfe";

  const getEl = (parent: Element, tag: string): Element | null =>
    parent.getElementsByTagNameNS(ns, tag)[0] || parent.getElementsByTagName(tag)[0] || null;

  const getText = (parent: Element, tag: string): string =>
    getEl(parent, tag)?.textContent?.trim() || "";

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

    if (name) {
      items.push({ name, quantity, unit: unit.toLowerCase(), price, total });
    }
  }

  return { items, emitente, numero };
}

const NFeImporter = ({
  onItemsConfirmed,
  buttonClassName,
}: NFeImporterProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setLoading(false);
    setStatusMessage("");
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

        setLoading(true);
        setStatusMessage(`${result.items.length} produtos encontrados. Registrando entradas...`);

        const allItems = result.items.map(({ name, quantity, unit, price }) => ({ name, quantity, unit, price }));
        await onItemsConfirmed(allItems);

        handleClose();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao ler o XML";
        toast.error(message);
        setLoading(false);
      }
    };
    reader.onerror = () => toast.error("Erro ao ler o arquivo");
    reader.readAsText(file);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1.5", buttonClassName)}
        onClick={() => {
          setOpen(true);
          // Auto-open file picker
          setTimeout(() => fileInputRef.current?.click(), 200);
        }}
        type="button"
      >
        <FileText className="h-4 w-4" />
        <span className="text-xs sm:hidden">XML</span>
        <span className="hidden text-sm sm:inline">Importar NF-e</span>
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!loading) { if (!v) handleClose(); else setOpen(true); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importar NF-e (XML)</DialogTitle>
            <DialogDescription>
              {loading ? statusMessage : "Envie o arquivo XML da Nota Fiscal para dar entrada automática."}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground text-center">{statusMessage}</p>
            </div>
          ) : (
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
                Aceita arquivos XML de NF-e (modelo 55) e NFC-e (modelo 65).
                Todos os produtos serão cadastrados e as entradas registradas automaticamente.
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".xml"
            className="hidden"
            onChange={handleFile}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NFeImporter;
