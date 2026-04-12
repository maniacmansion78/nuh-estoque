import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChefHat,
  Scale,
  Calculator,
  TrendingDown,
  ClipboardList,
  ArrowLeft,
  Check,
  Utensils,
  DollarSign,
  Package,
  FileText,
  BarChart3,
  AlertTriangle,
  Truck,
  ScanLine,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoNuh from "@/assets/logo-nuh.jpeg";

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
    title: "Cadastro de Produtos",
    items: [
      "Adicione nome, categoria, unidade, preço e fornecedor",
      "Defina quantidade mínima para alertas de estoque baixo",
      "Registre lote e validade para rastreabilidade",
      "Defina dias de alerta antes do vencimento",
      "Escaneie código de barras para buscar produtos automaticamente",
    ],
  },
  {
    icon: Truck,
    title: "Fornecedores",
    items: [
      "Cadastre nome, telefone e e-mail de cada fornecedor",
      "Vincule produtos aos seus respectivos fornecedores",
      "Acesse rapidamente o contato do fornecedor pelo WhatsApp",
    ],
  },
  {
    icon: ClipboardList,
    title: "Movimentações de Estoque",
    items: [
      "Registre entradas e saídas manuais de produtos",
      "Cada movimentação atualiza o estoque automaticamente",
      "Histórico completo com data, tipo, lote e quantidade",
      "Importação de NF-e via QR Code ou link para lançar entradas em lote",
      "Permissões configuráveis: somente entrada, somente saída ou ambos",
    ],
  },
  {
    icon: ChefHat,
    title: "Fichas Técnicas (Receitas)",
    items: [
      "Crie receitas com nome, categoria e número de porções",
      "Adicione ingredientes com peso bruto e fator de correção (FC)",
      "O peso líquido é calculado automaticamente: Peso Bruto ÷ FC",
      "Custo de cada ingrediente calculado com base no preço unitário do estoque",
      "Custo total da receita e custo por porção atualizados em tempo real",
      "Categorias: Entrada, Prato Principal, Sobremesa, Bebida, Acompanhamento, Molho",
    ],
  },
  {
    icon: Utensils,
    title: "Saída de Pratos (Vendas)",
    items: [
      "Selecione a data e o prato para registrar vendas do dia",
      "Aumente ou diminua a quantidade com botões + e −",
      "Vendas do mesmo prato no mesmo dia são agrupadas em um único card",
      "Ao registrar uma venda, o estoque dos insumos é abatido automaticamente",
      "O abatimento usa a ficha técnica: quantidade vendida × peso líquido de cada ingrediente",
      "Visualize vendas por dia, semana ou mês com filtros",
      "Resumo de consumo de insumos por período",
    ],
  },
  {
    icon: Scale,
    title: "Fator de Correção (FC)",
    items: [
      "O FC compensa perdas no preparo (cascas, ossos, aparas)",
      "Peso Líquido = Peso Bruto ÷ Fator de Correção",
      "Exemplo: 400g de frango com FC 1.15 = 348g aproveitáveis",
      "Garante custo real e abatimento preciso do estoque",
    ],
  },
  {
    icon: Calculator,
    title: "Custo por Porção",
    items: [
      "Custo Total = soma do custo de todos os ingredientes da receita",
      "Custo por Porção = Custo Total ÷ Número de Porções",
      "Atualizado em tempo real quando preços dos produtos mudam",
      "Compare com o preço de venda para calcular margem de lucro",
    ],
  },
  {
    icon: TrendingDown,
    title: "Abatimento Automático de Estoque",
    items: [
      "Ao registrar venda de um prato, cada ingrediente é abatido do estoque",
      "Cálculo: Quantidade Vendida × Peso Líquido do Ingrediente (em kg)",
      "Não precisa lançar saídas manuais — tudo é automatizado",
      "Se o estoque ficar abaixo do mínimo, alertas visuais aparecem no dashboard",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Não Conformidades",
    items: [
      "Registre problemas em entregas: produto errado, avariado, vencido, etc.",
      "Adicione fotos como evidência",
      "Vincule ao fornecedor responsável",
      "Gere relatório PDF ou envie via WhatsApp",
    ],
  },
  {
    icon: ScanLine,
    title: "Importação de NF-e",
    items: [
      "Escaneie o QR Code da nota fiscal ou cole o link",
      "Os produtos da nota são importados automaticamente como movimentações de entrada",
      "Economize tempo ao receber mercadorias",
    ],
  },
  {
    icon: BarChart3,
    title: "Dashboard e Relatórios",
    items: [
      "Resumo do estoque: total de produtos, alertas de estoque baixo e vencimento",
      "Últimas movimentações em destaque",
      "Relatório de movimentações com filtros por período e produto",
      "Exportação para análise detalhada",
    ],
  },
];

