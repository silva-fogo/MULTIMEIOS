import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BookOpen, Mail, Lock, AlertCircle } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = trpc.auth.loginWithEmail.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email || !senha) {
      setError("Por favor, preencha todos os campos");
      setIsLoading(false);
      return;
    }

    if (!email.includes("@")) {
      setError("Por favor, insira um email válido");
      setIsLoading(false);
      return;
    }

    try {
      const result = await loginMutation.mutateAsync({ email, senha });
      if (result.success) {
        toast.success("Login realizado com sucesso!");
        setLocation("/");
      } else {
        setError(result.message || "Erro ao fazer login");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary text-white p-3 rounded-lg">
              <BookOpen className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Biblioteca</h1>
          <p className="text-muted-foreground mt-2">Sistema de Gestão de Biblioteca</p>
        </div>

        {/* Card de Login */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle>Faça Login</CardTitle>
            <CardDescription>
              Acesse sua conta com email e senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Erro */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="border-blue-200 dark:border-blue-800"
                />
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="senha" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Senha
                </Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="Sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={isLoading}
                  className="border-blue-200 dark:border-blue-800"
                />
              </div>

              {/* Botão de Login */}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            {/* Link para Cadastro */}
            <div className="text-center text-sm mt-4">
              <p className="text-muted-foreground">
                Não tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => setLocation("/register")}
                  className="text-primary hover:underline font-semibold"
                  disabled={isLoading}
                >
                  Cadastre-se aqui
                </button>
              </p>
            </div>

            {/* Informações de Teste */}
            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Credenciais de Teste:
              </p>
              <div className="space-y-1 text-xs text-blue-800 dark:text-blue-400">
                <p><strong>Admin:</strong> admin@biblioteca.com / admin123</p>
                <p><strong>Bibliotecário:</strong> bibliotecario@biblioteca.com / bibliotecario123</p>
                <p><strong>Leitor:</strong> leitor@biblioteca.com / leitor123</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rodapé */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 Sistema de Gestão de Biblioteca. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
