import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";

export default function Proposta() {
  const proposalRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    if (!proposalRef.current) return;

    const contentClone = proposalRef.current.cloneNode(true) as HTMLDivElement;
    contentClone.querySelector("[data-proposal-download]")?.remove();

    const proposalText = contentClone.textContent?.replace(/\n{3,}/g, "\n\n").trim();
    if (!proposalText) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const fontSize = 7;
    const lineHeight = 3.2;

    const paintPage = () => {
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      doc.setFont("courier", "normal");
      doc.setFontSize(fontSize);
      doc.setTextColor(255, 255, 255);
    };

    paintPage();

    let y = margin;

    for (const rawLine of proposalText.split("\n")) {
      if (rawLine.trim().length === 0) {
        y += lineHeight;
      } else {
        const wrappedLines = doc.splitTextToSize(rawLine, pageWidth - margin * 2) as string[];

        for (const line of wrappedLines) {
          if (y > pageHeight - margin) {
            doc.addPage();
            paintPage();
            y = margin;
          }

          doc.text(line, margin, y);
          y += lineHeight;
        }
      }

      if (y > pageHeight - margin) {
        doc.addPage();
        paintPage();
        y = margin;
      }
    }

    doc.save("Proposta_NUH_Asian_Food.pdf");
  };

  return (
    <div className="min-h-screen bg-proposal text-proposal-foreground font-mono">
      <div
        ref={proposalRef}
        className="max-w-3xl mx-auto px-4 py-8 whitespace-pre-wrap text-sm leading-relaxed"
      >
{`================================================================================
                    PROPOSTA COMERCIAL
               SISTEMA DE FICHAS TÉCNICAS
                     NUH ASIAN FOOD
================================================================================

PARA: NUH Asian Food
DE: Eduardo Sommer Bertão
DATA: 16.04.2026
CONTATO: 51-995887437 - eduardosbdd1@gmail.com

================================================================================
                         RESUMO DA SOLUÇÃO
================================================================================

Sistema personalizado de controle de estoque que registra automaticamente o 
consumo de insumos a cada prato vendido, eliminando desperdícios, evitando 
faltas e fornecendo dados reais para gestão do restaurante.

PRINCIPAIS BENEFÍCIOS:
• Saída automática de insumos ao registrar saída de pratos
• Registro de fichas técnicas com insumos cadastrados automaticamente
• Cálculo de valores totais dos pratos 
• Relatórios de consumo mensal, com valores totais, prontos para baixar em pdf ou imprimir
• Acesso via navegador (computador, tablet ou celular)
• Dados seguros na nuvem com backup automático

================================================================================
                           INVESTIMENTO
================================================================================

IMPLEMENTAÇÃO ÚNICA: R$ 500,00

Incluso:
✓ App já finalizado e pronto para uso imediato
✓ Configuração personalizada para o NUH Restaurant
✓ Manual de uso em PDF
✓ Entrega imediata após pagamento

--------------------------------------------------------------------------------

MANUTENÇÃO SEMESTRAL: R$ 500,00 (renovação a cada 6 meses)

O que está incluso e justifica o valor:

1. SUPORTE TÉCNICO PRIORITÁRIO
   • Atendimento via WhatsApp em horário comercial
   • Resposta em até 4h úteis para dúvidas e problemas
   • Você nunca fica na mão quando mais precisa

2. MANUTENÇÃO E CORREÇÕES
   • Correção imediata de qualquer bug ou instabilidade
   • Ajustes no sistema conforme necessidade operacional
   • Garantia de funcionamento contínuo

3. OTIMIZAÇÕES E MELHORIAS
   • Pequenas evoluções no sistema a cada semestre
   • Ajustes de performance para carregar mais rápido
   • Melhorias de usabilidade baseadas no uso real

4. BANCO DE DADOS INCLUSO (Valor agregado: ~R$ 150/semestre)
   • Hospedagem segura no Supabase Cloud
   • Backup automático diário dos seus dados
   • Proteção contra perda de informações
   • Você não paga nada extra por isso

5. SEGURANÇA E ATUALIZAÇÕES
   • Atualizações de segurança do sistema
   • Compatibilidade com novas versões de navegadores/dispositivos
   • Tranquilidade para focar no seu restaurante

6. RELATÓRIO DE SAÚDE SEMESTRAL
   • Check-up do sistema + recomendações de uso
   • Dicas para aproveitar melhor as funcionalidades


================================================================================
                         FORMAS DE PAGAMENTO
================================================================================

SETUP (R$ 500,00):
• PIX à vista
• Chave PIX (CPF): 005.187.750-38
• Nome: Eduardo Sommer Bertão
• Banco: Nubank

MANUTENÇÃO SEMESTRAL (R$ 5.000,00):
• PIX à vista
• Chave PIX (CPF): 005.187.750-38
• Nome: Eduardo Sommer Bertão
• Banco: Nubank

VENCIMENTO:
• Setup: No ato da aprovação da proposta
• Semestral: A cada 6 meses, com aviso prévio de 15 dias

================================================================================
                         GARANTIAS
================================================================================

✓ SUPORTE ILIMITADO
  Dúvidas de uso durante todo o contrato sem custo adicional

✓ CONFIDENCIALIDADE
  Seus dados e informações do restaurante são totalmente protegidos

================================================================================
                         PRÓXIMOS PASSOS
================================================================================

1. APROVAR ESTA PROPOSTA
   Responder "APROVADO" por WhatsApp 

2. REALIZAR PAGAMENTO DO SETUP E SEMESTRE
   PIX para a chave acima e enviar comprovante

3. RECEBER ACESSO IMEDIATO
   Link do sistema, login e senha + manual em PDF

4. COMEÇAR A USAR!
   Sistema no ar em até 24h após pagamento`}

        <div data-proposal-download className="text-center my-8">
          <Button
            size="lg"
            onClick={handleDownloadPDF}
            className="bg-proposal-foreground px-8 text-lg font-bold text-proposal hover:bg-proposal-foreground/90"
          >
            <Download className="mr-2 h-5 w-5" />
            Baixar Proposta em PDF
          </Button>
        </div>

{`© 2026 Eduardo Sommer Bertão. Todos os direitos reservados.

================================================================================`}
      </div>
    </div>
  );
}