const workflow = [
  { step: "01", title: "Cadastre Fornecedores", desc: "Adicione os fornecedores com nome e contato." },
  { step: "02", title: "Cadastre Produtos", desc: "Registre os insumos com preço, unidade, lote e validade." },
  { step: "03", title: "Crie Fichas Técnicas", desc: "Monte as receitas com ingredientes, peso bruto e FC." },
  { step: "04", title: "Registre Movimentações", desc: "Lance entradas (compras) e saídas (consumo manual)." },
  { step: "05", title: "Registre Vendas de Pratos", desc: "Informe quantos pratos foram vendidos no dia." },
  { step: "06", title: "Estoque Atualizado", desc: "O sistema abate os insumos automaticamente e gera alertas." },
];

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
          Manual Completo do{" "}
          <span className="text-primary">Sistema NUH</span>
        </motion.h1>
        <motion.p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground" variants={fadeUp}>
          Conheça cada funcionalidade do sistema de controle de estoque, fichas técnicas e saída de pratos.
          Tudo explicado de forma simples e direta.
        </motion.p>
      </motion.section>

      {/* Fluxo de Trabalho */}
      <section className="bg-muted/50 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <motion.div className="text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 className="text-3xl font-bold md:text-4xl" variants={fadeUp}>
              Fluxo de Trabalho Recomendado
            </motion.h2>
            <motion.p className="mx-auto mt-4 max-w-xl text-muted-foreground" variants={fadeUp}>
              Siga estes passos para configurar e operar o sistema completo
            </motion.p>
          </motion.div>

          <motion.div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
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
            <motion.h2 className="text-3xl font-bold md:text-4xl" variants={fadeUp}>
              Funcionalidades Detalhadas
            </motion.h2>
            <motion.p className="mx-auto mt-4 max-w-xl text-muted-foreground" variants={fadeUp}>
              Cada módulo do sistema explicado passo a passo
            </motion.p>
          </motion.div>

          <motion.div className="mt-14 grid gap-6 md:grid-cols-2" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {modules.map((m) => (
              <motion.div key={m.title} className="rounded-xl border border-border bg-white p-6 transition-colors hover:border-primary/30" variants={fadeUp}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <m.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{m.title}</h3>
                </div>
                <ul className="space-y-2">
                  {m.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Exemplo Ficha Técnica */}
      <section className="bg-muted/50 py-20">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div className="text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 className="text-3xl font-bold md:text-4xl" variants={fadeUp}>
              Exemplo Prático: Ficha Técnica
            </motion.h2>
            <motion.p className="mx-auto mt-4 max-w-xl text-muted-foreground" variants={fadeUp}>
              Veja como uma receita fica organizada no sistema
            </motion.p>
          </motion.div>

          <motion.div className="mt-12 overflow-hidden rounded-2xl border border-border bg-white" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="border-b border-border bg-primary/5 px-6 py-4">
              <div className="flex items-center gap-3">
                <Utensils className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Yakisoba de Frango</h3>
                <span className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Prato Principal
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Porções: 4 | Custo Total: R$ 32,80 | Custo/Porção: R$ 8,20</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ingrediente</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Peso Bruto</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">FC</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Peso Líquido</th>
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

          {/* Exemplo Abatimento */}
          <motion.div className="mt-8 rounded-2xl border border-border bg-white p-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h3 className="mb-4 text-lg font-bold flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              Exemplo de Abatimento
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Se você registrar a venda de <strong>10 porções</strong> de Yakisoba de Frango, o sistema abate do estoque:
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                "Macarrão Yakisoba: 5.000g (5kg)",
                "Peito de Frango: 3.480g (3,48kg)",
                "Cenoura: 1.670g (1,67kg)",
                "Repolho: 2.730g (2,73kg)",
                "Molho Shoyu: 1.000ml (1L)",
                "Óleo de Gergelim: 300ml",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg bg-destructive/5 px-4 py-2 text-sm">
                  <Minus className="h-4 w-4 text-destructive" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
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
