import { useState } from "react";
import {
  Package,
  AlertTriangle,
  Clock,
  TrendingDown,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ingredients,
  weeklyConsumption,
  getIngredientStatus,
  getExpiryStatus,
  getDaysUntilExpiry,
} from "@/data/mockData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const totalItems = ingredients.length;
  const lowStock = ingredients.filter((i) => getIngredientStatus(i) !== "ok").length;
  const expiringSoon = ingredients.filter((i) => getExpiryStatus(i.expiry_date, i.alert_days) !== "ok").length;
  const criticalItems = ingredients.filter(
    (i) => getIngredientStatus(i) === "critical" || getExpiryStatus(i.expiry_date, i.alert_days) === "critical"
  );

  const statsCards = [
    {
      title: "Total de Itens",
      value: totalItems,
      icon: Package,
      color: "text-primary",
      bg: "bg-accent",
    },
    {
      title: "Estoque Baixo",
      value: lowStock,
      icon: TrendingDown,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      title: "Validade Próxima",
      value: expiringSoon,
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      title: "Itens Críticos",
      value: criticalItems.length,
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do estoque do NUH Thai Restaurant</p>
        </div>
        <div className="flex gap-3">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Nova Entrada
          </Button>
          <Button size="lg" variant="outline" className="gap-2">
            <Minus className="h-5 w-5" />
            Nova Saída
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Consumo Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyConsumption}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="entrada" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} name="Entradas" />
                  <Bar dataKey="saida" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Saídas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Alertas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ingredients
              .filter(
                (i) =>
                  getIngredientStatus(i) !== "ok" || getExpiryStatus(i.expiry_date, i.alert_days) !== "ok"
              )
              .slice(0, 6)
              .map((item) => {
                const stockStatus = getIngredientStatus(item);
                const expiryStatus = getExpiryStatus(item.expiry_date, item.alert_days);
                const days = getDaysUntilExpiry(item.expiry_date);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {stockStatus !== "ok" && (
                          <Badge
                            variant={stockStatus === "critical" ? "destructive" : "secondary"}
                            className={cn(
                              stockStatus === "warning" &&
                                "border-warning/30 bg-warning/10 text-warning-foreground"
                            )}
                          >
                            <TrendingDown className="mr-1 h-3 w-3" />
                            {item.quantity}{item.unit}
                          </Badge>
                        )}
                        {expiryStatus !== "ok" && (
                          <Badge
                            variant={expiryStatus === "critical" ? "destructive" : "secondary"}
                            className={cn(
                              expiryStatus === "warning" &&
                                "border-warning/30 bg-warning/10 text-warning-foreground"
                            )}
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            {days}d
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
