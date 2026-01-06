import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, TrendingUp, TrendingDown, DollarSign, Download, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function DRE() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  
  const period = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
  
  const { data: units } = trpc.storeUnits.list.useQuery();
  
  const dreMutation = trpc.dre.calculate.useMutation();
  
  const dreData = dreMutation.data;
  const isLoading = dreMutation.isPending;
  
  const calculateDRE = () => {
    dreMutation.mutate({
      period,
      unitId: selectedUnit ? parseInt(selectedUnit) : undefined,
    });
  };
  
  // Auto-calculate on mount and filter change
  useEffect(() => {
    calculateDRE();
  }, [period, selectedUnit]);

  const formatCurrency = (value: number | string | undefined | null) => {
    if (value === undefined || value === null) return "R$ 0,00";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  };

  const formatPercent = (value: number | string | undefined | null) => {
    if (value === undefined || value === null) return "0,00%";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `${num.toFixed(2)}%`;
  };

  const toNumber = (value: string | number | undefined | null): number => {
    if (value === undefined || value === null) return 0;
    return typeof value === "string" ? parseFloat(value) : value;
  };

  const months = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  // Parse DRE data
  const grossRevenue = toNumber(dreData?.grossRevenue);
  const returns = toNumber(dreData?.returns);
  const discounts = toNumber(dreData?.discounts);
  const netRevenue = toNumber(dreData?.netRevenue);
  const cmv = toNumber(dreData?.cmv);
  const grossProfit = toNumber(dreData?.grossProfit);
  const grossMargin = toNumber(dreData?.grossMarginPercent);
  const operatingExpenses = toNumber(dreData?.salaryExpenses) + toNumber(dreData?.rentExpenses) + 
                           toNumber(dreData?.marketingExpenses) + toNumber(dreData?.otherExpenses);
  const operatingProfit = toNumber(dreData?.operatingProfit);
  const operatingMargin = toNumber(dreData?.operatingMarginPercent);
  const taxes = toNumber(dreData?.taxes);
  const financialResult = 0; // Resultado financeiro calculado separadamente
  const netProfit = toNumber(dreData?.netProfit);
  const netMargin = toNumber(dreData?.netMarginPercent);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">DRE - Demonstração do Resultado</h1>
            <p className="text-muted-foreground">Análise de receitas, custos e lucro do período</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={calculateDRE}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Mês</Label>
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ano</Label>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Consolidado (Todas)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Consolidado (Todas)</SelectItem>
                    {units?.map((u: { id: number; name: string }) => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : dreData ? (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Bruta</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(grossRevenue)}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lucro Bruto</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(grossProfit)}</div>
                  <p className="text-xs text-muted-foreground">
                    Margem: {formatPercent(grossMargin)}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lucro Operacional</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(operatingProfit)}</div>
                  <p className="text-xs text-muted-foreground">
                    Margem: {formatPercent(operatingMargin)}
                  </p>
                </CardContent>
              </Card>
              
              <Card className={netProfit >= 0 ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                  {netProfit >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(netProfit)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Margem: {formatPercent(netMargin)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* DRE Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Demonstração do Resultado do Exercício
                </CardTitle>
                <CardDescription>
                  Período: {months.find(m => m.value === selectedMonth)?.label} de {selectedYear}
                  {selectedUnit && units?.find((u: { id: number }) => u.id === parseInt(selectedUnit)) && 
                    ` - ${units.find((u: { id: number }) => u.id === parseInt(selectedUnit))?.name}`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50%]">Descrição</TableHead>
                      <TableHead className="text-right">Valor (R$)</TableHead>
                      <TableHead className="text-right">% Receita</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Receita */}
                    <TableRow className="bg-green-50/50 font-medium">
                      <TableCell>RECEITA BRUTA DE VENDAS</TableCell>
                      <TableCell className="text-right">{formatCurrency(grossRevenue)}</TableCell>
                      <TableCell className="text-right">100,00%</TableCell>
                    </TableRow>
                    
                    <TableRow className="text-muted-foreground">
                      <TableCell className="pl-8">(-) Devoluções e Cancelamentos</TableCell>
                      <TableCell className="text-right text-red-600">
                        ({formatCurrency(returns)})
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercent(grossRevenue > 0 ? (returns / grossRevenue) * 100 : 0)}
                      </TableCell>
                    </TableRow>
                    
                    <TableRow className="text-muted-foreground">
                      <TableCell className="pl-8">(-) Descontos Concedidos</TableCell>
                      <TableCell className="text-right text-red-600">
                        ({formatCurrency(discounts)})
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercent(grossRevenue > 0 ? (discounts / grossRevenue) * 100 : 0)}
                      </TableCell>
                    </TableRow>
                    
                    <TableRow className="bg-blue-50/50 font-medium">
                      <TableCell>(=) RECEITA LÍQUIDA</TableCell>
                      <TableCell className="text-right">{formatCurrency(netRevenue)}</TableCell>
                      <TableCell className="text-right">
                        {formatPercent(grossRevenue > 0 ? (netRevenue / grossRevenue) * 100 : 0)}
                      </TableCell>
                    </TableRow>
                    
                    <TableRow className="text-muted-foreground">
                      <TableCell className="pl-8">(-) Custo das Mercadorias Vendidas (CMV)</TableCell>
                      <TableCell className="text-right text-red-600">
                        ({formatCurrency(cmv)})
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercent(grossRevenue > 0 ? (cmv / grossRevenue) * 100 : 0)}
                      </TableCell>
                    </TableRow>
                    
                    <TableRow className="bg-purple-50/50 font-medium">
                      <TableCell>(=) LUCRO BRUTO</TableCell>
                      <TableCell className="text-right">{formatCurrency(grossProfit)}</TableCell>
                      <TableCell className="text-right">{formatPercent(grossMargin)}</TableCell>
                    </TableRow>
                    
                    <TableRow className="text-muted-foreground">
                      <TableCell className="pl-8">(-) Despesas Operacionais</TableCell>
                      <TableCell className="text-right text-red-600">
                        ({formatCurrency(operatingExpenses)})
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercent(grossRevenue > 0 ? (operatingExpenses / grossRevenue) * 100 : 0)}
                      </TableCell>
                    </TableRow>
                    
                    <TableRow className="text-muted-foreground text-sm">
                      <TableCell className="pl-12">Salários e Encargos</TableCell>
                      <TableCell className="text-right text-red-600">
                        ({formatCurrency(dreData.salaryExpenses)})
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercent(grossRevenue > 0 ? (toNumber(dreData.salaryExpenses) / grossRevenue) * 100 : 0)}
                      </TableCell>
                    </TableRow>
                    
                    <TableRow className="text-muted-foreground text-sm">
                      <TableCell className="pl-12">Aluguel e Condomínio</TableCell>
                      <TableCell className="text-right text-red-600">
                        ({formatCurrency(dreData.rentExpenses)})
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercent(grossRevenue > 0 ? (toNumber(dreData.rentExpenses) / grossRevenue) * 100 : 0)}
                      </TableCell>
                    </TableRow>
                    
                    <TableRow className="text-muted-foreground text-sm">
                      <TableCell className="pl-12">Marketing e Publicidade</TableCell>
                      <TableCell className="text-right text-red-600">
                        ({formatCurrency(dreData.marketingExpenses)})
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercent(grossRevenue > 0 ? (toNumber(dreData.marketingExpenses) / grossRevenue) * 100 : 0)}
                      </TableCell>
                    </TableRow>
                    
                    <TableRow className="text-muted-foreground text-sm">
                      <TableCell className="pl-12">Outras Despesas</TableCell>
                      <TableCell className="text-right text-red-600">
                        ({formatCurrency(dreData.otherExpenses)})
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercent(grossRevenue > 0 ? (toNumber(dreData.otherExpenses) / grossRevenue) * 100 : 0)}
                      </TableCell>
                    </TableRow>
                    
                    <TableRow className="bg-indigo-50/50 font-medium">
                      <TableCell>(=) LUCRO OPERACIONAL (EBIT)</TableCell>
                      <TableCell className="text-right">{formatCurrency(operatingProfit)}</TableCell>
                      <TableCell className="text-right">{formatPercent(operatingMargin)}</TableCell>
                    </TableRow>
                    
                    <TableRow className="text-muted-foreground">
                      <TableCell className="pl-8">(-) Impostos e Taxas</TableCell>
                      <TableCell className="text-right text-red-600">
                        ({formatCurrency(taxes)})
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercent(grossRevenue > 0 ? (taxes / grossRevenue) * 100 : 0)}
                      </TableCell>
                    </TableRow>
                    
                    <TableRow className="text-muted-foreground">
                      <TableCell className="pl-8">(+/-) Resultado Financeiro</TableCell>
                      <TableCell className={`text-right ${financialResult >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {financialResult >= 0 ? "" : "("}{formatCurrency(Math.abs(financialResult))}{financialResult >= 0 ? "" : ")"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercent(grossRevenue > 0 ? (financialResult / grossRevenue) * 100 : 0)}
                      </TableCell>
                    </TableRow>
                    
                    <TableRow className={`font-bold text-lg ${netProfit >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                      <TableCell>(=) LUCRO LÍQUIDO</TableCell>
                      <TableCell className={`text-right ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(netProfit)}
                      </TableCell>
                      <TableCell className={`text-right ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatPercent(netMargin)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Analysis Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Análise de Margens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Margem Bruta</span>
                        <span className="text-sm font-medium">{formatPercent(grossMargin)}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-blue-600 rounded-full" 
                          style={{ width: `${Math.min(grossMargin, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Margem Operacional</span>
                        <span className="text-sm font-medium">{formatPercent(operatingMargin)}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-purple-600 rounded-full" 
                          style={{ width: `${Math.min(Math.max(operatingMargin, 0), 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Margem Líquida</span>
                        <span className={`text-sm font-medium ${netMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatPercent(netMargin)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div 
                          className={`h-2 rounded-full ${netMargin >= 0 ? "bg-green-600" : "bg-red-600"}`}
                          style={{ width: `${Math.min(Math.max(Math.abs(netMargin), 0), 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Composição de Custos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">CMV</span>
                      <span className="font-medium">{formatCurrency(cmv)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Despesas Operacionais</span>
                      <span className="font-medium">{formatCurrency(operatingExpenses)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Impostos</span>
                      <span className="font-medium">{formatCurrency(taxes)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="font-medium">Total de Custos</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(cmv + operatingExpenses + taxes)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Clique em "Atualizar" para calcular o DRE do período</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
