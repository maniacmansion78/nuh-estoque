import { motion } from "framer-motion";

export const ProblemSolution = () => {
  return (
    <section className="bg-slate-50 py-24 border-y border-slate-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-secondary leading-relaxed md:leading-snug mb-8">
              Muitos profissionais e pequenos negócios perdem tempo com <span className="text-primary italic">planilhas, mensagens soltas e processos manuais</span>. 
              Transformo essa dor em produtividade: aplicativos leves, seguros e feitos exatamente para a sua rotina.
            </h2>
            <div className="w-24 h-1 bg-primary/20 mx-auto rounded-full" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};