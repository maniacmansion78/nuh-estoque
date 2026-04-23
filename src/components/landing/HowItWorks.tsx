import { motion } from "framer-motion";
import { Search, PenTool, Code, Rocket, ChevronRight } from "lucide-react";

const steps = [
  {
    title: "Briefing & Validação",
    description: "Alinhamos suas necessidades e validamos o escopo do projeto.",
    icon: <Search className="w-8 h-8" />,
  },
  {
    title: "Design & Protótipo",
    description: "Criamos a interface visual e a experiência de uso (UI/UX).",
    icon: <PenTool className="w-8 h-8" />,
  },
  {
    title: "Desenvolvimento & Testes",
    description: "Construímos o código com foco em segurança e performance.",
    icon: <Code className="w-8 h-8" />,
  },
  {
    title: "Lançamento & Suporte",
    description: "Publicamos nas lojas e acompanhamos os primeiros resultados.",
    icon: <Rocket className="w-8 h-8" />,
  },
];

export const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-24 md:py-32 bg-slate-50 border-y border-slate-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Como Funciona</h2>
          <p className="text-lg text-secondary/60 max-w-2xl mx-auto">
            Um processo transparente e ágil para transformar sua ideia em uma ferramenta real.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 bg-white shadow-xl rounded-full flex items-center justify-center mb-8 relative z-10 group-hover:scale-110 transition-transform border border-slate-100">
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="text-primary">{step.icon}</div>
                </div>
                <h3 className="text-xl font-bold text-secondary mb-3">{step.title}</h3>
                <p className="text-secondary/60 text-sm md:text-base px-4">{step.description}</p>
                
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 -translate-y-1/2 z-20 text-slate-300">
                    <ChevronRight size={24} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};