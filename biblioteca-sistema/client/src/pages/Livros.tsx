import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { BookOpen, Plus, Search, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Livros() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    autor: "",
    isbn: "",
    categoriaId: "",
    descricao: "",
    totalCopias: "1",
  });

  const { data: livros, isLoading: livrosLoading, refetch: refetchLivros } = trpc.livros.list.useQuery();
  const { data: categorias } = trpc.categorias.list.useQuery();
  const createLivro = trpc.livros.create.useMutation();
  const updateLivro = trpc.livros.update.useMutation();
  const deleteLivro = trpc.livros.delete.useMutation();
  const isAdmin = user?.role === "admin" || user?.role === "bibliotecario";

  const handleSearch = async () => {
    // Busca é feita localmente no filtro abaixo
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.autor || !formData.categoriaId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (editingId) {
        await updateLivro.mutateAsync({
          id: editingId,
          titulo: formData.titulo,
          autor: formData.autor,
          isbn: formData.isbn || undefined,
          descricao: formData.descricao || undefined,
          totalCopias: parseInt(formData.totalCopias),
          copiasDisponiveis: parseInt(formData.totalCopias),
        });
        toast.success("Livro atualizado com sucesso!");
      } else {
        await createLivro.mutateAsync({
          ...formData,
          totalCopias: parseInt(formData.totalCopias),
          categoriaId: parseInt(formData.categoriaId),
        });
        toast.success("Livro criado com sucesso!");
      }
      
      setFormData({
        titulo: "",
        autor: "",
        isbn: "",
        categoriaId: "",
        descricao: "",
        totalCopias: "1",
      });
      setEditingId(null);
      setIsOpen(false);
      refetchLivros();
    } catch (error) {
      toast.error("Erro ao salvar livro");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar este livro?")) {
      try {
        await deleteLivro.mutateAsync({ id });
        toast.success("Livro deletado com sucesso!");
        refetchLivros();
      } catch (error) {
        toast.error("Erro ao deletar livro");
      }
    }
  };

  const displayedLivros = livros?.filter(livro =>
    livro.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    livro.autor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (livro.isbn?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  ) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-primary" />
              Gerenciamento de Livros
            </h1>
            <p className="text-muted-foreground mt-2">
              Cadastre, edite e gerencie todos os livros da biblioteca.
            </p>
          </div>
          {isAdmin && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingId(null);
                  setFormData({
                    titulo: "",
                    autor: "",
                    isbn: "",
                    categoriaId: "",
                    descricao: "",
                    totalCopias: "1",
                  });
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Livro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar Livro" : "Novo Livro"}</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do livro abaixo.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="titulo">Título *</Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      placeholder="Título do livro"
                    />
                  </div>
                  <div>
                    <Label htmlFor="autor">Autor *</Label>
                    <Input
                      id="autor"
                      value={formData.autor}
                      onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
                      placeholder="Nome do autor"
                    />
                  </div>
                  <div>
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      value={formData.isbn}
                      onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                      placeholder="ISBN"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Select value={formData.categoriaId} onValueChange={(value) => setFormData({ ...formData, categoriaId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="totalCopias">Total de Cópias *</Label>
              <Input
                id="totalCopias"
                type="number"
                min="1"
                value={formData.totalCopias}
                onChange={(e) => setFormData({ ...formData, totalCopias: e.target.value })}
                required
              />
                  </div>
                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descrição do livro"
                      rows={4}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingId ? "Atualizar" : "Criar"} Livro
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Busca */}
        <Card>
          <CardHeader>
            <CardTitle>Buscar Livros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por título, autor ou ISBN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={() => setSearchTerm("")} variant="outline">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Livros */}
        <Card>
          <CardHeader>
            <CardTitle>Livros Cadastrados</CardTitle>
            <CardDescription>
              Total de {displayedLivros.length} livro(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {livrosLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando livros...
              </div>
            ) : displayedLivros.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum livro encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Autor</TableHead>
                      <TableHead>ISBN</TableHead>
                      <TableHead>Cópias</TableHead>
                      <TableHead>Disponíveis</TableHead>
                      {isAdmin && <TableHead>Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedLivros.map((livro) => (
                      <TableRow key={livro.id}>
                        <TableCell className="font-medium">{livro.titulo}</TableCell>
                        <TableCell>{livro.autor}</TableCell>
                        <TableCell>{livro.isbn || "-"}</TableCell>
                        <TableCell>{livro.totalCopias}</TableCell>
                        <TableCell>{livro.copiasDisponiveis}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingId(livro.id);
                                  setFormData({
                                    titulo: livro.titulo,
                                    autor: livro.autor,
                                    isbn: livro.isbn || "",
                                    categoriaId: livro.categoriaId.toString(),
                                    descricao: livro.descricao || "",
                                    totalCopias: livro.totalCopias.toString(),
                                  });
                                  setIsOpen(true);
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(livro.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
