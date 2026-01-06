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
import { Plus, Search, Eye, Trash2, Users, Crown, Star, UserPlus, UserX, Phone, Mail, MapPin, ShoppingBag } from "lucide-react";
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

export default function Customers() {
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  
  const utils = trpc.useUtils();
  
  const { data: customers, isLoading } = trpc.customers.list.useQuery({
    search: search || undefined,
    segment: segmentFilter !== "all" ? segmentFilter : undefined
  });
  
  const { data: customerDetails } = trpc.customers.getById.useQuery(
    { id: selectedCustomer! },
    { enabled: !!selectedCustomer && isViewOpen }
  );
  
  const createCustomer = trpc.customers.create.useMutation({
    onSuccess: () => {
      toast.success("Cliente cadastrado com sucesso!");
      utils.customers.list.invalidate();
      setIsCreateOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar cliente");
    }
  });
  
  const deleteCustomer = trpc.customers.delete.useMutation({
    onSuccess: () => {
      toast.success("Cliente excluído com sucesso!");
      utils.customers.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir cliente");
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createCustomer.mutate({
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      email: formData.get("email") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      cpf: formData.get("cpf") as string || undefined,
      gender: formData.get("gender") as "M" | "F" | "O" | undefined,
      address: formData.get("address") as string || undefined,
      city: formData.get("city") as string || undefined,
      state: formData.get("state") as string || undefined,
      zipCode: formData.get("zipCode") as string || undefined,
      preferences: formData.get("preferences") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      deleteCustomer.mutate({ id });
    }
  };

  const getSegmentInfo = (segment: string) => {
    switch (segment) {
      case "VIP":
        return { label: "VIP", icon: Crown, color: "bg-amber-100 text-amber-700 border-amber-200" };
      case "REGULAR":
        return { label: "Regular", icon: Star, color: "bg-blue-100 text-blue-700 border-blue-200" };
      case "NEW":
        return { label: "Novo", icon: UserPlus, color: "bg-green-100 text-green-700 border-green-200" };
      case "INACTIVE":
        return { label: "Inativo", icon: UserX, color: "bg-gray-100 text-gray-700 border-gray-200" };
      default:
        return { label: segment, icon: Users, color: "bg-gray-100 text-gray-700 border-gray-200" };
    }
  };

  const segmentCounts = {
    VIP: customers?.filter(c => c.segment === "VIP").length || 0,
    REGULAR: customers?.filter(c => c.segment === "REGULAR").length || 0,
    NEW: customers?.filter(c => c.segment === "NEW").length || 0,
    INACTIVE: customers?.filter(c => c.segment === "INACTIVE").length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie sua base de clientes e relacionamentos
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
                <DialogDescription>
                  Cadastre um novo cliente
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código *</Label>
                    <Input id="code" name="code" required placeholder="CLI001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" name="cpf" placeholder="000.000.000-00" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input id="name" name="name" required placeholder="Nome do cliente" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" name="email" type="email" placeholder="email@exemplo.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" name="phone" placeholder="(00) 00000-0000" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">Gênero</Label>
                  <Select name="gender">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="F">Feminino</SelectItem>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="O">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" name="address" placeholder="Rua, número, complemento" />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" name="city" placeholder="Cidade" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input id="state" name="state" placeholder="UF" maxLength={2} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input id="zipCode" name="zipCode" placeholder="00000-000" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preferences">Preferências</Label>
                  <Textarea id="preferences" name="preferences" placeholder="Preferências de estilo, tamanhos, cores..." />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea id="notes" name="notes" placeholder="Observações adicionais" />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createCustomer.isPending}>
                    {createCustomer.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Segment Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {Object.entries(segmentCounts).map(([segment, count]) => {
            const info = getSegmentInfo(segment);
            return (
              <Card 
                key={segment} 
                className={`cursor-pointer transition-all hover:shadow-md ${segmentFilter === segment ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSegmentFilter(segmentFilter === segment ? "all" : segment)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${info.color}`}>
                      <info.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{info.label}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, e-mail ou código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Segmento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os segmentos</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="REGULAR">Regular</SelectItem>
                  <SelectItem value="NEW">Novo</SelectItem>
                  <SelectItem value="INACTIVE">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : customers && customers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Segmento</TableHead>
                    <TableHead className="text-right">Total Compras</TableHead>
                    <TableHead className="text-center">Qtd. Compras</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map(customer => {
                    const segmentInfo = getSegmentInfo(customer.segment);
                    return (
                      <TableRow key={customer.id}>
                        <TableCell className="font-mono text-sm">{customer.code}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            {customer.city && customer.state && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {customer.city}/{customer.state}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {customer.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </div>
                            )}
                            {customer.email && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={segmentInfo.color}>
                            <segmentInfo.icon className="h-3 w-3 mr-1" />
                            {segmentInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(customer.totalPurchases)}
                        </TableCell>
                        <TableCell className="text-center">
                          {customer.purchaseCount}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedCustomer(customer.id);
                                setIsViewOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(customer.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum cliente encontrado</h3>
                <p className="text-muted-foreground">
                  Comece cadastrando seu primeiro cliente
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Customer Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Cliente</DialogTitle>
            </DialogHeader>
            {customerDetails && (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="history">Histórico de Compras</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <div className={`h-16 w-16 rounded-full flex items-center justify-center ${getSegmentInfo(customerDetails.segment).color}`}>
                      <span className="text-2xl font-bold">
                        {customerDetails.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{customerDetails.name}</h3>
                      <Badge variant="outline" className={getSegmentInfo(customerDetails.segment).color}>
                        {getSegmentInfo(customerDetails.segment).label}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Código</p>
                      <p className="font-medium">{customerDetails.code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CPF</p>
                      <p className="font-medium">{customerDetails.cpf || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">E-mail</p>
                      <p className="font-medium">{customerDetails.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{customerDetails.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gênero</p>
                      <p className="font-medium">
                        {customerDetails.gender === 'F' ? 'Feminino' : 
                         customerDetails.gender === 'M' ? 'Masculino' : 
                         customerDetails.gender === 'O' ? 'Outro' : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente desde</p>
                      <p className="font-medium">
                        {format(new Date(customerDetails.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="font-medium">
                      {customerDetails.address ? (
                        <>
                          {customerDetails.address}
                          {customerDetails.city && `, ${customerDetails.city}`}
                          {customerDetails.state && `/${customerDetails.state}`}
                          {customerDetails.zipCode && ` - ${customerDetails.zipCode}`}
                        </>
                      ) : '-'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 p-4 bg-primary/5 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Total em Compras</p>
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(customerDetails.totalPurchases)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Quantidade de Compras</p>
                      <p className="text-xl font-bold">{customerDetails.purchaseCount}</p>
                    </div>
                  </div>
                  
                  {customerDetails.preferences && (
                    <div>
                      <p className="text-sm text-muted-foreground">Preferências</p>
                      <p className="font-medium">{customerDetails.preferences}</p>
                    </div>
                  )}
                  
                  {customerDetails.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Observações</p>
                      <p className="font-medium">{customerDetails.notes}</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="history" className="space-y-4">
                  {customerDetails.orders && customerDetails.orders.length > 0 ? (
                    <div className="space-y-4">
                      {customerDetails.orders.map(order => (
                        <Card key={order.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{order.orderNumber}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(order.orderDate), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{formatCurrency(order.total)}</p>
                                <Badge variant="outline">{order.status}</Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <ShoppingBag className="h-12 w-12 mb-2" />
                      <p>Nenhuma compra registrada</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
