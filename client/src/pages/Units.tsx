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
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Store, Warehouse, ShoppingCart, MapPin, Phone, Mail, User } from "lucide-react";

const unitTypeLabels = {
  STORE: { label: "Loja Física", icon: Store, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  WAREHOUSE: { label: "Centro de Distribuição", icon: Warehouse, color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300" },
  ECOMMERCE: { label: "E-commerce", icon: ShoppingCart, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
};

export default function Units() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "STORE" as "STORE" | "WAREHOUSE" | "ECOMMERCE",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    manager: "",
    isDefault: false,
  });

  const utils = trpc.useUtils();
  const { data: units, isLoading } = trpc.storeUnits.list.useQuery({ activeOnly: false });

  const createMutation = trpc.storeUnits.create.useMutation({
    onSuccess: () => {
      toast.success("Unidade criada com sucesso!");
      utils.storeUnits.list.invalidate();
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao criar unidade: ${error.message}`);
    },
  });

  const updateMutation = trpc.storeUnits.update.useMutation({
    onSuccess: () => {
      toast.success("Unidade atualizada com sucesso!");
      utils.storeUnits.list.invalidate();
      setEditingUnit(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar unidade: ${error.message}`);
    },
  });

  const deleteMutation = trpc.storeUnits.delete.useMutation({
    onSuccess: () => {
      toast.success("Unidade desativada com sucesso!");
      utils.storeUnits.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao desativar unidade: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      type: "STORE",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      email: "",
      manager: "",
      isDefault: false,
    });
  };

  const handleCreate = () => {
    if (!formData.code || !formData.name) {
      toast.error("Código e nome são obrigatórios");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editingUnit) return;
    updateMutation.mutate({
      id: editingUnit.id,
      data: {
        name: formData.name,
        type: formData.type,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        manager: formData.manager || undefined,
        isDefault: formData.isDefault,
      },
    });
  };

  const openEditDialog = (unit: any) => {
    setEditingUnit(unit);
    setFormData({
      code: unit.code,
      name: unit.name,
      type: unit.type,
      address: unit.address || "",
      city: unit.city || "",
      state: unit.state || "",
      zipCode: unit.zipCode || "",
      phone: unit.phone || "",
      email: unit.email || "",
      manager: unit.manager || "",
      isDefault: unit.isDefault,
    });
  };

  const UnitForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Código *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="Ex: LOJA01"
            disabled={isEdit}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Tipo *</Label>
          <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STORE">Loja Física</SelectItem>
              <SelectItem value="WAREHOUSE">Centro de Distribuição</SelectItem>
              <SelectItem value="ECOMMERCE">E-commerce</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Nome da unidade"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Endereço completo"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            maxLength={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zipCode">CEP</Label>
          <Input
            id="zipCode"
            value={formData.zipCode}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="manager">Gerente Responsável</Label>
        <Input
          id="manager"
          value={formData.manager}
          onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isDefault"
          checked={formData.isDefault}
          onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
        />
        <Label htmlFor="isDefault">Unidade padrão</Label>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Unidades</h1>
            <p className="text-muted-foreground">Gerencie suas lojas, centros de distribuição e e-commerce</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Unidade
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Unidade</DialogTitle>
                <DialogDescription>Cadastre uma nova unidade de negócio</DialogDescription>
              </DialogHeader>
              <UnitForm />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Unidade"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(unitTypeLabels).map(([type, config]) => {
            const count = units?.filter(u => u.type === type && u.isActive).length || 0;
            const Icon = config.icon;
            return (
              <Card key={type}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground">unidades ativas</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Units Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Unidades</CardTitle>
            <CardDescription>Todas as unidades cadastradas no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units?.map((unit) => {
                    const typeConfig = unitTypeLabels[unit.type as keyof typeof unitTypeLabels];
                    const Icon = typeConfig.icon;
                    return (
                      <TableRow key={unit.id}>
                        <TableCell className="font-mono">{unit.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{unit.name}</span>
                            {unit.isDefault && (
                              <Badge variant="secondary" className="text-xs">Padrão</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={typeConfig.color}>
                            <Icon className="mr-1 h-3 w-3" />
                            {typeConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {unit.city && unit.state ? (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {unit.city}, {unit.state}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {unit.phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {unit.phone}
                              </div>
                            )}
                            {unit.manager && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                {unit.manager}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={unit.isActive ? "default" : "secondary"}>
                            {unit.isActive ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(unit)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {unit.isActive && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteMutation.mutate({ id: unit.id })}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!units || units.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma unidade cadastrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingUnit} onOpenChange={(open) => !open && setEditingUnit(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Unidade</DialogTitle>
              <DialogDescription>Atualize as informações da unidade</DialogDescription>
            </DialogHeader>
            <UnitForm isEdit />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUnit(null)}>Cancelar</Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
