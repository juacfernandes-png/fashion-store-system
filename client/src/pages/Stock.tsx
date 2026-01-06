import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, ArrowUpCircle, ArrowDownCircle, AlertTriangle, Bell, BellOff, Package, Boxes, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatCurrency(value: string | number) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num);
}

export default function Stock() {
  const [isMovementOpen, setIsMovementOpen] = useState(false);
  const [movementType, setMovementType] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
  
  const utils = trpc.useUtils();
  
  const { data: products } = trpc.products.list.useQuery();
  const { data: movements, isLoading: movementsLoading } = trpc.stock.movements.useQuery();
  const { data: alerts, isLoading: alertsLoading } = trpc.stock.alerts.useQuery({ unreadOnly: false });
  const { data: lowStock } = trpc.reports.lowStock.useQuery();
  const { data: highStock } = trpc.reports.highStock.useQuery();
  
  const addMovement = trpc.stock.addMovement.useMutation({
    onSuccess: () => {
      toast.success("Movimentação registrada com sucesso!");
      utils.stock.movements.invalidate();
      utils.products.list.invalidate();
      utils.stock.alerts.invalidate();
      setIsMovementOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar movimentação");
    }
  });
  
  const markAlertRead = trpc.stock.markAlertRead.useMutation({
    onSuccess: () => {
      utils.stock.alerts.invalidate();
    }
  });
  
  const sendNotification = trpc.stock.sendAlertNotification.useMutation({
    onSuccess: () => {
      toast.success("Notificação enviada com sucesso!");
      utils.stock.alerts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar notificação");
    }
  });

  const handleMovement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    addMovement.mutate({
      productId: parseInt(formData.get("productId") as string),
      type: movementType,
      reason: formData.get("reason") as any,
      quantity: parseInt(formData.get("quantity") as string),
      unitCost: formData.get("unitCost") as string || undefined,
      batch: formData.get("batch") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    });
  };

  const getMovementTypeInfo = (type: string) => {
    switch (type) {
      case "IN":
        return { label: "Entrada", icon: ArrowUpCircle, color: "text-green-600" };
      case "OUT":
        return { label: "Saída", icon: ArrowDownCircle, color: "text-red-600" };
      default:
        return { label: "Ajuste", icon: Package, color: "text-blue-600" };
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      PURCHASE: "Compra",
      SALE: "Venda",
      RETURN: "Devolução",
      LOSS: "Perda",
      ADJUSTMENT: "Ajuste",
      TRANSFER: "Transferência"
    };
    return labels[reason] || reason;
  };

  const getAlertTypeInfo = (type: string) => {
    switch (type) {
      case "LOW_STOCK":
        return { label: "Estoque Baixo", variant: "destructive" as const };
      case "HIGH_STOCK":
        return { label: "Estoque Alto", variant: "secondary" as const };
      case "OUT_OF_STOCK":
        return { label: "Sem Estoque", variant: "destructive" as const };
      default:
        return { label: type, variant: "default" as const };
    }
  };

  const unreadAlerts = alerts?.filter(a => !a.isRead) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestão de Estoque</h1>
            <p className="text-muted-foreground">
              Controle de movimentações e alertas de estoque
            </p>
          </div>
          <Dialog open={isMovementOpen} onOpenChange={setIsMovementOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
                <DialogDescription>
                  Registre uma entrada, saída ou ajuste de estoque
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleMovement} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Movimentação</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={movementType === "IN" ? "default" : "outline"}
                      onClick={() => setMovementType("IN")}
                      className="flex-1"
                    >
                      <ArrowUpCircle className="h-4 w-4 mr-2" />
                      Entrada
                    </Button>
                    <Button
                      type="button"
                      variant={movementType === "OUT" ? "default" : "outline"}
                      onClick={() => setMovementType("OUT")}
                      className="flex-1"
                    >
                      <ArrowDownCircle className="h-4 w-4 mr-2" />
                      Saída
                    </Button>
                    <Button
                      type="button"
                      variant={movementType === "ADJUSTMENT" ? "default" : "outline"}
                      onClick={() => setMovementType("ADJUSTMENT")}
                      className="flex-1"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Ajuste
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="productId">Produto *</Label>
                  <Select name="productId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map(product => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.code} - {product.name} (Atual: {product.currentStock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo *</Label>
                  <Select name="reason" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {movementType === "IN" && (
                        <>
                          <SelectItem value="PURCHASE">Compra</SelectItem>
                          <SelectItem value="RETURN">Devolução</SelectItem>
                          <SelectItem value="TRANSFER">Transferência</SelectItem>
                        </>
                      )}
                      {movementType === "OUT" && (
                        <>
                          <SelectItem value="SALE">Venda</SelectItem>
                          <SelectItem value="LOSS">Perda</SelectItem>
                          <SelectItem value="TRANSFER">Transferência</SelectItem>
                        </>
                      )}
                      {movementType === "ADJUSTMENT" && (
                        <SelectItem value="ADJUSTMENT">Ajuste de Inventário</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade *</Label>
                    <Input id="quantity" name="quantity" type="number" min="1" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitCost">Custo Unitário</Label>
                    <Input id="unitCost" name="unitCost" type="number" step="0.01" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="batch">Lote</Label>
                  <Input id="batch" name="batch" placeholder="Número do lote" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Input id="notes" name="notes" placeholder="Observações adicionais" />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsMovementOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={addMovement.isPending}>
                    {addMovement.isPending ? "Salvando..." : "Registrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entradas Hoje</p>
                  <p className="text-2xl font-bold">
                    {movements?.filter(m => 
                      m.type === "IN" && 
                      new Date(m.createdAt).toDateString() === new Date().toDateString()
                    ).reduce((sum, m) => sum + m.quantity, 0) || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saídas Hoje</p>
                  <p className="text-2xl font-bold">
                    {movements?.filter(m => 
                      m.type === "OUT" && 
                      new Date(m.createdAt).toDateString() === new Date().toDateString()
                    ).reduce((sum, m) => sum + m.quantity, 0) || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                  <p className="text-2xl font-bold">{lowStock?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Boxes className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estoque Alto</p>
                  <p className="text-2xl font-bold">{highStock?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="movements" className="space-y-4">
          <TabsList>
            <TabsTrigger value="movements">Movimentações</TabsTrigger>
            <TabsTrigger value="alerts" className="relative">
              Alertas
              {unreadAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {unreadAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="low">Estoque Baixo</TabsTrigger>
            <TabsTrigger value="high">Estoque Alto</TabsTrigger>
          </TabsList>
          
          <TabsContent value="movements">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Movimentações</CardTitle>
                <CardDescription>Últimas movimentações de estoque</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {movementsLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : movements && movements.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead className="text-center">Quantidade</TableHead>
                        <TableHead className="text-center">Estoque</TableHead>
                        <TableHead>Lote</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.slice(0, 50).map(movement => {
                        const typeInfo = getMovementTypeInfo(movement.type);
                        const product = products?.find(p => p.id === movement.productId);
                        return (
                          <TableRow key={movement.id}>
                            <TableCell className="text-sm">
                              {format(new Date(movement.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <div className={`flex items-center gap-2 ${typeInfo.color}`}>
                                <typeInfo.icon className="h-4 w-4" />
                                {typeInfo.label}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{product?.name || '-'}</p>
                                <p className="text-sm text-muted-foreground">{product?.code}</p>
                              </div>
                            </TableCell>
                            <TableCell>{getReasonLabel(movement.reason)}</TableCell>
                            <TableCell className="text-center font-medium">
                              {movement.type === "IN" ? "+" : movement.type === "OUT" ? "-" : ""}{movement.quantity}
                            </TableCell>
                            <TableCell className="text-center">
                              {movement.previousStock} → {movement.newStock}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {movement.batch || '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Boxes className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhuma movimentação</h3>
                    <p className="text-muted-foreground">
                      Registre sua primeira movimentação de estoque
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Alertas de Estoque</CardTitle>
                <CardDescription>Produtos que precisam de atenção</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {alertsLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : alerts && alerts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-center">Estoque Atual</TableHead>
                        <TableHead className="text-center">Limite</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alerts.map(alert => {
                        const alertInfo = getAlertTypeInfo(alert.alertType);
                        return (
                          <TableRow key={alert.id} className={!alert.isRead ? "bg-amber-50" : ""}>
                            <TableCell className="text-sm">
                              {format(new Date(alert.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{alert.product?.name || '-'}</p>
                                <p className="text-sm text-muted-foreground">{alert.product?.code}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={alertInfo.variant}>{alertInfo.label}</Badge>
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {alert.currentStock}
                            </TableCell>
                            <TableCell className="text-center">
                              {alert.threshold}
                            </TableCell>
                            <TableCell className="text-center">
                              {alert.isNotified ? (
                                <Badge variant="outline" className="text-green-600">
                                  <Bell className="h-3 w-3 mr-1" />
                                  Notificado
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  <BellOff className="h-3 w-3 mr-1" />
                                  Pendente
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {!alert.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAlertRead.mutate({ id: alert.id })}
                                  >
                                    Marcar como lido
                                  </Button>
                                )}
                                {!alert.isNotified && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => sendNotification.mutate({ alertId: alert.id })}
                                    disabled={sendNotification.isPending}
                                  >
                                    <Bell className="h-4 w-4 mr-1" />
                                    Notificar
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhum alerta</h3>
                    <p className="text-muted-foreground">
                      Todos os produtos estão com estoque adequado
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="low">
            <Card>
              <CardHeader>
                <CardTitle>Produtos com Estoque Baixo</CardTitle>
                <CardDescription>Produtos abaixo do nível mínimo configurado</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {lowStock && lowStock.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-center">Estoque Atual</TableHead>
                        <TableHead className="text-center">Mínimo</TableHead>
                        <TableHead className="text-center">Falta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStock.map(product => (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono">{product.code}</TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="text-center text-red-600 font-bold">
                            {product.currentStock}
                          </TableCell>
                          <TableCell className="text-center">{product.minStock}</TableCell>
                          <TableCell className="text-center text-red-600">
                            {product.minStock - product.currentStock}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhum produto com estoque baixo</h3>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="high">
            <Card>
              <CardHeader>
                <CardTitle>Produtos com Estoque Alto</CardTitle>
                <CardDescription>Produtos acima do nível máximo configurado</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {highStock && highStock.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-center">Estoque Atual</TableHead>
                        <TableHead className="text-center">Máximo</TableHead>
                        <TableHead className="text-center">Excesso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {highStock.map(product => (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono">{product.code}</TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="text-center text-amber-600 font-bold">
                            {product.currentStock}
                          </TableCell>
                          <TableCell className="text-center">{product.maxStock}</TableCell>
                          <TableCell className="text-center text-amber-600">
                            +{product.currentStock - product.maxStock}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhum produto com estoque alto</h3>
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
