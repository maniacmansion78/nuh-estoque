import { Link } from "react-router-dom";
import { useRef } from "react";
import { motion } from "framer-motion";
import {
  ChefHat,
  Scale,
  Calculator,
  TrendingDown,
  ArrowLeft,
  Check,
  Utensils,
  DollarSign,
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
    desc: "Registre todos os insumos do seu estoque com nome, categoria, preço, unidade, fornecedor, lote e validade. Defina alertas de estoque mínimo e vencimento. Escaneie código de barras para busca automática.",
  },
  {
    icon: ChefHat,
    title: "Fichas Técnicas (Receitas)",
    desc: "Monte receitas com ingredientes, peso bruto e fator de correção (FC). O sistema calcula automaticamente o peso líquido, o custo de cada ingrediente e o custo por porção do prato.",
  },
  {
    icon: Utensils,
    title: "Saída de Pratos (Vendas)",
    desc: "Registre quantos pratos foram vendidos no dia. A cada venda registrada, todos os insumos da ficha técnica são computados e abatidos automaticamente do estoque geral — sem trabalho manual.",
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
    icon: Calculator,
    title: "Custo Real por Porção",
    desc: "O custo total da receita é a soma de todos os ingredientes. Dividido pelo número de porções, você tem o custo unitário exato de cada prato. Compare com o preço de venda e conheça sua margem.",
  },
  {
    icon: Scale,
    title: "Fator de Correção (FC)",
    desc: "Compensa perdas no preparo (cascas, ossos, aparas). Peso Líquido = Peso Bruto ÷ FC. Exemplo: 400g de frango com FC 1.15 = 348g aproveitáveis. Garante custo e abatimento precisos.",
  },
  {
    icon: TrendingDown,
    title: "Abatimento Automático de Estoque",
    desc: "Ao registrar a venda de um prato, cada ingrediente é abatido do estoque com base na ficha técnica (quantidade × peso líquido). Sem lançamentos manuais — tudo automatizado.",
  },
  {
    icon: BarChart3,
    title: "Dashboard com Estatísticas",
    desc: "Resumo completo: total de pratos vendidos e insumos consumidos por Hoje, Semana, Quinzena e Mês. Dados consolidados em tempo real para tomada de decisão rápida.",
  },
];

