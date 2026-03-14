import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
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

interface ProductData {
  name: string;
  category: string;
  barcode: string;
  brand?: string;
  quantity_text?: string;
}

interface BarcodeScannerProps {
  onProductFound: (product: ProductData) => void;
  buttonLabel?: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const BarcodeScanner = ({
  onProductFound,
  buttonLabel = "Escanear Código",
  buttonVariant = "outline",
  buttonSize = "default",
  className,
}: BarcodeScannerProps) => {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [looking, setLooking] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerId = "barcode-reader";

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
    setScanning(false);
  };

  const lookupBarcode = async (barcode: string) => {
    setLooking(true);
    try {
      const { data, error } = await supabase.functions.invoke("lookup-barcode", {
        body: { barcode },
      });

      if (error) throw error;

      if (data?.found) {
        toast.success(`Produto encontrado: ${data.product.name}`);
        onProductFound(data.product);
        setOpen(false);
      } else {
        toast.error("Produto não encontrado na base de dados. Preencha manualmente.");
        onProductFound({ name: "", category: "", barcode });
        setOpen(false);
      }
    } catch (err) {
      console.error("Lookup error:", err);
      toast.error("Erro ao consultar produto. Tente novamente.");
    } finally {
      setLooking(false);
    }
  };

  const startScanner = async () => {
    setScanning(true);
    try {
      const scanner = new Html5Qrcode(readerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 100 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          await stopScanner();
          await lookupBarcode(decodedText);
        },
        () => {
          // ignore scan failures
        }
      );
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Não foi possível acessar a câmera. Verifique as permissões.");
      setScanning(false);
    }
  };

  useEffect(() => {
    if (open) {
      // small delay to ensure DOM element exists
      setTimeout(() => startScanner(), 300);
    } else {
      stopScanner();
    }
    return () => { stopScanner(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        className={className}
        onClick={() => setOpen(true)}
        type="button"
      >
        <ScanLine className="h-4 w-4 mr-2" />
        {buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!looking) setOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escanear Código de Barras</DialogTitle>
            <DialogDescription>
              Aponte a câmera para o código de barras do produto
            </DialogDescription>
          </DialogHeader>

          <div className="relative w-full aspect-square max-h-[350px] overflow-hidden rounded-lg bg-muted">
            <div id={readerId} className="w-full h-full" />
            {looking && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Consultando produto...</p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={looking}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BarcodeScanner;
