import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BookOpen, Users, BookMarked, AlertCircle, TrendingUp } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: livrosMais, isLoading: livrosLoading } = trpc.dashboard.livrosMaisEmprestados.useQuery({ limit: 5 });
  const { data: usuariosMais, isLoading: usuariosLoading } = trpc.dashboard.usuariosMaisAtivos.useQuery({ limit: 5 });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="text-center max-w-md">
          <BookOpen className="w-16 h-16 mx-auto mb-6 text-primary" />
          <h1 className="text-4xl font-bold mb-4 text-foreground">Sistema de Gestão de Biblioteca</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Gerencie livros, empréstimos, reservas e multas de forma eficiente e intuitiva.
          </p>
          <Button size="lg" className="w-full">
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bem-vindo, {user?.name || "Usuário"}!</h1>
          <p className="text-muted-foreground mt-2">
            Aqui está um resumo das atividades da biblioteca.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Livros</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalLivros || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Livros cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalUsuarios || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Usuários ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empréstimos Ativos</CardTitle>
              <BookMarked className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.emprestimosAtivos || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Em circulação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Livros Disponíveis</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.livrosDisponiveis || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Prontos para empréstimo</p>
            </CardContent>
          </Card>

          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atrasos</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-destructive">{stats?.emprestimosAtrasados || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Empréstimos atrasados</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Livros Mais Emprestados */}
          <Card>
            <CardHeader>
              <CardTitle>Livros Mais Emprestados</CardTitle>
              <CardDescription>Top 5 livros com mais empréstimos</CardDescription>
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

          {/* Usuários Mais Ativos */}
          <Card>
            <CardHeader>
              <CardTitle>Usuários Mais Ativos</CardTitle>
              <CardDescription>Top 5 usuários com mais empréstimos</CardDescription>
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
        </div>

        {/* Quick Actions */}
        {(user?.role === "admin" || user?.role === "bibliotecario") && (
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>Acesso rápido às funcionalidades principais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="w-full">
                  Novo Livro
                </Button>
                <Button variant="outline" className="w-full">
                  Novo Empréstimo
                </Button>
                <Button variant="outline" className="w-full">
                  Novo Usuário
                </Button>
                <Button variant="outline" className="w-full">
                  Relatórios
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
