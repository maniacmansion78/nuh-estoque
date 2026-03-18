import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";
import html2canvas from "html2canvas";

interface BannerData {
  id: number;
  question: string;
  highlight: string;
  subtitle: string;
  options: { letter: string; text: string }[];
  accentColor: string;
}

const banners: BannerData[] = [
  {
    id: 1,
    question: "QUAL É O",
    highlight: "MAIOR\nDESAFIO",
    subtitle: "NA GESTÃO DE ESTOQUE?",
    accentColor: "#D4A843",
    options: [
      { letter: "A", text: "Controlar validade dos produtos." },
      { letter: "B", text: "Evitar desperdício de ingredientes." },
      { letter: "C", text: "Saber a quantidade exata em estoque." },
      { letter: "D", text: "Registrar entradas e saídas corretamente." },
    ],
  },
  {
    id: 2,
    question: "O QUE MAIS",
    highlight: "PREJUDICA\nSEU LUCRO",
    subtitle: "NO RESTAURANTE?",
    accentColor: "#D4A843",
    options: [
      { letter: "A", text: "Produtos vencendo sem perceber." },
      { letter: "B", text: "Comprar ingredientes em excesso." },
      { letter: "C", text: "Falta de controle nas saídas." },
      { letter: "D", text: "Não ter relatórios de consumo." },
    ],
  },
  {
    id: 3,
    question: "COMO VOCÊ",
    highlight: "CONTROLA\nO ESTOQUE",
    subtitle: "DO SEU NEGÓCIO HOJE?",
    accentColor: "#D4A843",
    options: [
      { letter: "A", text: "Planilha no Excel ou papel." },
      { letter: "B", text: "Sistema genérico e complicado." },
      { letter: "C", text: "De cabeça, na experiência." },
      { letter: "D", text: "Com um sistema especializado." },
    ],
  },
  {
    id: 4,
    question: "O QUE VOCÊ",
    highlight: "MAIS\nPRECISA",
    subtitle: "PARA CRESCER?",
    accentColor: "#D4A843",
    options: [
      { letter: "A", text: "Alertas de estoque baixo automáticos." },
      { letter: "B", text: "Relatórios mensais prontos." },
      { letter: "C", text: "Acesso pelo celular de qualquer lugar." },
      { letter: "D", text: "Controle de acesso por funcionário." },
    ],
  },
  {
    id: 5,
    question: "QUAL A MAIOR",
    highlight: "VANTAGEM\nDE UM",
    subtitle: "SISTEMA DE ESTOQUE?",
    accentColor: "#D4A843",
    options: [
      { letter: "A", text: "Economia de tempo e dinheiro." },
      { letter: "B", text: "Redução de desperdício." },
      { letter: "C", text: "Decisões baseadas em dados." },
      { letter: "D", text: "Tudo organizado em um só lugar." },
    ],
  },
];

function BannerCard({ banner }: { banner: BannerData }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async () => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
    });
    const link = document.createElement("a");
    link.download = `nuh-banner-${banner.id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [banner.id]);

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        ref={ref}
        className="relative w-[400px] h-[500px] rounded-2xl overflow-hidden flex flex-col items-center justify-between"
        style={{
          background: "linear-gradient(180deg, #1e2a4a 0%, #2d3f6e 40%, #7b8eb8 100%)",
        }}
      >
        {/* Top social icons */}
        <div className="flex gap-3 pt-5 text-white/40 text-base">
          <span>❤️</span>
          <span>💬</span>
          <span>📩</span>
          <span>🔖</span>
        </div>

        {/* Brand */}
        <div className="mt-2 flex items-center gap-2">
          <span
            className="text-xs font-bold tracking-[0.25em] uppercase"
            style={{ color: banner.accentColor }}
          >
            NUH Estoque
          </span>
        </div>

        {/* Question */}
        <div className="text-center px-6 mt-3">
          <p className="text-sm font-semibold text-white/60 tracking-widest">
            {banner.question}
          </p>
          <h2
            className="text-4xl font-extrabold leading-none mt-1"
            style={{ color: banner.accentColor }}
          >
            {banner.highlight.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                {i === 0 && <br />}
              </span>
            ))}
          </h2>
          <p className="text-xs font-semibold text-white/50 mt-2 tracking-widest">
            {banner.subtitle}
          </p>
        </div>

        {/* Options */}
        <div className="w-full px-6 pb-6 mt-4 flex flex-col gap-2.5">
          {banner.options.map((opt) => (
            <div
              key={opt.letter}
              className="flex items-center gap-3 rounded-xl px-4 py-2.5"
              style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-md text-[#1e2a4a] text-xs font-bold shrink-0"
                style={{ background: banner.accentColor }}
              >
                {opt.letter}
              </span>
              <span className="text-white/90 text-xs font-medium leading-snug">
                {opt.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Download button */}
      <Button
        onClick={handleDownload}
        className="gap-2 rounded-full px-6 border-none text-[#1e2a4a] font-semibold"
        style={{ background: "#D4A843" }}
      >
        <Download className="h-4 w-4" />
        Baixar para Rede Social
      </Button>
    </div>
  );
}

const Banners = () => {
  return (
    <div
      className="min-h-screen p-4 sm:p-8"
      style={{
        background: "linear-gradient(180deg, #1e2a4a 0%, #2d3f6e 50%, #7b8eb8 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl space-y-10">
        {/* Header */}
        <div className="flex items-center gap-4">
          <a href="/" className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Banners para Redes Sociais
            </h1>
            <p className="text-sm text-white/50">
              Clique em "Baixar" para salvar cada banner como imagem
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 justify-items-center">
          {banners.map((b) => (
            <BannerCard key={b.id} banner={b} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Banners;
