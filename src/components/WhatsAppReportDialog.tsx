import { useState } from "react";
import { Send, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import jsPDF from "jspdf";

interface WhatsAppReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: string;
    product_name: string;
    description: string;
    supplier_name: string;
    photo_urls: string[];
    created_at: string;
  };
}

export function WhatsAppReportDialog({ open, onOpenChange, item }: WhatsAppReportDialogProps) {
  const [phone, setPhone] = useState("");
  const [generating, setGenerating] = useState(false);

  const loadImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const generateAndSend = async () => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Informe um número de WhatsApp válido");
      return;
    }

    setGenerating(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageW = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Não Conformidade", pageW / 2, y, { align: "center" });
      y += 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("NUH Asian Food Restaurant", pageW / 2, y, { align: "center" });
      y += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Data: ${format(new Date(item.created_at), "dd/MM/yyyy HH:mm")}`, 15, y);
      y += 8;

      // Details
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Produto:", 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(item.product_name, 45, y);
      y += 8;

      doc.setFont("helvetica", "bold");
      doc.text("Fornecedor:", 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(item.supplier_name || "N/A", 50, y);
      y += 8;

      doc.setFont("helvetica", "bold");
      doc.text("Descrição:", 15, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      const descLines = doc.splitTextToSize(item.description, pageW - 30);
      doc.text(descLines, 15, y);
      y += descLines.length * 5 + 8;

      // Photos
      if (item.photo_urls.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Fotos:", 15, y);
        y += 8;

        for (let i = 0; i < item.photo_urls.length; i++) {
          const base64 = await loadImageAsBase64(item.photo_urls[i]);
          if (!base64) continue;

          if (y > 240) {
            doc.addPage();
            y = 20;
          }

          try {
            doc.addImage(base64, "JPEG", 15, y, 80, 60);
            y += 65;
          } catch {
            // skip unreadable image
          }
        }
      }

      // Upload PDF to storage
      const pdfBlob = doc.output("blob");
      const fileName = `nc_${item.id}_${Date.now()}.pdf`;
      const { error: uploadErr } = await supabase.storage
        .from("nc-reports")
        .upload(fileName, pdfBlob, { contentType: "application/pdf" });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("nc-reports")
        .getPublicUrl(fileName);

      const pdfUrl = urlData.publicUrl;
      const whatsappPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
      const message = encodeURIComponent(
        `📋 *Relatório de Não Conformidade*\n\n` +
        `*Produto:* ${item.product_name}\n` +
        `*Fornecedor:* ${item.supplier_name || "N/A"}\n` +
        `*Descrição:* ${item.description}\n\n` +
        `📎 PDF: ${pdfUrl}`
      );

      window.open(`https://wa.me/${whatsappPhone}?text=${message}`, "_blank");
      toast.success("Relatório gerado! WhatsApp aberto.");
      onOpenChange(false);
    } catch (err: any) {
      console.error("Erro ao gerar relatório:", err);
      toast.error(err.message || "Erro ao gerar relatório");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-green-600" />
            Enviar Relatório via WhatsApp
          </DialogTitle>
          <DialogDescription>
            Um mini relatório em PDF será gerado com as informações e fotos da não conformidade.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Produto</Label>
            <p className="text-sm text-muted-foreground">{item.product_name}</p>
          </div>
          <div className="grid gap-2">
            <Label>Número do WhatsApp *</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              type="tel"
            />
            <p className="text-xs text-muted-foreground">
              Informe o número com DDD. O código do país (55) será adicionado automaticamente.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={generateAndSend}
            disabled={generating}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Gerar e Enviar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
