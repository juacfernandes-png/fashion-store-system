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
import { Plus, Search, Eye, Trash2, ShoppingCart, Package, Check, X, Clock, Truck } from "lucide-react";
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
  unitPrice: string;
  discount: string;
  total: string;
}

export default function Sales() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [itemDiscount, setItemDiscount] = useState("0");
  
  const utils = trpc.useUtils();
  
  const { data: orders, isLoading } = trpc.salesOrders.list.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined
  });
  
  const { data: customers } = trpc.customers.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  
  const { data: orderDetails } = trpc.salesOrders.getById.useQuery(
    { id: selectedOrder! },
    { enabled: !!selectedOrder && isViewOpen }
  );
  
  const createOrder = trpc.salesOrders.create.useMutation({
    onSuccess: () => {
      toast.success("Pedido de venda criado com sucesso!");
      utils.salesOrders.list.invalidate();
      utils.products.list.invalidate();
      utils.stock.movements.invalidate();
      setIsCreateOpen(false);
      setOrderItems([]);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar pedido");
    }
  });
  
  const updateStatus = trpc.salesOrders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      utils.salesOrders.list.invalidate();
      utils.salesOrders.getById.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status");
    }
  });
  
  

  const addItem = () => {
    if (!selectedProductId) return;
    
    const product = products?.find(p => p.id === parseInt(selectedProductId));
    if (!product) return;
    
    const quantity = parseInt(itemQuantity) || 1;
    const discount = parseFloat(itemDiscount) || 0;
    const unitPrice = parseFloat(product.salePrice);
    const total = (unitPrice * quantity) - discount;
    
    setOrderItems([...orderItems, {
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: unitPrice.toString(),
      discount: discount.toString(),
      total: total.toString()
    }]);
    
    setSelectedProductId("");
    setItemQuantity("1");
    setItemDiscount("0");
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
      customerId: parseInt(formData.get("customerId") as string),
      paymentMethod: (formData.get("paymentMethod") as "CASH" | "CREDIT" | "DEBIT" | "PIX" | "TRANSFER" | "INSTALLMENT") || undefined,
      notes: formData.get("notes") as string || undefined,
      items: orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount
      }))
    });
  };

  

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PENDING":
        return { label: "Pendente", icon: Clock, variant: "secondary" as const };
      case "CONFIRMED":
        return { label: "Confirmado", icon: Check, variant: "default" as const };
      case "SHIPPED":
        return { label: "Enviado", icon: Truck, variant: "default" as const };
      case "DELIVERED":
        return { label: "Entregue", icon: Package, variant: "default" as const };
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
             order.customer?.name.toLowerCase().includes(searchLower);
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Vendas</h1>
            <p className="text-muted-foreground">
              Gerencie seus pedidos de venda
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Venda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Venda</DialogTitle>
                <DialogDescription>
                  Crie um novo pedido de venda
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Cliente *</Label>
                    <Select name="customerId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
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
                    <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                    <Select name="paymentMethod">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Dinheiro</SelectItem>
                        <SelectItem value="CREDIT">Cartão de Crédito</SelectItem>
                        <SelectItem value="DEBIT">Cartão de Débito</SelectItem>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="TRANSFER">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
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
                          {products?.filter(p => p.currentStock > 0).map(product => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - {formatCurrency(product.salePrice)} (Est: {product.currentStock})
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
                        value={itemDiscount}
                        onChange={(e) => setItemDiscount(e.target.value)}
                        className="w-24"
                        placeholder="Desconto"
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
                            <TableHead className="text-right">Preço</TableHead>
                            <TableHead className="text-right">Desconto</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell className="text-center">{item.quantity}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.discount)}</TableCell>
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
                            <TableCell colSpan={4} className="text-right font-bold">Total:</TableCell>
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
                    {createOrder.isPending ? "Salvando..." : "Finalizar Venda"}
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
                  placeholder="Buscar por número ou cliente..."
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
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                  <SelectItem value="SHIPPED">Enviado</SelectItem>
                  <SelectItem value="DELIVERED">Entregue</SelectItem>
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
                    <TableHead>Cliente</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-center">Itens</TableHead>
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
                        <TableCell>{order.customer?.name || '-'}</TableCell>
                        <TableCell>{order.paymentMethod || '-'}</TableCell>
                        <TableCell className="text-center">-</TableCell>
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
                          <div className="flex items-center justify-end gap-2">
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
                            
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum pedido encontrado</h3>
                <p className="text-muted-foreground">
                  Comece criando sua primeira venda
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Order Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Pedido</DialogTitle>
            </DialogHeader>
            {orderDetails && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{orderDetails.orderNumber}</p>
                    <p className="text-muted-foreground">
                      {format(new Date(orderDetails.orderDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge variant={getStatusInfo(orderDetails.status).variant} className="text-base px-4 py-2">
                    {getStatusInfo(orderDetails.status).label}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{orderDetails.customer?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                    <p className="font-medium">{orderDetails.paymentMethod || '-'}</p>
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
                          <TableHead className="text-right">Preço</TableHead>
                          <TableHead className="text-right">Desconto</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderDetails.items?.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product?.name || '-'}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.discount)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(parseFloat(item.unitPrice) * item.quantity - parseFloat(item.discount))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
                  <div className="grid grid-cols-3 gap-8">
                    <div>
                      <p className="text-sm text-muted-foreground">Subtotal</p>
                      <p className="font-medium">{formatCurrency(orderDetails.subtotal)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Desconto</p>
                      <p className="font-medium">{formatCurrency(orderDetails.discount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(orderDetails.total)}</p>
                    </div>
                  </div>
                </div>
                
                {orderDetails.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Observações</p>
                    <p className="font-medium">{orderDetails.notes}</p>
                  </div>
                )}
                
                {orderDetails.status !== "DELIVERED" && orderDetails.status !== "CANCELLED" && (
                  <div className="flex gap-2">
                    {orderDetails.status === "PENDING" && (
                      <>
                        <Button 
                          onClick={() => updateStatus.mutate({ id: orderDetails.id, status: "CONFIRMED" })}
                          disabled={updateStatus.isPending}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Confirmar
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
                    {orderDetails.status === "CONFIRMED" && (
                      <Button 
                        onClick={() => updateStatus.mutate({ id: orderDetails.id, status: "SHIPPED" })}
                        disabled={updateStatus.isPending}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Marcar como Enviado
                      </Button>
                    )}
                    {orderDetails.status === "SHIPPED" && (
                      <Button 
                        onClick={() => updateStatus.mutate({ id: orderDetails.id, status: "DELIVERED" })}
                        disabled={updateStatus.isPending}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Marcar como Entregue
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
