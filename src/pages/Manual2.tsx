import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChefHat,
  Scale,
  TrendingDown,
  ArrowLeft,
  Check,
  Utensils,
  Package,
  BarChart3,
  BookOpen,
  Minus,
  Download,
  CalendarDays,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoNuh from "@/assets/logo-nuh.jpeg";
import jsPDF from "jspdf";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const modules = [
  {
    icon: Package,
    title: "Cadastro de Produtos (Insumos)",
    desc: "Registre todos os insumos do estoque com nome, categoria, unidade, fornecedor, lote e validade. Defina alertas de estoque mínimo e vencimento. Escaneie código de barras para busca automática.",
  },
  {
    icon: ChefHat,
    title: "Fichas Técnicas (Receitas)",
    desc: "Monte receitas com ingredientes, peso bruto e fator de correção (FC). O sistema calcula automaticamente o peso líquido de cada ingrediente utilizado na receita.",
  },
  {
    icon: Utensils,
    title: "Saída de Pratos (Vendas)",
    desc: "Registre quantos pratos foram vendidos no dia. A cada venda, todos os insumos da ficha técnica são computados automaticamente no estoque geral — sem trabalho manual.",
  },
  {
    icon: CalendarDays,
    title: "Visualização por Período",
    desc: "Acompanhe as vendas e o consumo de insumos por Dia, Semana, Quinzena ou Mês. Os dados são acumulados e atualizados em tempo real para cada período selecionado.",
  },
  {
    icon: FileText,
    title: "Relatório de Consumo de Insumos",
    desc: "Relatório detalhado que mostra exatamente quanto de cada insumo foi consumido nos pratos vendidos. Saiba o total de peso/volume gasto por ingrediente em qualquer período.",
  },
  {
    icon: Scale,
    title: "Fator de Correção (FC)",
    desc: "Compensa perdas no preparo (cascas, ossos, aparas). Peso Líquido = Peso Bruto ÷ FC. Exemplo: 400g de frango com FC 1.15 = 348g aproveitáveis. Garante cálculo preciso do estoque.",
  },
  {
    icon: TrendingDown,
    title: "Computação Automática de Estoque",
    desc: "Ao registrar a venda de um prato, cada ingrediente é computado automaticamente com base na ficha técnica (quantidade × peso bruto). Sem lançamentos manuais — tudo automatizado.",
  },
  {
    icon: BarChart3,
    title: "Dashboard com Estatísticas",
    desc: "Resumo completo: total de pratos vendidos e insumos consumidos por Hoje, Semana, Quinzena e Mês. Dados consolidados em tempo real para tomada de decisão rápida.",
  },
];

const workflow = [
  { step: "01", title: "Crie Fichas Técnicas", desc: "Monte as receitas com ingredientes, peso bruto e FC." },
  { step: "02", title: "Registre Vendas", desc: "Informe quantos pratos foram vendidos no dia." },
  { step: "03", title: "Tudo Atualizado", desc: "Os insumos são computados automaticamente e os relatórios atualizados." },
];

function handleDownloadPDF() {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  const addLine = (text: string, size = 11, bold = false) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, pageW - 30);
    doc.text(lines, 15, y);
    y += lines.length * (size * 0.45) + 3;
  };

  addLine("Manual Completo — Sistema NUH", 18, true);
  addLine("Fichas Técnicas & Saída de Pratos", 13, true);
  y += 5;

  addLine("FLUXO DE TRABALHO", 14, true);
  workflow.forEach((w) => { addLine(`${w.step}. ${w.title}: ${w.desc}`); });
  y += 5;

  addLine("FUNCIONALIDADES", 14, true);
  modules.forEach((m) => {
    y += 2;
    addLine(m.title, 12, true);
    addLine(m.desc);
  });
  y += 5;

  addLine("© NUH — Asian Food", 9);

  doc.save("Manual-NUH-Fichas-Tecnicas.pdf");
}

export default function Manual2() {
  return (
    <div className="min-h-screen bg-white text-foreground overflow-y-auto">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoNuh} alt="NUH Logo" className="h-9 w-9 rounded-lg object-cover" />
            <span className="text-xl font-bold">NUH</span>
          </Link>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4" />
            Baixar PDF
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <motion.section
        className="mx-auto max-w-4xl px-4 pb-16 pt-20 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
      >
        <motion.div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10" variants={fadeUp}>
          <BookOpen className="h-10 w-10 text-primary" />
        </motion.div>
        <motion.h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-5xl" variants={fadeUp}>
          Manual do{" "}
          <span className="text-primary">Sistema NUH</span>
        </motion.h1>
        <motion.p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground" variants={fadeUp}>
          Fichas técnicas, saída de pratos e controle de insumos — tudo integrado.
          A cada prato vendido, os insumos são computados e o estoque atualizado automaticamente.
        </motion.p>
      </motion.section>

      {/* Fluxo */}
      <section className="bg-muted/50 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <motion.div className="text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 className="text-3xl font-bold md:text-4xl" variants={fadeUp}>Como Funciona</motion.h2>
          </motion.div>

          <motion.div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {workflow.map((w) => (
              <motion.div key={w.step} className="flex gap-4 rounded-xl border border-border bg-white p-5" variants={fadeUp}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                  {w.step}
                </div>
                <div>
                  <h3 className="font-semibold">{w.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{w.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Módulos */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <motion.div className="text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 className="text-3xl font-bold md:text-4xl" variants={fadeUp}>Funcionalidades</motion.h2>
          </motion.div>

          <motion.div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {modules.map((m) => (
              <motion.div key={m.title} className="rounded-xl border border-border bg-white p-6 transition-colors hover:border-primary/30" variants={fadeUp}>
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <m.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold">{m.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center">
          <div className="flex items-center gap-2">
            <img src={logoNuh} alt="NUH" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-lg font-bold">NUH</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} NUH — Asian Food. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
