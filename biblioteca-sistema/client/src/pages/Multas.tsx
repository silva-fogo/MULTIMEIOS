import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Multas() {
  const { user } = useAuth();
  const [selectedMulta, setSelectedMulta] = useState<number | null>(null);
  const [isPagando, setIsPagando] = useState(false);

  const { data: multas, isLoading: multasLoading, refetch: refetchMultas } = trpc.multas.list.useQuery();
  const registrarPagamento = trpc.multas.registrarPagamento.useMutation();

  const isAdmin = user?.role === "admin" || user?.role === "bibliotecario";

  const handleRegistrarPagamento = async () => {
    if (!selectedMulta) return;

    try {
      await registrarPagamento.mutateAsync({ id: selectedMulta });
      toast.success("Pagamento registrado com sucesso!");
      setIsPagando(false);
      setSelectedMulta(null);
      refetchMultas();
    } catch (error) {
      toast.error("Erro ao registrar pagamento");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">Pendente</span>;
      case "paga":
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Paga</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">{status}</span>;
    }
  };

  const totalPendente = multas
    ?.filter(m => m.status === "pendente")
    .reduce((sum, m) => sum + parseFloat(m.valor), 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <AlertCircle className="w-8 h-8 text-primary" />
            Gerenciamento de Multas
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe multas por atraso e registre pagamentos.
          </p>
        </div>

        {/* Card de Total Pendente */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Total Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">
              R$ {totalPendente.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Multas */}
        <Card>
          <CardHeader>
            <CardTitle>Multas</CardTitle>
            <CardDescription>
              Total de {multas?.length || 0} multa(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {multasLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando multas...
              </div>
            ) : !multas || multas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma multa encontrada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Empréstimo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data Geração</TableHead>
                      <TableHead>Data Pagamento</TableHead>
                      <TableHead>Status</TableHead>
                      {isAdmin && <TableHead>Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {multas.map((multa) => (
                      <TableRow key={multa.id}>
                        <TableCell className="font-medium">{multa.usuarioId}</TableCell>
                        <TableCell>{multa.emprestimoId}</TableCell>
                        <TableCell>R$ {parseFloat(multa.valor).toFixed(2)}</TableCell>
                        <TableCell>
                          {format(new Date(multa.dataGeracao), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {multa.dataPagamento
                            ? format(new Date(multa.dataPagamento), "dd/MM/yyyy", { locale: ptBR })
                            : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(multa.status)}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            {multa.status === "pendente" && (
                              <Dialog open={isPagando && selectedMulta === multa.id} onOpenChange={(open) => {
                                if (open) {
                                  setSelectedMulta(multa.id);
                                  setIsPagando(true);
                                } else {
                                  setIsPagando(false);
                                  setSelectedMulta(null);
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedMulta(multa.id);
                                      setIsPagando(true);
                                    }}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Registrar Pagamento</DialogTitle>
                                    <DialogDescription>
                                      Tem certeza que deseja registrar o pagamento desta multa?
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="bg-gray-100 p-4 rounded">
                                      <p className="text-sm text-gray-600">Valor da multa:</p>
                                      <p className="text-2xl font-bold">R$ {parseFloat(multa.valor).toFixed(2)}</p>
                                    </div>
                                    <Button onClick={handleRegistrarPagamento} className="w-full">
                                      Confirmar Pagamento
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
