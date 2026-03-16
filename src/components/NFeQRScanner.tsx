import { useEffect, useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  type CameraDevice,
} from "html5-qrcode";
import { Loader2, QrCode } from "lucide-react";
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
  const raw = decodedText.trim();

  const candidates = [
    raw,
    (() => {
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    })(),
  ];

  for (const candidate of candidates) {
    if (/^https?:\/\//i.test(candidate)) return candidate;

    const fullUrlMatch = candidate.match(/https?:\/\/\S+/i);
    if (fullUrlMatch?.[0]) return fullUrlMatch[0].replace(/[),.;]+$/, "");

    const wwwMatch = candidate.match(/www\.\S+/i);
    if (wwwMatch?.[0]) return `https://${wwwMatch[0].replace(/[),.;]+$/, "")}`;
  }

  return "";
};

const pickBackCamera = (cameras: CameraDevice[]) => {
  return (
    cameras.find((camera) => /back|rear|traseira|ambiente|environment/i.test(camera.label)) ||
    cameras.at(-1) ||
    cameras[0]
  );
};

const NFeQRScanner = ({ onItemsConfirmed, buttonClassName }: NFeQRScannerProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"scan" | "loading">("scan");
  const [loadingMessage, setLoadingMessage] = useState("Consultando NF-e...");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const startTimeoutRef = useRef<number | null>(null);
  const readerId = "nfe-qr-reader";

  const stopScanner = async () => {
    if (startTimeoutRef.current) {
      window.clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }

    if (!scannerRef.current) return;

    try {
      await scannerRef.current.stop();
    } catch {
      // ignore stop errors when scanner was not fully started
    }

    try {
      scannerRef.current.clear();
    } catch {
      // ignore clear errors
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
    window.setTimeout(reset, 250);
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
        setStep("scan");
        isProcessingRef.current = false;
        toast.error("Li o QR Code, mas não consegui extrair os produtos da nota.");
        return;
      }

      setLoadingMessage("Registrando entrada dos produtos...");
      await onItemsConfirmed(items);
      await handleClose();
    } catch (error) {
      console.error("QR NF-e error:", error);
      setStep("scan");
      isProcessingRef.current = false;
      toast.error("Erro ao consultar a NF-e pelo QR Code.");
    }
  };

  const startScanner = async () => {
    if (scannerRef.current || isProcessingRef.current) return;

    try {
      const scanner = new Html5Qrcode(readerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });

      scannerRef.current = scanner;

      const cameras = await Html5Qrcode.getCameras();
      const preferredCamera = pickBackCamera(cameras);
      const cameraConfig = preferredCamera?.id
        ? preferredCamera.id
        : { facingMode: { ideal: "environment" } };

      await scanner.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1,
          disableFlip: false,
        },
        async (decodedText) => {
          if (isProcessingRef.current) return;

          const url = getUrlFromDecodedText(decodedText);
          await stopScanner();

          if (!url) {
            toast.error("QR Code lido, mas ele não contém um link válido da NF-e.");
            startTimeoutRef.current = window.setTimeout(() => {
              void startScanner();
            }, 400);
            return;
          }

          toast.success("QR Code lido, consultando nota...");
          await fetchAndRegisterNFe(url);
        },
        () => {
          // ignore scan misses while aiming the camera
        }
      );
    } catch (error) {
      console.error("Camera error:", error);
      await stopScanner();
      toast.error("Não foi possível iniciar a câmera para ler o QR Code.");
    }
  };

  useEffect(() => {
    if (!open || step !== "scan") {
      void stopScanner();
      return;
    }

    startTimeoutRef.current = window.setTimeout(() => {
      void startScanner();
    }, 350);

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
                ? "Aponte a câmera para o QR Code da nota fiscal para registrar a entrada automaticamente."
                : loadingMessage}
            </DialogDescription>
          </DialogHeader>

          {step === "scan" ? (
            <div className="w-full aspect-square max-h-[320px] overflow-hidden rounded-lg bg-muted">
              <div id={readerId} className="h-full w-full" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-center text-sm text-muted-foreground">{loadingMessage}</p>
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
