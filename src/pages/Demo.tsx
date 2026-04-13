import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import logoNuh from "@/assets/logo-nuh.jpeg";

const Demo = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("webhook-demo", {
        body: { client: { name, email } },
      });

      if (error) {
        throw new Error(error.message || "Erro ao preparar acesso demo");
      }

      if (data?.status === "already_exists") {
        toast({
          title: "Conta já existente",
          description: "Esse email já possui acesso. Faça login com sua senha atual.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const password = data?.password;
      if (!password) {
        throw new Error("Senha demo não recebida.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new Error(signInError.message || "Conta criada, mas o login automático falhou.");
      }

      toast({
        title: data?.status === "demo_reset" ? "Acesso demo reativado" : "Conta demo criada! 🎉",
        description: `Você entrou com a senha temporária ${password}.`,
      });

      navigate("/alterar-senha", { replace: true });
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Não foi possível entrar no demo.",
        variant: "destructive",
      });
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
            <p className="text-xs text-muted-foreground">Experimente o NUH por 17 dias como administrador</p>
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
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Senha temporária do demo: <strong>nuhdemo2026</strong>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Entrando..." : "Criar e entrar no demo"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Demo;
