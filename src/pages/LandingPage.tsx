import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  ArrowLeftRight,
  AlertTriangle,
  Users,
  BarChart3,
  Smartphone,
  Check,
  ChevronDown,
  ShieldCheck,
  Zap,
  Clock,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import logoNuh from "@/assets/logo-nuh.jpeg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

const features = [
  {
    icon: Package,
    title: "Controle de Estoque",
    desc: "Gerencie produtos, lotes, validades e quantidades mínimas. Alertas automáticos de vencimento e estoque baixo.",
  },
  {
    icon: ArrowLeftRight,
    title: "Movimentações",
    desc: "Registre entradas e saídas com rastreamento por lote. Histórico completo de todas as operações.",
  },
  {
    icon: AlertTriangle,
    title: "Não Conformidades",
    desc: "Registre ocorrências com fotos, vincule fornecedores e mantenha o controle de qualidade.",
  },
  {
    icon: BarChart3,
    title: "Dashboard Completo",
    desc: "Visão geral do estoque, alertas de validade, produtos próximos do mínimo e resumo financeiro.",
  },
  {
    icon: Users,
    title: "Gestão de Funcionários",
    desc: "Cadastre colaboradores, defina permissões e controle quem acessa o quê no sistema.",
  },
  {
    icon: Smartphone,
    title: "100% Responsivo",
    desc: "Acesse de qualquer dispositivo — celular, tablet ou computador. Sua cozinha na palma da mão.",
  },
];

const howItWorks = [
  {
    icon: Zap,
    title: "Cadastre Produtos Rápido",
    desc: "Adicione produtos, fornecedores e lotes com poucos cliques.",
  },
  {
    icon: Clock,
    title: "Controle de Validade",
    desc: "Alertas automáticos de vencimento para evitar desperdícios.",
  },
  {
    icon: ShieldCheck,
    title: "Qualidade Garantida",
    desc: "Registre não conformidades e mantenha seus padrões elevados.",
  },
];

const planFeatures = [
  "Controle de estoque completo",
  "Movimentações ilimitadas",
  "Gestão de fornecedores",
  "Não conformidades com fotos",
  "Dashboard com alertas",
  "Gestão de funcionários",
  "Suporte prioritário",
  "Atualizações gratuitas",
  "Acesso mobile completo",
];

const testimonials = [
  {
    text: "Antes eu perdia horas com planilhas e cadernos. Com o NUH, organizo meu estoque e validades em minutos. Reduzi o desperdício em 40%!",
    name: "Ana Costa",
    role: "Chef de Cozinha — Restaurante Sakura",
    emoji: "🍜",
  },
  {
    text: "O controle de não conformidades é incrível. Consigo rastrear cada problema com fornecedores e manter a qualidade dos meus pratos.",
    name: "Carlos Mendes",
    role: "Gerente — Thai Garden",
    emoji: "🏆",
  },
  {
    text: "Sistema intuitivo e rápido. Minha equipe inteira usa sem dificuldade. Recomendo para qualquer restaurante que leva estoque a sério!",
    name: "Fernanda Lima",
    role: "Proprietária — Padaria Artesanal",
    emoji: "⭐",
  },
];

