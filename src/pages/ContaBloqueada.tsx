import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, RefreshCw, MessageCircle, LogOut } from "lucide-react";

const ContaBloqueada = () => {
  const { signOut } = useAuth();

  const whatsappUrl = "https://wa.me/5551995887437?text=Olá! Preciso de ajuda com minha conta no NUH Asian Food.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Conta Suspensa</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua assinatura expirou ou o pagamento não foi aprovado. Renove para continuar usando o sistema.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            size="lg"
            className="w-full gap-2"
            asChild
          >
            <a
              href="https://checkout.nexano.com.br/checkout/cmmfqefvo033g1rmfeh5a8jjw?offer=6QUFMRT"
              target="_blank"
              rel="noopener noreferrer"
            >
              <RefreshCw className="h-5 w-5" />
              Renovar Assinatura
            </a>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full gap-2"
            asChild
          >
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-5 w-5" />
              Falar no WhatsApp
            </a>
          </Button>

          <Button
            variant="ghost"
            className="w-full gap-2 text-muted-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
            Sair da conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContaBloqueada;
