import { useState, useEffect } from "react";
import { Camera, Plus, Trash2, AlertTriangle, Loader2, Download, X, ImageIcon, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { suppliers } from "@/data/mockData";
import { toast } from "sonner";
import { format } from "date-fns";
import { WhatsAppReportDialog } from "./WhatsAppReportDialog";

interface NonConformity {
  id: string;
  description: string;
  supplier_id: string;
  product_name: string;
  photo_urls: string[];
  created_at: string;
}

export function NaoConformidades() {
  const { user } = useAuth();
  const [items, setItems] = useState<NonConformity[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerPhotos, setViewerPhotos] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [whatsappItem, setWhatsappItem] = useState<NonConformity | null>(null);
  const [form, setForm] = useState({
    product_name: "",
    supplier_id: "",
    description: "",
  });

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("non_conformities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      console.error("Erro ao buscar não conformidades:", error);
      return;
    }
    if (data) setItems(data as unknown as NonConformity[]);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalAllowed = 5 - photoFiles.length;
    const newFiles = files.slice(0, totalAllowed);
    if (files.length > totalAllowed) {
      toast.warning(`Máximo de 5 fotos. Apenas ${totalAllowed} foram adicionadas.`);
    }
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setPhotoFiles((prev) => [...prev, ...newFiles]);
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setForm({ product_name: "", supplier_id: "", description: "" });
    photoPreviews.forEach((p) => URL.revokeObjectURL(p));
    setPhotoFiles([]);
    setPhotoPreviews([]);
  };

  const handleSubmit = async () => {
    if (!form.product_name || !form.supplier_id || !form.description) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const uploadedUrls: string[] = [];

      if (photoFiles.length > 0) {
        setUploading(true);
        for (const file of photoFiles) {
          const ext = file.name.split(".").pop();
          const path = `${Date.now()}_${crypto.randomUUID()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("non-conformities")
            .upload(path, file, { contentType: file.type });
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage
            .from("non-conformities")
            .getPublicUrl(path);
          uploadedUrls.push(urlData.publicUrl);
        }
        setUploading(false);
      }

      const { error } = await supabase.from("non_conformities").insert({
        product_name: form.product_name,
        supplier_id: form.supplier_id,
        description: form.description,
        photo_urls: uploadedUrls,
        created_by: user?.id,
      } as any);

      if (error) throw error;

      toast.success("Não conformidade registrada!");
      setDialogOpen(false);
      resetForm();
      fetchItems();
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const openViewer = (photos: string[], index: number) => {
    setViewerPhotos(photos);
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const downloadPhoto = async (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.download = url.split("/").pop() || "foto.jpg";
    a.click();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
            Não Conformidades
          </CardTitle>
          <Button size="sm" className="gap-1 text-xs shrink-0" onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="h-3.5 w-3.5" />
            Registrar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            Nenhuma não conformidade registrada
          </p>
        ) : (
          items.map((item) => {
            const supplier = suppliers.find((s) => s.id === item.supplier_id);
            const photos = item.photo_urls || [];
            return (
              <div
                key={item.id}
                className="rounded-lg border border-border bg-muted/30 p-3 space-y-2"
              >
                <div className="flex gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.product_name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {supplier && (
                        <Badge variant="outline" className="text-xs">
                          {supplier.name}
                        </Badge>
                      )}
                      {photos.length > 0 && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <ImageIcon className="h-3 w-3" />
                          {photos.length} foto{photos.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.created_at), "dd/MM/yy HH:mm")}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs shrink-0 text-green-600 border-green-600/30 hover:bg-green-50"
                      onClick={() => setWhatsappItem(item)}
                    >
                      <Send className="h-3 w-3" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
                {photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {photos.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Foto ${i + 1}`}
                        className="h-16 w-16 shrink-0 cursor-pointer rounded-md object-cover border border-border hover:opacity-80 transition-opacity"
                        onClick={() => openViewer(photos, i)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>

      {/* Register dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Não Conformidade</DialogTitle>
            <DialogDescription>
              Registre um problema com produto recebido de fornecedor.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome do Produto *</Label>
              <Input
                value={form.product_name}
                onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                placeholder="Ex: Camarão Fresco"
              />
            </div>
            <div className="grid gap-2">
              <Label>Fornecedor *</Label>
              <Select
                value={form.supplier_id}
                onValueChange={(v) => setForm({ ...form, supplier_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Descrição do Problema *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descreva o que está errado com o produto..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>Fotos do Produto (até 5)</Label>
              {photoFiles.length < 5 && (
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-muted-foreground/30 px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <Camera className="h-4 w-4" />
                  {photoFiles.length === 0 ? "Tirar / Anexar fotos" : `Adicionar mais (${5 - photoFiles.length} restantes)`}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotosChange}
                  />
                </label>
              )}
              {photoPreviews.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {photoPreviews.map((preview, i) => (
                    <div key={i} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${i + 1}`}
                        className="h-20 w-20 rounded-md object-cover border border-border"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -right-1 -top-1 h-5 w-5"
                        onClick={() => removePhoto(i)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? "Enviando fotos..." : "Salvando..."}
                </>
              ) : (
                "Registrar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp report dialog */}
      {whatsappItem && (
        <WhatsAppReportDialog
          open={!!whatsappItem}
          onOpenChange={(open) => !open && setWhatsappItem(null)}
          item={{
            ...whatsappItem,
            supplier_name: suppliers.find((s) => s.id === whatsappItem.supplier_id)?.name || "N/A",
          }}
        />
      )}

      {/* Photo viewer dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90dvh] p-0 overflow-hidden">
          <div className="relative flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-medium">
                Foto {viewerIndex + 1} de {viewerPhotos.length}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => downloadPhoto(viewerPhotos[viewerIndex])}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-center bg-black/5 p-2 min-h-[300px] max-h-[65dvh]">
              <img
                src={viewerPhotos[viewerIndex]}
                alt={`Foto ${viewerIndex + 1}`}
                className="max-h-[60dvh] max-w-full object-contain rounded"
              />
            </div>
            {viewerPhotos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3 border-t border-border">
                {viewerPhotos.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Thumb ${i + 1}`}
                    className={`h-14 w-14 shrink-0 cursor-pointer rounded-md object-cover border-2 transition-all ${
                      i === viewerIndex ? "border-primary ring-1 ring-primary" : "border-border opacity-60 hover:opacity-100"
                    }`}
                    onClick={() => setViewerIndex(i)}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
