import { useRef } from "react";
import { BookOpen, Download, LayoutDashboard, Package, Truck, ArrowLeftRight, AlertTriangle, FileText, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import jsPDF from "jspdf";

const sections = [
  {
    icon: LayoutDashboard,
    title: "Tela Inicial (Dashboard)",
    content: [
      "Visão geral do estoque com alertas de vencimento próximo e de estoque baixo.",
      "Acesso rápido às principais funcionalidades do sistema.",
    ],
  },
  {
    icon: Package,
    title: "Produtos",
    content: [
      "Cadastre produtos com nome, categoria (Vegetais, Proteínas, Temperos, Bebidas, Importados), unidade (kg, L, un) e quantidade mínima.",
      "Defina os dias de alerta antes do vencimento para cada produto.",
      "Visualize lotes, validade e movimentações diretamente no card do produto.",
      "Filtre por categoria ou pesquise por nome.",
      "Produtos com estoque abaixo do mínimo ou validade próxima exibem alertas visuais (Alerta / Crítico).",
    ],
  },
  {
    icon: ArrowLeftRight,
    title: "Movimentações",
    content: [
      "Registre entradas e saídas de estoque para cada produto.",
      "Ao registrar uma entrada, informe o lote e a data de validade — o estoque é atualizado automaticamente.",
      "Ao registrar uma saída, o sistema desconta a quantidade do estoque.",
      "O campo Lote é editável apenas no registro de novas entradas (administradores).",
      "Histórico completo de movimentações visível na listagem de produtos.",
    ],
  },
  {
    icon: Truck,
    title: "Fornecedores",
    content: [
      "Cadastre fornecedores com nome, telefone e e-mail.",
      "Vincule múltiplos produtos a cada fornecedor usando a lista de checkboxes no formulário.",
      "O contador de itens por fornecedor reflete os produtos vinculados.",
      "Ao cadastrar um novo fornecedor, ele fica disponível imediatamente no campo de fornecedor ao criar/editar produtos.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Não Conformidades",
    content: [
      "Registre ocorrências de produtos com problemas (avarias, irregularidades).",
      "Informe o nome do produto, fornecedor, descrição do problema e anexe fotos.",
      "As fotos são armazenadas no sistema de arquivos do backend.",
      "Visualize o histórico completo de não conformidades registradas.",
    ],
  },
  {
    icon: FileText,
    title: "Relatório Mensal",
    content: [
      "Gere relatórios de movimentações por período.",
      "Visualize entradas e saídas consolidadas.",
      "Útil para controle gerencial e auditoria do estoque.",
    ],
  },
  {
    icon: Users,
    title: "Funcionários (Admin)",
    content: [
      "Disponível apenas para administradores.",
      "Cadastre novos funcionários com e-mail e senha temporária.",
      "O funcionário deverá alterar a senha no primeiro acesso.",
      "Gerencie permissões: administradores têm acesso total; funcionários têm acesso operacional.",
      "Bloqueie ou desbloqueie contas de funcionários.",
    ],
  },
  {
    icon: Shield,
    title: "Segurança e Acesso",
    content: [
      "O sistema exige autenticação para acesso a todas as funcionalidades.",
      "Senhas temporárias forçam alteração no primeiro login.",
      "Contas bloqueadas são redirecionadas para tela específica.",
      "Os dados são protegidos por políticas de segurança no banco de dados.",
      "Conexão HTTPS/SSL garante a segurança na transmissão dos dados.",
    ],
  },
];

function generatePDF() {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const checkNewPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
  };

  // Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("NUH - Manual do Usuário", pageWidth / 2, y, { align: "center" });
  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema de Controle de Estoque", pageWidth / 2, y, { align: "center" });
  y += 15;

  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  for (const section of sections) {
    checkNewPage(30);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(section.title, margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    for (const line of section.content) {
      checkNewPage(12);
      const wrapped = doc.splitTextToSize(`• ${line}`, maxWidth - 5);
      doc.text(wrapped, margin + 5, y);
      y += wrapped.length * 5 + 3;
    }

    y += 6;
    doc.setDrawColor(230);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
  }

  // Footer
  checkNewPage(20);
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

  doc.save("NUH-Manual-do-Usuario.pdf");
  toast.success("PDF baixado com sucesso!");
}

const Manual = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Manual do Usuário</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Guia completo de como utilizar o sistema NUH de controle de estoque
          </p>
        </div>
        <Button size="sm" className="gap-2 sm:size-default" onClick={generatePDF}>
          <Download className="h-4 w-4" />
          Baixar PDF
        </Button>
      </div>

      <div className="space-y-4">
        {sections.map((section, idx) => (
          <Card key={idx} className="transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-base font-semibold sm:text-lg">{section.title}</h2>
              </div>
              <ul className="space-y-2 pl-1">
                {section.content.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                    {line}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Manual;
