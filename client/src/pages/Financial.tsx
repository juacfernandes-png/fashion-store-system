import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, Clock, CheckCircle, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  Legend
} from 'recharts';

function formatCurrency(value: string | number) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num);
}

export default function Financial() {
  const [isPayableOpen, setIsPayableOpen] = useState(false);
  const [isReceivableOpen, setIsReceivableOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<number | null>(null);
  const [selectedReceivable, setSelectedReceivable] = useState<number | null>(null);
  
  const utils = trpc.useUtils();
  
  const { data: payables, isLoading: payablesLoading } = trpc.accountsPayable.list.useQuery();
  const { data: receivables, isLoading: receivablesLoading } = trpc.accountsReceivable.list.useQuery();
  const { data: suppliers } = trpc.suppliers.list.useQuery();
  const { data: customers } = trpc.customers.list.useQuery();
  const { data: stats } = trpc.dashboard.stats.useQuery();
  
  const createPayable = trpc.accountsPayable.create.useMutation({
    onSuccess: () => {
      toast.success("Conta a pagar criada com sucesso!");
      utils.accountsPayable.list.invalidate();
      setIsPayableOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar conta");
    }
  });
  
  const createReceivable = trpc.accountsReceivable.create.useMutation({
    onSuccess: () => {
      toast.success("Conta a receber criada com sucesso!");
      utils.accountsReceivable.list.invalidate();
      setIsReceivableOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar conta");
    }
  });
  
  const payAccount = trpc.accountsPayable.pay.useMutation({
    onSuccess: () => {
      toast.success("Pagamento registrado com sucesso!");
      utils.accountsPayable.list.invalidate();
      setIsPayOpen(false);
      setSelectedPayable(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar pagamento");
    }
  });
  
  const receivePayment = trpc.accountsReceivable.receive.useMutation({
    onSuccess: () => {
      toast.success("Recebimento registrado com sucesso!");
      utils.accountsReceivable.list.invalidate();
      setIsReceiveOpen(false);
      setSelectedReceivable(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar recebimento");
    }
  });

  const handleCreatePayable = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createPayable.mutate({
      description: formData.get("description") as string,
      supplierId: formData.get("supplierId") ? parseInt(formData.get("supplierId") as string) : undefined,
      category: formData.get("category") as "SUPPLIER" | "RENT" | "UTILITIES" | "SALARY" | "TAX" | "OTHER",
      amount: formData.get("amount") as string,
      dueDate: new Date(formData.get("dueDate") as string),
      notes: formData.get("notes") as string || undefined,
    });
  };

  const handleCreateReceivable = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createReceivable.mutate({
      description: formData.get("description") as string,
      customerId: formData.get("customerId") ? parseInt(formData.get("customerId") as string) : undefined,
      amount: formData.get("amount") as string,
      dueDate: new Date(formData.get("dueDate") as string),
      notes: formData.get("notes") as string || undefined,
    });
  };

  const handlePay = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPayable) return;
    
    const formData = new FormData(e.currentTarget);
    
    payAccount.mutate({
      id: selectedPayable,
      amount: parseFloat(formData.get("amount") as string),
      paymentMethod: formData.get("paymentMethod") as "CASH" | "CREDIT" | "DEBIT" | "PIX" | "TRANSFER" | "CHECK",
    });
  };

  const handleReceive = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedReceivable) return;
    
    const formData = new FormData(e.currentTarget);
    
    receivePayment.mutate({
      id: selectedReceivable,
      amount: parseFloat(formData.get("amount") as string),
      paymentMethod: formData.get("paymentMethod") as "CASH" | "CREDIT" | "DEBIT" | "PIX" | "TRANSFER" | "CHECK",
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PENDING":
        return { label: "Pendente", icon: Clock, variant: "secondary" as const };
      case "PARTIAL":
        return { label: "Parcial", icon: AlertCircle, variant: "default" as const };
      case "PAID":
        return { label: "Pago", icon: CheckCircle, variant: "default" as const };
      case "RECEIVED":
        return { label: "Recebido", icon: CheckCircle, variant: "default" as const };
      case "OVERDUE":
        return { label: "Vencido", icon: AlertCircle, variant: "destructive" as const };
      default:
        return { label: status, icon: Clock, variant: "secondary" as const };
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      SUPPLIER: "Fornecedor",
      RENT: "Aluguel",
      UTILITIES: "Utilidades",
      SALARY: "Salário",
      TAX: "Impostos",
      OTHER: "Outros"
    };
    return labels[category] || category;
  };

  // Calculate totals
  const totalPayables = payables?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  const pendingPayables = payables?.filter(p => p.status === "PENDING" || p.status === "PARTIAL").reduce((sum, p) => sum + parseFloat(p.amount) - parseFloat(p.paidAmount), 0) || 0;
  const totalReceivables = receivables?.reduce((sum, r) => sum + parseFloat(r.amount), 0) || 0;
  const pendingReceivables = receivables?.filter(r => r.status === "PENDING" || r.status === "PARTIAL").reduce((sum, r) => sum + parseFloat(r.amount) - parseFloat(r.receivedAmount), 0) || 0;

  // Sample data for cash flow chart
  const cashFlowData = [
    { name: 'Jan', entradas: 15000, saidas: 12000 },
    { name: 'Fev', entradas: 18000, saidas: 14000 },
    { name: 'Mar', entradas: 22000, saidas: 16000 },
    { name: 'Abr', entradas: 20000, saidas: 15000 },
    { name: 'Mai', entradas: 25000, saidas: 18000 },
    { name: 'Jun', entradas: 28000, saidas: 20000 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão Financeira</h1>
          <p className="text-muted-foreground">
            Controle de contas a pagar, receber e fluxo de caixa
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <ArrowUpRight className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">A Receber</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(pendingReceivables)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <ArrowDownRight className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">A Pagar</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(pendingPayables)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Previsto</p>
                  <p className={`text-2xl font-bold ${pendingReceivables - pendingPayables >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(pendingReceivables - pendingPayables)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vendas do Mês</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.currentMonthSales || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cash Flow Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Fluxo de Caixa</CardTitle>
            <CardDescription>Entradas e saídas dos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="entradas" name="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Payables and Receivables */}
        <Tabs defaultValue="receivables" className="space-y-4">
          <TabsList>
            <TabsTrigger value="receivables">Contas a Receber</TabsTrigger>
            <TabsTrigger value="payables">Contas a Pagar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="receivables">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Contas a Receber</CardTitle>
                  <CardDescription>Gerencie seus recebimentos</CardDescription>
                </div>
                <Dialog open={isReceivableOpen} onOpenChange={setIsReceivableOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Conta
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova Conta a Receber</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateReceivable} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="description">Descrição *</Label>
                        <Input id="description" name="description" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customerId">Cliente</Label>
                        <Select name="customerId">
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers?.map(c => (
                              <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount">Valor *</Label>
                          <Input id="amount" name="amount" type="number" step="0.01" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dueDate">Vencimento *</Label>
                          <Input id="dueDate" name="dueDate" type="date" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea id="notes" name="notes" />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsReceivableOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createReceivable.isPending}>
                          {createReceivable.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                {receivablesLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : receivables && receivables.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Recebido</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receivables.map(receivable => {
                        const statusInfo = getStatusInfo(receivable.status);
                        return (
                          <TableRow key={receivable.id}>
                            <TableCell className="font-medium">{receivable.description}</TableCell>
                            <TableCell>{receivable.customer?.name || '-'}</TableCell>
                            <TableCell>
                              {format(new Date(receivable.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(receivable.amount)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(receivable.receivedAmount)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={statusInfo.variant}>
                                <statusInfo.icon className="h-3 w-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {(receivable.status === "PENDING" || receivable.status === "PARTIAL") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReceivable(receivable.id);
                                    setIsReceiveOpen(true);
                                  }}
                                >
                                  Receber
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhuma conta a receber</h3>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payables">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Contas a Pagar</CardTitle>
                  <CardDescription>Gerencie seus pagamentos</CardDescription>
                </div>
                <Dialog open={isPayableOpen} onOpenChange={setIsPayableOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Conta
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova Conta a Pagar</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreatePayable} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="description">Descrição *</Label>
                        <Input id="description" name="description" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Categoria *</Label>
                          <Select name="category" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SUPPLIER">Fornecedor</SelectItem>
                              <SelectItem value="RENT">Aluguel</SelectItem>
                              <SelectItem value="UTILITIES">Utilidades</SelectItem>
                              <SelectItem value="SALARY">Salário</SelectItem>
                              <SelectItem value="TAX">Impostos</SelectItem>
                              <SelectItem value="OTHER">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="supplierId">Fornecedor</Label>
                          <Select name="supplierId">
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {suppliers?.map(s => (
                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount">Valor *</Label>
                          <Input id="amount" name="amount" type="number" step="0.01" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dueDate">Vencimento *</Label>
                          <Input id="dueDate" name="dueDate" type="date" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea id="notes" name="notes" />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsPayableOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createPayable.isPending}>
                          {createPayable.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                {payablesLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : payables && payables.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Pago</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payables.map(payable => {
                        const statusInfo = getStatusInfo(payable.status);
                        return (
                          <TableRow key={payable.id}>
                            <TableCell className="font-medium">{payable.description}</TableCell>
                            <TableCell>{getCategoryLabel(payable.category)}</TableCell>
                            <TableCell>{payable.supplier?.name || '-'}</TableCell>
                            <TableCell>
                              {format(new Date(payable.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(payable.amount)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(payable.paidAmount)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={statusInfo.variant}>
                                <statusInfo.icon className="h-3 w-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {(payable.status === "PENDING" || payable.status === "PARTIAL") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPayable(payable.id);
                                    setIsPayOpen(true);
                                  }}
                                >
                                  Pagar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhuma conta a pagar</h3>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Pay Dialog */}
        <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePay} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pay-amount">Valor do Pagamento *</Label>
                <Input id="pay-amount" name="amount" type="number" step="0.01" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay-method">Forma de Pagamento *</Label>
                <Select name="paymentMethod" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Dinheiro</SelectItem>
                    <SelectItem value="CREDIT">Cartão de Crédito</SelectItem>
                    <SelectItem value="DEBIT">Cartão de Débito</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="TRANSFER">Transferência</SelectItem>
                    <SelectItem value="CHECK">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPayOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={payAccount.isPending}>
                  {payAccount.isPending ? "Processando..." : "Confirmar Pagamento"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Receive Dialog */}
        <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Recebimento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleReceive} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receive-amount">Valor Recebido *</Label>
                <Input id="receive-amount" name="amount" type="number" step="0.01" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receive-method">Forma de Recebimento *</Label>
                <Select name="paymentMethod" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Dinheiro</SelectItem>
                    <SelectItem value="CREDIT">Cartão de Crédito</SelectItem>
                    <SelectItem value="DEBIT">Cartão de Débito</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="TRANSFER">Transferência</SelectItem>
                    <SelectItem value="CHECK">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsReceiveOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={receivePayment.isPending}>
                  {receivePayment.isPending ? "Processando..." : "Confirmar Recebimento"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
