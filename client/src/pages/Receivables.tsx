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
import { toast } from "sonner";
import { Plus, CheckCircle, DollarSign, AlertTriangle, Clock, Filter, CreditCard, Banknote } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const paymentMethods = [
  { value: "CASH", label: "Dinheiro" },
  { value: "CREDIT", label: "Cartão de Crédito" },
  { value: "DEBIT", label: "Cartão de Débito" },
  { value: "PIX", label: "PIX" },
  { value: "TRANSFER", label: "Transferência" },
  { value: "CHECK", label: "Cheque" },
  { value: "BOLETO", label: "Boleto" },
];

const cardBrands = [
  { value: "VISA", label: "Visa" },
  { value: "MASTERCARD", label: "Mastercard" },
  { value: "ELO", label: "Elo" },
  { value: "AMEX", label: "American Express" },
  { value: "HIPERCARD", label: "Hipercard" },
];

export default function Receivables() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("");
  const [filterReconciled, setFilterReconciled] = useState<string>("");
  
  const [formData, setFormData] = useState({
    documentNumber: "",
    description: "",
    customerId: "",
    unitId: "",
    amount: "",
    dueDate: new Date().toISOString().split("T")[0],
    paymentMethod: "",
    cardBrand: "",
    cardInstallments: "",
    expectedReceiptDate: "",
    acquirerFee: "",
    bankAccount: "",
    notes: "",
  });
  
  const [receiveData, setReceiveData] = useState({
    amount: "",
    paymentMethod: "",
    bankAccount: "",
  });

  const utils = trpc.useUtils();
  
  const { data: receivables, isLoading } = trpc.receivables.list.useQuery({
    status: filterStatus || undefined,
    paymentMethod: filterPaymentMethod || undefined,
    isReconciled: filterReconciled === "true" ? true : filterReconciled === "false" ? false : undefined,
    limit: 500,
  });
  
  const { data: customers } = trpc.customers.list.useQuery();
  const { data: units } = trpc.storeUnits.list.useQuery();
  
  const createMutation = trpc.receivables.create.useMutation({
    onSuccess: () => {
      toast.success("Conta a receber criada com sucesso!");
      setIsDialogOpen(false);
      resetForm();
      utils.receivables.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const receiveMutation = trpc.receivables.receive.useMutation({
    onSuccess: () => {
      toast.success("Recebimento registrado!");
      setIsReceiveDialogOpen(false);
      setSelectedReceivable(null);
      utils.receivables.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const reconcileMutation = trpc.receivables.reconcile.useMutation({
    onSuccess: () => {
      toast.success("Conta conciliada!");
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

  const resetForm = () => {
    setFormData({
      documentNumber: "",
      description: "",
      customerId: "",
      unitId: "",
      amount: "",
      dueDate: new Date().toISOString().split("T")[0],
      paymentMethod: "",
      cardBrand: "",
      cardInstallments: "",
      expectedReceiptDate: "",
      acquirerFee: "",
      bankAccount: "",
      notes: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.description || !formData.amount || !formData.dueDate) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    
    createMutation.mutate({
      documentNumber: formData.documentNumber || undefined,
      description: formData.description,
      customerId: formData.customerId ? parseInt(formData.customerId) : undefined,
      unitId: formData.unitId ? parseInt(formData.unitId) : undefined,
      amount: formData.amount,
      dueDate: new Date(formData.dueDate),
      paymentMethod: formData.paymentMethod as any || undefined,
      cardBrand: formData.cardBrand || undefined,
      cardInstallments: formData.cardInstallments ? parseInt(formData.cardInstallments) : undefined,
      expectedReceiptDate: formData.expectedReceiptDate ? new Date(formData.expectedReceiptDate) : undefined,
      acquirerFee: formData.acquirerFee || undefined,
      bankAccount: formData.bankAccount || undefined,
      notes: formData.notes || undefined,
    });
  };
  
  const handleReceive = () => {
    if (!selectedReceivable || !receiveData.amount || !receiveData.paymentMethod) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    
    receiveMutation.mutate({
      id: selectedReceivable.id,
      amount: parseFloat(receiveData.amount),
      paymentMethod: receiveData.paymentMethod,
      bankAccount: receiveData.bankAccount || undefined,
    });
  };
  
  const openReceiveDialog = (receivable: any) => {
    setSelectedReceivable(receivable);
    setReceiveData({
      amount: receivable.amount,
      paymentMethod: receivable.paymentMethod || "",
      bankAccount: "",
    });
    setIsReceiveDialogOpen(true);
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />Pendente</Badge>;
      case "PARTIAL":
        return <Badge variant="secondary">Parcial</Badge>;
      case "RECEIVED":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Recebido</Badge>;
      case "OVERDUE":
        return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Vencido</Badge>;
      case "CHARGEBACK":
        return <Badge variant="destructive">Chargeback</Badge>;
      case "CANCELLED":
        return <Badge variant="secondary">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getPaymentMethodLabel = (method: string) => {
    return paymentMethods.find(pm => pm.value === method)?.label || method;
  };
  
  // Calculate summary
  const summary = receivables?.reduce((acc, r) => {
    const amount = parseFloat(r.amount);
    const netAmount = parseFloat(r.netAmount || r.amount);
    acc.total += amount;
    acc.netTotal += netAmount;
    if (r.status === "PENDING" || r.status === "PARTIAL") {
      acc.pending += amount - parseFloat(r.receivedAmount || "0");
    }
    if (r.status === "OVERDUE") {
      acc.overdue += amount - parseFloat(r.receivedAmount || "0");
    }
    if (!r.isReconciled && r.status === "RECEIVED") {
      acc.toReconcile += netAmount;
    }
    return acc;
  }, { total: 0, netTotal: 0, pending: 0, overdue: 0, toReconcile: 0 }) || { total: 0, netTotal: 0, pending: 0, overdue: 0, toReconcile: 0 };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contas a Receber</h1>
            <p className="text-muted-foreground">Gestão de recebíveis e receitas</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Conta a Receber</DialogTitle>
                <DialogDescription>Registre um novo recebível</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nº Documento</Label>
                    <Input
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                      placeholder="Ex: PED-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select value={formData.customerId} onValueChange={(v) => setFormData({ ...formData, customerId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {customers?.map((c: { id: number; name: string }) => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Descrição *</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do recebível"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vencimento *</Label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((pm) => (
                          <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade</Label>
                    <Select value={formData.unitId} onValueChange={(v) => setFormData({ ...formData, unitId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas</SelectItem>
                        {units?.map((u: { id: number; name: string }) => (
                          <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {(formData.paymentMethod === "CREDIT" || formData.paymentMethod === "DEBIT") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bandeira do Cartão</Label>
                      <Select value={formData.cardBrand} onValueChange={(v) => setFormData({ ...formData, cardBrand: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {cardBrands.map((cb) => (
                            <SelectItem key={cb.value} value={cb.value}>{cb.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.paymentMethod === "CREDIT" && (
                      <div className="space-y-2">
                        <Label>Parcelas</Label>
                        <Input
                          type="number"
                          min="1"
                          max="12"
                          value={formData.cardInstallments}
                          onChange={(e) => setFormData({ ...formData, cardInstallments: e.target.value })}
                          placeholder="1"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Prevista de Recebimento</Label>
                    <Input
                      type="date"
                      value={formData.expectedReceiptDate}
                      onChange={(e) => setFormData({ ...formData, expectedReceiptDate: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Ex: D+1 para débito, D+30 para crédito</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Taxa da Adquirente (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.acquirerFee}
                      onChange={(e) => setFormData({ ...formData, acquirerFee: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observações adicionais"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bruto</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.total)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Líquido</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.netTotal)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.pending)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencido</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.overdue)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Conciliar</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.toReconcile)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="PARTIAL">Parcial</SelectItem>
                    <SelectItem value="RECEIVED">Recebido</SelectItem>
                    <SelectItem value="OVERDUE">Vencido</SelectItem>
                    <SelectItem value="CHARGEBACK">Chargeback</SelectItem>
                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {paymentMethods.map((pm) => (
                      <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Conciliação</Label>
                <Select value={filterReconciled} onValueChange={setFilterReconciled}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="true">Conciliado</SelectItem>
                    <SelectItem value="false">Não Conciliado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Contas a Receber</CardTitle>
            <CardDescription>Lista de recebíveis</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : receivables && receivables.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Líquido</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivables.map((receivable) => (
                    <TableRow key={receivable.id}>
                      <TableCell>{formatDate(receivable.dueDate)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{receivable.description}</TableCell>
                      <TableCell>{receivable.customer?.name || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{receivable.paymentMethod ? getPaymentMethodLabel(receivable.paymentMethod) : "-"}</span>
                          {receivable.cardBrand && (
                            <span className="text-xs text-muted-foreground">{receivable.cardBrand}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(receivable.amount)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(receivable.netAmount || receivable.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(receivable.status)}
                          {receivable.isReconciled && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                              Conciliado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {(receivable.status === "PENDING" || receivable.status === "PARTIAL" || receivable.status === "OVERDUE") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openReceiveDialog(receivable)}
                              title="Receber"
                            >
                              <DollarSign className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {receivable.status === "RECEIVED" && !receivable.isReconciled && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => reconcileMutation.mutate({ id: receivable.id })}
                              disabled={reconcileMutation.isPending}
                              title="Conciliar"
                            >
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                          {(receivable.paymentMethod === "CREDIT" || receivable.paymentMethod === "DEBIT") && 
                           receivable.status !== "CHARGEBACK" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const reason = prompt("Motivo do chargeback:");
                                if (reason) {
                                  chargebackMutation.mutate({ id: receivable.id, reason });
                                }
                              }}
                              disabled={chargebackMutation.isPending}
                              title="Registrar Chargeback"
                            >
                              <AlertTriangle className="h-4 w-4 text-red-600" />
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
                Nenhuma conta a receber encontrada
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Receive Dialog */}
        <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Recebimento</DialogTitle>
              <DialogDescription>
                {selectedReceivable?.description}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Valor a Receber *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={receiveData.amount}
                  onChange={(e) => setReceiveData({ ...receiveData, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Forma de Recebimento *</Label>
                <Select value={receiveData.paymentMethod} onValueChange={(v) => setReceiveData({ ...receiveData, paymentMethod: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((pm) => (
                      <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Conta Bancária</Label>
                <Input
                  value={receiveData.bankAccount}
                  onChange={(e) => setReceiveData({ ...receiveData, bankAccount: e.target.value })}
                  placeholder="Ex: Banco do Brasil - CC"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReceiveDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleReceive} disabled={receiveMutation.isPending}>
                {receiveMutation.isPending ? "Processando..." : "Confirmar Recebimento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
