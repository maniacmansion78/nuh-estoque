import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import logoNuh from "@/assets/logo-nuh.jpeg";

const STORAGE_KEY = "nuh_remembered_email";

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "demo">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.removeItem("nuh_remembered_credentials");
    try {
      const savedEmail = localStorage.getItem(STORAGE_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {}
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY, email);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    const { error } = await signIn(email, password);
    if (error) setError(error);
    setLoading(false);
  };

  const handleDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("webhook-demo", {
        body: { client: { name, email } },
      });

      if (error) throw new Error(error.message || "Erro ao criar acesso demo");

      if (data?.status === "already_exists") {
        toast({
          title: "Conta já existente",
          description: "Esse email já possui acesso. Faça login com sua senha.",
          variant: "destructive",
        });
        setMode("login");
        setLoading(false);
        return;
      }

      const demoPassword = data?.password;
      if (!demoPassword) throw new Error("Senha demo não recebida.");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: demoPassword,
      });

      if (signInError) throw new Error("Conta criada, mas login falhou. Use a senha: " + demoPassword);

      toast({
        title: data?.status === "demo_reset" ? "Demo reativado!" : "Conta demo criada! 🎉",
        description: `Senha temporária: ${demoPassword}`,
      });

      navigate("/alterar-senha", { replace: true });
    } catch (err: any) {
      setError(err.message || "Erro ao entrar no demo.");
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
            <h1 className="text-2xl font-bold">NUH</h1>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Asian Food
            </p>
          </div>
          <div className="flex w-full rounded-lg border border-border overflow-hidden text-sm">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 font-medium transition-colors ${mode === "login" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("demo")}
              className={`flex-1 py-2 font-medium transition-colors ${mode === "demo" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              Teste Grátis
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">Lembrar meu email</Label>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleDemo} className="space-y-4">
              <p className="text-xs text-muted-foreground text-center">Experimente o NUH por 17 dias como administrador</p>
              <div className="grid gap-2">
                <Label htmlFor="demo-name">Nome completo</Label>
                <Input id="demo-name" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="demo-email">Email</Label>
                <Input id="demo-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Criando..." : "Criar e entrar no demo"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
