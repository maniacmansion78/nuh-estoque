import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { QrCode, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface NFeQRScannerProps {
  allProducts: { id: string; name: string; unit: string }[];
  onItemsConfirmed: (items: { name: string; quantity: number; unit: string; price: number }[]) => Promise<void>;
  buttonClassName?: string;
}

const getUrlFromDecodedText = (decodedText: string) => {
  const trimmed = decodedText.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/https?:\/\/\S+/i);
  return match?.[0]?.replace(/[),.;]+$/, "") || "";
};

const NFeQRScanner = ({ onItemsConfirmed, buttonClassName }: NFeQRScannerProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"scan" | "loading">("scan");
  const [loadingMessage, setLoadingMessage] = useState("Consultando NF-e...");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const readerId = "nfe-qr-reader";

  const stopScanner = async () => {
    if (!scannerRef.current) return;

    try {
      await scannerRef.current.stop();
      scannerRef.current.clear();
    } catch {
      // ignore scanner shutdown errors
    }

    scannerRef.current = null;
  };

  const reset = () => {
    setStep("scan");
    setLoadingMessage("Consultando NF-e...");
    isProcessingRef.current = false;
  };

  const handleClose = async () => {
    setOpen(false);
    await stopScanner();
    setTimeout(reset, 300);
  };

  const fetchAndRegisterNFe = async (url: string) => {
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    setStep("loading");
    setLoadingMessage("Consultando NF-e...");

    try {
      const { data, error } = await supabase.functions.invoke("parse-nfe-url", {
        body: { url },
      });

      if (error) throw error;

      const parsedItems = Array.isArray(data?.items)
        ? data.items.map((item: any) => ({
            name: String(item.name || "").trim(),
            quantity: Number(item.quantity) || 1,
            unit: String(item.unit || "un").trim() || "un",
            price: Number(item.price) || 0,
          }))
        : [];

      const validItems = parsedItems.filter((item) => item.name.length > 0 && item.quantity > 0);

      if (validItems.length === 0) {
        setStep("scan");
        isProcessingRef.current = false;
        toast.error("Não consegui extrair os produtos dessa nota pelo QR Code.");
        return;
      }

      setLoadingMessage("Cadastrando produtos e registrando entradas...");
      await onItemsConfirmed(validItems);
      await handleClose();
    } catch (err) {
      console.error("QR NF-e error:", err);
      setStep("scan");
      isProcessingRef.current = false;
      toast.error("Erro ao ler a NF-e pelo QR Code.");
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
          if (isProcessingRef.current) return;

          const url = getUrlFromDecodedText(decodedText);
          await stopScanner();

          if (!url) {
            toast.error("QR Code não contém um link válido da nota fiscal.");
            return;
          }

          await fetchAndRegisterNFe(url);
        },
        () => {
          // ignore scan failures while searching for a QR code
        }
      );
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Não foi possível acessar a câmera.");
    }
  };

  useEffect(() => {
    if (open && step === "scan") {
      const timeout = window.setTimeout(() => {
        void startScanner();
      }, 300);

      return () => {
        window.clearTimeout(timeout);
        void stopScanner();
      };
    }

    return () => {
      void stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        type="button"
        className={cn("gap-1.5", buttonClassName)}
      >
        <QrCode className="h-4 w-4" />
        <span className="text-xs sm:hidden">QR NF-e</span>
        <span className="hidden text-sm sm:inline">Consultar NF-e</span>
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (step === "loading") return;
          if (nextOpen) setOpen(true);
          else void handleClose();
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {step === "scan" ? "Escanear QR Code da NF-e" : "Processando NF-e"}
            </DialogTitle>
            <DialogDescription>
              {step === "scan"
                ? "Aponte a câmera para o QR Code da nota fiscal e a entrada será registrada automaticamente."
                : loadingMessage}
            </DialogDescription>
          </DialogHeader>

          {step === "scan" ? (
            <div className="w-full aspect-square max-h-[300px] overflow-hidden rounded-lg bg-muted">
              <div id={readerId} className="h-full w-full" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground text-center">{loadingMessage}</p>
            </div>
          )}

          {step === "scan" && (
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

export default NFeQRScanner;
