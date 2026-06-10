import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BookOpen, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const registerMutation = trpc.auth.registerWithEmail.useMutation();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    // Validações
    if (!nome || !email || !senha || !confirmSenha) {
      setError("Por favor, preencha todos os campos");
      setIsLoading(false);
      return;
    }

    if (nome.length < 3) {
      setError("Nome deve ter pelo menos 3 caracteres");
      setIsLoading(false);
      return;
    }

    if (!email.includes("@")) {
      setError("Por favor, insira um email válido");
      setIsLoading(false);
      return;
    }

    if (senha.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    if (senha !== confirmSenha) {
      setError("As senhas não coincidem");
      setIsLoading(false);
      return;
    }

    try {
      const result = await registerMutation.mutateAsync({ email, nome, senha });
      if (result.success) {
        setSuccess(true);
        toast.success("Cadastro realizado com sucesso! Redirecionando para dashboard...");
        setTimeout(() => {
          setLocation("/");
        }, 1500);
      } else {
        setError(result.message || "Erro ao cadastrar");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao cadastrar. Tente novamente.");
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
          <p className="text-muted-foreground mt-2">Crie sua conta</p>
        </div>

        {/* Card de Cadastro */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle>Cadastre-se</CardTitle>
            <CardDescription>
              Crie uma conta para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Erro */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Sucesso */}
              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-600 dark:text-green-400">Cadastro realizado com sucesso!</p>
                </div>
              )}

              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nome Completo
                </Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={isLoading || success}
                  className="border-blue-200 dark:border-blue-800"
                />
              </div>

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
                  disabled={isLoading || success}
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
                  placeholder="Sua senha (mín. 6 caracteres)"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={isLoading || success}
                  className="border-blue-200 dark:border-blue-800"
                />
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-2">
                <Label htmlFor="confirmSenha" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Confirmar Senha
                </Label>
                <Input
                  id="confirmSenha"
                  type="password"
                  placeholder="Confirme sua senha"
                  value={confirmSenha}
                  onChange={(e) => setConfirmSenha(e.target.value)}
                  disabled={isLoading || success}
                  className="border-blue-200 dark:border-blue-800"
                />
              </div>

              {/* Botão de Cadastro */}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white"
                disabled={isLoading || success}
              >
                {isLoading ? "Cadastrando..." : "Cadastrar"}
              </Button>

              {/* Link para Login */}
              <div className="text-center text-sm">
                <p className="text-muted-foreground">
                  Já tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => setLocation("/login")}
                    className="text-primary hover:underline font-semibold"
                    disabled={isLoading}
                  >
                    Faça login
                  </button>
                </p>
              </div>
            </form>
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
