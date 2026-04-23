import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const projects = [
  {
    name: "ClinikFlow",
    segment: "Saúde",
    challenge: "Agendamentos manuais causavam 40% de faltas e erros em prontuários.",
    solution: "Sistema de prontuário digital com lembretes via WhatsApp e confirmação automática.",
    result: "Redução de 40% em faltas no primeiro mês.",
  },
  {
    name: "SmartCondo",
    segment: "Imóveis",
    challenge: "Falta de transparência em assembleias e demora no registro de chamados.",
    solution: "Portal do morador com votação online, reserva de quadras e gestão de obras.",
    result: "Processo 100% digitalizado e aumento de 60% na participação moradora.",
  },
  {
    name: "LegalOps",
    segment: "Jurídico",
    challenge: "Dificuldade em monitorar prazos e enviar atualizações constantes para clientes.",
    solution: "Painel de controle para advogados com integração de prazos e portal do cliente.",
    result: "Aumento de 30% na produtividade da equipe e redução de 50% em emails de status.",
  },
];

export const Portfolio = () => {
  return (
    <section id="portfolio" className="py-24 md:py-32 bg-slate-50 border-y border-slate-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Casos de Uso</h2>
          <p className="text-lg text-secondary/60 max-w-2xl mx-auto">
            Conheça alguns desafios reais que foram transformados em soluções digitais de sucesso.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col"
            >
              <div className="p-8 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-bold text-secondary">{project.name}</h3>
                  <Badge variant="secondary" className="rounded-full px-4 py-1">{project.segment}</Badge>
                </div>
                
                <div className="space-y-6 flex-1">
                  <div>
                    <p className="text-xs font-bold text-secondary/40 uppercase mb-2">Desafio</p>
                    <p className="text-secondary/70">{project.challenge}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-secondary/40 uppercase mb-2">Solução</p>
                    <p className="text-secondary/70">{project.solution}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-2xl">
                    <p className="text-xs font-bold text-green-600 uppercase mb-1">Resultado Mensurável</p>
                    <p className="text-green-700 font-semibold">{project.result}</p>
                  </div>
                </div>

                <Button variant="outline" className="mt-8 rounded-xl border-2 font-bold w-full">
                  Ver case completo
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};