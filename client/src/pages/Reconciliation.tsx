import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, CheckCircle, AlertTriangle, Search, FileText, CreditCard, DollarSign, RefreshCw, XCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function Reconciliation() {
  const [activeTab, setActiveTab] = useState("sales");
  const [filterUnit, setFilterUnit] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const utils = trpc.useUtils();
  
  const { data: units } = trpc.storeUnits.list.useQuery();
  
  // Sales reconciliation
  const { data: salesOrders } = trpc.salesOrders.list.useQuery({
    status: "COMPLETED",
  });
  
  // Receivables for reconciliation
  const { data: receivables } = trpc.receivables.list.useQuery({
    status: filterStatus || undefined,
    limit: 500,
  });
  
  const reconcileMutation = trpc.receivables.reconcile.useMutation({
    onSuccess: () => {
      toast.success("Conta conciliada com sucesso!");
      utils.receivables.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const chargebackMutation = trpc.receivables.markChargeback.useMutation({
    onSuccess: () => {
      toast.success("Chargeback registrado!");
      utils.receivables.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };
  
  // Calculate reconciliation summary
  const reconciliationSummary = receivables?.reduce((acc, r) => {
    const amount = parseFloat(r.amount);
    const netAmount = parseFloat(r.netAmount || r.amount);
    
    if (r.status === "RECEIVED") {
      acc.totalReceived += netAmount;
      if (r.isReconciled) {
        acc.reconciled += netAmount;
      } else {
        acc.pending += netAmount;
      }
    }
    
    if (r.status === "CHARGEBACK") {
      acc.chargebacks += amount;
    }
    
    // Calculate acquirer fees
    if (r.acquirerFee) {
      acc.fees += amount * (parseFloat(r.acquirerFee) / 100);
    }
    
    return acc;
  }, { totalReceived: 0, reconciled: 0, pending: 0, chargebacks: 0, fees: 0 }) || { totalReceived: 0, reconciled: 0, pending: 0, chargebacks: 0, fees: 0 };
  
  // Filter receivables for display
  const filteredReceivables = receivables?.filter(r => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!r.description.toLowerCase().includes(term) && 
          !r.documentNumber?.toLowerCase().includes(term)) {
        return false;
      }
    }
    return true;
  });
  
  // Group by payment method for analysis
  const paymentMethodAnalysis = receivables?.reduce((acc, r) => {
    const method = r.paymentMethod || "OTHER";
    if (!acc[method]) {
      acc[method] = { total: 0, received: 0, pending: 0, fees: 0, count: 0 };
    }
    const amount = parseFloat(r.amount);
    acc[method].total += amount;
    acc[method].count += 1;
    if (r.status === "RECEIVED") {
      acc[method].received += parseFloat(r.netAmount || r.amount);
    } else if (r.status === "PENDING" || r.status === "PARTIAL") {
      acc[method].pending += amount - parseFloat(r.receivedAmount || "0");
    }
    if (r.acquirerFee) {
      acc[method].fees += amount * (parseFloat(r.acquirerFee) / 100);
    }
    return acc;
  }, {} as Record<string, { total: number; received: number; pending: number; fees: number; count: number }>);
  
  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      CASH: "Dinheiro",
      CREDIT: "Cartão de Crédito",
      DEBIT: "Cartão de Débito",
      PIX: "PIX",
      TRANSFER: "Transferência",
      CHECK: "Cheque",
      BOLETO: "Boleto",
      OTHER: "Outros",
    };
    return labels[method] || method;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Conciliação Bancária</h1>
            <p className="text-muted-foreground">Vendas registradas vs recebimentos no banco</p>
          </div>
          <Button variant="outline" onClick={() => utils.receivables.list.invalidate()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(reconciliationSummary.totalReceived)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conciliado</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(reconciliationSummary.reconciled)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Conciliar</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(reconciliationSummary.pending)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxas Adquirente</CardTitle>
              <CreditCard className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(reconciliationSummary.fees)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chargebacks</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(reconciliationSummary.chargebacks)}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="sales">Conciliação de Vendas</TabsTrigger>
            <TabsTrigger value="methods">Por Forma de Pagamento</TabsTrigger>
            <TabsTrigger value="divergences">Divergências</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sales" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        placeholder="Descrição ou documento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="RECEIVED">Recebido</SelectItem>
                        <SelectItem value="PENDING">Pendente</SelectItem>
                        <SelectItem value="CHARGEBACK">Chargeback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade</Label>
                    <Select value={filterUnit} onValueChange={setFilterUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {units?.map((u: { id: number; name: string }) => (
                          <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Receivables Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recebíveis para Conciliação</CardTitle>
                <CardDescription>Verifique se os valores recebidos conferem com o extrato bancário</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredReceivables && filteredReceivables.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead className="text-right">Valor Bruto</TableHead>
                        <TableHead className="text-right">Valor Líquido</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReceivables.map((r) => (
                        <TableRow key={r.id} className={r.isReconciled ? "bg-green-50/50" : ""}>
                          <TableCell>{formatDate(r.dueDate)}</TableCell>
                          <TableCell className="font-mono text-sm">{r.documentNumber || "-"}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{r.description}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">{r.paymentMethod ? getPaymentMethodLabel(r.paymentMethod) : "-"}</span>
                              {r.cardBrand && <span className="text-xs text-muted-foreground">{r.cardBrand}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(r.amount)}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatCurrency(r.netAmount || r.amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant={r.status === "RECEIVED" ? "default" : r.status === "CHARGEBACK" ? "destructive" : "secondary"}>
                                {r.status === "RECEIVED" ? "Recebido" : r.status === "CHARGEBACK" ? "Chargeback" : r.status}
                              </Badge>
                              {r.isReconciled && (
                                <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Conciliado
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {r.status === "RECEIVED" && !r.isReconciled && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => reconcileMutation.mutate({ id: r.id })}
                                  disabled={reconcileMutation.isPending}
                                  title="Marcar como conciliado"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              {(r.paymentMethod === "CREDIT" || r.paymentMethod === "DEBIT") && 
                               r.status !== "CHARGEBACK" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const reason = prompt("Motivo do chargeback:");
                                    if (reason) {
                                      chargebackMutation.mutate({ id: r.id, reason });
                                    }
                                  }}
                                  disabled={chargebackMutation.isPending}
                                  title="Registrar chargeback"
                                >
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum recebível encontrado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="methods" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análise por Forma de Pagamento</CardTitle>
                <CardDescription>Resumo de recebimentos e taxas por método</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentMethodAnalysis && Object.keys(paymentMethodAnalysis).length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Forma de Pagamento</TableHead>
                        <TableHead className="text-right">Qtd. Transações</TableHead>
                        <TableHead className="text-right">Total Bruto</TableHead>
                        <TableHead className="text-right">Recebido</TableHead>
                        <TableHead className="text-right">Pendente</TableHead>
                        <TableHead className="text-right">Taxas</TableHead>
                        <TableHead className="text-right">Taxa Média</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(paymentMethodAnalysis).map(([method, data]) => (
                        <TableRow key={method}>
                          <TableCell className="font-medium">{getPaymentMethodLabel(method)}</TableCell>
                          <TableCell className="text-right">{data.count}</TableCell>
                          <TableCell className="text-right">{formatCurrency(data.total)}</TableCell>
                          <TableCell className="text-right text-green-600">{formatCurrency(data.received)}</TableCell>
                          <TableCell className="text-right text-yellow-600">{formatCurrency(data.pending)}</TableCell>
                          <TableCell className="text-right text-orange-600">{formatCurrency(data.fees)}</TableCell>
                          <TableCell className="text-right">
                            {data.total > 0 ? ((data.fees / data.total) * 100).toFixed(2) : "0.00"}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="divergences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Alertas de Divergência
                </CardTitle>
                <CardDescription>Transações que precisam de atenção</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredReceivables?.filter(r => 
                  r.status === "CHARGEBACK" || 
                  (r.status === "RECEIVED" && !r.isReconciled) ||
                  r.status === "OVERDUE"
                ).length ? (
                  <div className="space-y-4">
                    {/* Chargebacks */}
                    {filteredReceivables.filter(r => r.status === "CHARGEBACK").length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">Chargebacks</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Motivo</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredReceivables.filter(r => r.status === "CHARGEBACK").map((r) => (
                              <TableRow key={r.id}>
                                <TableCell>{formatDate(r.dueDate)}</TableCell>
                                <TableCell>{r.description}</TableCell>
                                <TableCell>{r.chargebackReason || "-"}</TableCell>
                                <TableCell className="text-right text-red-600">{formatCurrency(r.amount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    
                    {/* Not reconciled */}
                    {filteredReceivables.filter(r => r.status === "RECEIVED" && !r.isReconciled).length > 0 && (
                      <div>
                        <h4 className="font-medium text-yellow-600 mb-2">Aguardando Conciliação</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Pagamento</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                              <TableHead>Ação</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredReceivables.filter(r => r.status === "RECEIVED" && !r.isReconciled).map((r) => (
                              <TableRow key={r.id}>
                                <TableCell>{formatDate(r.dueDate)}</TableCell>
                                <TableCell>{r.description}</TableCell>
                                <TableCell>{r.paymentMethod ? getPaymentMethodLabel(r.paymentMethod) : "-"}</TableCell>
                                <TableCell className="text-right">{formatCurrency(r.netAmount || r.amount)}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => reconcileMutation.mutate({ id: r.id })}
                                    disabled={reconcileMutation.isPending}
                                  >
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Conciliar
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    
                    {/* Overdue */}
                    {filteredReceivables.filter(r => r.status === "OVERDUE").length > 0 && (
                      <div>
                        <h4 className="font-medium text-orange-600 mb-2">Vencidos</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Vencimento</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Cliente</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredReceivables.filter(r => r.status === "OVERDUE").map((r) => (
                              <TableRow key={r.id}>
                                <TableCell className="text-red-600">{formatDate(r.dueDate)}</TableCell>
                                <TableCell>{r.description}</TableCell>
                                <TableCell>{r.customer?.name || "-"}</TableCell>
                                <TableCell className="text-right">{formatCurrency(r.amount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <p>Nenhuma divergência encontrada</p>
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
