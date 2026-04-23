import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  LayoutGrid, 
  Stethoscope, 
  Scale, 
  Building2, 
  Trophy, 
  GraduationCap 
} from "lucide-react";

const segments = [
  {
    title: "Gestão Empresarial",
    description: "Controle de estoque, fluxo de caixa e CRM integrados.",
    icon: <LayoutGrid className="w-8 h-8" />,
  },
  {
    title: "Saúde & Bem-estar",
    description: "Prontuário digital, agendamento e lembretes para pacientes.",
    icon: <Stethoscope className="w-8 h-8" />,
  },
  {
    title: "Jurídico & Contábil",
    description: "Gestão de processos, prazos e portal exclusivo para o cliente.",
    icon: <Scale className="w-8 h-8" />,
  },
  {
    title: "Imóveis & Condomínios",
    description: "Chamados, assembleia virtual e reserva de espaços.",
    icon: <Building2 className="w-8 h-8" />,
  },
  {
    title: "Esporte & Lazer",
    description: "Booking de quadras, mensalidades e sistema de rating.",
    icon: <Trophy className="w-8 h-8" />,
  },
  {
    title: "Educação & Mentoria",
    description: "Grade de horários, materiais e emissão de certificados.",
    icon: <GraduationCap className="w-8 h-8" />,
  },
];

export const Segments = () => {
  return (
    <section id="solucoes" className="py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Soluções por segmento</h2>
          <p className="text-lg text-secondary/60 max-w-2xl mx-auto">
            Desenvolvimento especializado para atender as particularidades do seu nicho de mercado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {segments.map((segment, index) => (
            <motion.div
              key={segment.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-8 rounded-2xl bg-white border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-slate-50 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                {segment.icon}
              </div>
              <h3 className="text-xl font-bold text-secondary mb-3">{segment.title}</h3>
              <p className="text-secondary/60 mb-8">{segment.description}</p>
              <Button 
                variant="ghost" 
                className="group-hover:text-primary p-0 hover:bg-transparent flex items-center gap-2 font-bold"
                onClick={() => document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" })}
              >
                Solicitar proposta <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

import { ArrowRight } from "lucide-react";