const workflow = [
  { step: "01", title: "Cadastre Produtos", desc: "Registre os insumos com preço, unidade, lote e validade." },
  { step: "02", title: "Crie Fichas Técnicas", desc: "Monte as receitas com ingredientes, peso bruto e FC." },
  { step: "03", title: "Registre Vendas", desc: "Informe quantos pratos foram vendidos no dia." },
  { step: "04", title: "Tudo Atualizado", desc: "Os insumos são abatidos automaticamente e os relatórios atualizados." },
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

  addLine("EXEMPLO: FICHA TÉCNICA — YAKISOBA DE FRANGO", 14, true);
  addLine("Porções: 4 | Custo Total: R$ 32,80 | Custo/Porção: R$ 8,20");
  const ingredients = [
    "Macarrão Yakisoba: 500g | FC 1.00 | Líq 500g | R$ 8,50",
    "Peito de Frango: 400g | FC 1.15 | Líq 348g | R$ 12,00",
    "Cenoura: 200g | FC 1.20 | Líq 167g | R$ 2,40",
    "Repolho: 300g | FC 1.10 | Líq 273g | R$ 3,60",
    "Molho Shoyu: 100ml | FC 1.00 | Líq 100ml | R$ 4,30",
    "Óleo de Gergelim: 30ml | FC 1.00 | Líq 30ml | R$ 2,00",
  ];
  ingredients.forEach((i) => addLine(`  • ${i}`));
  y += 3;

  addLine("EXEMPLO DE ABATIMENTO (10 porções)", 12, true);
  [
    "Macarrão: -5kg", "Frango: -3,48kg", "Cenoura: -1,67kg",
    "Repolho: -2,73kg", "Shoyu: -1L", "Óleo Gergelim: -300ml",
  ].forEach((i) => addLine(`  ▸ ${i}`));

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
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="sm">Entrar</Button>
            </Link>
          </div>
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

      {/* Exemplo Ficha Técnica */}
      <section className="bg-muted/50 py-20">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div className="text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 className="text-3xl font-bold md:text-4xl" variants={fadeUp}>Exemplo Prático</motion.h2>
          </motion.div>

          <motion.div className="mt-12 overflow-hidden rounded-2xl border border-border bg-white" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="border-b border-border bg-primary/5 px-6 py-4">
              <div className="flex items-center gap-3">
                <Utensils className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Yakisoba de Frango</h3>
                <span className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Prato Principal</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">4 porções | Custo Total: R$ 32,80 | Custo/Porção: R$ 8,20</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ingrediente</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Bruto</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">FC</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Líquido</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Custo</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Macarrão Yakisoba", bruto: "500g", fc: "1.00", liq: "500g", custo: "R$ 8,50" },
                    { name: "Peito de Frango", bruto: "400g", fc: "1.15", liq: "348g", custo: "R$ 12,00" },
                    { name: "Cenoura", bruto: "200g", fc: "1.20", liq: "167g", custo: "R$ 2,40" },
                    { name: "Repolho", bruto: "300g", fc: "1.10", liq: "273g", custo: "R$ 3,60" },
                    { name: "Molho Shoyu", bruto: "100ml", fc: "1.00", liq: "100ml", custo: "R$ 4,30" },
                    { name: "Óleo de Gergelim", bruto: "30ml", fc: "1.00", liq: "30ml", custo: "R$ 2,00" },
                  ].map((row) => (
                    <tr key={row.name} className="border-b border-border/50">
                      <td className="px-4 py-3 font-medium">{row.name}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{row.bruto}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{row.fc}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{row.liq}</td>
                      <td className="px-4 py-3 text-right font-medium">{row.custo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Abatimento */}
          <motion.div className="mt-8 rounded-2xl border border-border bg-white p-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h3 className="mb-2 text-lg font-bold flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              Abatimento ao vender 10 porções
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              O sistema computa todos os insumos automaticamente e desconta do estoque geral:
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                "Macarrão Yakisoba: −5kg",
                "Peito de Frango: −3,48kg",
                "Cenoura: −1,67kg",
                "Repolho: −2,73kg",
                "Molho Shoyu: −1L",
                "Óleo de Gergelim: −300ml",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg bg-destructive/5 px-4 py-2 text-sm">
                  <Minus className="h-4 w-4 text-destructive" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Relatório */}
          <motion.div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h3 className="mb-2 text-lg font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Relatório de Consumo
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O relatório mostra <strong>quanto de cada insumo foi consumido</strong> nos pratos vendidos.
              Filtre por <strong>Dia, Semana, Quinzena ou Mês</strong> para ver o total de peso/volume gasto por ingrediente.
              Ideal para planejar compras e identificar os insumos de maior consumo.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16">
        <motion.div className="mx-auto max-w-2xl px-4 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.h2 className="text-3xl font-bold text-primary-foreground md:text-4xl" variants={fadeUp}>
            Pronto para começar?
          </motion.h2>
          <motion.p className="mt-4 text-primary-foreground/80" variants={fadeUp}>
            Teste grátis por 30 dias. Sem compromisso.
          </motion.p>
          <motion.div className="mt-8 flex flex-wrap justify-center gap-4" variants={fadeUp}>
            <Link to="/demo">
              <Button size="lg" className="bg-white px-8 text-lg font-bold text-primary hover:bg-white/90">
                🚀 Testar Grátis
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 px-8 text-lg text-primary-foreground hover:bg-primary-foreground/10">
                Já tenho conta
              </Button>
            </Link>
          </motion.div>
        </motion.div>
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
