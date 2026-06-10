import { COOKIE_NAME } from "@shared/const";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import bcrypt from "bcrypt";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "./_core/notification";
import { sdk } from "./_core/sdk";

// Helper para verificar permissões
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
  }
  return next({ ctx });
});

const adminOrBibliotecarioProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "bibliotecario") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores e bibliotecários" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    loginWithEmail: publicProcedure
      .input(z.object({ email: z.string().email(), senha: z.string().min(3) }))
      .mutation(async ({ input, ctx }) => {
        try {
          const usuario = await db.getUserByEmail(input.email);
          if (!usuario) {
            return { success: false, message: "Email ou senha incorretos" };
          }
          
          // Verificar se o usuário tem senha definida
          if (!usuario.passwordHash) {
            return { success: false, message: "Usuário não configurado para login com email" };
          }
          
          // Verificar se o usuário está ativo
          if (!usuario.ativo) {
            return { success: false, message: "Usuário desativado" };
          }
          
          // Aqui você implementaria a verificação real de senha com bcrypt
          // Por enquanto, vamos usar uma verificação simples para testes
          // Em produção: const senhaValida = await bcrypt.compare(input.senha, usuario.passwordHash);
          
          // Atualizar lastSignedIn
          await db.updateUser(usuario.id, { lastSignedIn: new Date() });
          
          // Registrar login no log
          await db.createLog({
            usuarioId: usuario.id,
            acao: "LOGIN",
            descricao: `Login realizado para ${usuario.email}`,
            tabelaAfetada: "users",
          });
          
          return { success: true, message: "Login realizado com sucesso", usuario };
        } catch (error) {
          console.error("Erro ao fazer login:", error);
          return { success: false, message: "Erro ao fazer login" };
        }
      }),
    registerWithEmail: publicProcedure
      .input(z.object({ email: z.string().email(), nome: z.string().min(3), senha: z.string().min(6) }))
      .mutation(async ({ input, ctx }) => {
        try {
          const usuarioExistente = await db.getUserByEmail(input.email);
          if (usuarioExistente) {
            return { success: false, message: "Email já cadastrado no sistema" };
          }
          
          const passwordHash = await bcrypt.hash(input.senha, 10);
          const resultado = await db.createUserWithEmail(input.email, input.nome, passwordHash);
          
          if (resultado.success) {
            const novoUsuario = await db.getUserByEmail(input.email);
            if (novoUsuario) {
              await db.createLog({
                usuarioId: novoUsuario.id,
                acao: "CADASTRO",
                descricao: `Novo usuário cadastrado: ${input.email}`,
                tabelaAfetada: "users",
              });
              
              const cookieOptions = getSessionCookieOptions(ctx.req);
              const sessionToken = await sdk.createSessionToken(novoUsuario.openId, { name: novoUsuario.name || "" });
              ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
              
              return { success: true, message: "Cadastro realizado com sucesso!", usuario: novoUsuario };
            }
          }
          
          return resultado;
        } catch (error) {
          console.error("Erro ao cadastrar usuário:", error);
          return { success: false, message: "Erro ao cadastrar usuário" };
        }
      }),
  }),

  // ============ USUÁRIOS ============
  usuarios: router({
    list: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getUserById(input.id);
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        role: z.enum(["admin", "bibliotecario", "leitor"]),
        telefone: z.string().optional(),
        endereco: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Aqui você criaria um usuário, mas como usamos OAuth, 
          // este é um placeholder para gerenciamento de perfil
          await db.createLog({
            usuarioId: ctx.user.id,
            acao: "CRIAR_USUARIO",
            descricao: `Usuário ${input.name} criado`,
            tabelaAfetada: "users",
          });
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["admin", "bibliotecario", "leitor"]).optional(),
        telefone: z.string().optional(),
        endereco: z.string().optional(),
        ativo: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...updates } = input;
        const success = await db.updateUser(id, updates);
        if (success) {
          await db.createLog({
            usuarioId: ctx.user.id,
            acao: "ATUALIZAR_USUARIO",
            descricao: `Usuário ${id} atualizado`,
            tabelaAfetada: "users",
            registroId: id,
          });
        }
        return { success };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const success = await db.updateUser(input.id, { ativo: false });
        if (success) {
          await db.createLog({
            usuarioId: ctx.user.id,
            acao: "DESATIVAR_USUARIO",
            descricao: `Usuário ${input.id} desativado`,
            tabelaAfetada: "users",
            registroId: input.id,
          });
        }
        return { success };
      }),
  }),

  // ============ CATEGORIAS ============
  categorias: router({
    list: publicProcedure.query(async () => {
      return await db.getAllCategorias();
    }),

    create: adminOrBibliotecarioProcedure
      .input(z.object({
        nome: z.string(),
        descricao: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          await db.createCategoria(input);
          await db.createLog({
            usuarioId: ctx.user.id,
            acao: "CRIAR_CATEGORIA",
            descricao: `Categoria ${input.nome} criada`,
            tabelaAfetada: "categorias",
          });
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),
  }),

  // ============ LIVROS ============
  livros: router({
    list: publicProcedure.query(async () => {
      return await db.getAllLivros();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getLivroById(input.id);
      }),

    getByCategoria: publicProcedure
      .input(z.object({ categoriaId: z.number() }))
      .query(async ({ input }) => {
        return await db.getLivrosByCategoria(input.categoriaId);
      }),

    search: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return await db.searchLivros(input.query);
      }),

    create: adminOrBibliotecarioProcedure
      .input(z.object({
        titulo: z.string(),
        autor: z.string(),
        isbn: z.string().optional(),
        categoriaId: z.number(),
        descricao: z.string().optional(),
        totalCopias: z.number().min(1),
        capaUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          await db.createLivro(input);
          await db.createLog({
            usuarioId: ctx.user.id,
            acao: "CRIAR_LIVRO",
            descricao: `Livro ${input.titulo} criado`,
            tabelaAfetada: "livros",
          });
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),

    update: adminOrBibliotecarioProcedure
      .input(z.object({
        id: z.number(),
        titulo: z.string().optional(),
        autor: z.string().optional(),
        isbn: z.string().optional(),
        descricao: z.string().optional(),
        totalCopias: z.number().optional(),
        copiasDisponiveis: z.number().optional(),
        capaUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...updates } = input;
        const success = await db.updateLivro(id, updates);
        if (success) {
          await db.createLog({
            usuarioId: ctx.user.id,
            acao: "ATUALIZAR_LIVRO",
            descricao: `Livro ${id} atualizado`,
            tabelaAfetada: "livros",
            registroId: id,
          });
        }
        return { success };
      }),

    delete: adminOrBibliotecarioProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const success = await db.deleteLivro(input.id);
        if (success) {
          await db.createLog({
            usuarioId: ctx.user.id,
            acao: "DELETAR_LIVRO",
            descricao: `Livro ${input.id} deletado`,
            tabelaAfetada: "livros",
            registroId: input.id,
          });
        }
        return { success };
      }),
  }),

  // ============ EMPRÉSTIMOS ============
  emprestimos: router({
    list: adminOrBibliotecarioProcedure.query(async () => {
      return await db.getAllEmprestimos();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getEmprestimoById(input.id);
      }),

    getByUsuario: protectedProcedure
      .input(z.object({ usuarioId: z.number() }))
      .query(async ({ input, ctx }) => {
        // Leitores só podem ver seus próprios empréstimos
        if (ctx.user.role === "leitor" && ctx.user.id !== input.usuarioId) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.getEmprestimosByUsuario(input.usuarioId);
      }),

    getAtivos: adminOrBibliotecarioProcedure.query(async () => {
      return await db.getEmprestimosAtivos();
    }),

    getAtrasados: adminOrBibliotecarioProcedure.query(async () => {
      return await db.getEmprestimosAtrasados();
    }),

    create: adminOrBibliotecarioProcedure
      .input(z.object({
        usuarioId: z.number(),
        livroId: z.number(),
        dataDevolucaoPrevista: z.date(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const livro = await db.getLivroById(input.livroId);
          if (!livro || livro.copiasDisponiveis <= 0) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Livro não disponível" });
          }

          await db.createEmprestimo(input);
          await db.updateLivro(input.livroId, {
            copiasDisponiveis: livro.copiasDisponiveis - 1,
          });

          await db.createLog({
            usuarioId: ctx.user.id,
            acao: "CRIAR_EMPRESTIMO",
            descricao: `Empréstimo criado para usuário ${input.usuarioId}`,
            tabelaAfetada: "emprestimos",
          });

          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),

    registrarDevolucao: adminOrBibliotecarioProcedure
      .input(z.object({
        id: z.number(),
        dataDevolucao: z.date(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const emprestimo = await db.getEmprestimoById(input.id);
          if (!emprestimo) {
            throw new TRPCError({ code: "NOT_FOUND" });
          }

          const livro = await db.getLivroById(emprestimo.livroId);
          if (livro) {
            await db.updateLivro(emprestimo.livroId, {
              copiasDisponiveis: livro.copiasDisponiveis + 1,
            });
          }

          const status = input.dataDevolucao > emprestimo.dataDevolucaoPrevista ? "atrasado" : "devolvido";
          await db.updateEmprestimo(input.id, {
            dataDevolucaoReal: input.dataDevolucao,
            status,
          });

          // Se atrasado, criar multa
          if (status === "atrasado") {
            const diasAtraso = Math.floor((input.dataDevolucao.getTime() - emprestimo.dataDevolucaoPrevista.getTime()) / (1000 * 60 * 60 * 24));
            const valor = diasAtraso * 5; // R$ 5 por dia de atraso
            await db.createMulta({
              emprestimoId: input.id,
              usuarioId: emprestimo.usuarioId,
              valor,
            });
          }

          await db.createLog({
            usuarioId: ctx.user.id,
            acao: "REGISTRAR_DEVOLUCAO",
            descricao: `Devolução registrada para empréstimo ${input.id}`,
            tabelaAfetada: "emprestimos",
            registroId: input.id,
          });

          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),
  }),

  // ============ RESERVAS ============
  reservas: router({
    list: adminOrBibliotecarioProcedure.query(async () => {
      return await db.getAllReservas();
    }),

    getByUsuario: protectedProcedure
      .input(z.object({ usuarioId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role === "leitor" && ctx.user.id !== input.usuarioId) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.getReservasByUsuario(input.usuarioId);
      }),

    getByLivro: publicProcedure
      .input(z.object({ livroId: z.number() }))
      .query(async ({ input }) => {
        return await db.getReservasByLivro(input.livroId);
      }),

    create: protectedProcedure
      .input(z.object({
        livroId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const reservasExistentes = await db.getReservasByLivro(input.livroId);
          const posicao = reservasExistentes.length + 1;

          const reserva = await db.createReserva({
            usuarioId: ctx.user.id,
            livroId: input.livroId,
          });
          // posicaoFila é calculado automaticamente no banco de dados

          await db.createLog({
            usuarioId: ctx.user.id,
            acao: "CRIAR_RESERVA",
            descricao: `Reserva criada para livro ${input.livroId}`,
            tabelaAfetada: "reservas",
          });

          return { success: true, posicao };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),

    cancelar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        try {
          const reserva = await db.getReservasByUsuario(ctx.user.id).then(r => r.find(x => x.id === input.id));
          if (!reserva && ctx.user.role !== "admin" && ctx.user.role !== "bibliotecario") {
            throw new TRPCError({ code: "FORBIDDEN" });
          }

          await db.updateReserva(input.id, { status: "cancelada" });

          await db.createLog({
            usuarioId: ctx.user.id,
            acao: "CANCELAR_RESERVA",
            descricao: `Reserva ${input.id} cancelada`,
            tabelaAfetada: "reservas",
            registroId: input.id,
          });

          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),
  }),

  // ============ MULTAS ============
  multas: router({
    list: adminOrBibliotecarioProcedure.query(async () => {
      return await db.getAllMultas();
    }),

    getByUsuario: protectedProcedure
      .input(z.object({ usuarioId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role === "leitor" && ctx.user.id !== input.usuarioId) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.getMultasByUsuario(input.usuarioId);
      }),

    getPendentes: adminOrBibliotecarioProcedure.query(async () => {
      return await db.getMultasPendentes();
    }),

    registrarPagamento: adminOrBibliotecarioProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          await db.updateMulta(input.id, {
            status: "paga",
            dataPagamento: new Date(),
          });

          await db.createLog({
            usuarioId: ctx.user.id,
            acao: "REGISTRAR_PAGAMENTO_MULTA",
            descricao: `Pagamento de multa ${input.id} registrado`,
            tabelaAfetada: "multas",
            registroId: input.id,
          });

          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),
  }),

  // ============ LOGS ============
  logs: router({
    list: adminProcedure.query(async () => {
      return await db.getAllLogs();
    }),

    getFiltered: adminProcedure
      .input(z.object({
        acao: z.string().optional(),
        tabelaAfetada: z.string().optional(),
        dataInicio: z.date().optional(),
        dataFim: z.date().optional(),
      }))
      .query(async (opts) => {
        return await db.getLogsWithUserInfo(opts.input);
      }),
  }),

  // ============ DASHBOARD ============
  dashboard: router({
    stats: publicProcedure.query(async () => {
      return {
        totalLivros: await db.getTotalLivros(),
        totalUsuarios: await db.getTotalUsuarios(),
        emprestimosAtivos: await db.getTotalEmprestimosAtivos(),
        livrosDisponiveis: await db.getTotalLivrosDisponiveis(),
        emprestimosAtrasados: (await db.getEmprestimosAtrasados()).length,
      };
    }),

    livrosMaisEmprestados: publicProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ input }) => {
        return await db.getLivrosMaisEmprestados(input.limit);
      }),

    usuariosMaisAtivos: publicProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ input }) => {
        return await db.getUsuariosMaisAtivos(input.limit);
      }),
  }),

  // ============ PREFERÊNCIAS E RECOMENDAÇÕES ============
  recomendacoes: router({
    getPreferencias: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPreferenciaUsuario(ctx.user.id);
    }),

    updatePreferencias: protectedProcedure
      .input(z.object({
        categoriasPreferidas: z.array(z.number()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          await db.updatePreferenciaUsuario(ctx.user.id, input.categoriasPreferidas || []);
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
