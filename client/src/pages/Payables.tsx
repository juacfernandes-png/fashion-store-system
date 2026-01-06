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
import { Plus, CheckCircle, XCircle, DollarSign, AlertTriangle, Clock, Filter, Receipt } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const categories = [
  { value: "SUPPLIER", label: "Fornecedor" },
  { value: "RENT", label: "Aluguel" },
  { value: "UTILITIES", label: "Utilidades" },
  { value: "SALARY", label: "Salários" },
  { value: "TAX", label: "Impostos" },
  { value: "MARKETING", label: "Marketing" },
  { value: "FREIGHT", label: "Frete" },
  { value: "SYSTEM", label: "Sistemas" },
  { value: "INSURANCE", label: "Seguros" },
  { value: "MAINTENANCE", label: "Manutenção" },
  { value: "OTHER", label: "Outros" },
];

const paymentMethods = [
  { value: "CASH", label: "Dinheiro" },
  { value: "CREDIT", label: "Cartão de Crédito" },
  { value: "DEBIT", label: "Cartão de Débito" },
  { value: "PIX", label: "PIX" },
  { value: "TRANSFER", label: "Transferência" },
  { value: "CHECK", label: "Cheque" },
  { value: "BOLETO", label: "Boleto" },
];

const recurringFrequencies = [
  { value: "WEEKLY", label: "Semanal" },
  { value: "MONTHLY", label: "Mensal" },
  { value: "QUARTERLY", label: "Trimestral" },
  { value: "YEARLY", label: "Anual" },
];

type PayableType = {
  id: number;
  documentNumber: string | null;
  description: string;
  supplierId: number | null;
  unitId: number | null;
  costCenterId: number | null;
  category: string;
  amount: string;
  paidAmount: string | null;
  dueDate: Date;
  paymentDate?: Date | null;
  status: string;
  approvalStatus: string;
  isRecurring: boolean;
  installmentNumber: number | null;
  totalInstallments: number | null;
  supplier?: { id: number; name: string } | null;
  unit?: { id: number; name: string } | null;
  costCenter?: { id: number; name: string } | null;
};

