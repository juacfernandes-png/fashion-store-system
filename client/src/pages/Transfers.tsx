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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, ArrowRight, Check, X, Truck, Package, Eye, Clock, CheckCircle2, XCircle, Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  DRAFT: { label: "Rascunho", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", icon: Clock },
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", icon: Clock },
  APPROVED: { label: "Aprovada", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", icon: CheckCircle2 },
  IN_TRANSIT: { label: "Em Trânsito", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300", icon: Truck },
  RECEIVED: { label: "Recebida", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", icon: Check },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", icon: XCircle },
};

export default function Transfers() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [formData, setFormData] = useState({
    fromUnitId: "",
    toUnitId: "",
    notes: "",
    items: [] as { productId: number; variantId?: number; requestedQuantity: number; productName?: string }[],
  });
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const utils = trpc.useUtils();
  const { data: transfers, isLoading } = trpc.transfers.list.useQuery({});
  const { data: units } = trpc.storeUnits.list.useQuery({});
  const { data: products } = trpc.products.list.useQuery();
  const { data: transferDetails } = trpc.transfers.getById.useQuery(
    { id: selectedTransfer?.id },
    { enabled: !!selectedTransfer }
  );

  const createMutation = trpc.transfers.create.useMutation({
    onSuccess: () => {
      toast.success("Transferência criada com sucesso!");
      utils.transfers.list.invalidate();
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao criar transferência: ${error.message}`);
    },
  });

  const approveMutation = trpc.transfers.approve.useMutation({
    onSuccess: () => {
      toast.success("Transferência aprovada!");
      utils.transfers.list.invalidate();
      utils.transfers.getById.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar: ${error.message}`);
    },
  });

  const shipMutation = trpc.transfers.ship.useMutation({
    onSuccess: () => {
      toast.success("Transferência enviada!");
      utils.transfers.list.invalidate();
      utils.transfers.getById.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao enviar: ${error.message}`);
    },
  });

  const receiveMutation = trpc.transfers.receive.useMutation({
    onSuccess: () => {
      toast.success("Transferência recebida!");
      utils.transfers.list.invalidate();
      utils.transfers.getById.invalidate();
      setSelectedTransfer(null);
    },
    onError: (error) => {
      toast.error(`Erro ao receber: ${error.message}`);
    },
  });

  const cancelMutation = trpc.transfers.cancel.useMutation({
    onSuccess: () => {
      toast.success("Transferência cancelada!");
      utils.transfers.list.invalidate();
      utils.transfers.getById.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao cancelar: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      fromUnitId: "",
      toUnitId: "",
      notes: "",
      items: [],
    });
    setSelectedProductId("");
    setSelectedQuantity(1);
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
        requestedQuantity: selectedQuantity,
        productName: product.name,
      }],
    });
    setSelectedProductId("");
    setSelectedQuantity(1);
  };

  const removeItem = (productId: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter(i => i.productId !== productId),
    });
  };

  const handleCreate = () => {
    if (!formData.fromUnitId || !formData.toUnitId) {
      toast.error("Selecione as unidades de origem e destino");
      return;
    }
    if (formData.fromUnitId === formData.toUnitId) {
      toast.error("As unidades de origem e destino devem ser diferentes");
      return;
    }
    if (formData.items.length === 0) {
      toast.error("Adicione pelo menos um item");
      return;
    }

    createMutation.mutate({
      fromUnitId: parseInt(formData.fromUnitId),
      toUnitId: parseInt(formData.toUnitId),
      notes: formData.notes || undefined,
      items: formData.items.map(i => ({
        productId: i.productId,
        variantId: i.variantId,
        requestedQuantity: i.requestedQuantity,
      })),
    });
  };

  const handleReceive = () => {
    if (!transferDetails) return;
    receiveMutation.mutate({
      id: transferDetails.id,
      items: transferDetails.items.map((item: any) => ({
        itemId: item.id,
        receivedQuantity: item.shippedQuantity,
      })),
    });
  };

  const pendingCount = transfers?.filter(t => t.status === "PENDING").length || 0;
  const inTransitCount = transfers?.filter(t => t.status === "IN_TRANSIT").length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Transferências</h1>
            <p className="text-muted-foreground">Gerencie transferências de estoque entre unidades</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Transferência
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Nova Transferência</DialogTitle>
                <DialogDescription>Solicite uma transferência de produtos entre unidades</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Unidade de Origem *</Label>
                    <Select value={formData.fromUnitId} onValueChange={(v) => setFormData({ ...formData, fromUnitId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {units?.map(unit => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.name} ({unit.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade de Destino *</Label>
                    <Select value={formData.toUnitId} onValueChange={(v) => setFormData({ ...formData, toUnitId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {units?.filter(u => u.id.toString() !== formData.fromUnitId).map(unit => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.name} ({unit.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observações sobre a transferência..."
                    rows={2}
                  />
                </div>

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
                      className="w-24"
                      placeholder="Qtd"
                    />
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
                          <TableHead className="text-right">Quantidade</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.items.map((item) => (
                          <TableRow key={item.productId}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell className="text-right">{item.requestedQuantity}</TableCell>
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
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Transferência"}
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
              <p className="text-xs text-muted-foreground">aguardando aprovação</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Trânsito</CardTitle>
              <Truck className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inTransitCount}</div>
              <p className="text-xs text-muted-foreground">em transporte</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recebidas (Mês)</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {transfers?.filter(t => t.status === "RECEIVED").length || 0}
              </div>
              <p className="text-xs text-muted-foreground">concluídas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transfers?.length || 0}</div>
              <p className="text-xs text-muted-foreground">transferências</p>
            </CardContent>
          </Card>
        </div>

        {/* Transfers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Transferências</CardTitle>
            <CardDescription>Todas as transferências entre unidades</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="pending">Pendentes</TabsTrigger>
                <TabsTrigger value="transit">Em Trânsito</TabsTrigger>
                <TabsTrigger value="completed">Concluídas</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                <TransferTable 
                  transfers={transfers || []} 
                  isLoading={isLoading}
                  onView={setSelectedTransfer}
                  onApprove={(id) => approveMutation.mutate({ id })}
                  onShip={(id) => shipMutation.mutate({ id })}
                  onCancel={(id) => cancelMutation.mutate({ id })}
                />
              </TabsContent>
              <TabsContent value="pending" className="mt-4">
                <TransferTable 
                  transfers={transfers?.filter(t => t.status === "PENDING") || []} 
                  isLoading={isLoading}
                  onView={setSelectedTransfer}
                  onApprove={(id) => approveMutation.mutate({ id })}
                  onShip={(id) => shipMutation.mutate({ id })}
                  onCancel={(id) => cancelMutation.mutate({ id })}
                />
              </TabsContent>
              <TabsContent value="transit" className="mt-4">
                <TransferTable 
                  transfers={transfers?.filter(t => t.status === "IN_TRANSIT") || []} 
                  isLoading={isLoading}
                  onView={setSelectedTransfer}
                  onApprove={(id) => approveMutation.mutate({ id })}
                  onShip={(id) => shipMutation.mutate({ id })}
                  onCancel={(id) => cancelMutation.mutate({ id })}
                />
              </TabsContent>
              <TabsContent value="completed" className="mt-4">
                <TransferTable 
                  transfers={transfers?.filter(t => t.status === "RECEIVED" || t.status === "CANCELLED") || []} 
                  isLoading={isLoading}
                  onView={setSelectedTransfer}
                  onApprove={(id) => approveMutation.mutate({ id })}
                  onShip={(id) => shipMutation.mutate({ id })}
                  onCancel={(id) => cancelMutation.mutate({ id })}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Transfer Details Dialog */}
        <Dialog open={!!selectedTransfer} onOpenChange={(open) => !open && setSelectedTransfer(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Transferência</DialogTitle>
              <DialogDescription>
                {transferDetails?.transferNumber}
              </DialogDescription>
            </DialogHeader>
            {transferDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Origem</Label>
                    <p className="font-medium">{transferDetails.fromUnit?.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Destino</Label>
                    <p className="font-medium">{transferDetails.toUnit?.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge className={statusConfig[transferDetails.status as keyof typeof statusConfig]?.color}>
                        {statusConfig[transferDetails.status as keyof typeof statusConfig]?.label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Data da Solicitação</Label>
                    <p className="font-medium">
                      {format(new Date(transferDetails.requestedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {transferDetails.notes && (
                  <div>
                    <Label className="text-muted-foreground">Observações</Label>
                    <p className="text-sm">{transferDetails.notes}</p>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground">Itens</Label>
                  <Table className="mt-2">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Solicitado</TableHead>
                        <TableHead className="text-right">Enviado</TableHead>
                        <TableHead className="text-right">Recebido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transferDetails.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product?.name || `Produto #${item.productId}`}</TableCell>
                          <TableCell className="text-right">{item.requestedQuantity}</TableCell>
                          <TableCell className="text-right">{item.shippedQuantity}</TableCell>
                          <TableCell className="text-right">{item.receivedQuantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            <DialogFooter>
              {transferDetails?.status === "PENDING" && (
                <>
                  <Button variant="destructive" onClick={() => cancelMutation.mutate({ id: transferDetails.id })}>
                    Cancelar
                  </Button>
                  <Button onClick={() => approveMutation.mutate({ id: transferDetails.id })}>
                    Aprovar
                  </Button>
                </>
              )}
              {transferDetails?.status === "APPROVED" && (
                <Button onClick={() => shipMutation.mutate({ id: transferDetails.id })}>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar
                </Button>
              )}
              {transferDetails?.status === "IN_TRANSIT" && (
                <Button onClick={handleReceive}>
                  <Check className="mr-2 h-4 w-4" />
                  Confirmar Recebimento
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedTransfer(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function TransferTable({ 
  transfers, 
  isLoading, 
  onView, 
  onApprove, 
  onShip, 
  onCancel 
}: { 
  transfers: any[]; 
  isLoading: boolean;
  onView: (transfer: any) => void;
  onApprove: (id: number) => void;
  onShip: (id: number) => void;
  onCancel: (id: number) => void;
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
          <TableHead>Origem</TableHead>
          <TableHead></TableHead>
          <TableHead>Destino</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transfers.map((transfer) => {
          const config = statusConfig[transfer.status as keyof typeof statusConfig];
          const Icon = config?.icon || Clock;
          return (
            <TableRow key={transfer.id}>
              <TableCell className="font-mono">{transfer.transferNumber}</TableCell>
              <TableCell>{transfer.fromUnit?.name || "-"}</TableCell>
              <TableCell>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </TableCell>
              <TableCell>{transfer.toUnit?.name || "-"}</TableCell>
              <TableCell>
                {format(new Date(transfer.requestedAt), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell>
                <Badge className={config?.color}>
                  <Icon className="mr-1 h-3 w-3" />
                  {config?.label}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onView(transfer)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {transfer.status === "PENDING" && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => onApprove(transfer.id)}>
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onCancel(transfer.id)}>
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                  {transfer.status === "APPROVED" && (
                    <Button variant="ghost" size="icon" onClick={() => onShip(transfer.id)}>
                      <Send className="h-4 w-4 text-purple-600" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
        {transfers.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
              Nenhuma transferência encontrada
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
