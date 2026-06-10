import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

export default function Logs() {
  const { user } = useAuth();
  const [acaoFilter, setAcaoFilter] = useState("");
  const [tabelaFilter, setTabelaFilter] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  
  const { data: logs, isLoading: logsLoading } = trpc.logs.list.useQuery();

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

  // Filtrar logs baseado nos filtros selecionados
  const filteredLogs = logs?.filter(log => {
    const matchesAcao = !acaoFilter || log.acao === acaoFilter;
    const matchesTabela = !tabelaFilter || log.tabelaAfetada === tabelaFilter;
    
    let matchesData = true;
    if (dataInicio || dataFim) {
      const logDate = new Date(log.createdAt);
      if (dataInicio) {
        const inicio = new Date(dataInicio);
        matchesData = matchesData && logDate >= inicio;
      }
      if (dataFim) {
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        matchesData = matchesData && logDate <= fim;
      }
    }
    
    return matchesAcao && matchesTabela && matchesData;
  }) || [];

  // Extrair ações e tabelas únicas para filtros
  const acoes = Array.from(new Set(logs?.map(l => l.acao) || []));
  const tabelas = Array.from(new Set(logs?.map(l => l.tabelaAfetada) || []));

  const getAcaoBadge = (acao: string | null | undefined) => {
    const acaoStr = acao || "UNKNOWN";
    switch (acaoStr) {
      case "CREATE":
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Criado</span>;
      case "UPDATE":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Atualizado</span>;
      case "DELETE":
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">Deletado</span>;
      case "LOGIN":
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">Login</span>;
      case "LOGOUT":
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">Logout</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">{acaoStr}</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <AlertCircle className="w-8 h-8 text-primary" />
            Logs do Sistema
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualize todas as atividades e ações realizadas no sistema.
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtrar Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="acao">Ação</Label>
                <Select value={acaoFilter} onValueChange={setAcaoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as ações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as ações</SelectItem>
                    {acoes.map(acao => (
                      <SelectItem key={acao} value={acao}>
                        {acao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tabela">Tabela</Label>
                <Select value={tabelaFilter} onValueChange={setTabelaFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as tabelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as tabelas</SelectItem>
                    {tabelas.map(tabela => (
                      <SelectItem key={tabela || ""} value={tabela || ""}>
                        {tabela || "-"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>
              Total de {filteredLogs.length} atividade(s) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando logs...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum log encontrado com os filtros selecionados
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Tabela</TableHead>
                      <TableHead>Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">{String(log.usuarioId) || "Sistema"}</TableCell>
                        <TableCell>{getAcaoBadge(log.acao)}</TableCell>
                        <TableCell>{log.tabelaAfetada || "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{log.descricao || "-"}</TableCell>
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
