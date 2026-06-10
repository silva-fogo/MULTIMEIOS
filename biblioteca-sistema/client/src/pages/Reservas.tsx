import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Reservas() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLivroId, setSelectedLivroId] = useState("");

  const { data: reservas, isLoading: reservasLoading, refetch: refetchReservas } = trpc.reservas.list.useQuery();
  const { data: livros } = trpc.livros.list.useQuery();
  const createReserva = trpc.reservas.create.useMutation();
  const cancelarReserva = trpc.reservas.cancelar.useMutation();

  const isAdmin = user?.role === "admin" || user?.role === "bibliotecario";

  const handleCreateReserva = async (livroId: number) => {
    try {
      await createReserva.mutateAsync({ livroId });
      toast.success("Reserva criada com sucesso!");
      setIsOpen(false);
      setSelectedLivroId("");
      refetchReservas();
    } catch (error) {
      toast.error("Erro ao criar reserva");
    }
  };

  const handleCancelarReserva = async (id: number) => {
    if (confirm("Tem certeza que deseja cancelar esta reserva?")) {
      try {
        await cancelarReserva.mutateAsync({ id });
        toast.success("Reserva cancelada com sucesso!");
        refetchReservas();
      } catch (error) {
        toast.error("Erro ao cancelar reserva");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativa":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Ativa</span>;
      case "cancelada":
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">Cancelada</span>;
      case "concluida":
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Concluída</span>;
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
              <AlertCircle className="w-8 h-8 text-primary" />
              Gerenciamento de Reservas
            </h1>
            <p className="text-muted-foreground mt-2">
              Reserve livros indisponíveis e gerencie a fila de espera.
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedLivroId("")}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Reserva
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Reserva</DialogTitle>
                <DialogDescription>
                  Selecione um livro para reservar.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={selectedLivroId} onValueChange={setSelectedLivroId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um livro" />
                  </SelectTrigger>
                  <SelectContent>
                    {livros?.filter(l => l.copiasDisponiveis === 0).map((l) => (
                      <SelectItem key={l.id} value={l.id.toString()}>
                        {l.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    if (selectedLivroId) {
                      handleCreateReserva(parseInt(selectedLivroId));
                    }
                  }}
                  disabled={!selectedLivroId}
                  className="w-full"
                >
                  Criar Reserva
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabela de Reservas */}
        <Card>
          <CardHeader>
            <CardTitle>Reservas</CardTitle>
            <CardDescription>
              Total de {reservas?.length || 0} reserva(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reservasLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando reservas...
              </div>
            ) : !reservas || reservas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma reserva encontrada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Livro</TableHead>
                      <TableHead>Posição Fila</TableHead>
                      <TableHead>Data Reserva</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservas.map((res) => (
                      <TableRow key={res.id}>
                        <TableCell className="font-medium">{res.usuarioId}</TableCell>
                        <TableCell>{res.livroId}</TableCell>
                        <TableCell>{res.posicaoFila}</TableCell>
                        <TableCell>
                          {format(new Date(res.dataReserva), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{getStatusBadge(res.status)}</TableCell>
                        <TableCell>
                          {res.status === "ativa" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelarReserva(res.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
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
