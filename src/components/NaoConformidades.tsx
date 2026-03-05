import { useState, useEffect } from "react";
import { Camera, Plus, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface NonConformity {
  id: string;
  description: string;
  supplier_id: string;
  product_name: string;
  photo_url: string | null;
  created_at: string;
}

export function NaoConformidades() {
  const { user } = useAuth();
  const [items, setItems] = useState<NonConformity[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
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
      .limit(10);
    if (error) {
      console.error("Erro ao buscar não conformidades:", error);
      return;
    }
    if (data) setItems(data);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.product_name || !form.supplier_id || !form.description) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      let photo_url: string | null = null;

      if (photoFile) {
        setUploading(true);
        const ext = photoFile.name.split(".").pop();
        const path = `${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("non-conformities")
          .upload(path, photoFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("non-conformities")
          .getPublicUrl(path);
        photo_url = urlData.publicUrl;
        setUploading(false);
      }

      const { error } = await supabase.from("non_conformities").insert({
        product_name: form.product_name,
        supplier_id: form.supplier_id,
        description: form.description,
        photo_url,
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success("Não conformidade registrada!");
      setDialogOpen(false);
      setForm({ product_name: "", supplier_id: "", description: "" });
      setPhotoFile(null);
      setPhotoPreview(null);
      fetchItems();
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Não Conformidades
        </CardTitle>
        <Button size="sm" className="gap-1" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Registrar
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            Nenhuma não conformidade registrada
          </p>
        ) : (
          items.map((item) => {
            const supplier = suppliers.find((s) => s.id === item.supplier_id);
            return (
              <div
                key={item.id}
                className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3"
              >
                {item.photo_url && (
                  <img
                    src={item.photo_url}
                    alt="Foto do produto"
                    className="h-14 w-14 shrink-0 rounded-md object-cover"
                  />
                )}
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
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.created_at), "dd/MM/yy HH:mm")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

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
              <Label>Foto do Produto</Label>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-muted-foreground/30 px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <Camera className="h-4 w-4" />
                  {photoFile ? "Trocar foto" : "Tirar / Anexar foto"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>
              {photoPreview && (
                <div className="relative mt-2">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-32 w-full rounded-md object-cover"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute right-1 top-1 h-6 w-6"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
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
                  {uploading ? "Enviando foto..." : "Salvando..."}
                </>
              ) : (
                "Registrar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
