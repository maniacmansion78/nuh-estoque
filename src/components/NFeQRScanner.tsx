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
import { QrCode } from "lucide-react";
import { toast } from "sonner";

const NFeQRScanner = () => {
  const [open, setOpen] = useState(false);
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

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode(readerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await stopScanner();

          // NF-e QR codes contain URLs to SEFAZ portals
          if (decodedText.startsWith("http")) {
            toast.success("QR Code lido! Abrindo consulta na SEFAZ...");
            window.open(decodedText, "_blank");
          } else {
            toast.error("QR Code não contém um link válido da SEFAZ.");
          }
          setOpen(false);
        },
        () => {}
      );
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Não foi possível acessar a câmera.");
    }
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => startScanner(), 300);
    } else {
      stopScanner();
    }
    return () => { stopScanner(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} type="button">
        <QrCode className="h-4 w-4 mr-2" />
        Consultar NF-e
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escanear QR Code da NF-e</DialogTitle>
            <DialogDescription>
              Aponte a câmera para o QR Code da nota fiscal para consultar no site da SEFAZ
            </DialogDescription>
          </DialogHeader>
          <div className="w-full aspect-square max-h-[350px] overflow-hidden rounded-lg bg-muted">
            <div id={readerId} className="w-full h-full" />
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NFeQRScanner;
