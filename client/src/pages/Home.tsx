import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  Users,
  Receipt,
  Percent
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function StatCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon,
  description
}: { 
  title: string; 
  value: string; 
  change?: number; 
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  description?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1">
                {changeType === 'positive' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : changeType === 'negative' ? (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                ) : null}
                <span className={`text-sm font-medium ${
                  changeType === 'positive' ? 'text-green-600' : 
                  changeType === 'negative' ? 'text-red-600' : 
                  'text-muted-foreground'
                }`}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
                {description && (
                  <span className="text-sm text-muted-foreground ml-1">{description}</span>
                )}
              </div>
            )}
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertCard({ 
  title, 
  count, 
  type 
}: { 
  title: string; 
  count: number; 
  type: 'warning' | 'danger' | 'info';
}) {
  const colors = {
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    danger: 'bg-red-50 border-red-200 text-red-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700'
  };
  
  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${colors[type]}`}>
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5" />
        <span className="font-medium">{title}</span>
      </div>
      <span className="text-lg font-bold">{count}</span>
    </div>
  );
}

export default function Home() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: alerts } = trpc.stock.alerts.useQuery({ unreadOnly: true });
  const { data: lowStock } = trpc.reports.lowStock.useQuery();
  const { data: highStock } = trpc.reports.highStock.useQuery();

  // Sample data for charts (in a real app, this would come from the API)
  const salesChartData = [
    { name: 'Jan', vendas: 4000 },
    { name: 'Fev', vendas: 3000 },
    { name: 'Mar', vendas: 5000 },
    { name: 'Abr', vendas: 4500 },
    { name: 'Mai', vendas: 6000 },
    { name: 'Jun', vendas: 5500 },
  ];

  const categoryData = [
    { name: 'Vestidos', value: 35 },
    { name: 'Blusas', value: 25 },
    { name: 'Calças', value: 20 },
    { name: 'Acessórios', value: 15 },
    { name: 'Outros', value: 5 },
  ];

  const COLORS = ['#7c3aed', '#ec4899', '#06b6d4', '#f59e0b', '#84cc16'];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu negócio de moda
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Vendas do Mês"
            value={formatCurrency(stats?.currentMonthSales ?? 0)}
            change={stats?.salesGrowth ?? 0}
            changeType={stats?.salesGrowth && stats.salesGrowth > 0 ? 'positive' : stats?.salesGrowth && stats.salesGrowth < 0 ? 'negative' : 'neutral'}
            icon={DollarSign}
            description="vs mês anterior"
          />
          <StatCard
            title="Pedidos"
            value={formatNumber(stats?.currentMonthOrders ?? 0)}
            icon={ShoppingCart}
          />
          <StatCard
            title="Ticket Médio"
            value={formatCurrency(stats?.averageTicket ?? 0)}
            icon={Receipt}
          />
          <StatCard
            title="Margem Média"
            value={`${(stats?.avgProfitMargin ?? 0).toFixed(1)}%`}
            icon={Percent}
          />
        </div>

        {/* Inventory Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Valor em Estoque"
            value={formatCurrency(stats?.inventoryValue ?? 0)}
            icon={Boxes}
          />
          <StatCard
            title="Itens em Estoque"
            value={formatNumber(stats?.inventoryItems ?? 0)}
            icon={Package}
          />
          <StatCard
            title="A Receber"
            value={formatCurrency(stats?.pendingReceivablesTotal ?? 0)}
            icon={TrendingUp}
          />
          <StatCard
            title="A Pagar"
            value={formatCurrency(stats?.pendingPayablesTotal ?? 0)}
            icon={TrendingDown}
          />
        </div>

        {/* Alerts Section */}
        {(stats?.alertsCount ?? 0) > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Alertas de Estoque
              </CardTitle>
              <CardDescription>
                Produtos que precisam de atenção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(stats?.lowStockCount ?? 0) > 0 && (
                <AlertCard
                  title="Produtos com estoque baixo"
                  count={stats?.lowStockCount ?? 0}
                  type="danger"
                />
              )}
              {(stats?.highStockCount ?? 0) > 0 && (
                <AlertCard
                  title="Produtos com estoque alto"
                  count={stats?.highStockCount ?? 0}
                  type="warning"
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Vendas</CardTitle>
              <CardDescription>Vendas dos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesChartData}>
                    <defs>
                      <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Vendas']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="vendas" 
                      stroke="#7c3aed" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorVendas)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Vendas por Categoria</CardTitle>
              <CardDescription>Distribuição das vendas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value}%`, 'Participação']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {categoryData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-muted-foreground">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Products */}
        {lowStock && lowStock.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Produtos com Estoque Baixo</CardTitle>
              <CardDescription>
                Produtos que precisam de reposição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStock.slice(0, 5).map(product => (
                  <div 
                    key={product.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">Código: {product.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">{product.currentStock} un</p>
                      <p className="text-sm text-muted-foreground">Mín: {product.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
