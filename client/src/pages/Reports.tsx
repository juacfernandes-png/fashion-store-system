import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  FileText, 
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  PieChart
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';

function formatCurrency(value: string | number) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num);
}

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e', '#ec4899', '#6366f1', '#14b8a6'];

export default function Reports() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: products, isLoading: productsLoading } = trpc.products.list.useQuery();
  const { data: stockAlerts, isLoading: alertsLoading } = trpc.stock.alerts.useQuery();
  const { data: abcAnalysis, isLoading: abcLoading } = trpc.reports.abcAnalysis.useQuery();
  const { data: salesReport, isLoading: salesLoading } = trpc.reports.sales.useQuery({
    startDate: new Date(startDate),
    endDate: new Date(endDate)
  });
  const { data: topProducts, isLoading: topLoading } = trpc.reports.topProducts.useQuery({ 
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    limit: 10 
  });
  const { data: stockMovements, isLoading: movementsLoading } = trpc.stock.movements.useQuery({});

  // Calculate inventory value
  const inventoryValue = products?.reduce((sum, p) => 
    sum + (parseFloat(p.costPrice) * p.currentStock), 0) || 0;
  
  const potentialRevenue = products?.reduce((sum, p) => 
    sum + (parseFloat(p.salePrice) * p.currentStock), 0) || 0;

  // Prepare ABC chart data
  const abcChartData = abcAnalysis ? [
    { name: 'Classe A', value: abcAnalysis.filter(p => p.class === 'A').length, revenue: abcAnalysis.filter(p => p.class === 'A').reduce((s, p) => s + p.revenue, 0) },
    { name: 'Classe B', value: abcAnalysis.filter(p => p.class === 'B').length, revenue: abcAnalysis.filter(p => p.class === 'B').reduce((s, p) => s + p.revenue, 0) },
    { name: 'Classe C', value: abcAnalysis.filter(p => p.class === 'C').length, revenue: abcAnalysis.filter(p => p.class === 'C').reduce((s, p) => s + p.revenue, 0) },
  ] : [];

  // Prepare sales trend data - using orders for now
  const salesTrendData: { date: string; vendas: number; quantidade: number }[] = [];

  // Stock by category
  const stockByCategory = products?.reduce((acc, p) => {
    const category = 'Categoria';
    if (!acc[category]) {
      acc[category] = { name: category, value: 0, quantity: 0 };
    }
    acc[category].value += parseFloat(p.costPrice) * p.currentStock;
    acc[category].quantity += p.currentStock;
    return acc;
  }, {} as Record<string, { name: string; value: number; quantity: number }>) || {};
  
  const stockCategoryData = Object.values(stockByCategory);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
            <p className="text-muted-foreground">
              Análises e indicadores do seu negócio
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-auto"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor em Estoque</p>
                  <p className="text-2xl font-bold">{formatCurrency(inventoryValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receita Potencial</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(potentialRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Margem Média</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {inventoryValue > 0 ? ((potentialRevenue - inventoryValue) / potentialRevenue * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Alertas de Estoque</p>
                  <p className="text-2xl font-bold text-orange-600">{stockAlerts?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="stock">Estoque</TabsTrigger>
            <TabsTrigger value="abc">Curva ABC</TabsTrigger>
            <TabsTrigger value="movements">Movimentações</TabsTrigger>
          </TabsList>
          
          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tendência de Vendas</CardTitle>
                  <CardDescription>Vendas diárias no período selecionado</CardDescription>
                </CardHeader>
                <CardContent>
                  {salesLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesTrendData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                            formatter={(value: number, name: string) => [
                              name === 'vendas' ? formatCurrency(value) : value,
                              name === 'vendas' ? 'Vendas' : 'Quantidade'
                            ]}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="vendas" name="Vendas (R$)" stroke="#8b5cf6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Produtos Mais Vendidos</CardTitle>
                  <CardDescription>Top 10 produtos por receita</CardDescription>
                </CardHeader>
                <CardContent>
                  {topLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                  ) : topProducts && topProducts.length > 0 ? (
                    <div className="space-y-4">
                      {topProducts.slice(0, 5).map((product, index) => (
                        <div key={product.productId} className="flex items-center gap-4">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{product.product?.name || '-'}</p>
                            <p className="text-sm text-muted-foreground">{product.totalQuantity} unidades</p>
                          </div>
                          <p className="font-bold">{formatCurrency(product.totalRevenue)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhuma venda registrada</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Sales Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total de Vendas</p>
                    <p className="text-2xl font-bold">{formatCurrency(salesReport?.totalSales || 0)}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Quantidade Vendida</p>
                    <p className="text-2xl font-bold">{salesReport?.orders?.length || 0}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Número de Pedidos</p>
                    <p className="text-2xl font-bold">{salesReport?.totalOrders || 0}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Ticket Médio</p>
                    <p className="text-2xl font-bold">{formatCurrency(salesReport?.averageTicket || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Stock Tab */}
          <TabsContent value="stock" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Estoque por Categoria</CardTitle>
                  <CardDescription>Distribuição do valor em estoque</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={stockCategoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {stockCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Alertas de Estoque</CardTitle>
                  <CardDescription>Produtos que precisam de atenção</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {alertsLoading ? (
                    <div className="p-6 space-y-4">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                  ) : stockAlerts && stockAlerts.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead className="text-center">Atual</TableHead>
                          <TableHead className="text-center">Mínimo</TableHead>
                          <TableHead className="text-center">Tipo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockAlerts.slice(0, 5).map(alert => (
                          <TableRow key={alert.id}>
                            <TableCell className="font-medium">{alert.product?.name || '-'}</TableCell>
                            <TableCell className="text-center">{alert.product?.currentStock || 0}</TableCell>
                            <TableCell className="text-center">{alert.product?.minStock || 0}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={alert.alertType === 'LOW_STOCK' ? 'destructive' : 'default'}>
                                {alert.alertType === 'LOW_STOCK' ? (
                                  <>
                                    <ArrowDown className="h-3 w-3 mr-1" />
                                    Baixo
                                  </>
                                ) : (
                                  <>
                                    <ArrowUp className="h-3 w-3 mr-1" />
                                    Excesso
                                  </>
                                )}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhum alerta de estoque</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Stock Inventory */}
            <Card>
              <CardHeader>
                <CardTitle>Inventário Completo</CardTitle>
                <CardDescription>Lista de todos os produtos em estoque</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {productsLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : products && products.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-center">Estoque</TableHead>
                        <TableHead className="text-right">Custo Unit.</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map(product => {
                        const totalValue = parseFloat(product.costPrice) * product.currentStock;
                        const isLow = product.currentStock <= product.minStock;
                        const isHigh = product.maxStock && product.currentStock >= product.maxStock;
                        
                        return (
                          <TableRow key={product.id}>
                            <TableCell className="font-mono">{product.code}</TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell className="text-center">{product.currentStock}</TableCell>
                            <TableCell className="text-right">{formatCurrency(product.costPrice)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(totalValue)}</TableCell>
                            <TableCell className="text-center">
                              {isLow ? (
                                <Badge variant="destructive">
                                  <ArrowDown className="h-3 w-3 mr-1" />
                                  Baixo
                                </Badge>
                              ) : isHigh ? (
                                <Badge variant="default">
                                  <ArrowUp className="h-3 w-3 mr-1" />
                                  Alto
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <Minus className="h-3 w-3 mr-1" />
                                  Normal
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum produto cadastrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* ABC Analysis Tab */}
          <TabsContent value="abc" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-purple-200 bg-purple-50/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-purple-600">A</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Classe A - Alta Importância</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {abcAnalysis?.filter(p => p.class === 'A').length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">produtos</p>
                    <p className="text-lg font-semibold mt-2">
                      {formatCurrency(abcAnalysis?.filter(p => p.class === 'A').reduce((s, p) => s + p.revenue, 0) || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">~80% da receita</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-blue-600">B</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Classe B - Média Importância</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {abcAnalysis?.filter(p => p.class === 'B').length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">produtos</p>
                    <p className="text-lg font-semibold mt-2">
                      {formatCurrency(abcAnalysis?.filter(p => p.class === 'B').reduce((s, p) => s + p.revenue, 0) || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">~15% da receita</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-gray-200 bg-gray-50/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-gray-600">C</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Classe C - Baixa Importância</p>
                    <p className="text-3xl font-bold text-gray-600">
                      {abcAnalysis?.filter(p => p.class === 'C').length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">produtos</p>
                    <p className="text-lg font-semibold mt-2">
                      {formatCurrency(abcAnalysis?.filter(p => p.class === 'C').reduce((s, p) => s + p.revenue, 0) || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">~5% da receita</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Análise Detalhada da Curva ABC</CardTitle>
                <CardDescription>Classificação dos produtos por contribuição na receita</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {abcLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : abcAnalysis && abcAnalysis.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-center">Qtd Vendida</TableHead>
                        <TableHead className="text-right">Receita</TableHead>
                        <TableHead className="text-right">% Receita</TableHead>
                        <TableHead className="text-right">% Acumulado</TableHead>
                        <TableHead className="text-center">Classe</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {abcAnalysis.map(item => (
                        <TableRow key={item.productId}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                          <TableCell className="text-right">{item.percentage.toFixed(2)}%</TableCell>
                          <TableCell className="text-right">{item.cumulativePercentage.toFixed(2)}%</TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={item.class === 'A' ? 'default' : item.class === 'B' ? 'secondary' : 'outline'}
                              className={
                                item.class === 'A' ? 'bg-purple-100 text-purple-700' :
                                item.class === 'B' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }
                            >
                              Classe {item.class}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum dado para análise ABC</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Movements Tab */}
          <TabsContent value="movements">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Movimentações</CardTitle>
                <CardDescription>Entradas e saídas de estoque</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {movementsLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : stockMovements && stockMovements.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-center">Tipo</TableHead>
                        <TableHead className="text-center">Quantidade</TableHead>
                        <TableHead>Referência</TableHead>
                        <TableHead>Observação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockMovements.map(movement => (
                        <TableRow key={movement.id}>
                          <TableCell>
                            {format(new Date(movement.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="font-medium">Produto #{movement.productId}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={movement.type === 'IN' ? 'default' : 'destructive'}>
                              {movement.type === 'IN' ? (
                                <>
                                  <ArrowUp className="h-3 w-3 mr-1" />
                                  Entrada
                                </>
                              ) : (
                                <>
                                  <ArrowDown className="h-3 w-3 mr-1" />
                                  Saída
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {movement.type === 'IN' ? '+' : '-'}{movement.quantity}
                          </TableCell>
                          <TableCell>{movement.referenceId ? `#${movement.referenceId}` : '-'}</TableCell>
                          <TableCell className="text-muted-foreground">{movement.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma movimentação registrada</p>
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
