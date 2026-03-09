import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MessageSquare, Target, Lightbulb, ArrowRight, Star } from "lucide-react";

const sections = [
  {
    icon: MessageSquare,
    title: "1. Abertura — Conexão",
    badge: "Rapport",
    items: [
      "\"Oi [nome], tudo bem? Eu desenvolvi uma solução pensada especificamente para restaurantes como o NUH Asian Food.\"",
      "\"Antes de mostrar qualquer coisa, queria entender: como vocês controlam o estoque hoje?\"",
      "Ouça atentamente. Identifique dores: planilhas, perda de validade, falta de produto, retrabalho.",
    ],
  },
  {
    icon: Target,
    title: "2. Diagnóstico — Identificando Dores",
    badge: "Dores",
    items: [
      "\"Vocês já tiveram produto vencendo sem perceber?\"",
      "\"Já ficaram sem um ingrediente no meio do serviço?\"",
      "\"Quanto tempo por semana alguém gasta conferindo estoque manualmente?\"",
      "\"Já tiveram problemas com fornecedores e não tinham registro?\"",
      "Cada \"sim\" é uma oportunidade. Anote mentalmente.",
    ],
  },
  {
    icon: Lightbulb,
    title: "3. Apresentação da Solução",
    badge: "Solução",
    items: [
      "\"O NUH Estoque resolve exatamente esses problemas. Deixa eu te mostrar:\"",
      "📊 Dashboard — Visão geral instantânea com alertas de estoque baixo e validade próxima.",
      "📦 Produtos — Cadastro completo com lote, validade, quantidade mínima e alerta personalizado.",
      "🔄 Movimentações — Registro de todas as entradas e saídas com rastreabilidade total.",
      "🚚 Fornecedores — Cadastro centralizado para consulta rápida.",
      "⚠️ Não Conformidades — Registro de problemas com fotos, gerando histórico para negociação com fornecedores.",
      "📋 Relatório Mensal — Relatório completo para análise e tomada de decisão.",
      "👥 Funcionários — Controle de acesso por perfil (admin e funcionário).",
    ],
  },
  {
    icon: Star,
    title: "4. Diferenciais — Por que o NUH Estoque?",
    badge: "Valor",
    items: [
      "✅ Feito sob medida para o NUH — não é um sistema genérico.",
      "✅ Alertas automáticos — nunca mais perca um produto por validade.",
      "✅ Acesso pelo celular — qualquer funcionário pode usar de qualquer lugar.",
      "✅ Registro de não conformidades com fotos — poder de negociação com fornecedores.",
      "✅ Controle de acesso — o admin controla quem vê o quê.",
      "✅ Sem instalação — funciona 100% no navegador.",
      "✅ Suporte e atualizações contínuas.",
    ],
  },
  {
    icon: ArrowRight,
    title: "5. Projeção de Valor",
    badge: "ROI",
    items: [
      "\"Imagina economizar X horas por semana que hoje são gastas em conferência manual.\"",
      "\"Imagina nunca mais jogar fora um produto porque a validade passou despercebida.\"",
      "\"Imagina ter um relatório mensal pronto na hora, sem precisar montar planilha.\"",
      "\"Esse sistema se paga no primeiro mês só com a redução de desperdício.\"",
    ],
  },
  {
    icon: CheckCircle2,
    title: "6. Fechamento",
    badge: "Ação",
    items: [
      "\"Posso deixar o sistema rodando para vocês testarem essa semana?\"",
      "\"Qual seria o melhor momento para treinar a equipe?\"",
      "\"O investimento é [valor]. Considerando o que vocês perdem hoje, faz sentido para vocês?\"",
      "Se houver objeção de preço: \"Quanto vocês estimam que perdem por mês com produtos vencidos ou falta de controle?\"",
      "Sempre termine com próximo passo concreto: data de início, treinamento ou teste.",
    ],
  },
];

const tips = [
  "Mostre o sistema funcionando no celular durante a reunião — impacto visual.",
  "Use dados reais do restaurante se possível (produtos, fornecedores).",
  "Foque nos problemas que ELE mencionou, não em features genéricas.",
  "Não fale de tecnologia — fale de resultado: tempo, dinheiro, controle.",
  "Leve um resumo impresso de 1 página com os benefícios principais.",
];

const ScriptVenda = () => {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 lg:p-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl text-foreground">
            Script de Venda — NUH Estoque
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            Roteiro completo para apresentar e vender o sistema de controle de estoque para o NUH Asian Food
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base sm:text-lg">{section.title}</CardTitle>
                  </div>
                  <Badge variant="secondary">{section.badge}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm sm:text-base text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                      <span className={item.startsWith("\"") ? "italic text-foreground" : ""}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Dicas Extras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {tips.map((tip, i) => (
                <li key={i} className="flex gap-3 text-sm sm:text-base text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Este script é apenas para uso interno. Adapte conforme o contexto da conversa.
        </p>
      </div>
    </div>
  );
};

export default ScriptVenda;
