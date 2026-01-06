import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Edit, Trash2, Building2, Search, Eye, Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Suppliers() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  
  const utils = trpc.useUtils();
  
  const { data: suppliers, isLoading } = trpc.suppliers.list.useQuery();
  const { data: supplierDetails } = trpc.suppliers.getById.useQuery(
    { id: selectedSupplier! },
    { enabled: !!selectedSupplier && isViewOpen }
  );
  
  const createSupplier = trpc.suppliers.create.useMutation({
    onSuccess: () => {
      toast.success("Fornecedor criado com sucesso!");
      utils.suppliers.list.invalidate();
      setIsCreateOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar fornecedor");
    }
  });
  
  const deleteSupplier = trpc.suppliers.delete.useMutation({
    onSuccess: () => {
      toast.success("Fornecedor excluído com sucesso!");
      utils.suppliers.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir fornecedor");
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createSupplier.mutate({
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      tradeName: formData.get("tradeName") as string || undefined,
      cnpj: formData.get("cnpj") as string || undefined,
      email: formData.get("email") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      address: formData.get("address") as string || undefined,
      city: formData.get("city") as string || undefined,
      state: formData.get("state") as string || undefined,
      zipCode: formData.get("zipCode") as string || undefined,
      contactPerson: formData.get("contactPerson") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este fornecedor?")) {
      deleteSupplier.mutate({ id });
    }
  };

  const filteredSuppliers = suppliers?.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Fornecedores</h1>
            <p className="text-muted-foreground">
              Gerencie seus fornecedores e parceiros
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Fornecedor</DialogTitle>
                <DialogDescription>
                  Cadastre um novo fornecedor
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código *</Label>
                    <Input id="code" name="code" required placeholder="FOR001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input id="cnpj" name="cnpj" placeholder="00.000.000/0000-00" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Razão Social *</Label>
                  <Input id="name" name="name" required placeholder="Nome da empresa" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tradeName">Nome Fantasia</Label>
                  <Input id="tradeName" name="tradeName" placeholder="Nome fantasia" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" name="email" type="email" placeholder="email@empresa.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" name="phone" placeholder="(00) 00000-0000" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Pessoa de Contato</Label>
                  <Input id="contactPerson" name="contactPerson" placeholder="Nome do contato" />
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
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea id="notes" name="notes" placeholder="Observações adicionais" />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createSupplier.isPending}>
                    {createSupplier.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredSuppliers && filteredSuppliers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Cidade/UF</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map(supplier => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-mono text-sm">{supplier.code}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          {supplier.tradeName && (
                            <p className="text-sm text-muted-foreground">{supplier.tradeName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {supplier.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {supplier.phone}
                            </div>
                          )}
                          {supplier.email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {supplier.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.city && supplier.state ? `${supplier.city}/${supplier.state}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedSupplier(supplier.id);
                              setIsViewOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(supplier.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum fornecedor encontrado</h3>
                <p className="text-muted-foreground">
                  Comece cadastrando seu primeiro fornecedor
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes do Fornecedor</DialogTitle>
            </DialogHeader>
            {supplierDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Código</p>
                    <p className="font-medium">{supplierDetails.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CNPJ</p>
                    <p className="font-medium">{supplierDetails.cnpj || '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Razão Social</p>
                  <p className="font-medium">{supplierDetails.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nome Fantasia</p>
                  <p className="font-medium">{supplierDetails.tradeName || '-'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">E-mail</p>
                    <p className="font-medium">{supplierDetails.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{supplierDetails.phone || '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pessoa de Contato</p>
                  <p className="font-medium">{supplierDetails.contactPerson || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium">
                    {supplierDetails.address ? (
                      <>
                        {supplierDetails.address}
                        {supplierDetails.city && `, ${supplierDetails.city}`}
                        {supplierDetails.state && `/${supplierDetails.state}`}
                        {supplierDetails.zipCode && ` - ${supplierDetails.zipCode}`}
                      </>
                    ) : '-'}
                  </p>
                </div>
                {supplierDetails.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Observações</p>
                    <p className="font-medium">{supplierDetails.notes}</p>
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
