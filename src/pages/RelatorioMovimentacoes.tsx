import { useState, useMemo, useRef, useEffect } from "react";
import { Printer, ChevronLeft, ChevronRight, Download, UtensilsCrossed, ChefHat, Radio, Trash2 } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRecipes, RecipeIngredient } from "@/hooks/useRecipes";
import { useDishSales } from "@/hooks/useDishSales";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RelatorioMovimentacoes = () => {
  const { recipes, loading: recipesLoading } = useRecipes();
  const { sales, loading: salesLoading } = useDishSales();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [allIngredients, setAllIngredients] = useState<Record<string, RecipeIngredient[]>>({});
  const [loadingIngredients, setLoadingIngredients] = useState(true);

   useEffect(() => {
     const controller = new AbortController();
     const loadIngredients = async () => {
       setLoadingIngredients(true);
       try {
         const { data, error } = await supabase
           .from("recipe_ingredients")
           .select("*")
           .abortSignal(controller.signal);
 
         if (!error && data) {
           const grouped: Record<string, RecipeIngredient[]> = {};
           for (const ingredient of data as RecipeIngredient[]) {
             if (!grouped[ingredient.recipe_id]) grouped[ingredient.recipe_id] = [];
             grouped[ingredient.recipe_id].push(ingredient);
           }
           setAllIngredients(grouped);
         }
       } catch (err: any) {
         if (err.name !== 'AbortError') console.error(err);
       } finally {
         setLoadingIngredients(false);
       }
     };
 
     loadIngredients();
     return () => controller.abort();
   }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const monthSales = useMemo(() => {
    return sales.filter((sale) => {
      try {
        return isWithinInterval(parseISO(sale.date), { start: monthStart, end: monthEnd });
      } catch {
        return false;
      }
    });
  }, [sales, monthStart, monthEnd]);

  const recipeMap = useMemo(() => {
    return new Map(recipes.map((recipe) => [recipe.id, recipe]));
  }, [recipes]);

  const recipeNames = useMemo(() => {
    return new Map(recipes.map((recipe) => [recipe.id, recipe.name]));
  }, [recipes]);

  const dishesReport = useMemo(() => {
    const map = new Map<string, { name: string; total: number; totalCost: number }>();

    for (const sale of monthSales) {
      const recipe = recipeMap.get(sale.recipe_id);
      const name = recipe?.name || "—";
      const current = map.get(sale.recipe_id);
      map.set(sale.recipe_id, {
        name,
        total: (current?.total || 0) + sale.quantity,
        totalCost: (current?.totalCost || 0) + (recipe?.total_cost || 0) * sale.quantity,
      });
    }

    return Array.from(map.entries())
      .map(([id, value]) => ({ id, ...value }))
      .sort((a, b) => b.total - a.total);
  }, [monthSales, recipeMap]);

  const ingredientsReport = useMemo(() => {
    const map = new Map<string, { name: string; unit: string; total: number }>();

    for (const sale of monthSales) {
      const ingredients = allIngredients[sale.recipe_id] || [];

      for (const ingredient of ingredients) {
        const key = `${ingredient.ingredient_name}::${ingredient.unit}`;
        const current = map.get(key);

        map.set(key, {
          name: ingredient.ingredient_name,
          unit: ingredient.unit,
          total: Math.round((((current?.total || 0) + ingredient.gross_weight * sale.quantity) * 100)) / 100,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [monthSales, allIngredients]);

  const consumedIngredientsCount = useMemo(
    () => new Set(ingredientsReport.map((ingredient) => ingredient.name)).size,
    [ingredientsReport]
  );

  const totalDishesSold = useMemo(
    () => monthSales.reduce((sum, sale) => sum + sale.quantity, 0),
    [monthSales]
  );

  const totalCost = useMemo(
    () => dishesReport.reduce((sum, d) => sum + d.totalCost, 0),
    [dishesReport]
  );

  const [resetting, setResetting] = useState(false);

  const handleResetMonth = async () => {
    if (monthSales.length === 0) return;
    setResetting(true);
    try {
      const ids = monthSales.map((s) => s.id);
      const { error } = await supabase.from("dish_sales").delete().in("id", ids);
      if (error) {
        console.error("Erro ao zerar vendas:", error);
        toast.error("Erro ao zerar vendas do mês");
      } else {
        toast.success("Vendas do mês zeradas com sucesso!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro inesperado");
    }
    setResetting(false);
  };

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

      const filename = `relatorio-saida-pratos-${format(currentMonth, "yyyy-MM")}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    }
  };

  if (recipesLoading || salesLoading || loadingIngredients) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando relatório...</p>
      </div>
    );
  }

  const monthLabel = format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="space-y-2 text-center sm:text-left">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
              Relatório Mensal
            </h1>
            <Badge variant="secondary" className="gap-1">
              <Radio className="h-3.5 w-3.5" />
              Tempo real
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Saída de pratos e consumo de insumos
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" className="gap-2" onClick={handleDownloadPDF}>
            <Download className="h-5 w-5" />
            Baixar PDF
          </Button>
          <Button size="lg" variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-5 w-5" />
            Imprimir
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="lg" variant="destructive" className="gap-2" disabled={monthSales.length === 0 || resetting}>
                <Trash2 className="h-5 w-5" />
                Zerar mês
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Zerar vendas de {monthLabel}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação é <strong>definitiva e irreversível</strong>. Todos os {monthSales.length} registros de saída de pratos deste mês serão excluídos permanentemente do sistema, incluindo o Dashboard e a página de Saída de Pratos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetMonth} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Sim, zerar tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

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

      <div ref={reportRef} className="space-y-4 pdf-content">
        <div className="hidden print:block text-center mb-4">
          <h1 className="text-lg font-bold">Relatório Mensal de Saída de Pratos</h1>
          <p className="text-sm capitalize">{monthLabel}</p>
        </div>

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card className="print:shadow-none">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Pratos vendidos</p>
              <p className="mt-1 text-2xl font-bold">{totalDishesSold}</p>
            </CardContent>
          </Card>
          <Card className="print:shadow-none border-primary/30 bg-primary/5">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Custo total do mês</p>
              <p className="mt-1 text-2xl font-bold text-primary">R$ {totalCost.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="print:shadow-none">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Pratos no relatório</p>
              <p className="mt-1 text-2xl font-bold">{dishesReport.length}</p>
            </CardContent>
          </Card>
          <Card className="print:shadow-none">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Tipos de insumos usados</p>
              <p className="mt-1 text-2xl font-bold">{consumedIngredientsCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="print:shadow-none print:border-none">
          <CardHeader className="py-3">
            <CardTitle className="flex items-center gap-2 text-base capitalize">
              <UtensilsCrossed className="h-4 w-4 text-primary" />
              Pratos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-4 print:p-0">
            {dishesReport.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma saída de pratos neste mês.
              </p>
            ) : (
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-1.5 text-xs">Prato</TableHead>
                    <TableHead className="py-1.5 text-xs text-right">Quantidade</TableHead>
                    <TableHead className="py-1.5 text-xs text-right">Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dishesReport.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="py-1.5 font-medium text-xs break-words">{row.name}</TableCell>
                      <TableCell className="py-1.5 text-right font-semibold text-xs">{row.total}</TableCell>
                      <TableCell className="py-1.5 text-right font-semibold text-xs">R$ {row.totalCost.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30">
                    <TableCell className="py-1.5 font-bold text-xs">Total</TableCell>
                    <TableCell className="py-1.5 text-right font-bold text-xs">{totalDishesSold}</TableCell>
                    <TableCell className="py-1.5 text-right font-bold text-xs text-primary">R$ {totalCost.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="print:shadow-none print:border-none">
          <CardHeader className="py-3">
            <CardTitle className="flex items-center gap-2 text-base capitalize">
              <ChefHat className="h-4 w-4 text-primary" />
              Total de insumos consumidos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-4 print:p-0">
            {ingredientsReport.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum insumo consumido neste mês.
              </p>
            ) : (
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-1.5 text-xs">Insumo</TableHead>
                    <TableHead className="py-1.5 text-xs text-right">Consumo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredientsReport.map((row) => (
                    <TableRow key={`${row.name}-${row.unit}`}>
                      <TableCell className="py-1.5 font-medium text-xs break-words">{row.name}</TableCell>
                      <TableCell className="py-1.5 text-right font-semibold text-xs">
                        {row.total} {row.unit}
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
