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
  BarChart3,
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

const features = [
  {
    icon: ChefHat,
    title: "Fichas Técnicas Completas",
    desc: "Cadastre receitas com todos os ingredientes, quantidades e unidades de medida. Organize por categorias como Entrada, Prato Principal, Sobremesa e mais.",
  },
  {
    icon: Scale,
    title: "Peso Bruto e Fator de Correção",
    desc: "Registre o peso bruto de cada ingrediente e aplique o fator de correção (FC) para calcular automaticamente o peso líquido real utilizado na receita.",
  },
  {
    icon: Calculator,
    title: "Custo Automático por Porção",
    desc: "O sistema calcula o custo total da receita e divide pelo número de porções, dando o custo unitário exato de cada prato servido.",
  },
  {
    icon: TrendingDown,
    title: "Abatimento Automático de Estoque",
    desc: "Ao registrar a saída de pratos na tela de vendas, o estoque dos insumos é abatido automaticamente com base na ficha técnica — sem trabalho manual.",
  },
  {
    icon: ClipboardList,
    title: "Saída de Pratos por Dia",
    desc: "Registre quantas unidades de cada prato foram vendidas no dia. O sistema agrupa vendas do mesmo prato em um único card com a quantidade total.",
  },
  {
    icon: DollarSign,
    title: "Controle de Custos Real",
    desc: "Saiba exatamente quanto cada prato custa para produzir. Compare com o preço de venda e tome decisões baseadas em dados reais.",
  },
];

const steps = [
  {
    number: "01",
    title: "Cadastre seus Insumos",
    desc: "Adicione os produtos do seu estoque com preço, unidade e fornecedor.",
  },
  {
    number: "02",
    title: "Crie a Ficha Técnica",
    desc: "Monte a receita com os ingredientes, peso bruto, fator de correção e custo unitário.",
  },
  {
    number: "03",
    title: "Registre as Vendas",
    desc: "No fim do dia, registre quantos pratos foram vendidos na tela de Saída de Pratos.",
  },
  {
    number: "04",
    title: "Estoque Atualizado",
    desc: "O sistema abate automaticamente os insumos do estoque com base nas fichas técnicas.",
  },
];

const benefits = [
  "Redução de desperdício com fator de correção",
  "Custo real por porção calculado automaticamente",
  "Estoque abatido sem trabalho manual",
  "Histórico de vendas por prato e por dia",
  "Organização por categorias de receita",
  "Vendas do mesmo prato agrupadas no dia",
  "Relatórios precisos de consumo",
  "Integração total com o controle de estoque",
];

