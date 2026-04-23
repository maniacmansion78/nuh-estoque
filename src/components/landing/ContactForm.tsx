import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { useState } from "react";
import { CheckCircle2, ShieldCheck, Mail, MessageSquare, Smartphone } from "lucide-react";
import { toast } from "sonner";

export const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
    }, 1500);
  };

  if (isSuccess) {
    return (
      <section id="contato" className="py-24 md:py-32 bg-slate-900 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-lg p-12 rounded-[40px] border border-white/20"
          >
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 size={40} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Recebemos seu projeto!</h2>
            <p className="text-white/70 text-lg mb-8">
              Obrigado pelo contato. Minha equipe vai analisar os detalhes e entraremos em contato via WhatsApp em até 24h.
            </p>
            <Button variant="outline" className="text-white border-white hover:bg-white hover:text-slate-900 rounded-full px-8" onClick={() => setIsSuccess(false)}>
              Enviar nova mensagem
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="contato" className="py-24 md:py-32 bg-slate-900 text-white relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
              Pronto para <span className="text-primary italic">digitalizar</span> sua operação?
            </h2>
            <p className="text-lg text-white/60 mb-12">
              Preencha o formulário ao lado com os detalhes do seu projeto. Vou analisar pessoalmente e retornar com um diagnóstico gratuito e uma estimativa de investimento.
            </p>

            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
                  <ShieldCheck size={28} />
                </div>
                <p className="font-medium">Seus dados estão protegidos pela LGPD</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
                  <MessageSquare size={28} />
                </div>
                <p className="font-medium">Atendimento humanizado via WhatsApp</p>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white p-8 md:p-10 rounded-[40px] shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-slate-900 font-bold text-sm">Nome</label>
                  <Input required placeholder="Ex: João Silva" className="rounded-xl bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-400 h-12" />
                </div>
                <div className="space-y-2">
                  <label className="text-slate-900 font-bold text-sm">WhatsApp</label>
                  <Input required placeholder="(00) 00000-0000" className="rounded-xl bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-400 h-12" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-slate-900 font-bold text-sm">E-mail</label>
                <Input required type="email" placeholder="seu@email.com" className="rounded-xl bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-400 h-12" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-slate-900 font-bold text-sm">Segmento/Nicho</label>
                  <Select required>
                    <SelectTrigger className="rounded-xl bg-slate-50 border-slate-100 text-slate-900 h-12">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gestao">Gestão Empresarial</SelectItem>
                      <SelectItem value="saude">Saúde & Bem-estar</SelectItem>
                      <SelectItem value="juridico">Jurídico & Contábil</SelectItem>
                      <SelectItem value="imoveis">Imóveis & Condomínios</SelectItem>
                      <SelectItem value="esporte">Esporte & Lazer</SelectItem>
                      <SelectItem value="educacao">Educação & Mentoria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-slate-900 font-bold text-sm">Faixa de Investimento</label>
                  <Select required>
                    <SelectTrigger className="rounded-xl bg-slate-50 border-slate-100 text-slate-900 h-12">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">R$ 5k - R$ 10k</SelectItem>
                      <SelectItem value="medium">R$ 10k - R$ 25k</SelectItem>
                      <SelectItem value="advanced">Acima de R$ 25k</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-slate-900 font-bold text-sm">Descrição do Projeto</label>
                <Textarea required placeholder="Conte brevemente o que você precisa..." className="rounded-xl bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-400 min-h-[100px]" />
              </div>

              <div className="flex items-start space-x-3 pt-2">
                <Checkbox id="privacy" required className="mt-1" />
                <label htmlFor="privacy" className="text-sm text-slate-500 leading-snug">
                  Li e concordo com a Política de Privacidade e autorizo o contato para fins de orçamento.
                </label>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-full text-lg font-bold shadow-xl shadow-primary/20">
                {isSubmitting ? "Enviando..." : "Receber proposta em até 24h"}
              </Button>
              
              <p className="text-center text-xs text-slate-400">
                Respeitamos sua privacidade. Seus dados nunca serão compartilhados.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};