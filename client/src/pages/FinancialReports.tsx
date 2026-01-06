import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, Package, 
  AlertTriangle, Target, Award, RefreshCw, Building2
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function FinancialReports() {
  const [activeTab, setActiveTab] = useState("performance");
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  
  const { data: units } = trpc.storeUnits.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  
  // Stock analysis for ABC and profitability
  const { data: stockAnalysis, refetch: refetchAnalysis } = trpc.stockAnalysis.report.useQuery({
    period: new Date().toISOString().slice(0, 7),
    limit: 100,
  });
  
  // Dashboard stats
  const { data: dashboardStats } = trpc.dashboard.stats.useQuery();

  const formatCurrency = (value: string | number | undefined | null) => {
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

  // Calculate unit performance from stock analysis
  const unitPerformance = units?.map((unit: { id: number; name: string; type: string }) => {
    const unitAnalysis = stockAnalysis?.filter(a => a.unitId === unit.id) || [];
    const totalRevenue = unitAnalysis.reduce((sum, a) => sum + toNumber(a.revenue), 0);
    const totalProfit = unitAnalysis.reduce((sum, a) => sum + toNumber(a.profit), 0);
    const totalStock = unitAnalysis.reduce((sum, a) => sum + toNumber(a.stockValue), 0);
    const avgTurnover = unitAnalysis.length > 0 
      ? unitAnalysis.reduce((sum, a) => sum + toNumber(a.turnoverRate), 0) / unitAnalysis.length 
      : 0;
    
    return {
      ...unit,
      revenue: totalRevenue,
      profit: totalProfit,
      margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      stockValue: totalStock,
      turnover: avgTurnover,
    };
  }) || [];

  // Sort by revenue for ranking
  const rankedUnits = [...unitPerformance].sort((a, b) => b.revenue - a.revenue);

  // ABC Analysis by profitability
  const abcByProfit = stockAnalysis?.reduce((acc, item) => {
    const cls = item.abcClassProfit || "C";
    if (!acc[cls]) acc[cls] = { count: 0, revenue: 0, profit: 0, stockValue: 0 };
    acc[cls].count += 1;
    acc[cls].revenue += toNumber(item.revenue);
    acc[cls].profit += toNumber(item.profit);
    acc[cls].stockValue += toNumber(item.stockValue);
    return acc;
  }, {} as Record<string, { count: number; revenue: number; profit: number; stockValue: number }>);

  // Idle capital (stock without movement)
  const idleCapitalItems = stockAnalysis?.filter(a => toNumber(a.idleCapital) > 0) || [];
  const totalIdleCapital = idleCapitalItems.reduce((sum, a) => sum + toNumber(a.idleCapital), 0);

  // Low coverage items (risk of stockout)
  const lowCoverageItems = stockAnalysis?.filter(a => a.coverageDays !== null && a.coverageDays < 15) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h1>
            <p className="text-muted-foreground">Análise de performance, rentabilidade e indicadores</p>
          </div>
          <Button variant="outline" onClick={() => refetchAnalysis()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="performance">Performance por Unidade</TabsTrigger>
            <TabsTrigger value="abc">Curva ABC + Rentabilidade</TabsTrigger>
            <TabsTrigger value="capital">Capital Parado</TabsTrigger>
            <TabsTrigger value="coverage">Cobertura de Estoque</TabsTrigger>
          </TabsList>
          
          {/* Performance por Unidade */}
          <TabsContent value="performance" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(unitPerformance.reduce((sum, u) => sum + u.revenue, 0))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(unitPerformance.reduce((sum, u) => sum + u.profit, 0))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estoque Total</CardTitle>
                  <Package className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(unitPerformance.reduce((sum, u) => sum + u.stockValue, 0))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unidades</CardTitle>
                  <Building2 className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{units?.length || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Ranking Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Ranking de Performance por Unidade
                </CardTitle>
                <CardDescription>Comparativo de receita, lucro e margem por unidade</CardDescription>
              </CardHeader>
              <CardContent>
                {rankedUnits.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Receita</TableHead>
                        <TableHead className="text-right">Lucro</TableHead>
                        <TableHead className="text-right">Margem</TableHead>
                        <TableHead className="text-right">Estoque</TableHead>
                        <TableHead className="text-right">Giro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rankedUnits.map((unit, index) => (
                        <TableRow key={unit.id}>
                          <TableCell>
                            {index === 0 ? (
                              <Badge className="bg-yellow-500">1º</Badge>
                            ) : index === 1 ? (
                              <Badge className="bg-gray-400">2º</Badge>
                            ) : index === 2 ? (
                              <Badge className="bg-orange-600">3º</Badge>
                            ) : (
                              <span className="text-muted-foreground">{index + 1}º</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{unit.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {unit.type === "STORE" ? "Loja" : unit.type === "WAREHOUSE" ? "CD" : "E-commerce"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(unit.revenue)}</TableCell>
                          <TableCell className={`text-right ${unit.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(unit.profit)}
                          </TableCell>
                          <TableCell className={`text-right ${unit.margin >= 20 ? "text-green-600" : unit.margin >= 10 ? "text-yellow-600" : "text-red-600"}`}>
                            {formatPercent(unit.margin)}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(unit.stockValue)}</TableCell>
                          <TableCell className="text-right">{unit.turnover.toFixed(2)}x</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma unidade cadastrada
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Curva ABC + Rentabilidade */}
          <TabsContent value="abc" className="space-y-4">
            {/* ABC Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              {["A", "B", "C"].map((cls) => {
                const data = abcByProfit?.[cls] || { count: 0, revenue: 0, profit: 0, stockValue: 0 };
                const colors = {
                  A: { bg: "bg-green-50", border: "border-green-200", text: "text-green-600" },
                  B: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-600" },
                  C: { bg: "bg-red-50", border: "border-red-200", text: "text-red-600" },
                };
                const color = colors[cls as keyof typeof colors];
                
                return (
                  <Card key={cls} className={`${color.bg} ${color.border}`}>
                    <CardHeader>
                      <CardTitle className={`flex items-center gap-2 ${color.text}`}>
                        <Target className="h-5 w-5" />
                        Classe {cls}
                      </CardTitle>
                      <CardDescription>
                        {cls === "A" ? "80% do lucro" : cls === "B" ? "15% do lucro" : "5% do lucro"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Produtos</span>
                          <span className="font-medium">{data.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Receita</span>
                          <span className="font-medium">{formatCurrency(data.revenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Lucro</span>
                          <span className={`font-medium ${color.text}`}>{formatCurrency(data.profit)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estoque</span>
                          <span className="font-medium">{formatCurrency(data.stockValue)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Detailed ABC Table */}
            <Card>
              <CardHeader>
                <CardTitle>Análise ABC por Rentabilidade</CardTitle>
                <CardDescription>Classificação de produtos por contribuição ao lucro</CardDescription>
              </CardHeader>
              <CardContent>
                {stockAnalysis && stockAnalysis.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Classe</TableHead>
                        <TableHead className="text-right">Receita</TableHead>
                        <TableHead className="text-right">Lucro</TableHead>
                        <TableHead className="text-right">Margem</TableHead>
                        <TableHead className="text-right">Estoque (R$)</TableHead>
                        <TableHead className="text-right">Giro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockAnalysis.slice(0, 20).map((item) => {
                        const product = products?.find((p: { id: number }) => p.id === item.productId);
                        const revenue = toNumber(item.revenue);
                        const profit = toNumber(item.profit);
                        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{product?.name || `Produto #${item.productId}`}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={item.abcClassProfit === "A" ? "default" : item.abcClassProfit === "B" ? "secondary" : "outline"}
                                className={
                                  item.abcClassProfit === "A" ? "bg-green-600" : 
                                  item.abcClassProfit === "B" ? "bg-yellow-600" : ""
                                }
                              >
                                {item.abcClassProfit}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(revenue)}</TableCell>
                            <TableCell className={`text-right ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(profit)}
                            </TableCell>
                            <TableCell className={`text-right ${margin >= 20 ? "text-green-600" : margin >= 10 ? "text-yellow-600" : "text-red-600"}`}>
                              {formatPercent(margin)}
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(item.stockValue)}</TableCell>
                            <TableCell className="text-right">{toNumber(item.turnoverRate).toFixed(2)}x</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Execute a análise de estoque para ver os dados
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Capital Parado */}
          <TabsContent value="capital" className="space-y-4">
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                  Capital Parado em Estoque
                </CardTitle>
                <CardDescription>
                  Produtos sem movimento há mais de 90 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-orange-600 mb-4">
                  {formatCurrency(totalIdleCapital)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {idleCapitalItems.length} produtos com capital parado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento de Capital Parado</CardTitle>
                <CardDescription>Produtos que precisam de ação para liberar capital</CardDescription>
              </CardHeader>
              <CardContent>
                {idleCapitalItems.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead className="text-right">Capital Parado</TableHead>
                        <TableHead className="text-right">Dias Parado</TableHead>
                        <TableHead>Sugestão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {idleCapitalItems.map((item) => {
                        const product = products?.find((p: { id: number }) => p.id === item.productId);
                        const unit = units?.find((u: { id: number }) => u.id === item.unitId);
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{product?.name || `Produto #${item.productId}`}</TableCell>
                            <TableCell>{unit?.name || "Geral"}</TableCell>
                            <TableCell className="text-right text-orange-600 font-medium">
                              {formatCurrency(item.idleCapital)}
                            </TableCell>
                            <TableCell className="text-right">{item.idleDays} dias</TableCell>
                            <TableCell>
                              {item.idleDays && item.idleDays > 180 ? (
                                <Badge variant="destructive">Liquidar</Badge>
                              ) : item.idleDays && item.idleDays > 120 ? (
                                <Badge variant="secondary">Promoção</Badge>
                              ) : (
                                <Badge variant="outline">Monitorar</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum produto com capital parado identificado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Cobertura de Estoque */}
          <TabsContent value="coverage" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Risco de Ruptura
                  </CardTitle>
                  <CardDescription>Cobertura menor que 15 dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-red-600">{lowCoverageItems.length}</div>
                  <p className="text-sm text-muted-foreground">produtos em risco</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Cobertura Média</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">
                    {stockAnalysis && stockAnalysis.length > 0
                      ? Math.round(stockAnalysis.reduce((sum, a) => sum + (a.coverageDays || 0), 0) / stockAnalysis.length)
                      : 0}
                  </div>
                  <p className="text-sm text-muted-foreground">dias de estoque</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Perda Estimada</CardTitle>
                  <CardDescription>Por ruptura de estoque</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-red-600">
                    {formatCurrency(stockAnalysis?.reduce((sum, a) => sum + toNumber(a.estimatedLostSales), 0) || 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Produtos com Baixa Cobertura</CardTitle>
                <CardDescription>Itens que precisam de reposição urgente</CardDescription>
              </CardHeader>
              <CardContent>
                {lowCoverageItems.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead className="text-right">Estoque Atual</TableHead>
                        <TableHead className="text-right">Cobertura</TableHead>
                        <TableHead className="text-right">Venda Média/Dia</TableHead>
                        <TableHead>Urgência</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowCoverageItems.map((item) => {
                        const product = products?.find((p: { id: number }) => p.id === item.productId);
                        const unit = units?.find((u: { id: number }) => u.id === item.unitId);
                        const avgDaily = toNumber(item.quantitySold) / 30;
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{product?.name || `Produto #${item.productId}`}</TableCell>
                            <TableCell>{unit?.name || "Geral"}</TableCell>
                            <TableCell className="text-right">{toNumber(item.averageStock).toFixed(0)}</TableCell>
                            <TableCell className="text-right text-red-600 font-medium">
                              {item.coverageDays} dias
                            </TableCell>
                            <TableCell className="text-right">{avgDaily.toFixed(1)}</TableCell>
                            <TableCell>
                              {item.coverageDays !== null && item.coverageDays <= 5 ? (
                                <Badge variant="destructive">Crítico</Badge>
                              ) : item.coverageDays !== null && item.coverageDays <= 10 ? (
                                <Badge className="bg-orange-600">Alto</Badge>
                              ) : (
                                <Badge variant="secondary">Médio</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Todos os produtos têm cobertura adequada
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
