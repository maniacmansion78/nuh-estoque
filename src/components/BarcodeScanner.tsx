import { useState, useEffect, useRef } from "react";
import { Html5Qrcode, type CameraDevice } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScanLine, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ProductData {
  name: string;
  category: string;
  barcode: string;
  brand?: string;
  quantity_text?: string;
}

interface BarcodeScannerProps {
  /** Called when a single product EAN barcode is scanned */
  onProductFound: (product: ProductData) => Promise<void> | void;
  /** Called when a NF-e URL is detected (barcode on receipt) — extracts all items */
  onNFeUrlScanned?: (items: { name: string; quantity: number; unit: string; price: number }[]) => Promise<void>;
  buttonLabel?: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const isUrl = (text: string) => /^https?:\/\//i.test(text) || /www\.\S+/i.test(text);
const isNFeAccessKey = (text: string) => /^\d{44}$/.test(text.replace(/\s/g, ""));

const extractUrl = (text: string) => {
  const trimmed = text.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const match = trimmed.match(/https?:\/\/\S+/i);
  if (match?.[0]) return match[0].replace(/[),.;]+$/, "");
  const wwwMatch = trimmed.match(/www\.\S+/i);
  if (wwwMatch?.[0]) return `https://${wwwMatch[0].replace(/[),.;]+$/, "")}`;
  return "";
};

const pickBackCamera = (cameras: CameraDevice[]) =>
  cameras.find((c) => /back|rear|traseira|ambiente|environment/i.test(c.label)) ||
  cameras.at(-1) ||
  cameras[0];

const BarcodeScanner = ({
  onProductFound,
  onNFeUrlScanned,
  buttonLabel = "Escanear Código",
  buttonVariant = "outline",
  buttonSize = "default",
  className,
}: BarcodeScannerProps) => {
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const startTimeoutRef = useRef<number | null>(null);
  const readerId = "barcode-reader";

  const stopScanner = async () => {
    if (startTimeoutRef.current) {
      window.clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
    if (!scannerRef.current) return;
    try { await scannerRef.current.stop(); } catch { /* ignore */ }
    try { scannerRef.current.clear(); } catch { /* ignore */ }
    scannerRef.current = null;
  };

  const handleClose = async () => {
    setOpen(false);
    await stopScanner();
    window.setTimeout(() => {
      setProcessing(false);
      setStatusMessage("");
      isProcessingRef.current = false;
    }, 250);
  };

  const handleNFeUrl = async (url: string) => {
    if (!onNFeUrlScanned) return;

    isProcessingRef.current = true;
    setProcessing(true);
    setStatusMessage("Consultando NF-e...");

    try {
      const { data, error } = await supabase.functions.invoke("parse-nfe-url", {
        body: { url },
      });

      if (error) throw error;

      const items = Array.isArray(data?.items)
        ? data.items
            .map((item: any) => ({
              name: String(item.name || "").trim(),
              quantity: Number(item.quantity) || 1,
              unit: String(item.unit || "un").trim() || "un",
              price: Number(item.price) || 0,
            }))
            .filter((item) => item.name && item.quantity > 0)
        : [];

      if (items.length === 0) {
        toast.error("Li o código, mas não consegui extrair os produtos da nota.");
        setProcessing(false);
        isProcessingRef.current = false;
        return;
      }

      setStatusMessage("Registrando entrada dos produtos...");
      await onNFeUrlScanned(items);
      await handleClose();
    } catch (err) {
      console.error("NF-e barcode error:", err);
      toast.error("Erro ao consultar a nota fiscal.");
      setProcessing(false);
      isProcessingRef.current = false;
    }
  };

  const handleEanBarcode = async (barcode: string) => {
    isProcessingRef.current = true;
    setProcessing(true);
    setStatusMessage("Consultando produto...");

    const fallbackProduct: ProductData = {
      name: `Produto ${barcode}`,
      category: "Outros",
      barcode,
    };

    let resolvedProduct = fallbackProduct;
    let foundByLookup = false;

    try {
      const { data, error } = await supabase.functions.invoke("lookup-barcode", {
        body: { barcode },
      });

      if (error) throw error;

      if (data?.found && data.product?.name) {
        resolvedProduct = {
          name: String(data.product.name).trim(),
          category: String(data.product.category || "Outros").trim() || "Outros",
          barcode,
          brand: data.product.brand || "",
          quantity_text: data.product.quantity_text || "",
        };
        foundByLookup = true;
      }
    } catch (err) {
      console.error("Lookup error:", err);
    }

    try {
      if (foundByLookup) {
        toast.success(`Produto encontrado: ${resolvedProduct.name}`);
      } else {
        toast.success("Produto não cadastrado. Vou criar automaticamente.");
      }

      await onProductFound(resolvedProduct);
      await handleClose();
    } catch (err) {
      console.error("Barcode flow error:", err);
      toast.error("Erro ao processar o código de barras.");
      setProcessing(false);
      isProcessingRef.current = false;
    }
  };

  const startScanner = async () => {
    if (scannerRef.current || isProcessingRef.current) return;

    try {
      const scanner = new Html5Qrcode(readerId, { verbose: false });
      scannerRef.current = scanner;

      const cameras = await Html5Qrcode.getCameras();
      const preferred = pickBackCamera(cameras);
      const cameraConfig = preferred?.id
        ? preferred.id
        : { facingMode: { ideal: "environment" } };

      await scanner.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1,
          disableFlip: false,
        },
        async (decodedText) => {
          if (isProcessingRef.current) return;
          await stopScanner();

          const trimmed = decodedText.trim();

          if (isUrl(trimmed) && onNFeUrlScanned) {
            const url = extractUrl(trimmed);
            if (url) {
              toast.success("Código lido! Consultando nota...");
              await handleNFeUrl(url);
              return;
            }
          }

          // EAN barcode flow
          await handleEanBarcode(trimmed);
        },
        () => { /* ignore scan misses */ }
      );
    } catch (err) {
      console.error("Camera error:", err);
      await stopScanner();
      toast.error("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  useEffect(() => {
    if (!open || processing) {
      void stopScanner();
      return;
    }

    startTimeoutRef.current = window.setTimeout(() => {
      void startScanner();
    }, 350);

    return () => { void stopScanner(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, processing]);

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        className={cn(className)}
        onClick={() => setOpen(true)}
        type="button"
      >
        <ScanLine className="h-4 w-4 mr-1.5" />
        {buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!processing) { if (v) setOpen(true); else void handleClose(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escanear Código</DialogTitle>
            <DialogDescription>
              Aponte a câmera para o código de barras do produto ou da nota fiscal.
              {onNFeUrlScanned && " Se for uma nota, todos os produtos serão registrados automaticamente."}
            </DialogDescription>
          </DialogHeader>

          <div className="relative w-full aspect-square max-h-[320px] overflow-hidden rounded-lg bg-muted">
            <div id={readerId} className="w-full h-full" />
            {processing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground text-center">{statusMessage}</p>
              </div>
            )}
          </div>

          {!processing && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => void handleClose()}>
                Cancelar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BarcodeScanner;
