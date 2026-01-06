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
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Search, Eye, Truck, Check, X, Clock, Package, FileText } from "lucide-react";
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

interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitCost: string;
  total: string;
}

export default function Purchases() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [itemCost, setItemCost] = useState("");
  
  const utils = trpc.useUtils();
  
  const { data: orders, isLoading } = trpc.purchaseOrders.list.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined
  });
  
  const { data: suppliers } = trpc.suppliers.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  
  const { data: orderDetails } = trpc.purchaseOrders.getById.useQuery(
    { id: selectedOrder! },
    { enabled: !!selectedOrder && isViewOpen }
  );
  
  const createOrder = trpc.purchaseOrders.create.useMutation({
    onSuccess: () => {
      toast.success("Pedido de compra criado com sucesso!");
      utils.purchaseOrders.list.invalidate();
      setIsCreateOpen(false);
      setOrderItems([]);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar pedido");
    }
  });
  
  const updateStatus = trpc.purchaseOrders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      utils.purchaseOrders.list.invalidate();
      utils.purchaseOrders.getById.invalidate();
      utils.products.list.invalidate();
      utils.stock.movements.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status");
    }
  });

  const addItem = () => {
    if (!selectedProductId || !itemCost) return;
    
    const product = products?.find(p => p.id === parseInt(selectedProductId));
    if (!product) return;
    
    const quantity = parseInt(itemQuantity) || 1;
    const cost = parseFloat(itemCost) || 0;
    const total = cost * quantity;
    
    setOrderItems([...orderItems, {
      productId: product.id,
      productName: product.name,
      quantity,
      unitCost: cost.toString(),
      total: total.toString()
    }]);
    
    setSelectedProductId("");
    setItemQuantity("1");
    setItemCost("");
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + parseFloat(item.total), 0);
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (orderItems.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido");
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    
    createOrder.mutate({
      supplierId: parseInt(formData.get("supplierId") as string),
      expectedDate: formData.get("expectedDate") ? new Date(formData.get("expectedDate") as string) : undefined,
      notes: formData.get("notes") as string || undefined,
      items: orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
      }))
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "DRAFT":
        return { label: "Rascunho", icon: FileText, variant: "secondary" as const };
      case "PENDING":
        return { label: "Pendente", icon: Clock, variant: "secondary" as const };
      case "APPROVED":
        return { label: "Aprovado", icon: Check, variant: "default" as const };
      case "ORDERED":
        return { label: "Pedido Enviado", icon: Truck, variant: "default" as const };
      case "RECEIVED":
        return { label: "Recebido", icon: Package, variant: "default" as const };
      case "CANCELLED":
        return { label: "Cancelado", icon: X, variant: "destructive" as const };
      default:
        return { label: status, icon: Clock, variant: "secondary" as const };
    }
  };

  const filteredOrders = orders?.filter(order => {
    if (search) {
      const searchLower = search.toLowerCase();
      return order.orderNumber.toLowerCase().includes(searchLower) ||
             order.supplier?.name.toLowerCase().includes(searchLower);
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Compras</h1>
            <p className="text-muted-foreground">
              Gerencie seus pedidos de compra
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Compra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Compra</DialogTitle>
                <DialogDescription>
                  Crie um novo pedido de compra
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplierId">Fornecedor *</Label>
                    <Select name="supplierId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers?.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectedDate">Data Prevista</Label>
                    <Input id="expectedDate" name="expectedDate" type="date" />
                  </div>
                </div>
                
                {/* Add Items */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Itens do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione o produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map(product => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} (Est: {product.currentStock})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="1"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        className="w-20"
                        placeholder="Qtd"
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={itemCost}
                        onChange={(e) => setItemCost(e.target.value)}
                        className="w-28"
                        placeholder="Custo"
                      />
                      <Button type="button" onClick={addItem}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {orderItems.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead className="text-center">Qtd</TableHead>
                            <TableHead className="text-right">Custo Unit.</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell className="text-center">{item.quantity}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.unitCost)}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-bold">Total:</TableCell>
                            <TableCell className="text-right font-bold text-lg">
                              {formatCurrency(calculateTotal())}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea id="notes" name="notes" placeholder="Observações do pedido" />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createOrder.isPending || orderItems.length === 0}>
                    {createOrder.isPending ? "Salvando..." : "Criar Pedido"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número ou fornecedor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="DRAFT">Rascunho</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="APPROVED">Aprovado</SelectItem>
                  <SelectItem value="ORDERED">Pedido Enviado</SelectItem>
                  <SelectItem value="RECEIVED">Recebido</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredOrders && filteredOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Previsão</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map(order => {
                    const statusInfo = getStatusInfo(order.status);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                          {format(new Date(order.orderDate), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{order.supplier?.name || '-'}</TableCell>
                        <TableCell>
                          {order.expectedDate 
                            ? format(new Date(order.expectedDate), "dd/MM/yyyy", { locale: ptBR })
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(order.total)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={statusInfo.variant}>
                            <statusInfo.icon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedOrder(order.id);
                              setIsViewOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum pedido encontrado</h3>
                <p className="text-muted-foreground">
                  Comece criando seu primeiro pedido de compra
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Order Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Pedido de Compra</DialogTitle>
            </DialogHeader>
            {orderDetails && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{orderDetails.orderNumber}</p>
                    <p className="text-muted-foreground">
                      {format(new Date(orderDetails.orderDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge variant={getStatusInfo(orderDetails.status).variant} className="text-base px-4 py-2">
                    {getStatusInfo(orderDetails.status).label}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Fornecedor</p>
                    <p className="font-medium">{orderDetails.supplier?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data Prevista</p>
                    <p className="font-medium">
                      {orderDetails.expectedDate 
                        ? format(new Date(orderDetails.expectedDate), "dd/MM/yyyy", { locale: ptBR })
                        : '-'}
                    </p>
                  </div>
                </div>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Itens do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead className="text-center">Qtd</TableHead>
                          <TableHead className="text-right">Custo Unit.</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderDetails.items?.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product?.name || '-'}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitCost)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(parseFloat(item.unitCost) * item.quantity)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end p-4 bg-primary/5 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Total do Pedido</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(orderDetails.total)}</p>
                  </div>
                </div>
                
                {orderDetails.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Observações</p>
                    <p className="font-medium">{orderDetails.notes}</p>
                  </div>
                )}
                
                {orderDetails.status !== "RECEIVED" && orderDetails.status !== "CANCELLED" && (
                  <div className="flex gap-2">
                    {orderDetails.status === "DRAFT" && (
                      <Button 
                        onClick={() => updateStatus.mutate({ id: orderDetails.id, status: "PENDING" })}
                        disabled={updateStatus.isPending}
                      >
                        Enviar para Aprovação
                      </Button>
                    )}
                    {orderDetails.status === "PENDING" && (
                      <>
                        <Button 
                          onClick={() => updateStatus.mutate({ id: orderDetails.id, status: "APPROVED" })}
                          disabled={updateStatus.isPending}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => updateStatus.mutate({ id: orderDetails.id, status: "CANCELLED" })}
                          disabled={updateStatus.isPending}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </>
                    )}
                    {orderDetails.status === "APPROVED" && (
                      <Button 
                        onClick={() => updateStatus.mutate({ id: orderDetails.id, status: "ORDERED" })}
                        disabled={updateStatus.isPending}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Marcar como Enviado
                      </Button>
                    )}
                    {orderDetails.status === "ORDERED" && (
                      <Button 
                        onClick={() => updateStatus.mutate({ id: orderDetails.id, status: "RECEIVED" })}
                        disabled={updateStatus.isPending}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Confirmar Recebimento
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
