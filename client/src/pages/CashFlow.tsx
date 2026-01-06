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
import { Plus, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, CheckCircle, Filter, Calendar } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const incomeCategories = [
  { value: "SALES", label: "Vendas" },
  { value: "RECEIVABLES", label: "Recebíveis" },
  { value: "OTHER_INCOME", label: "Outras Receitas" },
];

const expenseCategories = [
  { value: "SUPPLIERS", label: "Fornecedores" },
  { value: "FREIGHT", label: "Frete" },
  { value: "SALARY", label: "Salários" },
  { value: "RENT", label: "Aluguel" },
  { value: "UTILITIES", label: "Utilidades" },
  { value: "MARKETING", label: "Marketing" },
  { value: "TAX", label: "Impostos" },
  { value: "FEES", label: "Taxas" },
  { value: "OTHER_EXPENSE", label: "Outras Despesas" },
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

export default function CashFlow() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterUnitId, setFilterUnitId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  const [formData, setFormData] = useState({
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    category: "",
    subcategory: "",
    description: "",
    amount: "",
    transactionDate: new Date().toISOString().split("T")[0],
    unitId: "",
    costCenterId: "",
    paymentMethod: "",
    bankAccount: "",
    isProjected: false,
    notes: "",
  });

  const utils = trpc.useUtils();
  
  const { data: cashFlowEntries, isLoading } = trpc.cashFlow.list.useQuery({
    type: filterType || undefined,
    category: filterCategory || undefined,
    unitId: filterUnitId ? parseInt(filterUnitId) : undefined,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    limit: 500,
  });
  
  const { data: summary } = trpc.cashFlow.summary.useQuery({
    unitId: filterUnitId ? parseInt(filterUnitId) : undefined,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });
  
  const { data: units } = trpc.storeUnits.list.useQuery();
  const { data: costCenters } = trpc.costCenters.list.useQuery();
  
  const createMutation = trpc.cashFlow.create.useMutation({
    onSuccess: () => {
      toast.success("Lançamento criado com sucesso!");
      setIsDialogOpen(false);
      resetForm();
      utils.cashFlow.list.invalidate();
      utils.cashFlow.summary.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const reconcileMutation = trpc.cashFlow.reconcile.useMutation({
    onSuccess: () => {
      toast.success("Lançamento conciliado!");
      utils.cashFlow.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      type: "EXPENSE",
      category: "",
      subcategory: "",
      description: "",
      amount: "",
      transactionDate: new Date().toISOString().split("T")[0],
      unitId: "",
      costCenterId: "",
      paymentMethod: "",
      bankAccount: "",
      isProjected: false,
      notes: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.category || !formData.description || !formData.amount) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    
    createMutation.mutate({
      type: formData.type,
      category: formData.category as any,
      subcategory: formData.subcategory || undefined,
      description: formData.description,
      amount: formData.amount,
      transactionDate: new Date(formData.transactionDate),
      unitId: formData.unitId ? parseInt(formData.unitId) : undefined,
      costCenterId: formData.costCenterId ? parseInt(formData.costCenterId) : undefined,
      paymentMethod: formData.paymentMethod as any || undefined,
      bankAccount: formData.bankAccount || undefined,
      isProjected: formData.isProjected,
      notes: formData.notes || undefined,
    });
  };

  const getCategoryLabel = (category: string) => {
    const allCategories = [...incomeCategories, ...expenseCategories];
    return allCategories.find(c => c.value === category)?.label || category;
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fluxo de Caixa</h1>
            <p className="text-muted-foreground">Controle de entradas e saídas financeiras</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Lançamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Lançamento</DialogTitle>
                <DialogDescription>Registre uma entrada ou saída no fluxo de caixa</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as any, category: "" })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INCOME">Entrada</SelectItem>
                        <SelectItem value="EXPENSE">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria *</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(formData.type === "INCOME" ? incomeCategories : expenseCategories).map((cat) => (
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
                    placeholder="Descrição do lançamento"
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
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={formData.transactionDate}
                      onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Unidade</Label>
                    <Select value={formData.unitId} onValueChange={(v) => setFormData({ ...formData, unitId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas</SelectItem>
                        {units?.map((unit: { id: number; name: string }) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>{unit.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Centro de Custo</Label>
                    <Select value={formData.costCenterId} onValueChange={(v) => setFormData({ ...formData, costCenterId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {costCenters?.map((cc) => (
                          <SelectItem key={cc.id} value={cc.id.toString()}>{cc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Label>Conta Bancária</Label>
                    <Input
                      value={formData.bankAccount}
                      onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                      placeholder="Ex: Banco do Brasil - CC"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isProjected"
                    checked={formData.isProjected}
                    onChange={(e) => setFormData({ ...formData, isProjected: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isProjected">Lançamento Projetado (futuro)</Label>
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
              <CardTitle className="text-sm font-medium">Entradas</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary?.income || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saídas</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary?.expense || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(summary?.balance || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(summary?.balance || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lançamentos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cashFlowEntries?.length || 0}</div>
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
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="INCOME">Entradas</SelectItem>
                    <SelectItem value="EXPENSE">Saídas</SelectItem>
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
                    {[...incomeCategories, ...expenseCategories].map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={filterUnitId} onValueChange={setFilterUnitId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {units?.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>{unit.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              
              <div className="space-y-2">
                <Label>Data Final</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* By Category Summary */}
        {summary?.byCategory && summary.byCategory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resumo por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {summary.byCategory.map((cat) => (
                  <div key={cat.category} className="p-4 border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground">{getCategoryLabel(cat.category)}</p>
                    <div className="mt-2 space-y-1">
                      {cat.income > 0 && (
                        <p className="text-sm text-green-600">+ {formatCurrency(cat.income)}</p>
                      )}
                      {cat.expense > 0 && (
                        <p className="text-sm text-red-600">- {formatCurrency(cat.expense)}</p>
                      )}
                      <p className={`text-sm font-medium ${cat.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                        = {formatCurrency(cat.balance)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lançamentos</CardTitle>
            <CardDescription>Lista de movimentações financeiras</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : cashFlowEntries && cashFlowEntries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashFlowEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDate(entry.transactionDate)}</TableCell>
                      <TableCell>
                        <Badge variant={entry.type === "INCOME" ? "default" : "destructive"}>
                          {entry.type === "INCOME" ? "Entrada" : "Saída"}
                        </Badge>
                      </TableCell>
                      <TableCell>{getCategoryLabel(entry.category)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{entry.description}</TableCell>
                      <TableCell className={`text-right font-medium ${entry.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                        {entry.type === "INCOME" ? "+" : "-"} {formatCurrency(entry.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {entry.isProjected && (
                            <Badge variant="outline">Projetado</Badge>
                          )}
                          {entry.isReconciled ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Conciliado
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pendente</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {!entry.isReconciled && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => reconcileMutation.mutate({ id: entry.id })}
                            disabled={reconcileMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum lançamento encontrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
