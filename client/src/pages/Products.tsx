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
import { Plus, Search, Edit, Trash2, Package, Eye, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatCurrency(value: string | number) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num);
}

export default function Products() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  
  const utils = trpc.useUtils();
  
  const { data: products, isLoading } = trpc.products.list.useQuery({
    search: search || undefined,
    categoryId: categoryFilter !== "all" ? parseInt(categoryFilter) : undefined
  });
  
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: suppliers } = trpc.suppliers.list.useQuery();
  const { data: productDetails } = trpc.products.getById.useQuery(
    { id: selectedProduct! },
    { enabled: !!selectedProduct && isViewOpen }
  );
  
  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Produto criado com sucesso!");
      utils.products.list.invalidate();
      setIsCreateOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar produto");
    }
  });
  
  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success("Produto excluído com sucesso!");
      utils.products.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir produto");
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createProduct.mutate({
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
      barcode: formData.get("barcode") as string || undefined,
      categoryId: formData.get("categoryId") ? parseInt(formData.get("categoryId") as string) : undefined,
      supplierId: formData.get("supplierId") ? parseInt(formData.get("supplierId") as string) : undefined,
      brand: formData.get("brand") as string || undefined,
      costPrice: formData.get("costPrice") as string,
      salePrice: formData.get("salePrice") as string,
      minStock: parseInt(formData.get("minStock") as string) || 0,
      maxStock: parseInt(formData.get("maxStock") as string) || 1000,
      unit: formData.get("unit") as string || "UN"
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteProduct.mutate({ id });
    }
  };

  const getStockStatus = (current: number, min: number, max: number) => {
    if (current === 0) return { label: "Sem Estoque", variant: "destructive" as const };
    if (current <= min) return { label: "Baixo", variant: "destructive" as const };
    if (current >= max) return { label: "Alto", variant: "secondary" as const };
    return { label: "Normal", variant: "default" as const };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
            <p className="text-muted-foreground">
              Gerencie o catálogo de produtos da sua loja
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Produto</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo produto
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código *</Label>
                    <Input id="code" name="code" required placeholder="PRD001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Código de Barras</Label>
                    <Input id="barcode" name="barcode" placeholder="7891234567890" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input id="name" name="name" required placeholder="Nome do produto" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" name="description" placeholder="Descrição detalhada do produto" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Categoria</Label>
                    <Select name="categoryId">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map(cat => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplierId">Fornecedor</Label>
                    <Select name="supplierId">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers?.map(sup => (
                          <SelectItem key={sup.id} value={sup.id.toString()}>
                            {sup.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca</Label>
                    <Input id="brand" name="brand" placeholder="Marca do produto" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unidade</Label>
                    <Select name="unit" defaultValue="UN">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UN">Unidade</SelectItem>
                        <SelectItem value="PC">Peça</SelectItem>
                        <SelectItem value="CJ">Conjunto</SelectItem>
                        <SelectItem value="KIT">Kit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Preço de Custo *</Label>
                    <Input id="costPrice" name="costPrice" type="number" step="0.01" required placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salePrice">Preço de Venda *</Label>
                    <Input id="salePrice" name="salePrice" type="number" step="0.01" required placeholder="0.00" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minStock">Estoque Mínimo</Label>
                    <Input id="minStock" name="minStock" type="number" defaultValue="5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxStock">Estoque Máximo</Label>
                    <Input id="maxStock" name="maxStock" type="number" defaultValue="100" />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createProduct.isPending}>
                    {createProduct.isPending ? "Salvando..." : "Salvar"}
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
                  placeholder="Buscar por nome ou código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories?.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Venda</TableHead>
                    <TableHead className="text-center">Estoque</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(product => {
                    const status = getStockStatus(product.currentStock, product.minStock, product.maxStock);
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-sm">{product.code}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            {product.brand && (
                              <p className="text-sm text-muted-foreground">{product.brand}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {categories?.find(c => c.id === product.categoryId)?.name || '-'}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(product.costPrice)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(product.salePrice)}</TableCell>
                        <TableCell className="text-center">{product.currentStock}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedProduct(product.id);
                                setIsViewOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(product.id)}
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
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground">
                  Comece adicionando seu primeiro produto
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Product Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Produto</DialogTitle>
            </DialogHeader>
            {productDetails && (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="variants">Variações</TabsTrigger>
                  <TabsTrigger value="images">Imagens</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Código</p>
                      <p className="font-medium">{productDetails.code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Código de Barras</p>
                      <p className="font-medium">{productDetails.barcode || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Nome</p>
                      <p className="font-medium">{productDetails.name}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Descrição</p>
                      <p className="font-medium">{productDetails.description || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Categoria</p>
                      <p className="font-medium">{productDetails.category?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fornecedor</p>
                      <p className="font-medium">{productDetails.supplier?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Marca</p>
                      <p className="font-medium">{productDetails.brand || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unidade</p>
                      <p className="font-medium">{productDetails.unit}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Preço de Custo</p>
                      <p className="font-medium">{formatCurrency(productDetails.costPrice)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Preço de Venda</p>
                      <p className="font-medium">{formatCurrency(productDetails.salePrice)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estoque Atual</p>
                      <p className="font-medium">{productDetails.currentStock}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Est. Mín / Máx</p>
                      <p className="font-medium">{productDetails.minStock} / {productDetails.maxStock}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="variants" className="space-y-4">
                  {productDetails.variants && productDetails.variants.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Tamanho</TableHead>
                          <TableHead>Cor</TableHead>
                          <TableHead className="text-center">Estoque</TableHead>
                          <TableHead className="text-right">Adicional</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productDetails.variants.map(variant => (
                          <TableRow key={variant.id}>
                            <TableCell className="font-mono">{variant.sku}</TableCell>
                            <TableCell>{variant.size || '-'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {variant.colorHex && (
                                  <div 
                                    className="w-4 h-4 rounded-full border"
                                    style={{ backgroundColor: variant.colorHex }}
                                  />
                                )}
                                {variant.color || '-'}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{variant.stock}</TableCell>
                            <TableCell className="text-right">
                              {variant.additionalPrice ? formatCurrency(variant.additionalPrice) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma variação cadastrada
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="images" className="space-y-4">
                  {productDetails.images && productDetails.images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                      {productDetails.images.map(image => (
                        <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden border">
                          <img 
                            src={image.url} 
                            alt="Produto" 
                            className="w-full h-full object-cover"
                          />
                          {image.isPrimary && (
                            <Badge className="absolute top-2 left-2">Principal</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mb-2" />
                      <p>Nenhuma imagem cadastrada</p>
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
