import { useState, useRef, useEffect } from "react";
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
import { 
  Plus, Package, ArrowDownCircle, ArrowUpCircle, RefreshCw, 
  Store, Warehouse, ShoppingCart, Search, Barcode, Eye,
  TrendingUp, TrendingDown, AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const unitTypeIcons = {
  STORE: Store,
  WAREHOUSE: Warehouse,
  ECOMMERCE: ShoppingCart,
};

const movementTypeConfig = {
  IN: { label: "Entrada", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", icon: ArrowDownCircle },
  OUT: { label: "Saída", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", icon: ArrowUpCircle },
  ADJUSTMENT: { label: "Ajuste", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", icon: RefreshCw },
};

const reasonLabels = {
  PURCHASE: "Compra",
  SALE: "Venda",
  RETURN: "Devolução",
  EXCHANGE: "Troca",
  LOSS: "Perda",
  ADJUSTMENT: "Ajuste de Inventário",
  TRANSFER_IN: "Transferência (Entrada)",
  TRANSFER_OUT: "Transferência (Saída)",
  INVENTORY: "Inventário",
};

export default function UnitStock() {
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [isMovementOpen, setIsMovementOpen] = useState(false);
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeResult, setBarcodeResult] = useState<any>(null);
  const [movementData, setMovementData] = useState({
    productId: "",
    type: "IN" as "IN" | "OUT" | "ADJUSTMENT",
    reason: "PURCHASE" as "PURCHASE" | "SALE" | "RETURN" | "EXCHANGE" | "LOSS" | "ADJUSTMENT" | "TRANSFER_IN" | "TRANSFER_OUT" | "INVENTORY",
    quantity: 1,
    unitCost: "",
    batch: "",
    barcode: "",
    notes: "",
  });
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: units } = trpc.storeUnits.list.useQuery({});
  const { data: products } = trpc.products.list.useQuery();
  const { data: multiUnitStats } = trpc.dashboard.multiUnit.useQuery({});
  const { data: unitStock, isLoading: stockLoading } = trpc.unitStock.byUnit.useQuery(
    { unitId: parseInt(selectedUnitId) },
    { enabled: !!selectedUnitId }
  );
  const { data: movements, isLoading: movementsLoading } = trpc.unitMovements.list.useQuery(
    { unitId: selectedUnitId ? parseInt(selectedUnitId) : undefined, limit: 50 },
    { enabled: true }
  );

  const barcodeLookup = trpc.barcode.lookup.useQuery(
    { barcode: barcodeInput },
    { enabled: false }
  );

  const createMovementMutation = trpc.unitMovements.create.useMutation({
    onSuccess: () => {
      toast.success("Movimentação registrada com sucesso!");
      utils.unitStock.byUnit.invalidate();
      utils.unitMovements.list.invalidate();
      utils.dashboard.multiUnit.invalidate();
      setIsMovementOpen(false);
      resetMovementForm();
    },
    onError: (error) => {
      toast.error(`Erro ao registrar movimentação: ${error.message}`);
    },
  });

  const resetMovementForm = () => {
    setMovementData({
      productId: "",
      type: "IN",
      reason: "PURCHASE",
      quantity: 1,
      unitCost: "",
      batch: "",
      barcode: "",
      notes: "",
    });
  };

  const handleBarcodeSearch = async () => {
    if (!barcodeInput.trim()) {
      toast.error("Digite um código de barras");
      return;
    }
    
    const result = await barcodeLookup.refetch();
    if (result.data) {
      setBarcodeResult(result.data);
      if (result.data.type === 'product') {
        setMovementData({ ...movementData, productId: result.data.data.id.toString() });
        toast.success(`Produto encontrado: ${(result.data.data as any).name}`);
      } else if (result.data.type === 'variant' && result.data.product) {
        setMovementData({ ...movementData, productId: result.data.product.id.toString() });
        toast.success(`Variante encontrada: ${result.data.product.name} - ${(result.data.data as any).size} ${(result.data.data as any).color}`);
      }
    } else {
      setBarcodeResult(null);
      toast.error("Produto não encontrado");
    }
  };

  const handleBarcodeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBarcodeSearch();
    }
  };

  const handleCreateMovement = () => {
    if (!selectedUnitId) {
      toast.error("Selecione uma unidade");
      return;
    }
    if (!movementData.productId) {
      toast.error("Selecione um produto");
      return;
    }
    if (movementData.quantity <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    createMovementMutation.mutate({
      unitId: parseInt(selectedUnitId),
      productId: parseInt(movementData.productId),
      type: movementData.type,
      reason: movementData.reason,
      quantity: movementData.quantity,
      unitCost: movementData.unitCost || undefined,
      batch: movementData.batch || undefined,
      barcode: movementData.barcode || undefined,
      notes: movementData.notes || undefined,
    });
  };

  useEffect(() => {
    if (isBarcodeOpen && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [isBarcodeOpen]);

  const selectedUnit = units?.find(u => u.id.toString() === selectedUnitId);
  const UnitIcon = selectedUnit ? unitTypeIcons[selectedUnit.type as keyof typeof unitTypeIcons] : Store;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Estoque por Unidade</h1>
            <p className="text-muted-foreground">Visualize e gerencie o estoque de cada unidade</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isBarcodeOpen} onOpenChange={setIsBarcodeOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Barcode className="mr-2 h-4 w-4" />
                  Código de Barras
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Busca por Código de Barras</DialogTitle>
                  <DialogDescription>Digite ou escaneie o código de barras do produto</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex gap-2">
                    <Input
                      ref={barcodeInputRef}
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyPress={handleBarcodeKeyPress}
                      placeholder="Digite o código de barras..."
                      className="font-mono"
                    />
                    <Button onClick={handleBarcodeSearch} disabled={barcodeLookup.isFetching}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  {barcodeResult && (
                    <Card>
                      <CardContent className="pt-4">
                        {barcodeResult.type === 'product' && (
                          <div className="space-y-2">
                            <p className="font-medium">{barcodeResult.data.name}</p>
                            <p className="text-sm text-muted-foreground">Código: {barcodeResult.data.code}</p>
                            <p className="text-sm">Estoque: {barcodeResult.data.currentStock} unidades</p>
                            <p className="text-sm">Preço: R$ {parseFloat(barcodeResult.data.salePrice).toFixed(2)}</p>
                          </div>
                        )}
                        {barcodeResult.type === 'variant' && (
                          <div className="space-y-2">
                            <p className="font-medium">{barcodeResult.product.name}</p>
                            <p className="text-sm text-muted-foreground">SKU: {barcodeResult.data.sku}</p>
                            <p className="text-sm">Tamanho: {barcodeResult.data.size} | Cor: {barcodeResult.data.color}</p>
                            <p className="text-sm">Estoque: {barcodeResult.data.stock} unidades</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsBarcodeOpen(false); setBarcodeInput(""); setBarcodeResult(null); }}>
                    Fechar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isMovementOpen} onOpenChange={setIsMovementOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetMovementForm} disabled={!selectedUnitId}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Movimentação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Registrar Movimentação</DialogTitle>
                  <DialogDescription>
                    {selectedUnit ? `Unidade: ${selectedUnit.name}` : "Selecione uma unidade primeiro"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Código de Barras (opcional)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={movementData.barcode}
                        onChange={(e) => setMovementData({ ...movementData, barcode: e.target.value })}
                        placeholder="Escaneie ou digite..."
                        className="font-mono"
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={async () => {
                          if (movementData.barcode) {
                            setBarcodeInput(movementData.barcode);
                            await handleBarcodeSearch();
                          }
                        }}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Produto *</Label>
                    <Select value={movementData.productId} onValueChange={(v) => setMovementData({ ...movementData, productId: v })}>
                      <SelectTrigger>
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo *</Label>
                      <Select value={movementData.type} onValueChange={(v: any) => setMovementData({ ...movementData, type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IN">Entrada</SelectItem>
                          <SelectItem value="OUT">Saída</SelectItem>
                          <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Motivo *</Label>
                      <Select value={movementData.reason} onValueChange={(v: any) => setMovementData({ ...movementData, reason: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PURCHASE">Compra</SelectItem>
                          <SelectItem value="SALE">Venda</SelectItem>
                          <SelectItem value="RETURN">Devolução</SelectItem>
                          <SelectItem value="EXCHANGE">Troca</SelectItem>
                          <SelectItem value="LOSS">Perda</SelectItem>
                          <SelectItem value="ADJUSTMENT">Ajuste de Inventário</SelectItem>
                          <SelectItem value="INVENTORY">Inventário</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantidade *</Label>
                      <Input
                        type="number"
                        min={1}
                        value={movementData.quantity}
                        onChange={(e) => setMovementData({ ...movementData, quantity: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Custo Unitário</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={movementData.unitCost}
                        onChange={(e) => setMovementData({ ...movementData, unitCost: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Lote</Label>
                    <Input
                      value={movementData.batch}
                      onChange={(e) => setMovementData({ ...movementData, batch: e.target.value })}
                      placeholder="Número do lote (opcional)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={movementData.notes}
                      onChange={(e) => setMovementData({ ...movementData, notes: e.target.value })}
                      placeholder="Observações..."
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsMovementOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateMovement} disabled={createMovementMutation.isPending}>
                    {createMovementMutation.isPending ? "Registrando..." : "Registrar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Multi-Unit Overview */}
        {multiUnitStats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estoque Total</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{multiUnitStats.totalStock.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">itens em todas as unidades</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {multiUnitStats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">valor em estoque</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transferências</CardTitle>
                <RefreshCw className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{multiUnitStats.pendingTransfersCount + multiUnitStats.inTransitTransfersCount}</div>
                <p className="text-xs text-muted-foreground">{multiUnitStats.pendingTransfersCount} pendentes, {multiUnitStats.inTransitTransfersCount} em trânsito</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Devoluções</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{multiUnitStats.pendingReturnsCount}</div>
                <p className="text-xs text-muted-foreground">pendentes de processamento</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stock by Unit Cards */}
        {multiUnitStats && (
          <div className="grid gap-4 md:grid-cols-3">
            {multiUnitStats.units.map((unit: any) => {
              const Icon = unitTypeIcons[unit.unitType as keyof typeof unitTypeIcons] || Store;
              const isSelected = unit.unitId.toString() === selectedUnitId;
              return (
                <Card 
                  key={unit.unitId} 
                  className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedUnitId(unit.unitId.toString())}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{unit.unitName}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{unit.totalItems.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      R$ {unit.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • {unit.stockCount} produtos
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Unit Selector for detailed view */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Detalhes do Estoque</CardTitle>
                <CardDescription>Selecione uma unidade para ver o estoque detalhado</CardDescription>
              </div>
              <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Selecione uma unidade..." />
                </SelectTrigger>
                <SelectContent>
                  {units?.map(unit => {
                    const Icon = unitTypeIcons[unit.type as keyof typeof unitTypeIcons];
                    return (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {unit.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedUnitId ? (
              <div className="text-center py-8 text-muted-foreground">
                Selecione uma unidade para visualizar o estoque
              </div>
            ) : stockLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Tabs defaultValue="stock">
                <TabsList>
                  <TabsTrigger value="stock">Estoque</TabsTrigger>
                  <TabsTrigger value="movements">Movimentações</TabsTrigger>
                </TabsList>
                <TabsContent value="stock" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Variante</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Mín</TableHead>
                        <TableHead className="text-right">Máx</TableHead>
                        <TableHead className="text-right">Disponível</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unitStock?.map((stock: any) => {
                        const isLow = stock.quantity <= stock.minStock;
                        const isHigh = stock.quantity >= stock.maxStock;
                        return (
                          <TableRow key={stock.id}>
                            <TableCell className="font-medium">{stock.product?.name || `Produto #${stock.productId}`}</TableCell>
                            <TableCell>
                              {stock.variant ? `${stock.variant.size} / ${stock.variant.color}` : "-"}
                            </TableCell>
                            <TableCell className="text-right">{stock.quantity}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{stock.minStock}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{stock.maxStock}</TableCell>
                            <TableCell className="text-right">{stock.availableQuantity}</TableCell>
                            <TableCell>
                              {isLow ? (
                                <Badge variant="destructive" className="gap-1">
                                  <TrendingDown className="h-3 w-3" />
                                  Baixo
                                </Badge>
                              ) : isHigh ? (
                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  Alto
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Normal</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {(!unitStock || unitStock.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Nenhum produto em estoque nesta unidade
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="movements" className="mt-4">
                  {movementsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead className="text-right">Qtd</TableHead>
                          <TableHead className="text-right">Anterior</TableHead>
                          <TableHead className="text-right">Novo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movements?.filter((m: any) => !selectedUnitId || m.unitId.toString() === selectedUnitId).map((mov: any) => {
                          const typeConfig = movementTypeConfig[mov.type as keyof typeof movementTypeConfig];
                          const Icon = typeConfig?.icon || RefreshCw;
                          return (
                            <TableRow key={mov.id}>
                              <TableCell>
                                {format(new Date(mov.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </TableCell>
                              <TableCell className="font-medium">{mov.product?.name || `#${mov.productId}`}</TableCell>
                              <TableCell>
                                <Badge className={typeConfig?.color}>
                                  <Icon className="mr-1 h-3 w-3" />
                                  {typeConfig?.label}
                                </Badge>
                              </TableCell>
                              <TableCell>{reasonLabels[mov.reason as keyof typeof reasonLabels] || mov.reason}</TableCell>
                              <TableCell className="text-right font-mono">
                                {mov.type === "IN" ? "+" : mov.type === "OUT" ? "-" : ""}{mov.quantity}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">{mov.previousStock}</TableCell>
                              <TableCell className="text-right font-medium">{mov.newStock}</TableCell>
                            </TableRow>
                          );
                        })}
                        {(!movements || movements.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              Nenhuma movimentação registrada
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
