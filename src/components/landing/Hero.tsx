import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Smartphone, Monitor } from "lucide-react";

export const Hero = () => {
  return (
    <section id="inicio" className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-slate-50 rounded-l-[100px] hidden lg:block" />
      
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-secondary leading-tight mb-6">
                Aplicativos sob medida para <span className="text-primary">escalar seu negócio</span>
              </h1>
              <p className="text-lg md:text-xl text-secondary/70 mb-10 max-w-2xl mx-auto lg:mx-0">
                Desenvolvo soluções digitais inteligentes para clínicas, escritórios, condomínios, quadras e muito mais. 
                Do conceito ao lançamento, com foco na experiência do usuário e total conformidade com a LGPD.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Button size="lg" className="rounded-full px-8 h-14 text-lg font-bold shadow-lg shadow-primary/20 w-full sm:w-auto" onClick={() => document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" })}>
                  Falar com um especialista
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg font-bold border-2 w-full sm:w-auto" onClick={() => document.getElementById("portfolio")?.scrollIntoView({ behavior: "smooth" })}>
                  Ver projetos entregues
                </Button>
              </div>
            </motion.div>
          </div>

          <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              {/* Mockup Desktop */}
              <div className="bg-white rounded-2xl shadow-2xl p-2 border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 rounded-xl aspect-[16/10] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-8 bg-white border-b border-slate-200 flex items-center px-3 gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                  </div>
                  <div className="p-8 w-full">
                    <div className="space-y-4">
                      <div className="h-4 w-3/4 bg-slate-200 rounded" />
                      <div className="h-20 w-full bg-slate-200 rounded" />
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-24 bg-primary/20 rounded-lg" />
                        <div className="h-24 bg-slate-200 rounded-lg" />
                        <div className="h-24 bg-slate-200 rounded-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mockup Mobile */}
              <div className="absolute -bottom-10 -left-6 md:-left-12 w-32 md:w-48 bg-white rounded-[2rem] shadow-2xl p-2 border border-slate-200">
                <div className="bg-slate-900 rounded-[1.8rem] aspect-[9/19] overflow-hidden flex flex-col items-center justify-center p-4">
                  <div className="w-12 h-1 bg-slate-800 rounded-full mb-6" />
                  <div className="space-y-3 w-full">
                    <div className="h-2 w-1/2 bg-slate-800 rounded mx-auto" />
                    <div className="h-10 w-full bg-primary rounded-lg" />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-16 bg-slate-800 rounded-lg" />
                      <div className="h-16 bg-slate-800 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-6 right-0 bg-white shadow-xl rounded-2xl p-4 flex items-center gap-3 border border-slate-100 animate-bounce-slow">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <ArrowRight size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-secondary uppercase">Produtividade</p>
                  <p className="text-sm text-secondary/70">+40% eficiência</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};