import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Calculator, DollarSign, Percent, TrendingUp, Target, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function Pricing() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("rules");
  
  // Calculator state
  const [calcData, setCalcData] = useState({
    baseCost: "",
    taxRate: "0",
    freightRate: "0",
    commissionRate: "0",
    marketplaceFee: "0",
    acquirerFee: "0",
    targetMargin: "30",
  });
  
  // Simulator state
  const [simData, setSimData] = useState({
    salePrice: "",
    baseCost: "",
    taxRate: "0",
    freightRate: "0",
    commissionRate: "0",
    marketplaceFee: "0",
    acquirerFee: "0",
  });
  
  // Rule form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    productId: "",
    categoryId: "",
    unitId: "",
    baseCost: "",
    taxRate: "0",
    freightRate: "0",
    commissionRate: "0",
    marketplaceFee: "0",
    acquirerFee: "0",
    targetMargin: "30",
    minMargin: "",
    maxMargin: "",
  });

  const utils = trpc.useUtils();
  
  const { data: pricingRules, isLoading } = trpc.pricing.list.useQuery({
    activeOnly: true,
  });
  
  const { data: products } = trpc.products.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: units } = trpc.storeUnits.list.useQuery();
  
  const { data: calculatedPrice, refetch: recalculatePrice } = trpc.pricing.calculatePrice.useQuery({
    baseCost: parseFloat(calcData.baseCost) || 0,
    taxRate: parseFloat(calcData.taxRate) || 0,
    freightRate: parseFloat(calcData.freightRate) || 0,
    commissionRate: parseFloat(calcData.commissionRate) || 0,
    marketplaceFee: parseFloat(calcData.marketplaceFee) || 0,
    acquirerFee: parseFloat(calcData.acquirerFee) || 0,
    targetMargin: parseFloat(calcData.targetMargin) || 0,
  }, {
    enabled: !!calcData.baseCost && parseFloat(calcData.baseCost) > 0,
  });
  
  const { data: simulatedMargin, refetch: recalculateMargin } = trpc.pricing.simulateMargin.useQuery({
    salePrice: parseFloat(simData.salePrice) || 0,
    baseCost: parseFloat(simData.baseCost) || 0,
    taxRate: parseFloat(simData.taxRate) || 0,
    freightRate: parseFloat(simData.freightRate) || 0,
    commissionRate: parseFloat(simData.commissionRate) || 0,
    marketplaceFee: parseFloat(simData.marketplaceFee) || 0,
    acquirerFee: parseFloat(simData.acquirerFee) || 0,
  }, {
    enabled: !!simData.salePrice && !!simData.baseCost && parseFloat(simData.salePrice) > 0 && parseFloat(simData.baseCost) > 0,
  });
  
  const createMutation = trpc.pricing.create.useMutation({
    onSuccess: () => {
      toast.success("Regra de precificação criada com sucesso!");
      setIsDialogOpen(false);
      resetForm();
      utils.pricing.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      productId: "",
      categoryId: "",
      unitId: "",
      baseCost: "",
      taxRate: "0",
      freightRate: "0",
      commissionRate: "0",
      marketplaceFee: "0",
      acquirerFee: "0",
      targetMargin: "30",
      minMargin: "",
      maxMargin: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.targetMargin) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    
    createMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      productId: formData.productId ? parseInt(formData.productId) : undefined,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
      unitId: formData.unitId ? parseInt(formData.unitId) : undefined,
      baseCost: formData.baseCost || undefined,
      taxRate: formData.taxRate,
      freightRate: formData.freightRate,
      commissionRate: formData.commissionRate,
      marketplaceFee: formData.marketplaceFee,
      acquirerFee: formData.acquirerFee,
      targetMargin: formData.targetMargin,
      minMargin: formData.minMargin || undefined,
      maxMargin: formData.maxMargin || undefined,
    });
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  };

  const formatPercent = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `${num.toFixed(2)}%`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Precificação Inteligente</h1>
            <p className="text-muted-foreground">Calcule preços e margens de forma estratégica</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Regra de Precificação</DialogTitle>
                <DialogDescription>Defina parâmetros de precificação para produtos ou categorias</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Regra *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Margem Padrão Loja"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Margem Alvo (%) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.targetMargin}
                      onChange={(e) => setFormData({ ...formData, targetMargin: e.target.value })}
                      placeholder="30"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição da regra"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Produto</Label>
                    <Select value={formData.productId} onValueChange={(v) => setFormData({ ...formData, productId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {products?.map((p: { id: number; name: string }) => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas</SelectItem>
                        {categories?.map((c: { id: number; name: string }) => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade</Label>
                    <Select value={formData.unitId} onValueChange={(v) => setFormData({ ...formData, unitId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas</SelectItem>
                        {units?.map((u: { id: number; name: string }) => (
                          <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Custos e Taxas (%)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Impostos</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.taxRate}
                        onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Frete</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.freightRate}
                        onChange={(e) => setFormData({ ...formData, freightRate: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Comissão</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.commissionRate}
                        onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Taxa Marketplace</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.marketplaceFee}
                        onChange={(e) => setFormData({ ...formData, marketplaceFee: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Taxa Adquirente</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.acquirerFee}
                        onChange={(e) => setFormData({ ...formData, acquirerFee: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Custo Base (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.baseCost}
                        onChange={(e) => setFormData({ ...formData, baseCost: e.target.value })}
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Margem Mínima (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.minMargin}
                      onChange={(e) => setFormData({ ...formData, minMargin: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Margem Máxima (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.maxMargin}
                      onChange={(e) => setFormData({ ...formData, maxMargin: e.target.value })}
                      placeholder="50"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="rules">Regras de Precificação</TabsTrigger>
            <TabsTrigger value="calculator">Calculadora de Preço</TabsTrigger>
            <TabsTrigger value="simulator">Simulador de Margem</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Regras de Precificação</CardTitle>
                <CardDescription>Configurações de margem e custos por produto/categoria</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : pricingRules && pricingRules.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Escopo</TableHead>
                        <TableHead className="text-right">Margem Alvo</TableHead>
                        <TableHead className="text-right">Impostos</TableHead>
                        <TableHead className="text-right">Comissão</TableHead>
                        <TableHead className="text-right">Preço Sugerido</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pricingRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-medium">{rule.name}</TableCell>
                          <TableCell>
                            {rule.productId ? "Produto" : rule.categoryId ? "Categoria" : rule.unitId ? "Unidade" : "Global"}
                          </TableCell>
                          <TableCell className="text-right">{formatPercent(rule.targetMargin)}</TableCell>
                          <TableCell className="text-right">{formatPercent(rule.taxRate)}</TableCell>
                          <TableCell className="text-right">{formatPercent(rule.commissionRate)}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {rule.suggestedPrice ? formatCurrency(rule.suggestedPrice) : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={rule.isActive ? "default" : "secondary"}>
                              {rule.isActive ? "Ativa" : "Inativa"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma regra de precificação cadastrada
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="calculator" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Calculadora de Preço
                  </CardTitle>
                  <CardDescription>
                    Calcule o preço de venda ideal com base no custo e margem desejada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Custo Base (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={calcData.baseCost}
                      onChange={(e) => setCalcData({ ...calcData, baseCost: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Margem Desejada (%) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={calcData.targetMargin}
                      onChange={(e) => setCalcData({ ...calcData, targetMargin: e.target.value })}
                      placeholder="30"
                    />
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4 text-sm">Custos Adicionais (%)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Impostos</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={calcData.taxRate}
                          onChange={(e) => setCalcData({ ...calcData, taxRate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Frete</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={calcData.freightRate}
                          onChange={(e) => setCalcData({ ...calcData, freightRate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Comissão</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={calcData.commissionRate}
                          onChange={(e) => setCalcData({ ...calcData, commissionRate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Marketplace</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={calcData.marketplaceFee}
                          onChange={(e) => setCalcData({ ...calcData, marketplaceFee: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Adquirente</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={calcData.acquirerFee}
                          onChange={(e) => setCalcData({ ...calcData, acquirerFee: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Resultado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {calculatedPrice ? (
                    <div className="space-y-6">
                      <div className="text-center p-6 bg-primary/5 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Preço de Venda Sugerido</p>
                        <p className="text-4xl font-bold text-primary">
                          {formatCurrency(calculatedPrice.suggestedPrice)}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Custo Base</span>
                          <span className="font-medium">{formatCurrency(parseFloat(calcData.baseCost) || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total de Taxas</span>
                          <span className="font-medium text-red-600">- {formatCurrency(calculatedPrice.breakdown?.totalFees || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Lucro Estimado</span>
                          <span className="font-medium text-green-600">{formatCurrency(calculatedPrice.suggestedPrice - (parseFloat(calcData.baseCost) || 0) - (calculatedPrice.breakdown?.totalFees || 0))}</span>
                        </div>
                        <div className="flex justify-between border-t pt-3">
                          <span className="font-medium">Margem Alvo</span>
                          <span className="font-bold text-primary">{formatPercent(parseFloat(calcData.targetMargin) || 0)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Preencha o custo base para calcular o preço</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="simulator" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Simulador de Margem
                  </CardTitle>
                  <CardDescription>
                    "Se eu vender por X, minha margem fica quanto?"
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Preço de Venda (R$) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={simData.salePrice}
                        onChange={(e) => setSimData({ ...simData, salePrice: e.target.value })}
                        placeholder="0,00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Custo Base (R$) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={simData.baseCost}
                        onChange={(e) => setSimData({ ...simData, baseCost: e.target.value })}
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4 text-sm">Custos Adicionais (%)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Impostos</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={simData.taxRate}
                          onChange={(e) => setSimData({ ...simData, taxRate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Frete</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={simData.freightRate}
                          onChange={(e) => setSimData({ ...simData, freightRate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Comissão</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={simData.commissionRate}
                          onChange={(e) => setSimData({ ...simData, commissionRate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Marketplace</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={simData.marketplaceFee}
                          onChange={(e) => setSimData({ ...simData, marketplaceFee: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Adquirente</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={simData.acquirerFee}
                          onChange={(e) => setSimData({ ...simData, acquirerFee: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Resultado da Simulação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {simulatedMargin ? (
                    <div className="space-y-6">
                      <div className={`text-center p-6 rounded-lg ${simulatedMargin.margin >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                        <p className="text-sm text-muted-foreground mb-2">Margem de Lucro</p>
                        <p className={`text-4xl font-bold ${simulatedMargin.margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatPercent(simulatedMargin.marginPercent)}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Preço de Venda</span>
                          <span className="font-medium">{formatCurrency(parseFloat(simData.salePrice) || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Custo Base</span>
                          <span className="font-medium">{formatCurrency(parseFloat(simData.baseCost) || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total de Taxas</span>
                          <span className="font-medium text-red-600">- {formatCurrency(simulatedMargin.breakdown?.totalFees || 0)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-3">
                          <span className="font-medium">Lucro Líquido</span>
                          <span className={`font-bold ${simulatedMargin.margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(simulatedMargin.margin)}
                          </span>
                        </div>
                      </div>
                      
                      {simulatedMargin.marginPercent < 10 && (
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm text-yellow-800">
                            <strong>Atenção:</strong> Margem abaixo de 10% pode não cobrir custos operacionais.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Preencha o preço e custo para simular a margem</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
