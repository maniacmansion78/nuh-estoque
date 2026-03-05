import { NaoConformidades } from "@/components/NaoConformidades";

const NaoConformidadesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Não Conformidades</h1>
        <p className="text-muted-foreground">Registre e acompanhe problemas com produtos recebidos</p>
      </div>
      <NaoConformidades />
    </div>
  );
};

export default NaoConformidadesPage;
