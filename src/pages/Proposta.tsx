import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function Proposta() {

  return (
    <div className="min-h-screen bg-[#111111] text-[#FFD700] font-mono">
      <div className="max-w-3xl mx-auto px-4 py-8 whitespace-pre-wrap text-sm leading-relaxed">
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
• Cálculo de valores total dos pratos 
• Relatórios de consumo mensais, com valores totais, prontos para baixar em pdf ou imprimir
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

        <div className="text-center my-8">
          <a
            href="/Proposta_NUH.pdf"
            download="Proposta_NUH_Asian_Food.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              className="bg-[#FFD700] px-8 text-lg font-bold text-[#111111] hover:bg-[#FFD700]/90"
            >
              <Download className="mr-2 h-5 w-5" />
              Baixar Proposta em PDF
            </Button>
          </a>
        </div>

{`© 2026 Eduardo Sommer Bertão. Todos os direitos reservados.

================================================================================`}
      </div>
    </div>
  );
}
