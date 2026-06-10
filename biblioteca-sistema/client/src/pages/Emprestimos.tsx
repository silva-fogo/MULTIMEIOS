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
import { BookMarked, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Emprestimos() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isDevolvendo, setIsDevolvendo] = useState(false);
  const [selectedEmprestimo, setSelectedEmprestimo] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    usuarioId: "",
    livroId: "",
    dataDevolucaoPrevista: "",
  });

  const { data: emprestimos, isLoading: emprestimosLoading, refetch: refetchEmprestimos } = trpc.emprestimos.list.useQuery();
  const { data: usuarios } = trpc.usuarios.list.useQuery();
  const { data: livros } = trpc.livros.list.useQuery();
  const createEmprestimo = trpc.emprestimos.create.useMutation();
  const registrarDevolucao = trpc.emprestimos.registrarDevolucao.useMutation();

  const isAdmin = user?.role === "admin" || user?.role === "bibliotecario";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.usuarioId || !formData.livroId || !formData.dataDevolucaoPrevista) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createEmprestimo.mutateAsync({
        usuarioId: parseInt(formData.usuarioId),
        livroId: parseInt(formData.livroId),
        dataDevolucaoPrevista: new Date(formData.dataDevolucaoPrevista),
      });
      toast.success("Empréstimo criado com sucesso!");
      setFormData({
        usuarioId: "",
        livroId: "",
        dataDevolucaoPrevista: "",
      });
      setIsOpen(false);
      refetchEmprestimos();
    } catch (error) {
      toast.error("Erro ao criar empréstimo");
    }
  };

  const handleDevolucao = async () => {
    if (!selectedEmprestimo) return;

    try {
      await registrarDevolucao.mutateAsync({
        id: selectedEmprestimo,
        dataDevolucao: new Date(),
      });
      toast.success("Devolução registrada com sucesso!");
      setIsDevolvendo(false);
      setSelectedEmprestimo(null);
      refetchEmprestimos();
    } catch (error) {
      toast.error("Erro ao registrar devolução");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Ativo</span>;
      case "devolvido":
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Devolvido</span>;
      case "atrasado":
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">Atrasado</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">{status}</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <BookMarked className="w-8 h-8 text-primary" />
              Gerenciamento de Empréstimos
            </h1>
            <p className="text-muted-foreground mt-2">
              Registre empréstimos, devoluções e acompanhe o histórico.
            </p>
          </div>
          {isAdmin && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setFormData({
                    usuarioId: "",
                    livroId: "",
                    dataDevolucaoPrevista: "",
                  });
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Empréstimo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Empréstimo</DialogTitle>
                  <DialogDescription>
                    Registre um novo empréstimo de livro.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="usuario">Usuário *</Label>
                    <Select value={formData.usuarioId} onValueChange={(value) => setFormData({ ...formData, usuarioId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {usuarios?.map((u) => (
                          <SelectItem key={u.id} value={u.id.toString()}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="livro">Livro *</Label>
                    <Select value={formData.livroId} onValueChange={(value) => setFormData({ ...formData, livroId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um livro" />
                      </SelectTrigger>
                      <SelectContent>
                        {livros?.filter(l => l.copiasDisponiveis > 0).map((l) => (
                          <SelectItem key={l.id} value={l.id.toString()}>
                            {l.titulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dataDevolucao">Data de Devolução Prevista *</Label>
                    <Input
                      id="dataDevolucao"
                      type="date"
                      value={formData.dataDevolucaoPrevista}
                      onChange={(e) => setFormData({ ...formData, dataDevolucaoPrevista: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Criar Empréstimo
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Tabela de Empréstimos */}
        <Card>
          <CardHeader>
            <CardTitle>Empréstimos</CardTitle>
            <CardDescription>
              Total de {emprestimos?.length || 0} empréstimo(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emprestimosLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando empréstimos...
              </div>
            ) : !emprestimos || emprestimos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum empréstimo encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Livro</TableHead>
                      <TableHead>Data Empréstimo</TableHead>
                      <TableHead>Devolução Prevista</TableHead>
                      <TableHead>Devolução Real</TableHead>
                      <TableHead>Status</TableHead>
                      {isAdmin && <TableHead>Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emprestimos.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.usuarioId}</TableCell>
                        <TableCell>{emp.livroId}</TableCell>
                        <TableCell>
                          {format(new Date(emp.dataEmprestimo), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {format(new Date(emp.dataDevolucaoPrevista), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {emp.dataDevolucaoReal
                            ? format(new Date(emp.dataDevolucaoReal), "dd/MM/yyyy", { locale: ptBR })
                            : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(emp.status)}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            {emp.status === "ativo" && (
                              <Dialog open={isDevolvendo && selectedEmprestimo === emp.id} onOpenChange={(open) => {
                                if (open) {
                                  setSelectedEmprestimo(emp.id);
                                  setIsDevolvendo(true);
                                } else {
                                  setIsDevolvendo(false);
                                  setSelectedEmprestimo(null);
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedEmprestimo(emp.id);
                                      setIsDevolvendo(true);
                                    }}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Registrar Devolução</DialogTitle>
                                    <DialogDescription>
                                      Tem certeza que deseja registrar a devolução deste livro?
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <Button onClick={handleDevolucao} className="w-full">
                                      Confirmar Devolução
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
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