export default function Payables() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<PayableType | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterApproval, setFilterApproval] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  
  const [formData, setFormData] = useState({
    documentNumber: "",
    description: "",
    supplierId: "",
    unitId: "",
    costCenterId: "",
    category: "",
    amount: "",
    dueDate: new Date().toISOString().split("T")[0],
    paymentMethod: "",
    bankAccount: "",
    isRecurring: false,
    recurringFrequency: "",
    totalInstallments: "",
    notes: "",
  });
  
  const [payData, setPayData] = useState({
    amount: "",
    paymentMethod: "",
    bankAccount: "",
  });

  const utils = trpc.useUtils();
  
  const { data: payables, isLoading } = trpc.payables.list.useQuery({
    status: filterStatus || undefined,
    approvalStatus: filterApproval || undefined,
    category: filterCategory || undefined,
    limit: 500,
  });
  
  const { data: suppliers } = trpc.suppliers.list.useQuery();
  const { data: units } = trpc.storeUnits.list.useQuery();
  const { data: costCenters } = trpc.costCenters.list.useQuery();
  
  const createMutation = trpc.payables.create.useMutation({
    onSuccess: () => {
      toast.success("Conta a pagar criada com sucesso!");
      setIsDialogOpen(false);
      resetForm();
      utils.payables.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const approveMutation = trpc.payables.approve.useMutation({
    onSuccess: () => {
      toast.success("Conta aprovada!");
      utils.payables.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const rejectMutation = trpc.payables.reject.useMutation({
    onSuccess: () => {
      toast.success("Conta rejeitada!");
      utils.payables.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const payMutation = trpc.payables.pay.useMutation({
    onSuccess: () => {
      toast.success("Pagamento registrado!");
      setIsPayDialogOpen(false);
      setSelectedPayable(null);
      utils.payables.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      documentNumber: "",
      description: "",
      supplierId: "",
      unitId: "",
      costCenterId: "",
      category: "",
      amount: "",
      dueDate: new Date().toISOString().split("T")[0],
      paymentMethod: "",
      bankAccount: "",
      isRecurring: false,
      recurringFrequency: "",
      totalInstallments: "",
      notes: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.category || !formData.description || !formData.amount || !formData.dueDate) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    
    createMutation.mutate({
      documentNumber: formData.documentNumber || undefined,
      description: formData.description,
      supplierId: formData.supplierId ? parseInt(formData.supplierId) : undefined,
      unitId: formData.unitId ? parseInt(formData.unitId) : undefined,
      costCenterId: formData.costCenterId ? parseInt(formData.costCenterId) : undefined,
      category: formData.category as any,
      amount: formData.amount,
      dueDate: new Date(formData.dueDate),
      paymentMethod: formData.paymentMethod as any || undefined,
      bankAccount: formData.bankAccount || undefined,
      isRecurring: formData.isRecurring,
      recurringFrequency: formData.recurringFrequency as any || undefined,
      totalInstallments: formData.totalInstallments ? parseInt(formData.totalInstallments) : undefined,
      notes: formData.notes || undefined,
    });
  };
  
  const handlePay = () => {
    if (!selectedPayable || !payData.amount || !payData.paymentMethod) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    
    payMutation.mutate({
      id: selectedPayable.id,
      amount: parseFloat(payData.amount),
      paymentMethod: payData.paymentMethod,
      bankAccount: payData.bankAccount || undefined,
    });
  };
  
  const openPayDialog = (payable: PayableType) => {
    setSelectedPayable(payable);
    setPayData({
      amount: payable.amount,
      paymentMethod: "",
      bankAccount: "",
    });
    setIsPayDialogOpen(true);
  };

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
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
      case "PAID":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Pago</Badge>;
      case "OVERDUE":
        return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Vencido</Badge>;
      case "CANCELLED":
        return <Badge variant="secondary">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getApprovalBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline">Aguardando</Badge>;
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Calculate summary
  const summary = payables?.reduce((acc, p) => {
    const amount = parseFloat(p.amount);
    acc.total += amount;
    if (p.status === "PENDING" || p.status === "PARTIAL") {
      acc.pending += amount - parseFloat(p.paidAmount || "0");
    }
    if (p.status === "OVERDUE") {
      acc.overdue += amount - parseFloat(p.paidAmount || "0");
    }
    if (p.approvalStatus === "PENDING") {
      acc.awaitingApproval += amount;
    }
    return acc;
  }, { total: 0, pending: 0, overdue: 0, awaitingApproval: 0 }) || { total: 0, pending: 0, overdue: 0, awaitingApproval: 0 };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contas a Pagar</h1>
            <p className="text-muted-foreground">Gestão de pagamentos e despesas</p>
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
                <DialogTitle>Nova Conta a Pagar</DialogTitle>
                <DialogDescription>Registre uma nova despesa ou pagamento</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nº Documento</Label>
                    <Input
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                      placeholder="Ex: NF-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria *</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
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
                    placeholder="Descrição da conta"
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
                    <Label>Fornecedor</Label>
                    <Select value={formData.supplierId} onValueChange={(v) => setFormData({ ...formData, supplierId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {suppliers?.map((s: { id: number; name: string }) => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Centro de Custo</Label>
                    <Select value={formData.costCenterId} onValueChange={(v) => setFormData({ ...formData, costCenterId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {costCenters?.map((cc: { id: number; name: string }) => (
                          <SelectItem key={cc.id} value={cc.id.toString()}>{cc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isRecurring">Conta Recorrente</Label>
                </div>
                
                {formData.isRecurring && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Frequência</Label>
                      <Select value={formData.recurringFrequency} onValueChange={(v) => setFormData({ ...formData, recurringFrequency: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {recurringFrequencies.map((f) => (
                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Parcelamento (opcional)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.totalInstallments}
                    onChange={(e) => setFormData({ ...formData, totalInstallments: e.target.value })}
                    placeholder="Número de parcelas"
                  />
                  <p className="text-xs text-muted-foreground">Se preenchido, o valor será dividido em parcelas mensais</p>
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
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.total)}</div>
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
              <CardTitle className="text-sm font-medium">Aguardando Aprovação</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.awaitingApproval)}</div>
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
                    <SelectItem value="PAID">Pago</SelectItem>
                    <SelectItem value="OVERDUE">Vencido</SelectItem>
                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Aprovação</Label>
                <Select value={filterApproval} onValueChange={setFilterApproval}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="PENDING">Aguardando</SelectItem>
                    <SelectItem value="APPROVED">Aprovado</SelectItem>
                    <SelectItem value="REJECTED">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Contas a Pagar</CardTitle>
            <CardDescription>Lista de despesas e pagamentos</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : payables && payables.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aprovação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payables.map((payable) => (
                    <TableRow key={payable.id}>
                      <TableCell>{formatDate(payable.dueDate)}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate">{payable.description}</div>
                        {payable.installmentNumber && payable.totalInstallments && (
                          <span className="text-xs text-muted-foreground">
                            Parcela {payable.installmentNumber}/{payable.totalInstallments}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getCategoryLabel(payable.category)}</TableCell>
                      <TableCell>{payable.supplier?.name || "-"}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(payable.amount)}</TableCell>
                      <TableCell>{getStatusBadge(payable.status)}</TableCell>
                      <TableCell>{getApprovalBadge(payable.approvalStatus)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {payable.approvalStatus === "PENDING" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => approveMutation.mutate({ id: payable.id })}
                                disabled={approveMutation.isPending}
                                title="Aprovar"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => rejectMutation.mutate({ id: payable.id })}
                                disabled={rejectMutation.isPending}
                                title="Rejeitar"
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          {payable.approvalStatus === "APPROVED" && payable.status !== "PAID" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openPayDialog(payable)}
                              title="Pagar"
                            >
                              <DollarSign className="h-4 w-4 text-green-600" />
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
                Nenhuma conta a pagar encontrada
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Pay Dialog */}
        <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
              <DialogDescription>
                {selectedPayable?.description}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Valor a Pagar *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={payData.amount}
                  onChange={(e) => setPayData({ ...payData, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Forma de Pagamento *</Label>
                <Select value={payData.paymentMethod} onValueChange={(v) => setPayData({ ...payData, paymentMethod: v })}>
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
                  value={payData.bankAccount}
                  onChange={(e) => setPayData({ ...payData, bankAccount: e.target.value })}
                  placeholder="Ex: Banco do Brasil - CC"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handlePay} disabled={payMutation.isPending}>
                {payMutation.isPending ? "Processando..." : "Confirmar Pagamento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
