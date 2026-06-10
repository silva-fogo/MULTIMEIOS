import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Users, Plus, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Usuarios() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [roleFilter, setRoleFilter] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "leitor",
  });

  const { data: usuarios, isLoading: usuariosLoading, refetch: refetchUsuarios } = trpc.usuarios.list.useQuery();
  const createUsuario = trpc.usuarios.create.useMutation();
  const updateUsuario = trpc.usuarios.update.useMutation();
  const deleteUsuario = trpc.usuarios.delete.useMutation();

  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.role) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (editingId) {
        await updateUsuario.mutateAsync({
          id: editingId,
          name: formData.name,
          email: formData.email,
          role: formData.role as "admin" | "bibliotecario" | "leitor",
        });
        toast.success("Usuário atualizado com sucesso!");
      } else {
        await createUsuario.mutateAsync({
          name: formData.name,
          email: formData.email,
          role: formData.role as "admin" | "bibliotecario" | "leitor",
        });
        toast.success("Usuário criado com sucesso!");
      }
      
      setFormData({
        name: "",
        email: "",
        role: "leitor",
      });
      setEditingId(null);
      setIsOpen(false);
      refetchUsuarios();
    } catch (error) {
      toast.error("Erro ao salvar usuário");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar este usuário?")) {
      try {
        await deleteUsuario.mutateAsync({ id });
        toast.success("Usuário deletado com sucesso!");
        refetchUsuarios();
      } catch (error) {
        toast.error("Erro ao deletar usuário");
      }
    }
  };

  const filteredUsuarios = usuarios?.filter(u =>
    !roleFilter || u.role === roleFilter
  ) || [];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">Administrador</span>;
      case "bibliotecario":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Bibliotecário</span>;
      case "leitor":
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Leitor</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">{role}</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-8 h-8 text-primary" />
              Gerenciamento de Usuários
            </h1>
            <p className="text-muted-foreground mt-2">
              Cadastre e gerencie os usuários da biblioteca.
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingId(null);
                setFormData({
                  name: "",
                  email: "",
                  role: "leitor",
                });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
                <DialogDescription>
                  Preencha os dados do usuário abaixo.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do usuário"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email do usuário"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Perfil *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leitor">Leitor</SelectItem>
                      <SelectItem value="bibliotecario">Bibliotecário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? "Atualizar" : "Criar"} Usuário
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtro */}
        <Card>
          <CardHeader>
            <CardTitle>Filtrar Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os perfis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os perfis</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="bibliotecario">Bibliotecário</SelectItem>
                <SelectItem value="leitor">Leitor</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Tabela de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários Cadastrados</CardTitle>
            <CardDescription>
              Total de {filteredUsuarios.length} usuário(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usuariosLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando usuários...
              </div>
            ) : filteredUsuarios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Data Cadastro</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsuarios.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(u.id);
                                setFormData({
                                  name: u.name || "",
                                  email: u.email || "",
                                  role: u.role,
                                });
                                setIsOpen(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(u.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
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
