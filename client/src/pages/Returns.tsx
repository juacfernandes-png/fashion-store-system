import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, RotateCcw, RefreshCw, Eye, Clock, CheckCircle2, XCircle, Package, DollarSign, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", icon: Clock },
  APPROVED: { label: "Aprovada", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", icon: CheckCircle2 },
  REJECTED: { label: "Rejeitada", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", icon: XCircle },
  COMPLETED: { label: "Concluída", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", icon: CheckCircle2 },
};

const typeConfig = {
  RETURN: { label: "Devolução", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300", icon: RotateCcw },
  EXCHANGE: { label: "Troca", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300", icon: RefreshCw },
};

const reasonLabels = {
  DEFECT: "Defeito de Fabricação",
  WRONG_SIZE: "Tamanho Errado",
  WRONG_COLOR: "Cor Errada",
  REGRET: "Arrependimento",
  DAMAGED: "Produto Danificado",
  OTHER: "Outro",
};

const conditionLabels = {
  NEW: "Novo",
  USED: "Usado",
  DAMAGED: "Danificado",
  DEFECTIVE: "Defeituoso",
};

export default function Returns() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [formData, setFormData] = useState({
    customerId: "",
    unitId: "",
    type: "RETURN" as "RETURN" | "EXCHANGE",
    reason: "DEFECT" as "DEFECT" | "WRONG_SIZE" | "WRONG_COLOR" | "REGRET" | "DAMAGED" | "OTHER",
    reasonDetails: "",
    refundAmount: "",
    refundMethod: "CASH" as "CASH" | "CREDIT" | "STORE_CREDIT" | "EXCHANGE",
    notes: "",
    items: [] as { productId: number; quantity: number; unitPrice: string; condition: "NEW" | "USED" | "DAMAGED" | "DEFECTIVE"; productName?: string }[],
  });
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedCondition, setSelectedCondition] = useState<"NEW" | "USED" | "DAMAGED" | "DEFECTIVE">("USED");
  const [returnToStock, setReturnToStock] = useState(true);

  const utils = trpc.useUtils();
  const { data: returns, isLoading } = trpc.returns.list.useQuery({});
  const { data: units } = trpc.storeUnits.list.useQuery({});
  const { data: customers } = trpc.customers.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  const { data: returnDetails } = trpc.returns.getById.useQuery(
    { id: selectedReturn?.id },
    { enabled: !!selectedReturn }
  );

  const createMutation = trpc.returns.create.useMutation({
    onSuccess: () => {
      toast.success("Devolução/Troca registrada com sucesso!");
      utils.returns.list.invalidate();
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao registrar: ${error.message}`);
    },
  });

  const approveMutation = trpc.returns.approve.useMutation({
    onSuccess: () => {
      toast.success("Devolução/Troca aprovada!");
      utils.returns.list.invalidate();
      utils.returns.getById.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar: ${error.message}`);
    },
  });

  const rejectMutation = trpc.returns.reject.useMutation({
    onSuccess: () => {
      toast.success("Devolução/Troca rejeitada!");
      utils.returns.list.invalidate();
      utils.returns.getById.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao rejeitar: ${error.message}`);
    },
  });

  const processMutation = trpc.returns.process.useMutation({
    onSuccess: () => {
      toast.success("Devolução/Troca processada com sucesso!");
      utils.returns.list.invalidate();
      utils.returns.getById.invalidate();
      setSelectedReturn(null);
    },
    onError: (error) => {
      toast.error(`Erro ao processar: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      customerId: "",
      unitId: "",
      type: "RETURN",
      reason: "DEFECT",
      reasonDetails: "",
      refundAmount: "",
      refundMethod: "CASH",
      notes: "",
      items: [],
    });
    setSelectedProductId("");
    setSelectedQuantity(1);
    setSelectedCondition("USED");
  };

  const addItem = () => {
    if (!selectedProductId) return;
    const product = products?.find(p => p.id === parseInt(selectedProductId));
    if (!product) return;

    if (formData.items.some(i => i.productId === product.id)) {
      toast.error("Produto já adicionado");
      return;
    }

    setFormData({
      ...formData,
      items: [...formData.items, {
        productId: product.id,
        quantity: selectedQuantity,
        unitPrice: product.salePrice,
        condition: selectedCondition,
        productName: product.name,
      }],
    });
    setSelectedProductId("");
    setSelectedQuantity(1);
    setSelectedCondition("USED");
  };

  const removeItem = (productId: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter(i => i.productId !== productId),
    });
  };

  const handleCreate = () => {
    if (formData.items.length === 0) {
      toast.error("Adicione pelo menos um item");
      return;
    }

    createMutation.mutate({
      customerId: formData.customerId ? parseInt(formData.customerId) : undefined,
      unitId: formData.unitId ? parseInt(formData.unitId) : undefined,
      type: formData.type,
      reason: formData.reason,
      reasonDetails: formData.reasonDetails || undefined,
      refundAmount: formData.refundAmount || undefined,
      refundMethod: formData.type === "RETURN" ? formData.refundMethod : undefined,
      notes: formData.notes || undefined,
      items: formData.items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        condition: i.condition,
      })),
    });
  };

  const totalRefund = formData.items.reduce((sum, item) => sum + (parseFloat(item.unitPrice) * item.quantity), 0);

  const pendingCount = returns?.filter(r => r.status === "PENDING").length || 0;
  const returnsCount = returns?.filter(r => r.type === "RETURN").length || 0;
  const exchangesCount = returns?.filter(r => r.type === "EXCHANGE").length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Trocas e Devoluções</h1>
            <p className="text-muted-foreground">Gerencie trocas e devoluções de produtos</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Devolução/Troca
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Devolução/Troca</DialogTitle>
                <DialogDescription>Registre uma devolução ou troca de produto</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RETURN">Devolução</SelectItem>
                        <SelectItem value="EXCHANGE">Troca</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Motivo *</Label>
                    <Select value={formData.reason} onValueChange={(v: any) => setFormData({ ...formData, reason: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DEFECT">Defeito de Fabricação</SelectItem>
                        <SelectItem value="WRONG_SIZE">Tamanho Errado</SelectItem>
                        <SelectItem value="WRONG_COLOR">Cor Errada</SelectItem>
                        <SelectItem value="REGRET">Arrependimento</SelectItem>
                        <SelectItem value="DAMAGED">Produto Danificado</SelectItem>
                        <SelectItem value="OTHER">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select value={formData.customerId} onValueChange={(v) => setFormData({ ...formData, customerId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customers?.map(customer => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade</Label>
                    <Select value={formData.unitId} onValueChange={(v) => setFormData({ ...formData, unitId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {units?.map(unit => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Detalhes do Motivo</Label>
                  <Textarea
                    value={formData.reasonDetails}
                    onChange={(e) => setFormData({ ...formData, reasonDetails: e.target.value })}
                    placeholder="Descreva os detalhes do motivo..."
                    rows={2}
                  />
                </div>

                {formData.type === "RETURN" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Método de Reembolso</Label>
                      <Select value={formData.refundMethod} onValueChange={(v: any) => setFormData({ ...formData, refundMethod: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">Dinheiro</SelectItem>
                          <SelectItem value="CREDIT">Cartão de Crédito</SelectItem>
                          <SelectItem value="STORE_CREDIT">Crédito na Loja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor do Reembolso</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.refundAmount || totalRefund.toFixed(2)}
                        onChange={(e) => setFormData({ ...formData, refundAmount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Adicionar Produtos</Label>
                  <div className="flex gap-2">
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione um produto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map(product => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.code} - {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                      className="w-20"
                      placeholder="Qtd"
                    />
                    <Select value={selectedCondition} onValueChange={(v: any) => setSelectedCondition(v)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">Novo</SelectItem>
                        <SelectItem value="USED">Usado</SelectItem>
                        <SelectItem value="DAMAGED">Danificado</SelectItem>
                        <SelectItem value="DEFECTIVE">Defeituoso</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" onClick={addItem} disabled={!selectedProductId}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {formData.items.length > 0 && (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Condição</TableHead>
                          <TableHead className="text-right">Qtd</TableHead>
                          <TableHead className="text-right">Valor Unit.</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.items.map((item) => (
                          <TableRow key={item.productId}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{conditionLabels[item.condition]}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">R$ {parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                            <TableCell className="text-right">R$ {(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(item.productId)}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={4} className="text-right font-medium">Total:</TableCell>
                          <TableCell className="text-right font-bold">R$ {totalRefund.toFixed(2)}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observações adicionais..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Registrando..." : "Registrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">aguardando processamento</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devoluções</CardTitle>
              <RotateCcw className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{returnsCount}</div>
              <p className="text-xs text-muted-foreground">total de devoluções</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trocas</CardTitle>
              <RefreshCw className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exchangesCount}</div>
              <p className="text-xs text-muted-foreground">total de trocas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{returns?.length || 0}</div>
              <p className="text-xs text-muted-foreground">registros</p>
            </CardContent>
          </Card>
        </div>

        {/* Returns Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Trocas e Devoluções</CardTitle>
            <CardDescription>Todos os registros de trocas e devoluções</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="pending">Pendentes</TabsTrigger>
                <TabsTrigger value="returns">Devoluções</TabsTrigger>
                <TabsTrigger value="exchanges">Trocas</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                <ReturnsTable 
                  returns={returns || []} 
                  isLoading={isLoading}
                  onView={setSelectedReturn}
                />
              </TabsContent>
              <TabsContent value="pending" className="mt-4">
                <ReturnsTable 
                  returns={returns?.filter(r => r.status === "PENDING") || []} 
                  isLoading={isLoading}
                  onView={setSelectedReturn}
                />
              </TabsContent>
              <TabsContent value="returns" className="mt-4">
                <ReturnsTable 
                  returns={returns?.filter(r => r.type === "RETURN") || []} 
                  isLoading={isLoading}
                  onView={setSelectedReturn}
                />
              </TabsContent>
              <TabsContent value="exchanges" className="mt-4">
                <ReturnsTable 
                  returns={returns?.filter(r => r.type === "EXCHANGE") || []} 
                  isLoading={isLoading}
                  onView={setSelectedReturn}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Return Details Dialog */}
        <Dialog open={!!selectedReturn} onOpenChange={(open) => !open && setSelectedReturn(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da {returnDetails?.type === "RETURN" ? "Devolução" : "Troca"}</DialogTitle>
              <DialogDescription>
                {returnDetails?.returnNumber}
              </DialogDescription>
            </DialogHeader>
            {returnDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Tipo</Label>
                    <div className="mt-1">
                      <Badge className={typeConfig[returnDetails.type as keyof typeof typeConfig]?.color}>
                        {typeConfig[returnDetails.type as keyof typeof typeConfig]?.label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge className={statusConfig[returnDetails.status as keyof typeof statusConfig]?.color}>
                        {statusConfig[returnDetails.status as keyof typeof statusConfig]?.label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Motivo</Label>
                    <p className="font-medium">{reasonLabels[returnDetails.reason as keyof typeof reasonLabels]}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Data</Label>
                    <p className="font-medium">
                      {format(new Date(returnDetails.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {returnDetails.customer && (
                    <div>
                      <Label className="text-muted-foreground">Cliente</Label>
                      <p className="font-medium">{returnDetails.customer.name}</p>
                    </div>
                  )}
                  {returnDetails.unit && (
                    <div>
                      <Label className="text-muted-foreground">Unidade</Label>
                      <p className="font-medium">{returnDetails.unit.name}</p>
                    </div>
                  )}
                </div>

                {returnDetails.reasonDetails && (
                  <div>
                    <Label className="text-muted-foreground">Detalhes do Motivo</Label>
                    <p className="text-sm">{returnDetails.reasonDetails}</p>
                  </div>
                )}

                {returnDetails.type === "RETURN" && returnDetails.refundAmount && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <Label className="text-muted-foreground">Valor do Reembolso</Label>
                      <p className="font-bold text-lg">R$ {parseFloat(returnDetails.refundAmount).toFixed(2)}</p>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground">Itens</Label>
                  <Table className="mt-2">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Condição</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {returnDetails.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product?.name || `Produto #${item.productId}`}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{conditionLabels[item.condition as keyof typeof conditionLabels]}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">R$ {parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {returnDetails.status === "APPROVED" && (
                  <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                    <Switch
                      id="returnToStock"
                      checked={returnToStock}
                      onCheckedChange={setReturnToStock}
                    />
                    <Label htmlFor="returnToStock">Retornar itens ao estoque (exceto defeituosos/danificados)</Label>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              {returnDetails?.status === "PENDING" && (
                <>
                  <Button variant="destructive" onClick={() => rejectMutation.mutate({ id: returnDetails.id })}>
                    Rejeitar
                  </Button>
                  <Button onClick={() => approveMutation.mutate({ id: returnDetails.id })}>
                    Aprovar
                  </Button>
                </>
              )}
              {returnDetails?.status === "APPROVED" && (
                <Button onClick={() => processMutation.mutate({ id: returnDetails.id, returnToStock })}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Processar
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedReturn(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function ReturnsTable({ 
  returns, 
  isLoading, 
  onView 
}: { 
  returns: any[]; 
  isLoading: boolean;
  onView: (ret: any) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Motivo</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {returns.map((ret) => {
          const statusConf = statusConfig[ret.status as keyof typeof statusConfig];
          const typeConf = typeConfig[ret.type as keyof typeof typeConfig];
          const StatusIcon = statusConf?.icon || Clock;
          const TypeIcon = typeConf?.icon || RotateCcw;
          return (
            <TableRow key={ret.id}>
              <TableCell className="font-mono">{ret.returnNumber}</TableCell>
              <TableCell>
                <Badge className={typeConf?.color}>
                  <TypeIcon className="mr-1 h-3 w-3" />
                  {typeConf?.label}
                </Badge>
              </TableCell>
              <TableCell>{ret.customer?.name || "-"}</TableCell>
              <TableCell>{reasonLabels[ret.reason as keyof typeof reasonLabels]}</TableCell>
              <TableCell>
                {format(new Date(ret.createdAt), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell>
                <Badge className={statusConf?.color}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusConf?.label}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onView(ret)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
        {returns.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
              Nenhum registro encontrado
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
