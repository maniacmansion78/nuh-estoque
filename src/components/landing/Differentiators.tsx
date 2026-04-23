import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const differentiators = [
  {
    title: "Foco em experiência intuitiva",
    description: "Menos cliques, mais agilidade para o usuário final.",
  },
  {
    title: "Conformidade com LGPD nativa",
    description: "Privacidade e proteção de dados desde o primeiro dia.",
  },
  {
    title: "Integrações inteligentes",
    description: "Pagamentos, mensagens automatizadas e agendas conectadas.",
  },
  {
    title: "Estrutura preparada para crescimento",
    description: "Seu sistema escala conforme seu negócio cresce.",
  },
  {
    title: "Suporte contínuo com resposta garantida",
    description: "Atendimento humano e resolutivo em poucas horas.",
  },
];

export const Differentiators = () => {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-6 leading-tight">
              Diferenciais que <span className="text-primary">fazem a diferença</span> no dia a dia.
            </h2>
            <p className="text-lg text-secondary/60 mb-10">
              Minha entrega vai além do código. Construo ferramentas que resolvem problemas reais e geram valor imediato para sua operação.
            </p>
            <div className="space-y-6">
              {differentiators.map((diff) => (
                <div key={diff.title} className="flex gap-4 items-start">
                  <div className="w-6 h-6 text-primary flex-shrink-0 mt-1">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-secondary mb-1">{diff.title}</h4>
                    <p className="text-secondary/60 text-sm md:text-base">{diff.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="aspect-square bg-slate-50 rounded-[40px] flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="relative z-10 w-3/4 h-3/4 bg-white rounded-3xl shadow-2xl border border-slate-100 p-8">
                <div className="space-y-6">
                  <div className="h-4 w-1/2 bg-slate-100 rounded" />
                  <div className="space-y-3">
                    <div className="h-10 w-full bg-primary/10 rounded-lg flex items-center px-4">
                      <div className="h-2 w-2/3 bg-primary/30 rounded" />
                    </div>
                    <div className="h-10 w-full bg-slate-50 rounded-lg flex items-center px-4">
                      <div className="h-2 w-1/2 bg-slate-200 rounded" />
                    </div>
                    <div className="h-10 w-full bg-slate-50 rounded-lg flex items-center px-4">
                      <div className="h-2 w-3/4 bg-slate-200 rounded" />
                    </div>
                  </div>
                  <div className="pt-4">
                    <div className="h-32 bg-slate-50 rounded-2xl flex items-center justify-center">
                       <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};