const faqs = [
  {
    q: "Não entendo de tecnologia. Vou conseguir usar?",
    a: "Sim! O NUH foi projetado para ser intuitivo. Se você sabe usar um celular, consegue usar o sistema sem nenhum treinamento.",
  },
  {
    q: "Funciona em qualquer dispositivo?",
    a: "Sim! O NUH é 100% responsivo e funciona perfeitamente em celulares, tablets e computadores.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, você pode cancelar a qualquer momento sem taxas adicionais. Sem burocracia.",
  },
  {
    q: "Tem limite de produtos ou funcionários?",
    a: "Não! O plano inclui produtos, movimentações e funcionários ilimitados.",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-[hsl(220,20%,10%)] overflow-y-auto">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-[hsl(220,14%,90%)] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logoNuh} alt="NUH Logo" className="h-9 w-9 rounded-lg object-cover" />
            <span className="text-xl font-bold">NUH</span>
          </div>

          {/* Desktop menu */}
          <div className="hidden items-center gap-6 md:flex">
            {[
              ["Funcionalidades", "funcionalidades"],
              ["Como Funciona", "como-funciona"],
              ["Plano", "plano"],
              ["FAQ", "faq"],
            ].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-sm text-[hsl(220,10%,45%)] transition-colors hover:text-[hsl(220,20%,10%)]"
              >
                {label}
              </button>
            ))}
            <Link to="/login">
              <Button variant="outline" className="border-[hsl(220,14%,80%)] bg-transparent text-[hsl(220,20%,10%)] hover:bg-[hsl(220,14%,95%)]">
                Entrar
              </Button>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[hsl(220,14%,90%)] bg-white px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {[
                ["Funcionalidades", "funcionalidades"],
                ["Como Funciona", "como-funciona"],
                ["Plano", "plano"],
                ["FAQ", "faq"],
              ].map(([label, id]) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="text-left text-sm text-[hsl(220,10%,45%)] transition-colors hover:text-[hsl(220,20%,10%)]"
                >
                  {label}
                </button>
              ))}
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full border-[hsl(220,14%,80%)] bg-transparent text-[hsl(220,20%,10%)]">
                  Entrar
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <motion.section
        className="mx-auto max-w-4xl px-4 pb-20 pt-24 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
      >
        <motion.h1
          className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl"
          variants={fadeUp}
        >
          O sistema exclusivo do{" "}
          <span className="text-primary">NUH Thai Restaurant</span>
        </motion.h1>
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg text-[hsl(220,10%,45%)]"
          variants={fadeUp}
        >
          Controle completo de estoque, validades, fornecedores e equipe — desenvolvido especialmente para a operação do NUH.
        </motion.p>
        <motion.div className="mt-10 flex flex-wrap items-center justify-center gap-4" variants={fadeUp}>
          <Button
            size="lg"
            className="bg-primary px-8 text-lg font-semibold text-primary-foreground hover:bg-primary/90"
            onClick={() => scrollTo("plano")}
          >
            🚀 Começar Agora
          </Button>
          <Link to="/login">
            <Button
              size="lg"
              variant="outline"
              className="border-[hsl(220,14%,80%)] bg-transparent px-8 text-lg text-[hsl(220,20%,10%)] hover:bg-[hsl(220,14%,95%)]"
            >
              Entrar
            </Button>
          </Link>
        </motion.div>
      </motion.section>

      {/* Como Funciona */}
      <section id="como-funciona" className="bg-[hsl(220,14%,96%)] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 className="text-3xl font-bold md:text-4xl" variants={fadeUp}>
              Como Funciona o NUH
            </motion.h2>
            <motion.p className="mx-auto mt-4 max-w-xl text-[hsl(220,10%,45%)]" variants={fadeUp}>
              Chega de planilhas, cadernos e controles manuais. O NUH é seu braço direito na gestão da cozinha.
            </motion.p>
          </motion.div>
          <motion.div
            className="mt-14 grid gap-6 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {howItWorks.map((item) => (
              <motion.div
                key={item.title}
                className="rounded-xl border border-[hsl(220,14%,90%)] bg-white p-6"
                variants={fadeUp}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-[hsl(220,10%,45%)]">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 className="text-3xl font-bold md:text-4xl" variants={fadeUp}>
              Funcionalidades
            </motion.h2>
            <motion.p className="mx-auto mt-4 max-w-xl text-[hsl(220,10%,45%)]" variants={fadeUp}>
              Tudo que você precisa em um só sistema
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

      {/* Plano */}
      <section id="plano" className="bg-[hsl(220,14%,96%)] py-20">
        <div className="mx-auto max-w-lg px-4">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 className="text-3xl font-bold md:text-4xl" variants={fadeUp}>
              💳 Plano Único
            </motion.h2>
            <motion.p className="mt-4 text-[hsl(220,10%,45%)]" variants={fadeUp}>
              ⚡ Acesso completo a todas as funcionalidades
            </motion.p>
          </motion.div>

          <motion.div
            className="relative mt-12 overflow-hidden rounded-2xl border-2 border-primary bg-white"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="bg-primary px-4 py-2 text-center text-sm font-bold text-primary-foreground">
              🔥 MELHOR CUSTO-BENEFÍCIO
            </div>
            <div className="p-8">
              <p className="text-sm font-medium text-[hsl(220,10%,45%)]">Semestral</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold">R$ 69</span>
                <span className="text-2xl font-bold text-[hsl(220,10%,45%)]">,90</span>
                <span className="ml-1 text-[hsl(220,10%,45%)]">/mês</span>
              </div>
              <p className="mt-2 text-xs text-[hsl(220,10%,55%)]">Cobrado semestralmente • R$ 419,40 total</p>

              <div className="mt-8 space-y-3">
                <p className="text-sm font-semibold">✨ Tudo Incluído:</p>
                {planFeatures.map((f) => (
                  <div key={f} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-secondary" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className="mt-8 w-full bg-primary text-lg font-bold text-primary-foreground hover:bg-primary/90"
                onClick={() => scrollTo("plano")}
              >
                🚀 Começar Agora
              </Button>
              <p className="mt-3 text-center text-xs text-[hsl(220,10%,55%)]">
                Pagamento 100% seguro
              </p>
            </div>
          </motion.div>
        </div>
      </section>


      {/* FAQ */}
      <section id="faq" className="bg-[hsl(220,14%,96%)] py-20">
        <div className="mx-auto max-w-2xl px-4">
          <motion.h2
            className="text-center text-3xl font-bold md:text-4xl"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            ❓ Perguntas Frequentes
          </motion.h2>
          <div className="mt-12 space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-[hsl(220,14%,90%)] bg-white"
              >
                <button
                  className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="border-t border-[hsl(220,14%,90%)] px-6 py-4 text-sm text-[hsl(220,10%,45%)]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(220,14%,90%)] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center">
          <div className="flex items-center gap-2">
            <img src={logoNuh} alt="NUH" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-lg font-bold">NUH</span>
          </div>
          <p className="text-xs text-[hsl(220,10%,55%)]">
            © {new Date().getFullYear()} NUH — Thai Restaurant. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
