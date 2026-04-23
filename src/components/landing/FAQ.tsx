import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "Qual o prazo médio de entrega?",
    answer: "O prazo varia de acordo com a complexidade, mas projetos típicos de MVPs e automações para clínicas e escritórios levam entre 4 a 8 semanas da validação ao lançamento.",
  },
  {
    question: "Os aplicativos funcionam em iOS e Android?",
    answer: "Sim, desenvolvo soluções híbridas e progressivas que funcionam perfeitamente em ambos os sistemas operacionais, além de rodarem também no desktop via navegador.",
  },
  {
    question: "Como funciona o suporte após o lançamento?",
    answer: "Ofereço planos de suporte contínuo que garantem atualizações de segurança, correções de bugs e monitoramento 24/7, com tempo de resposta garantido em contrato.",
  },
  {
    question: "O sistema está adequado à proteção de dados?",
    answer: "Sim, todos os projetos seguem os princípios de Privacy by Design e estão em total conformidade com a LGPD, incluindo criptografia de dados sensíveis e logs de acesso.",
  },
  {
    question: "Preciso pagar hospedagem e domínio separadamente?",
    answer: "Não se preocupe com a parte técnica. Eu ajudo a configurar tudo e incluo a gestão de infraestrutura nas propostas, garantindo que você tenha um custo fixo previsível.",
  },
];

export const FAQ = () => {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Perguntas Frequentes</h2>
            <p className="text-lg text-secondary/60">
              Tudo o que você precisa saber para começar seu projeto com segurança.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-white border border-slate-100 rounded-2xl px-6 py-2 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="text-left text-lg font-bold text-secondary hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-secondary/70 text-base leading-relaxed pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
};