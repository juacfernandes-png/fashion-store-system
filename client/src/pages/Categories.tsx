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
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Categories() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: number; name: string; description: string | null } | null>(null);
  
  const utils = trpc.useUtils();
  
  const { data: categories, isLoading } = trpc.categories.list.useQuery();
  
  const createCategory = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success("Categoria criada com sucesso!");
      utils.categories.list.invalidate();
      setIsCreateOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar categoria");
    }
  });
  
  const updateCategory = trpc.categories.update.useMutation({
    onSuccess: () => {
      toast.success("Categoria atualizada com sucesso!");
      utils.categories.list.invalidate();
      setEditingCategory(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar categoria");
    }
  });
  
  const deleteCategory = trpc.categories.delete.useMutation({
    onSuccess: () => {
      toast.success("Categoria excluída com sucesso!");
      utils.categories.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir categoria");
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createCategory.mutate({
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCategory) return;
    
    const formData = new FormData(e.currentTarget);
    
    updateCategory.mutate({
      id: editingCategory.id,
      data: {
        name: formData.get("name") as string,
        description: formData.get("description") as string || undefined,
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta categoria?")) {
      deleteCategory.mutate({ id });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Categorias</h1>
            <p className="text-muted-foreground">
              Organize seus produtos em categorias
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Categoria</DialogTitle>
                <DialogDescription>
                  Crie uma nova categoria para organizar seus produtos
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input id="name" name="name" required placeholder="Ex: Vestidos" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" name="description" placeholder="Descrição da categoria" />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createCategory.isPending}>
                    {createCategory.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : categories && categories.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map(category => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingCategory({
                              id: category.id,
                              name: category.name,
                              description: category.description
                            })}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(category.id)}
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
                <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhuma categoria encontrada</h3>
                <p className="text-muted-foreground">
                  Comece criando sua primeira categoria
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Categoria</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome *</Label>
                <Input 
                  id="edit-name" 
                  name="name" 
                  required 
                  defaultValue={editingCategory?.name} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea 
                  id="edit-description" 
                  name="description" 
                  defaultValue={editingCategory?.description || ''} 
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateCategory.isPending}>
                  {updateCategory.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
