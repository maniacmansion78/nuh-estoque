import { useState, useEffect } from "react";
import { Plus, Users, Trash2, Shield, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Employee {
  user_id: string;
  display_name: string;
  job_title: string;
  role: "admin" | "employee";
  movement_permission: string;
}

const Funcionarios = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ display_name: "", email: "", password: "", job_title: "", movement_permission: "all" });

  const fetchEmployees = async () => {
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, job_title, movement_permission");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");

    if (profiles && roles) {
      const emps: Employee[] = profiles.map((p) => {
        const r = roles.find((r) => r.user_id === p.user_id);
        return {
          user_id: p.user_id,
          display_name: p.display_name,
          job_title: p.job_title || "",
          role: (r?.role as "admin" | "employee") || "employee",
          movement_permission: (p as any).movement_permission || "all",
        };
      });
      setEmployees(emps);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreate = async () => {
    const email = form.email.trim().toLowerCase();
    const displayName = form.display_name.trim();
    const jobTitle = form.job_title.trim();

    if (!email || !form.password || !displayName) {
      toast.error("Preencha todos os campos");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Email inválido. Use o formato nome@dominio.com");
      return;
    }

    if (form.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-employee", {
        body: {
          email,
          password: form.password,
          display_name: displayName,
          job_title: jobTitle,
          movement_permission: form.movement_permission,
        },
      });

      if (error) {
        let detailedMessage = error.message;
        try {
          if ("context" in error && error.context) {
            const context = error.context as Response;
            const body = await context.json();
            detailedMessage = body?.error || detailedMessage;
          }
        } catch (_) {
          // keep default message
        }
        throw new Error(detailedMessage || "Erro ao criar funcionário");
      }

      if (data?.error) throw new Error(data.error);

      toast.success(`Funcionário ${displayName} criado com sucesso!`);
      setDialogOpen(false);
      setForm({ display_name: "", email: "", password: "", job_title: "", movement_permission: "all" });
      fetchEmployees();
    } catch (err: any) {
      console.error("Create employee error:", err);
      toast.error(err.message || "Erro ao criar funcionário");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-employee", {
        body: { user_id: deleteTarget.user_id },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success(`${deleteTarget.display_name} removido com sucesso`);
      setDeleteTarget(null);
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message || "Erro ao deletar funcionário");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Funcionários</h1>
          <p className="text-muted-foreground">Gerencie a equipe do restaurante</p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-5 w-5" />
          Novo Funcionário
        </Button>
      </div>

      {employees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum funcionário cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((emp) => (
            <Card key={emp.user_id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  {emp.role === "admin" ? (
                    <Shield className="h-5 w-5 text-primary" />
                  ) : (
                    <User className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="truncate text-sm font-semibold">{emp.display_name}</p>
                  {emp.job_title && (
                    <p className="truncate text-xs text-muted-foreground">{emp.job_title}</p>
                  )}
                  <Badge
                    variant={emp.role === "admin" ? "default" : "secondary"}
                    className="mt-1 text-[10px]"
                  >
                    {emp.role === "admin" ? "Administrador" : "Funcionário"}
                  </Badge>
                </div>
                {emp.role !== "admin" && emp.user_id !== user?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget(emp)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Funcionário</DialogTitle>
            <DialogDescription>
              Crie um acesso para o novo funcionário. Ele usará o email e senha para entrar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="Nome do funcionário"
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="funcionario@email.com"
              />
            </div>
            <div className="grid gap-2">
              <Label>Senha</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="grid gap-2">
              <Label>Cargo</Label>
              <Input
                value={form.job_title}
                onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                placeholder="Ex: Cozinheiro, Garçom, Gerente..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Criando..." : "Criar Funcionário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover funcionário?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deleteTarget?.display_name}</strong>? Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Funcionarios;
