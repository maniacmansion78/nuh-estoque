import { Facebook, Instagram, Linkedin, Twitter, Shield, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white pt-20 pb-10 border-t border-slate-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-secondary">DevApp</span>
            </div>
            <p className="text-secondary/60 text-sm leading-relaxed">
              Transformando processos complexos em aplicativos sob medida intuitivos e eficientes.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-secondary/60 hover:bg-primary hover:text-white transition-all">
                <Linkedin size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-secondary/60 hover:bg-primary hover:text-white transition-all">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-secondary/60 hover:bg-primary hover:text-white transition-all">
                <Facebook size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-secondary mb-6">Links Rápidos</h4>
            <ul className="space-y-4 text-sm text-secondary/60">
              <li><a href="#inicio" className="hover:text-primary transition-colors">Início</a></li>
              <li><a href="#solucoes" className="hover:text-primary transition-colors">Soluções</a></li>
              <li><a href="#como-funciona" className="hover:text-primary transition-colors">Como Funciona</a></li>
              <li><a href="#portfolio" className="hover:text-primary transition-colors">Portfólio</a></li>
              <li><a href="#contato" className="hover:text-primary transition-colors">Contato</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-secondary mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-secondary/60">
              <li><a href="#" className="hover:text-primary transition-colors">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Segurança de Dados</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">LGPD Compliance</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-secondary mb-6">Selo de Confiança</h4>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Shield size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-secondary uppercase mb-1">Protegido</p>
                <p className="text-xs text-secondary/60">Infraestrutura 100% segura e monitorada</p>
              </div>
            </div>
            <Button variant="ghost" className="mt-6 w-full text-secondary/40 hover:text-primary gap-2" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              Voltar ao topo <ArrowUp size={16} />
            </Button>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-secondary/40">
            © {currentYear} DevApp Soluções Digitais. Todos os direitos reservados.
          </p>
          <p className="text-xs text-secondary/40 italic">
            Desenvolvimento de alta performance focado em resultados reais.
          </p>
        </div>
      </div>
    </footer>
  );
};