import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, Search, RefreshCw, User, Calendar, FileText, 
  Package, DollarSign, Truck, ArrowLeftRight, AlertTriangle
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function AuditLogs() {
  const [filterEntity, setFilterEntity] = useState<string>("");
  const [filterAction, setFilterAction] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: logs, isLoading, refetch } = trpc.auditLogs.list.useQuery({
    entityType: filterEntity || undefined,
    action: filterAction || undefined,
    limit: 100,
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("pt-BR");
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case "PRODUCT": return <Package className="h-4 w-4" />;
      case "STOCK": return <Package className="h-4 w-4" />;
      case "SALE": return <DollarSign className="h-4 w-4" />;
      case "PURCHASE": return <Truck className="h-4 w-4" />;
      case "TRANSFER": return <ArrowLeftRight className="h-4 w-4" />;
      case "PRICE": return <DollarSign className="h-4 w-4" />;
      case "COST": return <DollarSign className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return <Badge className="bg-green-600">Criação</Badge>;
      case "UPDATE":
        return <Badge className="bg-blue-600">Atualização</Badge>;
      case "DELETE":
        return <Badge variant="destructive">Exclusão</Badge>;
      case "PRICE_CHANGE":
        return <Badge className="bg-purple-600">Alteração de Preço</Badge>;
      case "COST_CHANGE":
        return <Badge className="bg-orange-600">Alteração de Custo</Badge>;
      case "STOCK_ADJUSTMENT":
        return <Badge className="bg-yellow-600">Ajuste de Estoque</Badge>;
      case "CANCEL":
        return <Badge variant="destructive">Cancelamento</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getEntityLabel = (entity: string) => {
    const labels: Record<string, string> = {
      PRODUCT: "Produto",
      STOCK: "Estoque",
      SALE: "Venda",
      PURCHASE: "Compra",
      TRANSFER: "Transferência",
      PRICE: "Preço",
      COST: "Custo",
      CUSTOMER: "Cliente",
      SUPPLIER: "Fornecedor",
      PAYABLE: "Conta a Pagar",
      RECEIVABLE: "Conta a Receber",
    };
    return labels[entity] || entity;
  };

  const filteredLogs = logs?.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.fieldChanged?.toLowerCase().includes(search) ||
      log.userName?.toLowerCase().includes(search) ||
      log.entityType.toLowerCase().includes(search)
    );
  });

  const entityTypes = [
    "PRODUCT", "STOCK", "SALE", "PURCHASE", "TRANSFER", 
    "PRICE", "COST", "CUSTOMER", "SUPPLIER", "PAYABLE", "RECEIVABLE"
  ];

  const actionTypes = [
    "CREATE", "UPDATE", "DELETE", "PRICE_CHANGE", 
    "COST_CHANGE", "STOCK_ADJUSTMENT", "CANCEL"
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h1>
            <p className="text-muted-foreground">Histórico completo de alterações no sistema</p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Descrição, usuário..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Entidade</Label>
                <Select value={filterEntity || "all"} onValueChange={(val) => setFilterEntity(val === "all" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {entityTypes.map((type) => (
                      <SelectItem key={type} value={type}>{getEntityLabel(type)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ação</Label>
                <Select value={filterAction || "all"} onValueChange={(val) => setFilterAction(val === "all" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {actionTypes.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action === "CREATE" ? "Criação" :
                         action === "UPDATE" ? "Atualização" :
                         action === "DELETE" ? "Exclusão" :
                         action === "PRICE_CHANGE" ? "Alteração de Preço" :
                         action === "COST_CHANGE" ? "Alteração de Custo" :
                         action === "STOCK_ADJUSTMENT" ? "Ajuste de Estoque" :
                         action === "CANCEL" ? "Cancelamento" : action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setFilterEntity("");
                    setFilterAction("");
                    setSearchTerm("");
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredLogs?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Criações</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {filteredLogs?.filter(l => l.action === "CREATE").length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atualizações</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {filteredLogs?.filter(l => l.action === "UPDATE").length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exclusões/Cancelamentos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {filteredLogs?.filter(l => l.action === "DELETE" || l.action === "CANCEL").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Histórico de Alterações
            </CardTitle>
            <CardDescription>
              Trilha de auditoria completa: quem fez, quando e por quê
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredLogs && filteredLogs.length > 0 ? (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead className="w-[40%]">Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(log.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{log.userName || "Sistema"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEntityIcon(log.entityType)}
                            <span>{getEntityLabel(log.entityType)}</span>
                            {log.entityId && (
                              <span className="text-xs text-muted-foreground">#{log.entityId}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">{log.fieldChanged ? `Campo: ${log.fieldChanged}` : "Registro alterado"}</p>
                            {log.oldValue && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Antes:</span> {log.oldValue}
                              </p>
                            )}
                            {log.newValue && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Depois:</span> {log.newValue}
                              </p>
                            )}
                            {log.reason && (
                              <p className="text-xs text-orange-600">
                                <span className="font-medium">Motivo:</span> {log.reason}
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum registro de auditoria encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
