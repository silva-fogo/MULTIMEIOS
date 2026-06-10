import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { FileText, Download } from "lucide-react";
import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Relatorios() {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState("mes");
  const [tipoRelatorio, setTipoRelatorio] = useState("livros");

  const { data: livrosMais, isLoading: livrosLoading } = trpc.dashboard.livrosMaisEmprestados.useQuery({ limit: 10 });
  const { data: usuariosMais, isLoading: usuariosLoading } = trpc.dashboard.usuariosMaisAtivos.useQuery({ limit: 10 });
  const { data: multas, isLoading: multasLoading } = trpc.multas.list.useQuery();
  const { data: emprestimos, isLoading: emprestimosLoading } = trpc.emprestimos.list.useQuery();

  const isAdmin = user?.role === "admin" || user?.role === "bibliotecario";

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleExportPDF = () => {
    // Implementar exportação para PDF
    alert("Exportação para PDF em desenvolvimento");
  };

  const handleExportExcel = () => {
    // Implementar exportação para Excel
    alert("Exportação para Excel em desenvolvimento");
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-8 h-8 text-primary" />
              Relatórios
            </h1>
            <p className="text-muted-foreground mt-2">
              Visualize relatórios e analise dados da biblioteca.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Período</label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semana">Última Semana</SelectItem>
                  <SelectItem value="mes">Último Mês</SelectItem>
                  <SelectItem value="trimestre">Último Trimestre</SelectItem>
                  <SelectItem value="ano">Último Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Tipo de Relatório</label>
              <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="livros">Livros Mais Emprestados</SelectItem>
                  <SelectItem value="usuarios">Usuários Mais Ativos</SelectItem>
                  <SelectItem value="multas">Multas Geradas</SelectItem>
                  <SelectItem value="emprestimos">Empréstimos por Período</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Gráficos */}
        {tipoRelatorio === "livros" && (
          <Card>
            <CardHeader>
              <CardTitle>Livros Mais Emprestados</CardTitle>
              <CardDescription>Top 10 livros com mais empréstimos no período</CardDescription>
            </CardHeader>
            <CardContent>
              {livrosLoading ? (
                <Skeleton className="h-80" />
              ) : livrosMais && livrosMais.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={livrosMais}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="titulo" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="var(--color-primary)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tipoRelatorio === "usuarios" && (
          <Card>
            <CardHeader>
              <CardTitle>Usuários Mais Ativos</CardTitle>
              <CardDescription>Top 10 usuários com mais empréstimos no período</CardDescription>
            </CardHeader>
            <CardContent>
              {usuariosLoading ? (
                <Skeleton className="h-80" />
              ) : usuariosMais && usuariosMais.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={usuariosMais}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="var(--color-accent)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tipoRelatorio === "multas" && (
          <Card>
            <CardHeader>
              <CardTitle>Multas Geradas</CardTitle>
              <CardDescription>Multas geradas no período</CardDescription>
            </CardHeader>
            <CardContent>
              {multasLoading ? (
                <Skeleton className="h-80" />
              ) : multas && multas.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={multas}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="data" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total" fill="var(--color-destructive)" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Total de Multas</div>
                        <div className="text-2xl font-bold">
                          R$ {multas?.reduce((sum: number, m: any) => sum + parseFloat(m.valor), 0).toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Multas Pagas</div>
                        <div className="text-2xl font-bold text-green-600">
                          {multas?.filter((m: any) => m.status === "paga").length || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Multas Pendentes</div>
                        <div className="text-2xl font-bold text-red-600">
                          {multas?.filter((m: any) => m.status === "pendente").length || 0}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tipoRelatorio === "emprestimos" && (
          <Card>
            <CardHeader>
              <CardTitle>Empréstimos por Período</CardTitle>
              <CardDescription>Evolução de empréstimos ao longo do período</CardDescription>
            </CardHeader>
            <CardContent>
              {emprestimosLoading ? (
                <Skeleton className="h-80" />
              ) : emprestimos && emprestimos.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={emprestimos}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="emprestimos" stroke="var(--color-primary)" />
                    <Line type="monotone" dataKey="devolucoes" stroke="var(--color-accent)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