export default function FichasTecnicasInfo() {
  return (
    <div className="min-h-screen bg-white text-[hsl(220,20%,10%)] overflow-y-auto">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-[hsl(220,14%,90%)] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoNuh} alt="NUH Logo" className="h-9 w-9 rounded-lg object-cover" />
            <span className="text-xl font-bold">NUH</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 text-[hsl(220,10%,45%)]">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="sm" className="border-[hsl(220,14%,80%)] bg-transparent text-[hsl(220,20%,10%)]">
                Entrar
              </Button>
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
        <motion.div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10"
          variants={fadeUp}
        >
          <ChefHat className="h-10 w-10 text-primary" />
        </motion.div>
        <motion.h1
          className="text-3xl font-extrabold leading-tight tracking-tight md:text-5xl"
          variants={fadeUp}
        >
          Fichas Técnicas &{" "}
          <span className="text-primary">Saída de Pratos</span>
        </motion.h1>
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg text-[hsl(220,10%,45%)]"
          variants={fadeUp}
        >
          Controle total da produção: do ingrediente ao prato servido. Calcule custos reais,
          aplique fatores de correção e abata o estoque automaticamente a cada venda.
        </motion.p>
        <motion.div className="mt-8 flex flex-wrap justify-center gap-4" variants={fadeUp}>
          <Link to="/demo">
            <Button size="lg" className="bg-primary px-8 text-lg font-semibold text-primary-foreground hover:bg-primary/90">
              🚀 Testar Grátis
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="border-[hsl(220,14%,80%)] bg-transparent px-8 text-lg text-[hsl(220,20%,10%)] hover:bg-[hsl(220,14%,95%)]">
              Já tenho conta
            </Button>
          </Link>
        </motion.div>
      </motion.section>

      {/* Funcionalidades */}
      <section className="bg-[hsl(220,14%,96%)] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 className="text-3xl font-bold md:text-4xl" variants={fadeUp}>
              O que o sistema faz por você
            </motion.h2>
            <motion.p className="mx-auto mt-4 max-w-xl text-[hsl(220,10%,45%)]" variants={fadeUp}>
              Cada recurso foi pensado para simplificar a gestão da sua cozinha
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                className="rounded-xl border border-[hsl(220,14%,90%)] bg-white p-6 transition-colors hover:border-primary/30"
                variants={fadeUp}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-[hsl(220,10%,45%)]">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Passo a Passo */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 className="text-3xl font-bold md:text-4xl" variants={fadeUp}>
              Como funciona na prática
            </motion.h2>
            <motion.p className="mx-auto mt-4 max-w-xl text-[hsl(220,10%,45%)]" variants={fadeUp}>
              Do cadastro ao abatimento automático em 4 passos simples
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-14 grid gap-6 sm:grid-cols-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {steps.map((step) => (
              <motion.div
                key={step.number}
                className="flex gap-4 rounded-xl border border-[hsl(220,14%,90%)] bg-white p-6"
                variants={fadeUp}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-[hsl(220,10%,45%)]">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Exemplo Visual */}
      <section className="bg-[hsl(220,14%,96%)] py-20">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 className="text-3xl font-bold md:text-4xl" variants={fadeUp}>
              Exemplo: Ficha Técnica de um Prato
            </motion.h2>
          </motion.div>

          <motion.div
            className="mt-12 overflow-hidden rounded-2xl border border-[hsl(220,14%,90%)] bg-white"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="border-b border-[hsl(220,14%,90%)] bg-primary/5 px-6 py-4">
              <div className="flex items-center gap-3">
                <Utensils className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Yakisoba de Frango</h3>
                <span className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Prato Principal
                </span>
              </div>
              <p className="mt-1 text-sm text-[hsl(220,10%,45%)]">Porções: 4 | Custo Total: R$ 32,80 | Custo/Porção: R$ 8,20</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(220,14%,90%)] bg-[hsl(220,14%,97%)]">
                    <th className="px-4 py-3 text-left font-medium text-[hsl(220,10%,45%)]">Ingrediente</th>
                    <th className="px-4 py-3 text-center font-medium text-[hsl(220,10%,45%)]">Peso Bruto</th>
                    <th className="px-4 py-3 text-center font-medium text-[hsl(220,10%,45%)]">FC</th>
                    <th className="px-4 py-3 text-center font-medium text-[hsl(220,10%,45%)]">Peso Líquido</th>
                    <th className="px-4 py-3 text-right font-medium text-[hsl(220,10%,45%)]">Custo</th>
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
                    <tr key={row.name} className="border-b border-[hsl(220,14%,93%)]">
                      <td className="px-4 py-3 font-medium">{row.name}</td>
                      <td className="px-4 py-3 text-center text-[hsl(220,10%,45%)]">{row.bruto}</td>
                      <td className="px-4 py-3 text-center text-[hsl(220,10%,45%)]">{row.fc}</td>
                      <td className="px-4 py-3 text-center text-[hsl(220,10%,45%)]">{row.liq}</td>
                      <td className="px-4 py-3 text-right font-medium">{row.custo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 className="text-3xl font-bold md:text-4xl" variants={fadeUp}>
              ✅ Benefícios
            </motion.h2>
          </motion.div>

          <motion.div
            className="mt-12 grid gap-3 sm:grid-cols-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {benefits.map((b) => (
              <motion.div key={b} className="flex items-center gap-3 rounded-lg border border-[hsl(220,14%,90%)] bg-white px-5 py-4" variants={fadeUp}>
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm font-medium">{b}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-primary py-16">
        <motion.div
          className="mx-auto max-w-2xl px-4 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2 className="text-3xl font-bold text-primary-foreground md:text-4xl" variants={fadeUp}>
            Comece a controlar sua produção hoje
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
            <Link to="/">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 px-8 text-lg text-primary-foreground hover:bg-primary-foreground/10">
                Ver todas funcionalidades
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(220,14%,90%)] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center">
          <div className="flex items-center gap-2">
            <img src={logoNuh} alt="NUH" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-lg font-bold">NUH</span>
          </div>
          <p className="text-xs text-[hsl(220,10%,55%)]">
            © {new Date().getFullYear()} NUH — Asian Food. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
