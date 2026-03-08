import { useState, useMemo, useRef } from "react";
import { Printer, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProducts } from "@/hooks/useProducts";
import { useMovements } from "@/hooks/useMovements";

const RelatorioMovimentacoes = () => {
  const { items: dbProducts, loading: productsLoading } = useProducts();
  const { items: dbMovements, loading: movementsLoading } = useMovements();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const report = useMemo(() => {
    const filtered = dbMovements.filter((m) => {
      const d = new Date(m.date);
      return d >= monthStart && d <= monthEnd;
    });

    const map: Record<string, { name: string; unit: string; totalIn: number; totalOut: number }> = {};

    for (const mov of filtered) {
      if (!map[mov.product_id]) {
        const product = dbProducts.find((p) => p.id === mov.product_id);
        map[mov.product_id] = {
          name: product?.name || "Produto removido",
          unit: product?.unit || "",
          totalIn: 0,
          totalOut: 0,
        };
      }
      if (mov.type === "in") {
        map[mov.product_id].totalIn += Number(mov.quantity);
      } else {
        map[mov.product_id].totalOut += Number(mov.quantity);
      }
    }

    return Object.values(map)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .map((r) => ({
        ...r,
        totalIn: Math.round(r.totalIn * 100) / 100,
        totalOut: Math.round(r.totalOut * 100) / 100,
      }));
  }, [dbMovements, dbProducts, monthStart, monthEnd]);

  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = 200;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = pdfHeight;
      let position = 5;

      pdf.addImage(imgData, "PNG", 5, position, pdfWidth, pdfHeight);
      heightLeft -= 287;

      while (heightLeft > 0) {
        pdf.addPage();
        position -= 287;
        pdf.addImage(imgData, "PNG", 5, position, pdfWidth, pdfHeight);
        heightLeft -= 287;
      }

      const filename = `relatorio-${format(currentMonth, "yyyy-MM")}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    }
  };

  if (productsLoading || movementsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando relatório...</p>
      </div>
    );
  }

  const monthLabel = format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header - hidden on print */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="text-center sm:text-left">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
            Relatório Mensal
          </h1>
          <p className="text-sm text-muted-foreground">
            Entradas e saídas por produto
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="lg" className="gap-2" onClick={handleDownloadPDF}>
            <Download className="h-5 w-5" />
            Baixar PDF
          </Button>
          <Button size="lg" variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-5 w-5" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Month selector - hidden on print */}
      <div className="flex items-center justify-center gap-4 print:hidden">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold capitalize min-w-[200px] text-center">
          {monthLabel}
        </span>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div ref={reportRef} className="pdf-content">
        {/* PDF/Print header */}
        <div className="hidden print:block text-center mb-4">
          <h1 className="text-lg font-bold">Relatório de Movimentações</h1>
          <p className="text-sm capitalize">{monthLabel}</p>
        </div>

        <Card className="print:shadow-none print:border-none">
          <CardHeader className="py-3 print:hidden">
            <CardTitle className="text-base capitalize">{monthLabel}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-4 print:p-0">
            {report.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma movimentação neste mês.
              </p>
            ) : (
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-1.5 text-xs">Produto</TableHead>
                    <TableHead className="py-1.5 text-xs text-center">Entrada</TableHead>
                    <TableHead className="py-1.5 text-xs text-center">Saída</TableHead>
                    <TableHead className="py-1.5 text-xs text-center">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="py-1.5 font-medium text-xs">{row.name}</TableCell>
                      <TableCell className="py-1.5 text-center text-success font-semibold text-xs">
                        +{row.totalIn} {row.unit}
                      </TableCell>
                      <TableCell className="py-1.5 text-center text-destructive font-semibold text-xs">
                        -{row.totalOut} {row.unit}
                      </TableCell>
                      <TableCell className="py-1.5 text-center font-semibold text-xs">
                        {Math.round((row.totalIn - row.totalOut) * 100) / 100} {row.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RelatorioMovimentacoes;
