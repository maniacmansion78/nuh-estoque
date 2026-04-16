import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

export default function Proposta() {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/Proposta_NUH.pdf";
    link.download = "Proposta_NUH_Asian_Food.pdf";
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#FFD700] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#FFD700]/20 py-6">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            PROPOSTA COMERCIAL
          </h1>
          <p className="mt-1 text-lg text-[#FFD700]/70">
            Sistema de Fichas Técnicas — NUH Asian Food
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10 space-y-10">
        {/* Download Card */}
        <div className="rounded-2xl border border-[#FFD700]/20 bg-[#1a1a1a] p-8 text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FFD700]/10">
            <FileText className="h-10 w-10 text-[#FFD700]" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Proposta Comercial — NUH Asian Food</h2>
            <p className="mt-2 text-sm text-[#FFD700]/60">
              Eduardo Sommer Bertão · 16.04.2026
            </p>
          </div>
          <Button
            onClick={handleDownload}
            size="lg"
            className="bg-[#FFD700] px-8 text-lg font-bold text-[#111111] hover:bg-[#FFD700]/90"
          >
            <Download className="mr-2 h-5 w-5" />
            Baixar PDF
          </Button>
        </div>

        {/* Resumo inline */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold border-b border-[#FFD700]/20 pb-2">Resumo da Solução</h3>
          <p className="text-sm text-[#FFD700]/80 leading-relaxed">
            Sistema personalizado de controle de estoque que registra automaticamente o consumo de insumos a cada prato vendido, eliminando desperdícios, evitando faltas e fornecendo dados reais para gestão do restaurante.
          </p>
          <ul className="space-y-2 text-sm text-[#FFD700]/80">
            {[
              "Saída automática de insumos ao registrar saída de pratos",
              "Registro de fichas técnicas com insumos cadastrados automaticamente",
              "Cálculo de valores total dos pratos",
              "Relatórios de consumo mensais, prontos para baixar em PDF ou imprimir",
              "Acesso via navegador (computador, tablet ou celular)",
              "Dados seguros na nuvem com backup automático",
            ].map((b) => (
              <li key={b} className="flex gap-2">
                <span className="text-[#FFD700]">•</span>
                {b}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold border-b border-[#FFD700]/20 pb-2">Investimento</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#FFD700]/20 bg-[#1a1a1a] p-5">
              <p className="text-xs text-[#FFD700]/50 uppercase tracking-wider">Implementação Única</p>
              <p className="mt-2 text-2xl font-extrabold">R$ 500,00</p>
              <p className="mt-1 text-xs text-[#FFD700]/60">App pronto + configuração + manual</p>
            </div>
            <div className="rounded-xl border border-[#FFD700]/20 bg-[#1a1a1a] p-5">
              <p className="text-xs text-[#FFD700]/50 uppercase tracking-wider">Manutenção Semestral</p>
              <p className="mt-2 text-2xl font-extrabold">R$ 500,00</p>
              <p className="mt-1 text-xs text-[#FFD700]/60">Suporte + banco de dados + melhorias</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold border-b border-[#FFD700]/20 pb-2">Próximos Passos</h3>
          <div className="space-y-3">
            {[
              { n: "1", t: "Aprovar esta proposta", d: 'Responder "APROVADO" por WhatsApp' },
              { n: "2", t: "Realizar pagamento", d: "PIX para a chave informada no PDF" },
              { n: "3", t: "Receber acesso imediato", d: "Link do sistema, login e senha + manual em PDF" },
              { n: "4", t: "Começar a usar!", d: "Sistema no ar em até 24h após pagamento" },
            ].map((s) => (
              <div key={s.n} className="flex gap-4 items-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFD700] text-sm font-bold text-[#111111]">
                  {s.n}
                </div>
                <div>
                  <p className="font-semibold text-sm">{s.t}</p>
                  <p className="text-xs text-[#FFD700]/60">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <div className="text-center pt-4">
          <Button
            onClick={handleDownload}
            size="lg"
            className="bg-[#FFD700] px-8 text-lg font-bold text-[#111111] hover:bg-[#FFD700]/90"
          >
            <Download className="mr-2 h-5 w-5" />
            Baixar Proposta Completa em PDF
          </Button>
        </div>
      </main>

      <footer className="border-t border-[#FFD700]/20 py-6 text-center">
        <p className="text-xs text-[#FFD700]/40">
          © 2026 Eduardo Sommer Bertão. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
