import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import logoNuh from "@/assets/logo-nuh.jpeg";

const Demo = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [document, setDocument] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDoc = document.replace(/\D/g, "");
    if (cleanDoc.length < 11) {
      toast({ title: "CPF inválido", description: "Informe um CPF com 11 dígitos.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/webhook-demo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client: { name, email, cpf: cleanDoc } }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar conta demo");
      }
      if (data.status === "already_exists") {
        toast({ title: "Usuário já cadastrado", description: "Faça login com suas credenciais." });
      } else {
        toast({
          title: "Conta demo criada! 🎉",
          description: `Sua senha temporária é seu CPF (${cleanDoc}). Você terá 17 dias de acesso.`,
        });
      }
      navigate("/login");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center gap-3 pb-2">
          <img src={logoNuh} alt="NUH Logo" className="h-20 w-20 rounded-full object-cover" />
          <div className="text-center">
            <h1 className="text-2xl font-bold">Teste Grátis</h1>
            <p className="text-xs text-muted-foreground">
              Experimente o NUH por 7 dias como administrador
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cpf">CPF (será sua senha temporária)</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={document}
                onChange={(e) => setDocument(formatCpf(e.target.value))}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Criando conta..." : "Começar teste grátis"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Já tem conta?{" "}
              <a href="/login" className="text-primary underline">Entrar</a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Demo;
